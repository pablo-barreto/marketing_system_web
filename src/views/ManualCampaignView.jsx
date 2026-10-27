'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AudienceSelect, { DEFAULT_AUDIENCE, skippedNotice } from '../components/AudienceSelect';
import { PageHeader } from '../components/shell/AppShell';
import { Button, Card, Field, Icon, MoneyInput, buttonClass, inputClass } from '../components/ui';
import { useDashboardData } from '../hooks/useDashboardData';
import { useRevalidate } from '../hooks/useApi';
import { campaignService } from '../services/api';

const MAX_COPY = 500;
const today = () => new Date().toISOString().split('T')[0];

function Section({ title, children }) {
    return (
        <fieldset className="m-0 border border-slate-200 rounded-xl bg-white px-6 pt-5 pb-6 flex flex-col gap-4 min-w-0">
            <legend className="px-1.5 text-[15px] font-bold">{title}</legend>
            {children}
        </fieldset>
    );
}

export default function ManualCampaignView() {
    const router = useRouter();
    const revalidate = useRevalidate();
    const { data } = useDashboardData('30');
    const services = data?.services || [];
    const minBudget = data?.business_config?.min_daily_budget || 20000;

    const [form, setForm] = useState({
        title: '', body: '', redirect_url: '', whatsapp_number: '', service: '',
        platform: 'facebook', budget: 50000, end_date: '', audience_type: DEFAULT_AUDIENCE,
    });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const onFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) {
            Swal.fire('Imagen muy pesada', 'El máximo es 5 MB.', 'warning');
            return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            Swal.fire('Falta la imagen', 'Sube la imagen del anuncio.', 'warning');
            return;
        }
        if (Number(form.budget) < minBudget) {
            Swal.fire('Presupuesto muy bajo', `El mínimo diario es $ ${minBudget.toLocaleString('es-CO')} COP.`, 'warning');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('title', form.title.trim());
            formData.append('body', form.body.trim());
            formData.append('redirect_url', form.redirect_url.trim());
            if (form.whatsapp_number.trim()) formData.append('whatsapp_number', form.whatsapp_number.trim());
            if (form.service) formData.append('service', form.service);
            formData.append('platform', form.platform);
            formData.append('budget', form.budget);
            formData.append('audience_type', form.audience_type);
            if (form.end_date) formData.append('end_date', form.end_date);

            const res = await campaignService.createManualCampaign(formData);
            const platforms = res.created?.map((c) => c.platform).join(', ') || 'las plataformas';
            const notice = skippedNotice(res.skipped);
            revalidate('/api/v1/campaigns');
            await Swal.fire({ title: 'Campaña publicada', text: `Publicada en ${platforms}.${notice ? ` ${notice}` : ''}`, icon: 'success' });
            router.push('/campaigns');
        } catch (error) {
            Swal.fire('No se pudo publicar', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                breadcrumb={[{ label: 'Campañas (Ads)', href: '/campaigns' }, { label: 'Campaña manual' }]}
                title="Nueva campaña manual"
                actions={<span className="text-[13px] text-slate-600">Contenido libre · CTA a WhatsApp · URL de destino propia</span>}
            />
            <form onSubmit={onSubmit} className="w-full max-w-[1240px] mx-auto px-4 md:px-8 pt-7 pb-12 box-border">
                <div className="grid gap-6 items-start grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    <div className="flex flex-col gap-5 min-w-0">
                        <Section title="1. Anuncio">
                            <label className="flex flex-col items-center justify-center gap-2 min-h-[150px] border-2 border-dashed border-slate-300 rounded-[10px] bg-slate-50 cursor-pointer text-center p-4 hover:border-blue-400">
                                {preview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={preview} alt="Imagen seleccionada" className="max-h-32 rounded-lg object-contain" />
                                ) : (
                                    <Icon name="image" size={32} className="text-blue-600" />
                                )}
                                <span className="font-semibold">
                                    {file ? 'Cambiar imagen' : <>Imagen del anuncio <span className="text-red-700">*</span></>}
                                </span>
                                <span className="text-[13px] text-slate-500">{file ? file.name : 'JPG o PNG · máximo 5 MB'}</span>
                                <input type="file" accept="image/png,image/jpeg" onChange={onFile} className="sr-only" />
                            </label>
                            <Field label="Título" required>
                                <input type="text" required maxLength={150} value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="Ej.: Webinar gratuito — Cierre tributario" className={inputClass} />
                            </Field>
                            <label className="flex flex-col gap-1.5">
                                <span className="flex justify-between">
                                    <span className="text-[13px] font-semibold text-slate-700">Texto del anuncio <span className="text-red-700">*</span></span>
                                    <span className="text-xs text-slate-500">{form.body.length}/{MAX_COPY}</span>
                                </span>
                                <textarea
                                    required
                                    rows={4}
                                    maxLength={MAX_COPY}
                                    value={form.body}
                                    onChange={(e) => set('body')(e.target.value)}
                                    placeholder="Texto principal que verá el usuario"
                                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-y"
                                />
                            </label>
                            <Field label="Servicio asociado" optional hint="Los leads y métricas de la campaña se atribuyen a este servicio.">
                                <select value={form.service} onChange={(e) => set('service')(e.target.value)} className={inputClass}>
                                    <option value="">Sin servicio (usar el título)</option>
                                    {services.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </Field>
                        </Section>

                        <Section title="2. Destino">
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <Field label="URL de destino" required hint="A donde lleva el clic en la imagen.">
                                    <input type="url" required value={form.redirect_url} onChange={(e) => set('redirect_url')(e.target.value)} placeholder="https://crconsultorescolombia.com/…" className={inputClass} />
                                </Field>
                                <Field label="WhatsApp para el CTA" optional hint="Si lo dejas vacío se usa el número por defecto.">
                                    <div className="flex items-center gap-1.5 h-11 rounded-lg border border-slate-300 bg-white px-3">
                                        <span className="text-slate-500">+</span>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={15}
                                            value={form.whatsapp_number}
                                            onChange={(e) => set('whatsapp_number')(e.target.value.replace(/\D/g, ''))}
                                            placeholder="57 300 000 0000"
                                            className="border-0 outline-none text-sm w-full bg-transparent"
                                        />
                                    </div>
                                </Field>
                            </div>
                        </Section>

                        <Section title="3. Distribución y presupuesto">
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <Field label="Plataforma">
                                    <select value={form.platform} onChange={(e) => set('platform')(e.target.value)} className={inputClass}>
                                        <option value="facebook">Solo Meta (Facebook / Instagram)</option>
                                        <option value="all">Meta + LinkedIn</option>
                                        <option value="linkedin">Solo LinkedIn</option>
                                    </select>
                                </Field>
                                <AudienceSelect value={form.audience_type} onChange={set('audience_type')} platform={form.platform} />
                                <Field label="Presupuesto diario (COP)" hint={`Mínimo $ ${minBudget.toLocaleString('es-CO')}.`}>
                                    <MoneyInput value={form.budget} onChange={set('budget')} min={minBudget} step={5000} />
                                </Field>
                                <Field
                                    label="Fecha límite"
                                    optional
                                    hint={form.end_date ? 'Se pausa en esta fecha aunque quede presupuesto.' : 'Sin fecha, se pausa al agotar el presupuesto.'}
                                >
                                    <input type="date" min={today()} value={form.end_date} onChange={(e) => set('end_date')(e.target.value)} className={inputClass} />
                                </Field>
                            </div>
                        </Section>
                    </div>

                    <aside aria-label="Vista previa" className="flex flex-col gap-4 xl:sticky xl:top-6">
                        <Card as="div" className="p-5 flex flex-col gap-3.5">
                            <h2 className="m-0 text-[15px] font-bold">Vista previa</h2>
                            <div className="border border-slate-200 rounded-[10px] overflow-hidden">
                                <div className="flex items-center gap-2.5 px-3 py-2.5">
                                    <div aria-hidden="true" className="w-8 h-8 rounded-full bg-slate-900" />
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-semibold">CR Consultores Colombia</span>
                                        <span className="text-xs text-slate-500">Publicidad</span>
                                    </div>
                                </div>
                                <p className="m-0 px-3 pb-2.5 text-[13px] text-slate-700 whitespace-pre-line">
                                    {form.body || 'Aquí aparecerá el texto del anuncio mientras lo escribes.'}
                                </p>
                                <div className="aspect-square bg-slate-200 flex items-center justify-center text-slate-500 text-[13px]">
                                    {preview
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={preview} alt="Vista previa de la imagen" className="w-full h-full object-cover" />
                                        : 'Imagen del anuncio'}
                                </div>
                                <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 bg-slate-50">
                                    <span className="text-sm font-semibold">{form.title || 'Título del anuncio'}</span>
                                    <span className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-slate-200">Enviar WhatsApp</span>
                                </div>
                            </div>
                        </Card>
                        <Card as="div" className="p-5 flex flex-col gap-3">
                            <span className="text-[13px] text-slate-600">Revisa la vista previa antes de publicar. Puedes pausar la campaña en cualquier momento desde el historial.</span>
                            <Button type="submit" variant="primary" size="lg" disabled={loading}>{loading ? 'Publicando…' : 'Publicar campaña'}</Button>
                            <Link href="/campaigns" className={buttonClass('secondary', 'md', 'no-underline min-h-11')}>Cancelar</Link>
                        </Card>
                    </aside>
                </div>
            </form>
        </>
    );
}
