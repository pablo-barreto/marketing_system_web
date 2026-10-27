'use client';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AudienceSelect, { AUDIENCE_OPTIONS, DEFAULT_AUDIENCE } from '../components/AudienceSelect';
import { PageHeader } from '../components/shell/AppShell';
import { Button, Card, Field, Icon, MoneyInput, StatCard, cx, inputClass } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { launchService } from '../services/api';

const COUNTRIES = [
    { value: 'CO', label: 'Colombia' }, { value: 'MX', label: 'México' }, { value: 'PE', label: 'Perú' },
    { value: 'CL', label: 'Chile' }, { value: 'EC', label: 'Ecuador' }, { value: 'AR', label: 'Argentina' },
    { value: 'PA', label: 'Panamá' }, { value: 'ES', label: 'España' }, { value: 'US', label: 'EE. UU.' },
];

const SERVICES = [
    { value: 'servicios-tributarios', label: 'Tributario' }, { value: 'impuestos', label: 'Impuestos' },
    { value: 'nomina', label: 'Nómina' }, { value: 'asesoria-financiera', label: 'Asesoría financiera' },
    { value: 'servicios-legales', label: 'Legal' }, { value: 'auditoria', label: 'Auditoría' },
    { value: 'consultoria', label: 'Consultoría' },
];

const MODES = [
    { value: 'new', label: 'Crear campaña nueva' },
    { value: 'existing', label: 'Enviar a campañas existentes' },
];

const STRATEGIES = [
    { value: 'all', label: 'Masivo', desc: 'Toda la base de datos histórica. Ideal para posicionamiento de marca.' },
    { value: 'top_roles', label: 'Top 5 cargos (IA)', desc: 'Los cinco cargos más frecuentes del CRM.' },
    { value: 'specific', label: 'Cargos específicos', desc: 'Eliges a mano los cargos que recibirán el anuncio.' },
];

const URGENT_KEYWORDS = ['embargo', 'dian', 'sancion', 'multa', 'urgente', 'tributaria'];
const IGNORED_ROLES = ['visitante', 'desconocido', 'n/a', 'otro'];

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CO');

