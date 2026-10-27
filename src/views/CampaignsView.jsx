'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import CampaignTable from '../components/CampaignTable';
import AudienceSelect, { DEFAULT_AUDIENCE, skippedNotice } from '../components/AudienceSelect';
import { PageBody, PageHeader } from '../components/shell/AppShell';
import { Button, Card, Field, Icon, MoneyInput, buttonClass, cx, inputClass } from '../components/ui';
import { useDashboardData } from '../hooks/useDashboardData';
import { useRevalidate } from '../hooks/useApi';
import { apiFetch } from '../lib/apiClient';
import { campaignService } from '../services/api';

export const PLATFORM_OPTIONS = [
    { value: 'all', label: 'Redes sociales (Meta + LinkedIn)' },
    { value: 'facebook', label: 'Solo Meta (Facebook / Instagram)' },
    { value: 'linkedin', label: 'Solo LinkedIn' },
    { value: 'google', label: 'Google Ads (búsqueda)' },
];

const PLATFORM_NAMES = { facebook: 'Meta', linkedin: 'LinkedIn', google: 'Google Ads' };

// Plataformas donde realmente se publicó, descontando las que el backend omitió por el público.
export const publishedPlatforms = (platform, skipped = []) => {
    const requested = platform === 'all' ? ['facebook', 'linkedin'] : [platform];
    const names = requested.filter(p => !skipped.includes(p)).map(p => PLATFORM_NAMES[p] || p);
    return names.length ? names.join(' y ') : 'ninguna plataforma';
};

function Steps({ current }) {
    const steps = ['Imagen', 'Ajustes', 'Publicar'];
    return (
        <ol aria-label="Pasos" className="flex flex-wrap gap-2 m-0 p-0 list-none">
            {steps.map((label, i) => {
                const n = i + 1;
                const state = n < current ? 'done' : n === current ? 'current' : 'todo';
                return (
                    <li
                        key={label}
                        aria-current={state === 'current' ? 'step' : undefined}
                        className={cx(
                            'text-xs font-semibold px-3 py-1.5 rounded-full',
                            state === 'current' && 'bg-blue-600 text-white',
                            state === 'done' && 'bg-blue-50 text-blue-800',
                            state === 'todo' && 'bg-slate-100 text-slate-500'
                        )}
                    >
                        {n} · {label}
                    </li>
                );
            })}
        </ol>
    );
}

