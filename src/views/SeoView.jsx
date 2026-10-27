'use client';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import SeoRankingTable, { isNational, timeAgo } from '../components/SeoRankingTable';
import ContentTable from '../components/ContentTable';
import { PageBody, PageHeader } from '../components/shell/AppShell';
import { Button, Card, CardHeader, ProgressBar, StatCard, Tabs } from '../components/ui';
import { launchService } from '../services/api';
import { useApi, useRevalidate } from '../hooks/useApi';

const MIN_BOOST_CREDITS = 100;

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const confirm = (opts) => Swal.fire({ showCancelButton: true, cancelButtonText: 'Cancelar', confirmButtonColor: '#2563EB', ...opts });

export default function SeoView() {
    const revalidate = useRevalidate();
    const [scope, setScope] = useState('national');
    const [contentTab, setContentTab] = useState('BLOG');

    // Los rankings solo cambian cuando corre una verificación (minutos): basta refrescar cada 2 min
    const { data: rankingsData, loading: loadingRankings } = useApi('/api/v1/seo/rankings', { refreshInterval: 120000 });
    const { data: creditsData } = useApi('/api/v1/seo/credits');
    const { data: statusData, refresh: refreshStatus } = useApi('/api/v1/seo/ranking-status');
    // Solo para saber si hay historial que limpiar; cada lista pide su propia página
    const { data: contentSummary } = useApi('/api/v1/seo/content?page_size=1');

    const rankings = rankingsData?.items;
    const credits = creditsData ? (creditsData?.data?.credits ?? creditsData?.credits ?? 0) : null;
    const lowCredits = credits !== null && credits < MIN_BOOST_CREDITS;
    const status = statusData?.data?.[scope];
    const hasContent = (contentSummary?.total || 0) > 0;

    const scopeStats = useMemo(() => {
        const rows = (rankings || []).filter((r) => (scope === 'national' ? isNational(r) : !isNational(r)));
        const top10 = rows.filter((r) => r.ranking <= 10).length;
        const last = rows.reduce((max, r) => (r.checked_at && r.checked_at > max ? r.checked_at : max), '');
        return { total: rows.length, top10, last };
    }, [rankings, scope]);

    const scopeLabel = scope === 'national' ? 'nacional' : 'internacional';

    const runCheck = async () => {
        if (status && !status.allowed) {
            Swal.fire('Verificación al día', `La verificación ${scopeLabel} ya cubre este periodo. Próxima: ${fmtDate(status.next_allowed)}.`, 'info');
            return;
        }
        const ok = await confirm({
            title: `Verificar posiciones (${scopeLabel})`,
            text: 'Consulta Google para cada servicio y consume créditos de SerpHouse. Corre en segundo plano.',
            icon: 'question',
            confirmButtonText: 'Verificar ahora',
        });
        if (!ok.isConfirmed) return;
        try {
            await launchService.triggerRankingCheck(scope);
            Swal.fire('Verificación iniciada', 'Las posiciones se actualizarán a medida que avance.', 'success');
            refreshStatus();
        } catch (e) {
            Swal.fire('No se pudo iniciar', e.message, 'error');
        }
    };

    const runScraping = async () => {
        const ok = await confirm({
            title: 'Sincronizar servicios',
            text: 'Se revisará el sitio web para actualizar la lista de servicios.',
            icon: 'question',
            confirmButtonText: 'Sincronizar',
        });
        if (!ok.isConfirmed) return;
        try {
            await launchService.triggerScraping();
            Swal.fire('Sincronización iniciada', 'Recibirás una notificación al terminar.', 'success');
        } catch (e) {
            Swal.fire('No se pudo sincronizar', e.message, 'error');
        }
    };

    const runBoost = async () => {
        const ok = await confirm({
            title: 'Forzar SEO Boost',
            text: 'La IA analizará rankings, generará contenido y lo publicará en el CMS. Consume créditos y tarda unos minutos.',
            icon: 'warning',
            confirmButtonText: 'Forzar SEO Boost',
        });
        if (!ok.isConfirmed) return;
        try {
            await launchService.triggerSeoBoost();
            Swal.fire('Iniciado', 'El motor SEO trabaja en segundo plano.', 'success');
        } catch (e) {
            Swal.fire('No se pudo iniciar', e.message, 'error');
        }
    };

    const runGenesis = async () => {
        const ok = await confirm({
            title: 'Generar contenido con IA',
            text: 'Se toma el servicio con peor posición y se genera un artículo SEO y un set de preguntas frecuentes.',
            icon: 'question',
            confirmButtonText: 'Generar',
        });
        if (!ok.isConfirmed) return;
        try {
            await launchService.triggerManualGenesis();
            Swal.fire('Generación iniciada', 'El artículo y las preguntas se publicarán en segundo plano.', 'success');
        } catch (e) {
            Swal.fire('No se pudo generar', e.message, 'error');
        }
    };

    const clearHistory = async () => {
        const ok = await confirm({
            title: 'Limpiar historial',
            text: 'Se borrarán todos los registros de contenido publicado del panel. No se puede deshacer.',
            icon: 'warning',
            confirmButtonText: 'Limpiar',
            confirmButtonColor: '#B91C1C',
        });
        if (!ok.isConfirmed) return;
        try {
            await launchService.clearSeoHistory();
            revalidate('/api/v1/seo/content');
        } catch (e) {
            Swal.fire('No se pudo limpiar', e.message, 'error');
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Adquisición"
                title="SEO y contenido"
                actions={
                    <>
                        <Button onClick={runScraping}>Sincronizar servicios</Button>
                        <Button
                            onClick={runBoost}
                            disabled={lowCredits}
                            title={lowCredits ? `Se necesitan al menos ${MIN_BOOST_CREDITS} créditos` : 'Reprocesa las páginas y consume créditos'}
                        >
                            Forzar SEO Boost
                        </Button>
                        <Button variant="primary" onClick={runGenesis}>Generar contenido con IA</Button>
                    </>
                }
            />
            <PageBody>
                <p className="m-0 text-slate-600">Monitoreo de posiciones en Google y generación automática de contenido.</p>

                <section aria-label="Resumen SEO" className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <StatCard label={`Búsquedas en el Top 10 (${scopeLabel})`} value={scopeStats.top10.toLocaleString('es-CO')} suffix={`de ${scopeStats.total.toLocaleString('es-CO')}`}>
                        <ProgressBar value={scopeStats.total ? (scopeStats.top10 / scopeStats.total) * 100 : 0} />
                    </StatCard>
                    <StatCard label="Créditos de SerpHouse" value={credits === null ? '…' : credits.toLocaleString('es-CO')}>
                        <span className={lowCredits ? 'text-xs font-semibold text-red-700' : 'text-xs text-slate-500'}>
                            {lowCredits ? `Menos de ${MIN_BOOST_CREDITS}: el SEO Boost queda deshabilitado` : 'Se descuentan al verificar posiciones o forzar el boost'}
                        </span>
                    </StatCard>
                    <StatCard label={`Última verificación (${scopeLabel})`} value={timeAgo(status?.last_checked || scopeStats.last || null)}>
                        {status && !status.allowed ? (
                            <span className="text-xs text-slate-500">Próxima disponible: {fmtDate(status.next_allowed)}</span>
                        ) : (
                            <button type="button" onClick={runCheck} className="self-start border-0 bg-transparent p-0 min-h-6 text-blue-700 text-[13px] font-semibold cursor-pointer hover:underline">
                                Verificar ahora →
                            </button>
                        )}
                    </StatCard>
                </section>

                <SeoRankingTable rankings={rankings} scope={scope} onScopeChange={setScope} loading={loadingRankings} />

                <Card aria-labelledby="content-title" className="overflow-hidden">
                    <CardHeader
                        id="content-title"
                        title="Contenido publicado"
                        subtitle="Artículos y preguntas frecuentes que la IA publicó en el sitio."
                        actions={hasContent && <Button size="sm" variant="danger" onClick={clearHistory}>Limpiar historial</Button>}
                    />
                    <div className="px-5 border-b border-slate-200">
                        <Tabs
                            label="Tipo de contenido"
                            tabs={[{ value: 'BLOG', label: 'Artículos de blog' }, { value: 'Q&A', label: 'Preguntas frecuentes' }]}
                            value={contentTab}
                            onChange={setContentTab}
                        />
                    </div>
                    <ContentTable key={contentTab} type={contentTab} />
                </Card>
            </PageBody>
        </>
    );
}