function ToggleChips({ options, selected, onToggle, label }) {
    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-2">
            {options.map((o) => {
                const on = selected.includes(o.value);
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onToggle(o.value)}
                        className={cx(
                            'inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full border text-[13px] font-semibold cursor-pointer',
                            on ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                        )}
                    >
                        {on && <Icon name="check" size={14} />} {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function RadioCards({ options, value, onChange, label }) {
    return (
        <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
            {options.map((o) => {
                const on = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => onChange(o.value)}
                        className={cx(
                            'flex items-start gap-3 text-left p-3.5 rounded-lg border cursor-pointer',
                            on ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200 bg-white hover:bg-slate-50'
                        )}
                    >
                        <span aria-hidden="true" className={cx('mt-0.5 w-4 h-4 shrink-0 rounded-full border-2', on ? 'border-blue-600 bg-blue-600 shadow-[inset_0_0_0_3px_white]' : 'border-slate-400')} />
                        <span className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900">{o.label}</span>
                            {o.desc && <span className="text-[13px] text-slate-600">{o.desc}</span>}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function Section({ title, aside, children }) {
    return (
        <fieldset className="m-0 p-0 border-0 flex flex-col gap-3 min-w-0">
            <legend className="mb-3 p-0 text-[13px] font-semibold text-slate-700">
                {title}{aside && <span className="font-normal text-slate-500"> · {aside}</span>}
            </legend>
            {children}
        </fieldset>
    );
}

export default function LaunchView() {
    // Los 200 leads más recientes alimentan la detección de roles e intención
    const { data: leadsPage } = useApi('/api/v1/crm/leads?page_size=200');
    const leads = useMemo(() => leadsPage?.items || [], [leadsPage]);
    const { data: activePage } = useApi('/api/v1/campaigns?status=active&page_size=200');
    const activeCampaigns = activePage?.items || [];

    const [mode, setMode] = useState('new');
    const [title, setTitle] = useState('');
    const [budget, setBudget] = useState(50000);
    const [audienceType, setAudienceType] = useState(DEFAULT_AUDIENCE);
    const [strategy, setStrategy] = useState('all');
    const [roles, setRoles] = useState([]);
    const [countries, setCountries] = useState(COUNTRIES.map((c) => c.value));
    const [services, setServices] = useState(SERVICES.map((s) => s.value));
    const [campaignIds, setCampaignIds] = useState([]);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const { availableRoles, topRoles, urgent } = useMemo(() => {
        const counts = {};
        leads.forEach((l) => {
            const r = l.role?.trim();
            if (r && r.length > 2 && !IGNORED_ROLES.includes(r.toLowerCase())) counts[r] = (counts[r] || 0) + 1;
        });
        return {
            availableRoles: Object.keys(counts).sort(),
            topRoles: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([r]) => r),
            urgent: leads.filter((l) => URGENT_KEYWORDS.some((k) => (l.service_interest || '').toLowerCase().includes(k))).length,
        };
    }, [leads]);

    const toggle = (setter) => (value) => setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

    const onFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const problems = [];
    if (mode === 'new') {
        if (!title.trim()) problems.push('Escribe el título de la campaña.');
        if (!file) problems.push('Sube el arte del anuncio.');
        if (Number(budget) < 20000) problems.push('El presupuesto mínimo es $ 20.000.');
        if (countries.length === 0) problems.push('Selecciona al menos un país.');
        if (services.length === 0) problems.push('Selecciona al menos un servicio.');
    } else if (campaignIds.length === 0) {
        problems.push('Selecciona al menos una campaña activa.');
    }
    if (strategy === 'specific' && roles.length === 0) problems.push('Elige al menos un cargo.');

    const syncLookalikes = async () => {
        Swal.fire({ title: 'Analizando la base de datos…', text: 'Filtrando clientes de alto valor.', didOpen: () => Swal.showLoading() });
        try {
            const res = await launchService.syncLookalikes();
            const details = Object.entries(res.platforms || {}).map(([p, s]) => `<li><b>${p}:</b> ${s}</li>`).join('');
            Swal.fire({
                title: 'Audiencias similares sincronizadas',
                html: `<p>Se enviaron <b>${fmt(res.vip_leads_count)}</b> leads de alto valor como semilla.</p><ul style="text-align:left">${details}</ul><p style="font-size:12px;color:#64748b">Meta y LinkedIn tardan entre 1 y 24 horas en recalcular los públicos.</p>`,
                icon: 'success',
                confirmButtonColor: '#2563EB',
            });
        } catch (error) {
            Swal.fire('No se pudo sincronizar', error.message, 'error');
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (problems.length) return;
        const audienceLabel = AUDIENCE_OPTIONS.find((o) => o.value === audienceType)?.label;
        const ok = await Swal.fire({
            title: mode === 'new' ? 'Ejecutar lanzamiento' : 'Sincronizar audiencia',
            html: mode === 'new'
                ? `<b>${title}</b><br/>$ ${fmt(budget)} diarios · ${audienceLabel}<br/>${countries.length} países · ${services.length} servicios`
                : `Se enviará la audiencia a ${campaignIds.length} campaña(s) activa(s).`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: mode === 'new' ? 'Publicar en las plataformas' : 'Sincronizar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563EB',
        });
        if (!ok.isConfirmed) return;

        setProcessing(true);
        try {
            if (mode === 'new') {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('title', title.trim());
                formData.append('context', 'seminario');
                formData.append('segmentation_mode', strategy);
                formData.append('budget', budget);
                formData.append('audience_type', audienceType);
                if (strategy === 'specific') formData.append('target_roles', roles.join(','));
                formData.append('target_countries', countries.join(','));
                formData.append('service_interests', services.join(','));
                const res = await launchService.executeGlobalLaunch(formData);
                let msg = `Se impactaron ${res.leads_impacted || 'múltiples'} leads.`;
                if (res.roles_targeted?.length) msg += ` Cargos: ${res.roles_targeted.join(', ')}.`;
                if (audienceType === 'persona_natural') msg += ' Personas naturales: solo Meta (LinkedIn se omite).';
                Swal.fire({ title: 'Lanzamiento en marcha', text: msg, icon: 'success' });
                setTitle('');
                setFile(null);
                setPreview(null);
            } else {
                await launchService.syncAudienceToCampaigns({
                    campaign_ids: campaignIds,
                    segmentation_mode: strategy,
                    target_roles: strategy === 'specific' ? roles : [],
                    audience_type: audienceType,
                });
                Swal.fire({ title: 'Sincronización en cola', text: `Recibirás una notificación cuando termine (${campaignIds.length} campaña(s)).`, icon: 'success' });
                setCampaignIds([]);
            }
        } catch (error) {
            Swal.fire('No se pudo completar', error.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const strategyLabel = STRATEGIES.find((s) => s.value === strategy)?.label;

    return (
        <>
            <PageHeader
                eyebrow="Clientes"
                title="Lanzamiento e IA"
                actions={<span className="text-[13px] text-slate-600">Retargeting en Meta y LinkedIn a partir de tus audiencias</span>}
            />
            <div className="w-full max-w-[1240px] mx-auto px-4 md:px-8 pt-7 pb-12 box-border flex flex-col gap-5">
                <section aria-label="Audiencias" className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <StatCard label="Tráfico de crisis" value={fmt(urgent)}>
                        <span className="text-xs text-slate-500">Leads recientes con riesgo legal (embargos, DIAN)</span>
                    </StatCard>
                    <StatCard label="Tráfico informativo" value={fmt(leads.length - urgent)}>
                        <span className="text-xs text-slate-500">Visitantes generales (últimos {fmt(leads.length)} leads)</span>
                    </StatCard>
                    <Card as="article" className="px-5 py-[18px] flex flex-col justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[13px] font-semibold text-slate-600">Audiencias similares</span>
                            <span className="text-[13px] text-slate-500">Crea gemelos de tu base de alto valor en Meta y LinkedIn.</span>
                        </div>
                        <Button onClick={syncLookalikes} className="self-start">Sincronizar lookalikes</Button>
                    </Card>
                </section>

                <form onSubmit={onSubmit} className="grid gap-6 items-start grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card as="div" className="p-6 flex flex-col gap-6 min-w-0">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="m-0 text-base font-bold">Lanzamiento global</h2>
                            <span className="text-[13px] text-slate-500">Configura una campaña de retargeting o envía la audiencia a campañas que ya corren.</span>
                        </div>

                        <Section title="Modo">
                            <div role="radiogroup" aria-label="Modo" className="inline-flex flex-wrap gap-1 p-1 rounded-[10px] bg-slate-100 self-start">
                                {MODES.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={mode === m.value}
                                        onClick={() => setMode(m.value)}
                                        className={cx('min-h-10 px-4 rounded-lg border-0 text-[13px] font-semibold cursor-pointer', mode === m.value ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-600')}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </Section>

                        {mode === 'new' && (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                                <Field label="Título de la campaña" hint="Aparece tal cual como titular del anuncio." className="md:col-span-3">
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: Seminario de actualización tributaria" className={inputClass} />
                                </Field>
                                <Field label="Presupuesto diario (COP)" hint="Mínimo recomendado: $ 20.000">
                                    <MoneyInput value={budget} onChange={setBudget} min={20000} step={5000} />
                                </Field>
                                <AudienceSelect value={audienceType} onChange={setAudienceType} className="md:col-span-2" />
                            </div>
                        )}
                        {mode === 'existing' && <AudienceSelect value={audienceType} onChange={setAudienceType} className="max-w-sm" />}

                        <Section title="Estrategia de segmentación">
                            <RadioCards label="Estrategia de segmentación" options={STRATEGIES} value={strategy} onChange={setStrategy} />
                            {strategy === 'top_roles' && (
                                <p className="m-0 text-[13px] text-slate-600">
                                    {topRoles.length ? <>Se lanzará a: <strong>{topRoles.join(', ')}</strong>.</> : 'Aún no hay datos suficientes para calcular los cargos más frecuentes.'}
                                </p>
                            )}
                            {strategy === 'specific' && (
                                <div className="flex flex-col gap-2.5">
                                    <Field label={`Agregar cargo (${availableRoles.length} en el CRM)`}>
                                        <select
                                            value=""
                                            onChange={(e) => e.target.value && setRoles((r) => (r.includes(e.target.value) ? r : [...r, e.target.value]))}
                                            className={inputClass}
                                        >
                                            <option value="">Selecciona un cargo…</option>
                                            {availableRoles.filter((r) => !roles.includes(r)).map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </Field>
                                    <div className="flex flex-wrap gap-2">
                                        {roles.map((r) => (
                                            <span key={r} className="inline-flex items-center gap-1 pl-3 pr-1 min-h-8 rounded-full bg-blue-50 text-blue-800 text-[13px] font-semibold">
                                                {r}
                                                <button type="button" aria-label={`Quitar ${r}`} onClick={() => setRoles((x) => x.filter((v) => v !== r))} className="w-7 h-7 flex items-center justify-center rounded-full border-0 bg-transparent text-blue-800 cursor-pointer hover:bg-blue-100">
                                                    <Icon name="close" size={14} />
                                                </button>
                                            </span>
                                        ))}
                                        {roles.length === 0 && <span className="text-[13px] text-slate-500">Ningún cargo seleccionado.</span>}
                                    </div>
                                </div>
                            )}
                        </Section>

                        {mode === 'new' ? (
                            <>
                                <Section title="Países objetivo" aside={`${countries.length} seleccionados`}>
                                    <ToggleChips label="Países objetivo" options={COUNTRIES} selected={countries} onToggle={toggle(setCountries)} />
                                </Section>
                                <Section title="Servicios objetivo" aside={`${services.length} seleccionados`}>
                                    <ToggleChips label="Servicios objetivo" options={SERVICES} selected={services} onToggle={toggle(setServices)} />
                                </Section>
                                <label className="flex flex-col items-center justify-center gap-2 min-h-[140px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer text-center p-4 hover:border-blue-400">
                                    {preview
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={preview} alt="Arte seleccionado" className="max-h-36 rounded-lg object-contain" />
                                        : <Icon name="image" size={28} className="text-blue-600" />}
                                    <span className="font-semibold">{file ? 'Cambiar arte' : 'Subir arte del anuncio'}</span>
                                    <span className="text-[13px] text-slate-500">{file ? file.name : 'JPG o PNG'}</span>
                                    <input type="file" accept="image/png,image/jpeg" onChange={onFile} className="sr-only" />
                                </label>
                            </>
                        ) : (
                            <Section title="Campañas activas" aside={`${campaignIds.length} de ${activeCampaigns.length} seleccionadas`}>
                                {activeCampaigns.length === 0 ? (
                                    <p className="m-0 text-[13px] text-slate-500">No hay campañas activas. Crea una o revisa su estado en Campañas.</p>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                                        {activeCampaigns.map((c) => (
                                            <label key={c.id} className="flex items-center gap-3 px-4 min-h-11 cursor-pointer hover:bg-slate-50">
                                                <input type="checkbox" checked={campaignIds.includes(c.id)} onChange={() => toggle(setCampaignIds)(c.id)} className="w-4 h-4 accent-blue-600" />
                                                <span className="text-sm text-slate-900">{c.service}</span>
                                                <span className="ml-auto text-xs text-slate-500">{(c.platform || '').toLowerCase().includes('linkedin') ? 'LinkedIn' : 'Meta'}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </Section>
                        )}
                    </Card>

                    <aside aria-label="Resumen del lanzamiento" className="xl:sticky xl:top-6">
                        <Card as="div" className="p-5 flex flex-col gap-4">
                            <h2 className="m-0 text-[15px] font-bold">Resumen</h2>
                            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                                <dt className="text-slate-500">Modo</dt><dd className="m-0 text-right font-semibold">{MODES.find((m) => m.value === mode).label}</dd>
                                <dt className="text-slate-500">Estrategia</dt><dd className="m-0 text-right font-semibold">{strategyLabel}</dd>
                                <dt className="text-slate-500">Público</dt><dd className="m-0 text-right font-semibold">{AUDIENCE_OPTIONS.find((o) => o.value === audienceType)?.label}</dd>
                                {mode === 'new' ? (
                                    <>
                                        <dt className="text-slate-500">Presupuesto</dt><dd className="m-0 text-right font-semibold">$ {fmt(budget)} / día</dd>
                                        <dt className="text-slate-500">Países</dt><dd className="m-0 text-right font-semibold">{countries.length}</dd>
                                        <dt className="text-slate-500">Servicios</dt><dd className="m-0 text-right font-semibold">{services.length}</dd>
                                    </>
                                ) : (
                                    <>
                                        <dt className="text-slate-500">Campañas</dt><dd className="m-0 text-right font-semibold">{campaignIds.length}</dd>
                                    </>
                                )}
                            </dl>
                            {problems.length > 0 && (
                                <ul role="alert" className="m-0 pl-4 text-[13px] text-amber-800 flex flex-col gap-1">
                                    {problems.map((p) => <li key={p}>{p}</li>)}
                                </ul>
                            )}
                            <Button type="submit" variant="primary" size="lg" disabled={processing || problems.length > 0}>
                                {processing ? 'Procesando…' : mode === 'new' ? 'Ejecutar lanzamiento' : 'Sincronizar audiencia'}
                            </Button>
                            <span className="text-xs text-slate-500">Se pedirá confirmación antes de publicar en las plataformas.</span>
                        </Card>
                    </aside>
                </form>
            </div>
        </>
    );
}
