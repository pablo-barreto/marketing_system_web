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

    return (
        <Card aria-labelledby="weekly-budget-title" className="overflow-hidden">
            <CardHeader
                id="weekly-budget-title"
                title="Pauta semanal Meta · servicios principales"
                subtitle="Lunes 6:00 AM se activan con el presupuesto; viernes 6:00 PM se pausan (hora Colombia). LinkedIn no se toca."
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
                            <table className={cx(tableClass, 'min-w-[520px]')}>
                                <caption className="sr-only">Campañas incluidas en la pauta semanal</caption>
                                <thead>
                                    <tr>
                                        <th scope="col" className={thClass}>Servicio</th>
                                        <th scope="col" className={thClass}>Campaña</th>
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
            </PageBody>
        </>
    );
}
