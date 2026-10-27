'use client';
import { useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { campaignService } from '../services/api';
import { apiFetch } from '../lib/apiClient';
import { useApi, useRevalidate } from '../hooks/useApi';
import { useDashboardData } from '../hooks/useDashboardData';
import FormattedDate from '../components/FormattedDate';
import AudienceSelect, { DEFAULT_AUDIENCE, skippedNotice } from '../components/AudienceSelect';
import { PageBody, PageHeader } from '../components/shell/AppShell';
import { PLATFORM_OPTIONS, publishedPlatforms } from './CampaignsView';
import { Button, Card, Chips, EmptyState, Field, Icon, MoneyInput, cx, inputClass } from '../components/ui';

const ALL = 'Todos';

// Las piezas antiguas guardaban rutas locales; hoy todas viven en el bucket de GCS
const imageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const filename = path.replace(/\\/g, '/').split('/').pop();
    return `https://storage.googleapis.com/marketing-system-assets-prod/uploads/${filename}`;
};

function CreativeCard({ creative, onCreate, onDelete, busy }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [broken, setBroken] = useState(false);
    const src = imageUrl(creative.url);
    return (
        <li className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] hover:border-slate-300 transition-shadow">
            <div className="aspect-square bg-slate-200 flex items-center justify-center text-slate-600 text-xs text-center p-0">
                {src && !broken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={`Pieza publicitaria de ${creative.service}`} loading="lazy" onError={() => setBroken(true)} className="w-full h-full object-cover" />
                ) : (
                    <span className="p-3">Imagen no disponible</span>
                )}
            </div>
            <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-[13px] truncate" title={creative.service}>{creative.service || 'Sin servicio asignado'}</span>
                    <span className="text-xs text-slate-500"><FormattedDate dateString={creative.date} /></span>
                </div>
                <div className="relative flex gap-1.5 mt-auto">
                    <Button size="sm" variant="primary" className="flex-1" disabled={busy} onClick={() => onCreate(creative)}>Crear campaña</Button>
                    <button
                        type="button"
                        aria-label={`Más opciones de la pieza de ${creative.service}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((o) => !o)}
                        className="w-9 min-h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <Icon name="more" size={16} />
                    </button>
                    {menuOpen && (
                        <>
                            <button type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-10 cursor-default border-0 bg-transparent" />
                            <div role="menu" className="absolute right-0 bottom-full mb-1 z-20 w-48 py-1.5 bg-white border border-slate-200 rounded-lg shadow-lg">
                                {src && (
                                    <a role="menuitem" href={src} target="_blank" rel="noopener noreferrer" className="flex items-center min-h-10 px-3.5 text-sm text-slate-800 no-underline hover:bg-slate-50">
                                        Ver imagen completa
                                    </a>
                                )}
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => { setMenuOpen(false); onDelete(creative); }}
                                    className="w-full min-h-10 px-3.5 text-left text-sm text-red-700 border-0 bg-transparent cursor-pointer hover:bg-slate-50"
                                >
                                    Eliminar de la galería
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}

export default function GalleryView() {
    const { data: summary } = useDashboardData('30');
    const config = summary?.business_config;
    const minBudget = config?.min_daily_budget || 20000;
    const revalidate = useRevalidate();

    const { data, loading, refresh } = useApi('/api/v1/assets/creatives');
    const creatives = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    const [budget, setBudget] = useState(config?.default_budget || 50000);
    const [audienceType, setAudienceType] = useState(DEFAULT_AUDIENCE);
    const [platform, setPlatform] = useState('all');
    const [filter, setFilter] = useState(ALL);
    const [busy, setBusy] = useState(false);
    const fileRef = useRef(null);

    // Filtros: los servicios con más piezas primero
    const chips = useMemo(() => {
        const counts = {};
        creatives.forEach((c) => { const k = c.service || 'Sin servicio asignado'; counts[k] = (counts[k] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
        return [ALL, ...top].map((v) => ({ value: v, label: v }));
    }, [creatives]);

    const visible = filter === ALL ? creatives : creatives.filter((c) => (c.service || 'Sin servicio asignado') === filter);

    const budgetOk = () => {
        if (Number(budget) >= minBudget) return true;
        Swal.fire('Presupuesto muy bajo', `El mínimo diario es $ ${minBudget.toLocaleString('es-CO')} COP.`, 'warning');
        return false;
    };

    const summaryText = () =>
        `$ ${Number(budget).toLocaleString('es-CO')} diarios · ${PLATFORM_OPTIONS.find((p) => p.value === platform)?.label}`;

    // Subir una pieza nueva: la IA detecta el servicio y, tras confirmar, se crea la campaña
    const onUpload = async (e) => {
        const file = e.target.files?.[0];
        if (fileRef.current) fileRef.current.value = '';
        if (!file || !budgetOk()) return;
        setBusy(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const result = await apiFetch('/api/v1/assets/analyze', { method: 'POST', body: formData }).catch(() => null);
            const serviceName = result?.data?.service || 'General';

            const ok = await Swal.fire({
                title: 'Crear campaña con esta pieza',
                html: `Servicio detectado: <b>${serviceName}</b><br/><small>${summaryText()}</small>`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Crear campaña',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#2563EB',
            });
            if (!ok.isConfirmed) return;

            const createForm = new FormData();
            createForm.append('image', file);
            createForm.append('service_name', serviceName);
            createForm.append('budget', budget);
            createForm.append('platform', platform);
            createForm.append('audience_type', audienceType);
            const res = await campaignService.uploadCreative(createForm);
            const notice = skippedNotice(res?.skipped);
            Swal.fire({ title: 'Campaña creada', text: `${serviceName} en ${publishedPlatforms(platform, res?.skipped)}.${notice ? ` ${notice}` : ''}`, icon: 'success', timer: 3000, showConfirmButton: false });
            refresh();
            revalidate('/api/v1/campaigns');
        } catch (error) {
            Swal.fire('No se pudo crear la campaña', error.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const onCreate = async (creative) => {
        if (!budgetOk()) return;
        const ok = await Swal.fire({
            title: 'Crear campaña',
            html: `<b>${creative.service}</b><br/><small>${summaryText()}</small>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Crear campaña',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563EB',
        });
        if (!ok.isConfirmed) return;
        setBusy(true);
        try {
            const res = await campaignService.relaunchCreative(creative.id, Number(budget), platform, audienceType);
            const notice = skippedNotice(res?.skipped);
            Swal.fire({ title: 'Campaña creada', text: `${creative.service} en ${publishedPlatforms(platform, res?.skipped)}.${notice ? ` ${notice}` : ''}`, icon: 'success', timer: 2500, showConfirmButton: false });
            revalidate('/api/v1/campaigns');
        } catch (error) {
            Swal.fire('No se pudo crear la campaña', error.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const onDelete = async (creative) => {
        const ok = await Swal.fire({
            title: 'Eliminar pieza',
            text: `Se quitará de la galería la pieza de ${creative.service}. Las campañas ya creadas no se afectan.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#B91C1C',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
        });
        if (!ok.isConfirmed) return;
        try {
            await campaignService.deleteCreative(creative.id);
            refresh();
        } catch (error) {
            Swal.fire('No se pudo eliminar', error.message, 'error');
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Adquisición"
                title="Galería de activos"
                actions={
                    <>
                        <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={onUpload} className="sr-only" id="gallery-upload" />
                        <label htmlFor="gallery-upload" className={cx('inline-flex items-center justify-center gap-2 rounded-lg border font-semibold min-h-10 px-4 text-sm bg-white text-slate-900 border-slate-300 hover:bg-slate-50', busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer')}>
                            <Icon name="upload" size={16} /> {busy ? 'Procesando…' : 'Subir pieza'}
                        </label>
                    </>
                }
            />
            <PageBody>
                <Card aria-label="Valores por defecto para campañas" className="px-5 py-4 flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-0.5 flex-[1_1_240px]">
                        <span className="font-bold">Crear campaña desde una pieza</span>
                        <span className="text-[13px] text-slate-500">Elige una pieza y pulsa “Crear campaña”. Se usarán estos valores.</span>
                    </div>
                    <Field label="Presupuesto diario" className="w-40">
                        <MoneyInput value={budget} onChange={setBudget} min={minBudget} step={5000} />
                    </Field>
                    <Field label="Plataformas" className="w-64">
                        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputClass}>
                            {PLATFORM_OPTIONS.filter((o) => o.value !== 'google').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                    <AudienceSelect value={audienceType} onChange={setAudienceType} platform={platform} className="w-48" />
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Chips label="Filtrar por servicio" options={chips} value={filter} onChange={setFilter} />
                    <span className="text-[13px] text-slate-600">{visible.length} piezas</span>
                </div>

                {loading && !data ? (
                    <p className="text-slate-500">Cargando galería…</p>
                ) : visible.length === 0 ? (
                    <Card><EmptyState title="Aún no hay piezas" description="Usa “Subir pieza” para agregar una imagen y crear su campaña." /></Card>
                ) : (
                    <ul className="list-none m-0 p-0 grid gap-4 grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
                        {visible.map((c) => <CreativeCard key={c.id} creative={c} onCreate={onCreate} onDelete={onDelete} busy={busy} />)}
                    </ul>
                )}
            </PageBody>
        </>
    );
}