// Campaña automática: la IA lee la imagen y sugiere el servicio; el usuario revisa y publica
function AutoCampaignCard({ services, config }) {
    const revalidate = useRevalidate();
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [service, setService] = useState('');
    const [detected, setDetected] = useState(null);
    const [platform, setPlatform] = useState('all');
    const [audienceType, setAudienceType] = useState(DEFAULT_AUDIENCE);
    const [budget, setBudget] = useState(config?.default_budget || 50000);

    useEffect(() => {
        if (!service && services.length) setService(services[0]);
    }, [services, service]);

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const reset = () => {
        setFile(null);
        setPreview(null);
        setDetected(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const onFile = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setDetected(null);
        setAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('image', f);
            const result = await apiFetch('/api/v1/assets/analyze', { method: 'POST', body: formData });
            const aiService = result?.data?.service;
            if (aiService && services.includes(aiService)) {
                setService(aiService);
                setDetected(aiService);
            }
        } catch (err) {
            // Sin análisis se sigue con el servicio elegido a mano
            console.warn('Análisis IA no disponible:', err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const publish = async () => {
        if (!file) return;
        const minBudget = config?.min_daily_budget || 20000;
        if (Number(budget) < minBudget) {
            Swal.fire('Presupuesto muy bajo', `El mínimo diario es $ ${minBudget.toLocaleString('es-CO')} COP.`, 'warning');
            return;
        }
        setPublishing(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('service_name', service || 'General');
            formData.append('budget', budget);
            formData.append('platform', platform);
            formData.append('audience_type', audienceType);
            const res = await campaignService.uploadCreative(formData);
            const notice = skippedNotice(res?.skipped);
            revalidate('/api/v1/campaigns');
            Swal.fire({
                title: 'Campaña creada',
                html: `Se creó la campaña de <b>${service}</b> en <b>${publishedPlatforms(platform, res?.skipped)}</b>.${notice ? `<br/><small>${notice}</small>` : ''}`,
                icon: 'success',
                timer: 3500,
                showConfirmButton: false,
            });
            reset();
        } catch (error) {
            Swal.fire('No se pudo crear la campaña', error.message, 'error');
        } finally {
            setPublishing(false);
        }
    };

    const step = !file ? 1 : publishing ? 3 : 2;
    const busy = analyzing || publishing;

    return (
        <Card aria-labelledby="auto-title" className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
                <div className="flex flex-col gap-0.5">
                    <h2 id="auto-title" className="m-0 text-base font-bold">Nueva campaña automática</h2>
                    <span className="text-[13px] text-slate-500">Sube la imagen; la IA detecta el servicio y redacta el anuncio. Tú revisas antes de publicar.</span>
                </div>
                <Steps current={step} />
            </div>

            <div className="grid gap-6 p-5 grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-2">
                    {!preview ? (
                        <label className="flex flex-col items-center justify-center gap-2 min-h-[260px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer text-center p-4 hover:border-blue-400 hover:bg-blue-50/40">
                            <Icon name="image" size={32} className="text-blue-600" />
                            <span className="font-semibold">Arrastra la imagen o haz clic para subirla</span>
                            <span className="text-[13px] text-slate-500">JPG o PNG · máximo 5 MB</span>
                            <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={onFile} className="sr-only" />
                        </label>
                    ) : (
                        <div className="relative flex items-center justify-center min-h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Imagen del anuncio" className={cx('max-h-[320px] w-auto object-contain', busy && 'opacity-50')} />
                            {busy && (
                                <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white font-semibold">
                                    <span aria-hidden="true" className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin" />
                                    {analyzing ? 'Leyendo el texto de la imagen…' : 'Publicando campaña…'}
                                </div>
                            )}
                        </div>
                    )}
                    {preview && !busy && (
                        <div className="flex justify-between gap-3 text-[13px]">
                            <span className="text-slate-500 truncate">{file?.name}</span>
                            <button type="button" onClick={reset} className="border-0 bg-transparent text-blue-700 font-semibold cursor-pointer">Cambiar imagen</button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <Field label="Servicio detectado" hint={detected ? 'Detectado por la IA. Puedes corregirlo si se equivoca.' : 'Puedes corregirlo si la IA se equivoca.'}>
                        <select value={service} onChange={(e) => setService(e.target.value)} disabled={busy} className={inputClass}>
                            {services.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </Field>
                    <Field label="Plataformas">
                        <select value={platform} onChange={(e) => setPlatform(e.target.value)} disabled={busy} className={inputClass}>
                            {PLATFORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <AudienceSelect value={audienceType} onChange={setAudienceType} disabled={busy} platform={platform} />
                        <Field label="Presupuesto base (COP)">
                            <MoneyInput value={budget} onChange={setBudget} min={config?.min_daily_budget || 20000} step={5000} disabled={busy} />
                        </Field>
                    </div>
                    <Button variant="primary" size="lg" onClick={publish} disabled={!file || busy}>
                        {publishing ? 'Publicando…' : 'Generar campaña con IA'}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

export default function CampaignsView() {
    const { data } = useDashboardData('30');
    const revalidate = useRevalidate();
    const services = data?.services || [];
    const config = data?.business_config || { lead_value: 15, min_daily_budget: 20000, default_budget: 50000 };

    const handleApprove = async (campaignId) => {
        Swal.fire({
            title: 'Activando campaña…',
            text: 'Sincronizando con la plataforma de anuncios.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            await campaignService.approve(campaignId);
            Swal.fire({ title: 'Campaña aprobada', icon: 'success', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire('No se pudo activar', err.message || 'Revisa los logs del servidor.', 'error');
        } finally {
            revalidate('/api/v1/campaigns');
            revalidate('/api/v1/dashboard/summary');
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Adquisición"
                title="Campañas (Ads)"
                actions={
                    <Link href="/campaigns/new" className={buttonClass('primary', 'md', 'no-underline')}>
                        <Icon name="plus" size={16} /> Campaña manual
                    </Link>
                }
            />
            <PageBody>
                <AutoCampaignCard services={services} config={config} />
                <Card aria-labelledby="hist-title" className="overflow-hidden">
                    <CampaignTable onApprove={handleApprove} config={config} />
                </Card>
            </PageBody>
        </>
    );
}
