'use client';
import React, { useContext } from 'react';
import SeoRankingTable from '../components/SeoRankingTable';
import ContentTable from '../components/ContentTable';
import { AuthContext } from '../context/AuthContext';
import { launchService } from '../services/api';
import Swal from 'sweetalert2';

const SeoView = ({ rankings, content }) => {
    const { basicAuthHeader } = useContext(AuthContext);
    const [credits, setCredits] = React.useState(null);
    const [loadingCredits, setLoadingCredits] = React.useState(true);
    const [activeContentTab, setActiveContentTab] = React.useState('blog');
    const [auditOpen, setAuditOpen] = React.useState(false);
    const [auditLoading, setAuditLoading] = React.useState(false);
    const [auditResult, setAuditResult] = React.useState(null);


    // Filtrar contenido por tipo
    const blogContent = (content || []).filter(item => item.type === 'BLOG');
    const faqContent = (content || []).filter(item => item.type === 'Q&A');

    React.useEffect(() => {
        const fetchCredits = async () => {
            try {
                const data = await launchService.getSeoCredits(basicAuthHeader);
                // SerpHouse typically returns credits in data.data.credits or similar
                // Adjust based on the actual observed response
                const remaining = data?.data?.credits || data?.credits || 0;
                setCredits(remaining);
            } catch (error) {
                console.error("Error fetching credits:", error);
                setCredits(0);
            } finally {
                setLoadingCredits(false);
            }
        };

        fetchCredits();
    }, [basicAuthHeader]);

    const hasLowCredits = credits !== null && credits < 100;

    const handleForceBoost = async () => {
        if (hasLowCredits) {
            Swal.fire('Sin Créditos', 'No tienes créditos suficientes (< 100) para iniciar un ciclo intensivo.', 'error');
            return;
        }
        Swal.fire({
            title: '¿Iniciar Ciclo Intensivo?',
            text: 'La IA analizará rankings, generará contenido legal y lo publicará en el CMS. Esto puede tardar unos minutos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, Potenciar SEO',
            confirmButtonColor: '#d97706'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await launchService.triggerSeoBoost(basicAuthHeader);
                    Swal.fire('Iniciado', 'El motor SEO está trabajando en segundo plano.', 'success');
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    const handleRankingCheck = async () => {
        if (hasLowCredits) {
            Swal.fire('Sin Créditos', 'No tienes créditos suficientes (< 100) para realizar una verificación de rankings.', 'error');
            return;
        }
        const { value: scope } = await Swal.fire({
            title: '🔍 Verificar Rankings',
            text: '¿Qué alcance deseas verificar?',
            icon: 'question',
            input: 'select',
            inputOptions: {
                'national': '🇨🇴 Nacional (Colombia)',
                'international': '🌍 Internacional',
                'all': '🌐 Todos'
            },
            inputValue: 'all',
            showCancelButton: true,
            confirmButtonText: 'Verificar',
            confirmButtonColor: '#2563eb'
        });

        if (scope) {
            try {
                await launchService.triggerRankingCheck(scope, basicAuthHeader);
                Swal.fire('Iniciado', `Verificación de rankings (${scope}) ejecutándose en segundo plano. Recibirás una notificación al finalizar.`, 'success');
            } catch (e) {
                Swal.fire('Error', e.message, 'error');
            }
        }
    };

    const handleScraping = async () => {
        Swal.fire({
            title: '📡 Sincronizar Servicios',
            text: 'Se revisará tu sitio web para actualizar la lista de servicios en la base de datos.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sincronizar',
            confirmButtonColor: '#059669'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await launchService.triggerScraping(basicAuthHeader);
                    Swal.fire('Iniciado', 'Sincronización de servicios en segundo plano. Recibirás una notificación al finalizar.', 'success');
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    const handleManualGenesis = async () => {
        Swal.fire({
            title: '¿Generar Contenido IA?',
            text: 'Se buscará el servicio con peor ranking y se generará un Artículo SEO + Set de Q&A. Este proceso utiliza rankings existentes.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Generar Todo',
            confirmButtonColor: '#8b5cf6'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await launchService.triggerManualGenesis(basicAuthHeader);
                    Swal.fire('Iniciado', 'La IA está generando el artículo y las FAQs en segundo plano.', 'success');
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    const handleAudit = async () => {
        setAuditOpen(true);
        setAuditLoading(true);
        setAuditResult(null);
        try {
            const data = await launchService.getBrokenLinks(basicAuthHeader);
            setAuditResult(data);
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
            setAuditOpen(false);
        } finally {
            setAuditLoading(false);
        }
    };

    const handleClearHistory = async () => {
        Swal.fire({
            title: '¿Limpiar Historial?',
            text: 'Esta acción eliminará todos los registros de la tabla de contenido publicado. No se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, Limpiar Todo',
            confirmButtonColor: '#ef4444'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await launchService.clearSeoHistory(basicAuthHeader);
                    Swal.fire('Limpiado', 'El historial ha sido eliminado.', 'success').then(() => {
                        window.location.reload();
                    });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };


    // Componente Tooltip Premium para una mejor experiencia visual
    const PremiumTooltip = ({ children, message, enabled }) => {
        if (!enabled) return children;
        return (
            <div className="group relative flex items-center justify-center">
                {children}
                <div className="absolute top-full mt-3 hidden group-hover:flex flex-col items-center pointer-events-none z-[100] transition-all duration-300">
                    <div className="relative p-4 text-[12px] leading-relaxed text-white bg-slate-900 border border-white/20 rounded-2xl shadow-2xl w-56 text-center backdrop-blur-xl">
                        <div className="font-black mb-2 text-red-500 flex items-center justify-center gap-1 text-xs uppercase tracking-tighter">
                            <span className="text-base">⚠️</span> CRÉDITOS INSUFICIENTES
                        </div>
                        <p className="font-medium text-slate-300">{message}</p>
                        {/* Triángulo apuntando hacia arriba */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-b-slate-900"></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-2 md:p-6 w-full max-w-full overflow-x-hidden">

            {/* ENCABEZADO SUPERIOR CON BOTONES DE ACCIÓN */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Estrategia Orgánica</h2>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                        <p className="text-slate-500 text-sm">Monitorización de rankings y generación de contenido automático.</p>
                        {!loadingCredits && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasLowCredits ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {credits} créditos restantes
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                    <PremiumTooltip message="Se requiere al menos 100 créditos en SerpHouse para realizar una verificación de rankings." enabled={hasLowCredits}>
                        <button
                            onClick={handleRankingCheck}
                            disabled={hasLowCredits}
                            className={`${hasLowCredits ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20 active:scale-95'} px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm`}
                        >
                            <span>🔍 Verificar Rankings</span>
                        </button>
                    </PremiumTooltip>

                    <button
                        onClick={handleScraping}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
                    >
                        <span>📡 Sync Servicios</span>
                    </button>

                    <button
                        onClick={handleManualGenesis}
                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20 active:scale-95 px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm"
                    >
                        <span>🚀 Contenido IA</span>
                    </button>

                    <PremiumTooltip message="Se requiere al menos 100 créditos en SerpHouse para iniciar una optimización intensiva." enabled={hasLowCredits}>
                        <button
                            onClick={handleForceBoost}
                            disabled={hasLowCredits}
                            className={`${hasLowCredits ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20 active:scale-95'} px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm`}
                        >
                            <span>⚡ Force SEO Boost</span>
                        </button>
                    </PremiumTooltip>

                    <button
                        onClick={handleAudit}
                        disabled={auditLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                        <span>🔗 Auditar Links</span>
                    </button>
                </div>
            </div>

            {/* GRID DE CONTENIDO */}
            <div className="animate-fade-in-up flex flex-col lg:flex-row gap-8 w-full">

                {/* COLUMNA IZQUIERDA: RANKINGS */}
                <div className="flex-1 w-full bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[450px] h-auto">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 shrink-0">
                        <span className="text-xl">🌍</span> Rankings Internacionales
                    </h3>
                    <div className="flex-1 overflow-visible md:overflow-y-auto rounded-xl">
                        <SeoRankingTable rankings={rankings} />
                    </div>
                </div>
            </div>


            {/* SECCIÓN DE CONTENIDO PUBLICADO (CON PESTAÑAS) */}
            <div className="animate-fade-in-up w-full bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-50 pb-4">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveContentTab('blog')}
                            className={`pb-2 px-1 text-sm font-bold transition-all flex items-center gap-2 ${activeContentTab === 'blog'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span>📝</span> Artículos de Blog
                        </button>
                        <button
                            onClick={() => setActiveContentTab('faq')}
                            className={`pb-2 px-1 text-sm font-bold transition-all flex items-center gap-2 ${activeContentTab === 'faq'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span>❓</span> Preguntas Frecuentes
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {content && content.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider flex items-center gap-1"
                            >
                                🗑️ Limpiar Historial Total
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-visible">
                    {activeContentTab === 'blog' ? (
                        <ContentTable content={blogContent} title="Entradas de Blog Publicadas" />
                    ) : (
                        <ContentTable content={faqContent} title="FAQs Generadas por IA" />
                    )}
                </div>
            </div>

            {/* SECCIÓN: AUDITORÍA DE LINKS ROTOS */}
            {auditOpen && (
                <div className="animate-fade-in-up w-full bg-white rounded-2xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🔗</span>
                            <div>
                                <h3 className="font-bold text-slate-800">Auditoría de Links Publicados</h3>
                                {auditResult && !auditLoading && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {auditResult.total} URLs verificadas ·{' '}
                                        <span className="text-red-500 font-semibold">{auditResult.broken?.length} rotas</span> ·{' '}
                                        <span className="text-emerald-600 font-semibold">{auditResult.ok?.length} activas</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setAuditOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
                    </div>

                    {auditLoading && (
                        <div className="flex justify-center items-center py-16 text-slate-400 animate-pulse">
                            Verificando URLs... esto puede tomar unos segundos.
                        </div>
                    )}

                    {auditResult && !auditLoading && (
                        <div className="p-6 space-y-6">

                            {/* LINKS ROTOS */}
                            {auditResult.broken?.length > 0 ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        <h4 className="font-semibold text-red-600 text-sm uppercase tracking-wide">
                                            URLs con error ({auditResult.broken.length})
                                        </h4>
                                    </div>
                                    <div className="rounded-xl border border-red-100 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-red-50 text-xs text-red-400 uppercase tracking-wider">
                                                    <th className="text-left px-4 py-2.5 font-medium">URL</th>
                                                    <th className="text-center px-4 py-2.5 font-medium w-20">Código</th>
                                                    <th className="text-center px-4 py-2.5 font-medium w-32">Publicado</th>
                                                    <th className="text-right px-4 py-2.5 font-medium w-36">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-red-50">
                                                {auditResult.broken.map((item, i) => (
                                                    <tr key={i} className="hover:bg-red-50/50">
                                                        <td className="px-4 py-3">
                                                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                                className="text-slate-700 hover:text-blue-600 hover:underline break-all text-xs font-mono">
                                                                {item.url}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 404 ? 'bg-red-100 text-red-600' : item.status === 0 ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-600'}`}>
                                                                {item.status === 0 ? 'Error' : item.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-xs text-slate-400">
                                                            {new Date(item.published_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <a
                                                                href={`https://search.google.com/search-console/removals`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
                                                                title="Abrir Google Search Console para solicitar eliminación"
                                                            >
                                                                Eliminar de Google →
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* INSTRUCCIONES GSC */}
                                    <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                                        <p className="font-semibold mb-1">Cómo eliminar estas URLs de Google:</p>
                                        <ol className="list-decimal list-inside space-y-1 text-xs text-amber-700">
                                            <li>Abre <strong>Google Search Console</strong> → pestaña <strong>Eliminaciones</strong></li>
                                            <li>Haz clic en <strong>"Nueva solicitud"</strong> e ingresa la URL exacta</li>
                                            <li>Selecciona <strong>"Eliminar esta URL de caché"</strong> (temporal) o espera a que Google la des-indexe sola al detectar el 404</li>
                                            <li>Google de-indexa automáticamente en ~2 semanas las URLs que devuelven 404 consistentemente</li>
                                        </ol>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-emerald-600">
                                    <div className="text-3xl mb-2">✅</div>
                                    <p className="font-semibold">Todas las URLs publicadas están activas.</p>
                                    <p className="text-sm text-slate-400 mt-1">No se encontraron links rotos.</p>
                                </div>
                            )}

                            {/* LINKS ACTIVOS (colapsado) */}
                            {auditResult.ok?.length > 0 && (
                                <details className="group">
                                    <summary className="cursor-pointer text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-2 select-none">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                        Ver {auditResult.ok.length} URLs activas
                                    </summary>
                                    <div className="mt-3 rounded-xl border border-emerald-100 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-emerald-50">
                                                {auditResult.ok.map((item, i) => (
                                                    <tr key={i} className="hover:bg-emerald-50/50">
                                                        <td className="px-4 py-2.5">
                                                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                                className="text-xs font-mono text-slate-600 hover:text-blue-600 hover:underline break-all">
                                                                {item.url}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-600">
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SeoView;