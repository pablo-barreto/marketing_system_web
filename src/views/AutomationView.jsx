'use client';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { automationService } from '../services/api';
import { useApi } from '../hooks/useApi';
import { PageBody, PageHeader } from '../components/shell/AppShell';
import {
    Button, Card, CardHeader, Drawer, EmptyState, Field, Icon, MoneyInput, Pill, Switch, cx, inputClass,
    tableClass, tdClass, thClass, trClass,
} from '../components/ui';

const EMAIL_RE = /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/;
const cop = (v) => `$${Math.round(Number(v) || 0).toLocaleString('es-CO')}`;
const when = (iso) => (iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : null);

function LastRun({ label, run, children }) {
    if (!run) return <span className="text-[13px] text-slate-500">{label}: aún no se ha ejecutado.</span>;
    return (
        <span className="text-[13px] text-slate-600">
            {label}: <strong className="text-slate-800">{when(run.at)}</strong> · {children}
        </span>
    );
}

// --- Informe semanal de leads ---------------------------------------------------------

function LeadsReportCard() {
    const { data, loading, refresh } = useApi('/api/v1/automation/leads-report');
    const [recipients, setRecipients] = useState([]);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (data?.recipients) setRecipients(data.recipients);
    }, [data]);

    const dirty = data && JSON.stringify(recipients) !== JSON.stringify(data.recipients || []);

    const addRecipient = (e) => {
        e.preventDefault();
        const emails = draft.split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
        const invalid = emails.find((x) => !EMAIL_RE.test(x));
        if (invalid) {
            Swal.fire('Correo no válido', invalid, 'warning');
            return;
        }
        setRecipients((list) => [...list, ...emails.filter((x) => !list.includes(x))]);
        setDraft('');
    };

    const save = async (changes) => {
        setSaving(true);
        try {
            await automationService.saveLeadsReport(changes);
            refresh();
        } catch (e) {
            Swal.fire('No se pudo guardar', e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const sendNow = async () => {
        if (dirty) {
            Swal.fire('Guarda primero', 'Hay cambios en los destinatarios sin guardar.', 'info');
            return;
        }
        const ok = await Swal.fire({
            title: 'Enviar el informe ahora',
            text: `Se enviará el informe de los últimos 7 días a ${recipients.length} destinatario(s).`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Enviar',
            cancelButtonText: 'Cancelar',
        });
        if (!ok.isConfirmed) return;
        setSending(true);
        try {
            const r = await automationService.sendLeadsReportNow();
            Swal.fire('Informe enviado', `Enviado a ${r.sent.length} destinatario(s) con ${r.leads} lead(s).`, 'success');
            refresh();
        } catch (e) {
            Swal.fire('No se pudo enviar', e.message, 'error');
        } finally {
            setSending(false);
        }
    };

    const openPreview = async () => {
        try {
            setPreview(await automationService.previewLeadsReport());
        } catch (e) {
            Swal.fire('No se pudo generar la vista previa', e.message, 'error');
        }
    };

    const last = data?.last_sent;

    return (
        <Card aria-labelledby="leads-report-title">
            <CardHeader
                id="leads-report-title"
                title="Informe semanal de leads"
                subtitle="Correo con los leads de las publicidades de los servicios principales · viernes 6:00 PM (hora Colombia)"
                actions={data && (
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                        {data.enabled ? 'Activo' : 'Pausado'}
                        <Switch checked={!!data.enabled} disabled={saving} onChange={(v) => save({ enabled: v })} label="Enviar el informe cada viernes" />
                    </label>
                )}
            />
            {loading && !data ? (
                <p className="m-0 px-5 py-10 text-center text-slate-500">Cargando…</p>
            ) : (
                <div className="p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-[13px] font-semibold text-slate-700">Destinatarios</span>
                        {recipients.length === 0 ? (
                            <span className="text-[13px] text-amber-800">Sin destinatarios: el informe no se enviará.</span>
                        ) : (
                            <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
                                {recipients.map((email) => (
                                    <li key={email} className="inline-flex items-center gap-1 pl-3 pr-1 h-9 rounded-full bg-slate-100 text-[13px] text-slate-800">
                                        {email}
                                        <button
                                            type="button"
                                            onClick={() => setRecipients((list) => list.filter((x) => x !== email))}
                                            aria-label={`Quitar ${email}`}
                                            className="w-7 h-7 inline-flex items-center justify-center rounded-full border-0 bg-transparent text-slate-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                        >
                                            <Icon name="close" size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <form onSubmit={addRecipient} className="flex flex-wrap items-end gap-2">
                        <Field label="Agregar correo" hint="Puedes pegar varios separados por coma." className="flex-1 min-w-[240px]">
                            <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="nombre@crconsultorescolombia.com" className={inputClass} />
                        </Field>
                        <Button type="submit" disabled={!draft.trim()}><Icon name="plus" size={16} /> Agregar</Button>
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="primary" disabled={!dirty || saving || recipients.length === 0} onClick={() => save({ recipients })}>
                            {saving ? 'Guardando…' : 'Guardar destinatarios'}
                        </Button>
                        {dirty && <Button onClick={() => setRecipients(data.recipients || [])}>Descartar cambios</Button>}
                        <span className="flex-1" />
                        <Button onClick={openPreview}><Icon name="mail" size={16} /> Vista previa</Button>
                        <Button onClick={sendNow} disabled={sending || recipients.length === 0}>{sending ? 'Enviando…' : 'Enviar ahora'}</Button>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                        <LastRun label="Último envío" run={last}>
                            {last && <>{last.leads} lead(s) · enviado a {last.sent?.length || 0}{last.failed?.length ? <>, <span className="text-red-700">falló {last.failed.join(', ')}</span></> : null}{last.test && ' · envío manual'}</>}
                        </LastRun>
                    </div>
                </div>
            )}

            <Drawer open={!!preview} onClose={() => setPreview(null)} title="Vista previa del informe" width="max-w-3xl">
                {preview && (
                    <div className="flex flex-col h-full">
                        <p className="m-0 px-6 py-3 text-[13px] text-slate-600 border-b border-slate-200">
                            <strong>Asunto:</strong> {preview.subject}
                        </p>
                        <iframe title="Vista previa del correo" srcDoc={preview.html} sandbox="" className="flex-1 w-full border-0 min-h-[70vh]" />
                    </div>
                )}
            </Drawer>
        </Card>
    );
}

// --- Pauta semanal Meta ------------------------------------------------------------------

function WeeklyMetaBudgetCard() {
    const { data, loading, refresh } = useApi('/api/v1/automation/weekly-meta-budget');
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.weekly_budget !== undefined) setAmount(String(Math.round(data.weekly_budget)));
    }, [data]);

    const save = async (changes) => {
        setSaving(true);
        try {
            await automationService.saveWeeklyMetaBudget(changes);
            refresh();
        } catch (e) {
            Swal.fire('No se pudo guardar', e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const days = data?.active_days || 5;
    const dirty = data && Number(amount) !== Math.round(data.weekly_budget);
    const campaigns = data?.campaigns || [];
    const excluded = data?.excluded_campaigns || 0;
    const older = data?.older_campaigns || [];
    const [cleaning, setCleaning] = useState(false);

    const cleanup = async () => {
        const esc = (t) => String(t).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
        const day = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '—');
        const rows = older.map((c) => `<li><strong>${esc(c.service)}</strong> · ${esc(day(c.created_at))} · <code>${esc(c.campaign_id)}</code></li>`).join('');
        const ok = await Swal.fire({
            title: `Eliminar ${older.length} campaña(s) anteriores`,
            html: `<p style="margin:0 0 8px">Se conserva la más reciente de cada servicio principal. Se eliminarán:</p>
                   <ul style="text-align:left;max-height:240px;overflow:auto;font-size:13px;margin:0;padding-left:18px">${rows}</ul>
                   <p style="margin:12px 0 0;font-size:13px">Se borra su historial de métricas en el sistema. Los leads del CRM se conservan.</p>`,
            input: 'checkbox',
            inputValue: 1,
            inputPlaceholder: 'Eliminarlas también en Meta (no se puede deshacer)',
            icon: 'warning',
            width: 640,
            showCancelButton: true,
            confirmButtonColor: '#B91C1C',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
        });
        if (!ok.isConfirmed) return;
        setCleaning(true);
        try {
            const r = await automationService.deleteOlderMetaCampaigns(!!ok.value);
            refresh();
            Swal.fire(
                r.failed.length ? 'Limpieza con errores' : 'Lista limpia',
                `${r.deleted.length} eliminada(s)${r.failed.length ? `, ${r.failed.length} con error` : ''}.`,
                r.failed.length ? 'warning' : 'success'
            );
        } catch (e) {
            Swal.fire('No se pudo limpiar', e.message, 'error');
        } finally {
            setCleaning(false);
        }
    };

    return (
        <Card aria-labelledby="weekly-budget-title" className="overflow-hidden">
            <CardHeader
                id="weekly-budget-title"
                title="Pauta semanal Meta · servicios principales"
                subtitle="Lunes 6:00 AM se activa la campaña más reciente de cada servicio; viernes 6:00 PM se pausan todas (hora Colombia). LinkedIn no se toca."
                actions={data && (
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                        {data.enabled ? 'Activa' : 'Pausada'}
                        <Switch checked={!!data.enabled} disabled={saving} onChange={(v) => save({ enabled: v })} label="Activar y pausar automáticamente cada semana" />
                    </label>
                )}
            />
            {loading && !data ? (
                <p className="m-0 px-5 py-10 text-center text-slate-500">Cargando…</p>
            ) : (
                <>
                    <div className="p-5 flex flex-col gap-4">
                        <form
                            className="flex flex-wrap items-end gap-3"
                            onSubmit={(e) => { e.preventDefault(); save({ weekly_budget: Number(amount) }); }}
                        >
                            <Field
                                label="Presupuesto semanal por campaña (COP)"
                                hint={`= ${cop(Number(amount) / days)} diarios de lunes a viernes. Los cambios aplican desde el próximo lunes.`}
                                className="w-full sm:w-80"
                            >
                                <MoneyInput value={amount} onChange={setAmount} min={25000} step={1000} aria-label="Presupuesto semanal" />
                            </Field>
                            <Button type="submit" variant="primary" disabled={!dirty || saving || !(Number(amount) > 0)}>
                                {saving ? 'Guardando…' : 'Guardar'}
                            </Button>
                        </form>
                        <div className="flex flex-col gap-1">
                            <LastRun label="Última activación" run={data?.last_activation}>
                                {data?.last_activation && <>{data.last_activation.ok} activada(s){data.last_activation.failed ? <span className="text-red-700"> · {data.last_activation.failed} con error</span> : null}</>}
                            </LastRun>
                            <LastRun label="Última pausa" run={data?.last_pause}>
                                {data?.last_pause && <>{data.last_pause.ok} pausada(s){data.last_pause.failed ? <span className="text-red-700"> · {data.last_pause.failed} con error</span> : null}</>}
                            </LastRun>
                        </div>
                    </div>

                    {campaigns.length === 0 ? (
                        <EmptyState
                            title="No hay campañas de Meta de servicios principales"
                            description="Crea campañas en Meta para los servicios marcados como principales en Configuración → Servicios."
                        />
                    ) : (
                        <div className="overflow-x-auto border-t border-slate-200">
                            <p className="m-0 px-5 py-3 text-[13px] text-slate-600">
                                Entra en la pauta la campaña <strong>más reciente</strong> de cada servicio principal.
                                {excluded > 0 && <> Las otras {excluded} campaña(s) anteriores de estos servicios no se activan; el viernes se pausan si alguien las activó.</>}
                                {excluded > 0 && (
                                    <Button variant="danger" size="sm" className="ml-2 align-middle" onClick={cleanup} disabled={cleaning}>
                                        <Icon name="trash" size={14} /> {cleaning ? 'Eliminando…' : `Eliminar ${excluded} anteriores`}
                                    </Button>
                                )}
                            </p>
                            <table className={cx(tableClass, 'min-w-[600px]')}>
                                <caption className="sr-only">Campañas incluidas en la pauta semanal</caption>
                                <thead>
                                    <tr>
                                        <th scope="col" className={thClass}>Servicio</th>
                                        <th scope="col" className={thClass}>Campaña</th>
                                        <th scope="col" className={thClass}>Creada</th>
                                        <th scope="col" className={thClass}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((c) => {
                                        const active = (c.status || '').toLowerCase() !== 'paused';
                                        return (
                                            <tr key={c.campaign_id} className={trClass}>
                                                <th scope="row" className={cx(tdClass, 'text-left font-semibold text-slate-900')}>{c.service}</th>
                                                <td className={cx(tdClass, 'font-mono text-xs')}>{c.campaign_id}</td>
                                                <td className={tdClass}>{c.created_at ? new Date(c.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '—'}</td>
                                                <td className={tdClass}><Pill tone={active ? 'green' : 'neutral'}>{active ? 'Activa' : 'Pausada'}</Pill></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
}

// --- Publicidad a visitantes web no contadores ------------------------------------------------

const num = (v) => Math.round(Number(v) || 0).toLocaleString('es-CO');

const toForm = (data) => ({
    pixel_id: data.pixel_id || '',
    visitor_share_pct: String(data.visitor_share_pct),
    excluded_roles: (data.excluded_roles || []).join(', '),
    retention_days: String(data.retention_days),
    min_audience_size: String(data.min_audience_size),
});

function WebVisitorsCard() {
    const { data, loading, refresh } = useApi('/api/v1/automation/web-visitors');
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [busy, setBusy] = useState(null);

    useEffect(() => {
        if (data) setForm(toForm(data));
    }, [data]);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const dirty = data && form && JSON.stringify(form) !== JSON.stringify(toForm(data));

    const save = async (changes) => {
        setSaving(true);
        try {
            await automationService.saveWebVisitors(changes);
            refresh();
        } catch (e) {
            Swal.fire('No se pudo guardar', e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveForm = (e) => {
        e.preventDefault();
        save({
            pixel_id: form.pixel_id.trim(),
            visitor_share_pct: Number(form.visitor_share_pct),
            excluded_roles: form.excluded_roles,
            retention_days: Number(form.retention_days),
            min_audience_size: Number(form.min_audience_size),
        });
    };

    const syncAudience = async () => {
        setBusy('audience');
        try {
            await automationService.syncWebVisitorsAudience();
            refresh();
            Swal.fire('Audiencia lista', 'La audiencia de visitantes no contadores quedó configurada en Meta.', 'success');
        } catch (e) {
            Swal.fire('No se pudo configurar la audiencia', e.message, 'error');
        } finally {
            setBusy(null);
        }
    };

    const createCampaigns = async (recreate) => {
        if (recreate) {
            const ok = await Swal.fire({
                title: 'Recrear campañas de visitantes',
                text: 'Se eliminan las campañas de visitantes actuales (también en Meta) y se crean de nuevo con el anuncio vigente de cada servicio.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#B91C1C',
                confirmButtonText: 'Recrear',
                cancelButtonText: 'Cancelar',
            });
            if (!ok.isConfirmed) return;
        }
        setBusy(recreate ? 'recreate' : 'create');
        try {
            const r = await automationService.createWebVisitorsCampaigns(recreate);
            refresh();
            const errors = r.failed.map((f) => `${f.service}: ${f.error}`).join('\n');
            Swal.fire(
                r.failed.length ? 'Campañas con errores' : 'Campañas listas',
                `${r.created.length} creada(s) en pausa${r.skipped.length ? `, ${r.skipped.length} ya existían` : ''}.${errors ? `\n\n${errors}` : ''}`,
                r.failed.length ? 'warning' : 'success'
            );
        } catch (e) {
            Swal.fire('No se pudieron crear las campañas', e.message, 'error');
        } finally {
            setBusy(null);
        }
    };

    const split = data?.split;
    const pct = Number(form?.visitor_share_pct) || 0;
    const days = split?.active_days || 5;
    const weekly = split?.weekly_budget || 0;
    const visitorWeekly = Math.round((weekly * pct) / 100);
    const generalWeekly = weekly - visitorWeekly;
    const tooLow = generalWeekly / days < 5000 || visitorWeekly / days < 5000;
    const counts = data?.counts || { people: 0, with_fbp: 0 };
    const audience = data?.audience;
    const campaigns = data?.campaigns || [];
    const missing = campaigns.filter((c) => !c.visitor).length;

    return (
        <Card aria-labelledby="web-visitors-title" className="overflow-hidden">
            <CardHeader
                id="web-visitors-title"
                title="Publicidad a visitantes de la web · no contadores"
                subtitle="A quien visite la página y el sistema no detecte como contador se le muestra publicidad de los servicios principales en Meta. Usa parte del presupuesto semanal de cada servicio."
                actions={data && (
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                        {data.enabled ? 'Activa' : 'Apagada'}
                        <Switch checked={!!data.enabled} disabled={saving || !data.pixel_id} onChange={(v) => save({ enabled: v })} label="Informar visitantes a Meta y repartir la pauta" />
                    </label>
                )}
            />
            {loading && !data ? (
                <p className="m-0 px-5 py-10 text-center text-slate-500">Cargando…</p>
            ) : data && form && (
                <>
                    <div className="p-5 flex flex-col gap-5">
                        {data.meta_error && (
                            <p className="m-0 text-[13px] text-amber-800">Meta no respondió: {data.meta_error}</p>
                        )}

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-500">Visitantes no contadores (últimos {data.retention_days} días)</div>
                                <div className="text-2xl font-bold text-slate-900">{num(counts.people)}</div>
                                <div className="text-xs text-slate-500">{num(counts.with_fbp)} con cookie de Meta</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-500">Mínimo para activar las campañas</div>
                                <div className="text-2xl font-bold text-slate-900">{num(data.min_audience_size)}</div>
                                <Pill tone={data.ready ? 'green' : 'amber'}>{data.ready ? 'Alcanzado' : `Faltan ${num(data.min_audience_size - counts.people)}`}</Pill>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-500">Audiencia en Meta</div>
                                {data.audience_id ? (
                                    <>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {audience && audience.approximate_count_lower_bound > 0
                                                ? `${num(audience.approximate_count_lower_bound)}–${num(audience.approximate_count_upper_bound)}`
                                                : 'En formación'}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">{data.audience_id}</div>
                                    </>
                                ) : (
                                    <div className="text-sm text-slate-600 mt-1">Aún no se ha creado.</div>
                                )}
                            </div>
                        </div>

                        <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveForm}>
                            <Field label="Píxel de Meta" hint="El píxel instalado en crconsultorescolombia.com al que se envían los visitantes.">
                                {data.pixels?.length ? (
                                    <select value={form.pixel_id} onChange={set('pixel_id')} className={inputClass}>
                                        <option value="">Selecciona un píxel</option>
                                        {data.pixels.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} · {p.id}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input type="text" inputMode="numeric" value={form.pixel_id} onChange={set('pixel_id')} placeholder="189593765525559" className={inputClass} />
                                )}
                            </Field>
                            <Field
                                label="Porcentaje del presupuesto para visitantes"
                                hint={tooLow
                                    ? <span className="text-red-700">Meta exige al menos {cop(5000)} diarios en cada campaña.</span>
                                    : `Por servicio: ${cop(generalWeekly)} general + ${cop(visitorWeekly)} visitantes a la semana (${cop(generalWeekly / days)} + ${cop(visitorWeekly / days)} diarios).`}
                            >
                                <input type="number" min={0} max={100} step={5} value={form.visitor_share_pct} onChange={set('visitor_share_pct')} className={inputClass} />
                            </Field>
                            <Field label="Perfiles que cuentan como contador" hint="Separados por coma. A estos perfiles no se les muestra esta publicidad.">
                                <input type="text" value={form.excluded_roles} onChange={set('excluded_roles')} placeholder="contador, revisor fiscal" className={inputClass} />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Días en la audiencia" hint={`Máximo ${data.max_retention_days}.`}>
                                    <input type="number" min={1} max={data.max_retention_days} value={form.retention_days} onChange={set('retention_days')} className={inputClass} />
                                </Field>
                                <Field label="Mínimo de visitantes" hint="Antes de esto, todo va a la campaña general.">
                                    <input type="number" min={0} value={form.min_audience_size} onChange={set('min_audience_size')} className={inputClass} />
                                </Field>
                            </div>
                            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                                <Button type="submit" variant="primary" disabled={!dirty || saving || tooLow}>{saving ? 'Guardando…' : 'Guardar'}</Button>
                                {dirty && <Button onClick={() => setForm(toForm(data))}>Descartar cambios</Button>}
                                <span className="flex-1" />
                                <Button onClick={syncAudience} disabled={!!busy || !data.pixel_id || dirty}>
                                    <Icon name="refresh" size={16} /> {busy === 'audience' ? 'Configurando…' : data.audience_id ? 'Actualizar audiencia en Meta' : 'Crear audiencia en Meta'}
                                </Button>
                            </div>
                            {data.audience_outdated && (
                                <p className="sm:col-span-2 m-0 text-[13px] text-amber-800">Cambiaste el píxel: actualiza la audiencia para que use el píxel nuevo.</p>
                            )}
                        </form>

                        <div className="flex flex-col gap-1">
                            <LastRun label="Última configuración de la audiencia" run={data.last_audience_sync}>
                                {data.last_audience_sync && <>{data.last_audience_sync.action}</>}
                            </LastRun>
                            <span className="text-[13px] text-slate-500">
                                Requiere el script de seguimiento actualizado en la página web (envía las cookies de Meta con cada visita).
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto border-t border-slate-200">
                        <div className="px-5 py-3 text-[13px] text-slate-600 flex flex-wrap items-center gap-2">
                            <span className="flex-1 min-w-[240px]">
                                Cada servicio principal tiene una campaña de visitantes con el mismo anuncio de su campaña general. Nacen pausadas; el lunes se activan si la audiencia llegó al mínimo.
                            </span>
                            {missing > 0 && (
                                <Button size="sm" variant="primary" onClick={() => createCampaigns(false)} disabled={!!busy || !data.audience_id}>
                                    <Icon name="plus" size={14} /> {busy === 'create' ? 'Creando…' : `Crear ${missing} campaña(s) de visitantes`}
                                </Button>
                            )}
                            {campaigns.length > missing && (
                                <Button size="sm" onClick={() => createCampaigns(true)} disabled={!!busy || !data.audience_id}>
                                    <Icon name="refresh" size={14} /> {busy === 'recreate' ? 'Recreando…' : 'Recrear con el anuncio actual'}
                                </Button>
                            )}
                        </div>
                        {campaigns.length === 0 ? (
                            <EmptyState title="No hay campañas generales" description="Primero debe existir la campaña de Meta de cada servicio principal." />
                        ) : (
                            <table className={cx(tableClass, 'min-w-[600px]')}>
                                <caption className="sr-only">Campañas de visitantes por servicio</caption>
                                <thead>
                                    <tr>
                                        <th scope="col" className={thClass}>Servicio</th>
                                        <th scope="col" className={thClass}>Campaña de visitantes</th>
                                        <th scope="col" className={thClass}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((c) => {
                                        const v = c.visitor;
                                        const active = v && (v.status || '').toLowerCase() !== 'paused';
                                        return (
                                            <tr key={c.service} className={trClass}>
                                                <th scope="row" className={cx(tdClass, 'text-left font-semibold text-slate-900')}>{c.service}</th>
                                                <td className={cx(tdClass, 'font-mono text-xs')}>{v ? v.campaign_id : '—'}</td>
                                                <td className={tdClass}>
                                                    {v ? <Pill tone={active ? 'green' : 'neutral'}>{active ? 'Activa' : 'Pausada'}</Pill> : <Pill tone="amber">Sin crear</Pill>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </Card>
    );
}

export default function AutomationView() {
    return (
        <>
            <PageHeader eyebrow="Configuración" title="Automatizaciones" />
            <PageBody>
                <p className="m-0 text-slate-600">
                    Tareas semanales de los <strong>servicios principales</strong>. Se ejecutan solas; aquí se activan, pausan y configuran.
                </p>
                <LeadsReportCard />
                <WeeklyMetaBudgetCard />
                <WebVisitorsCard />
            </PageBody>
        </>
    );
}
