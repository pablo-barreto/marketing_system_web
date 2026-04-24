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

    // --- ESTADO AUDITORÍA 404 ---
    const [auditLoading, setAuditLoading] = React.useState(false);
    const [auditResults, setAuditResults] = React.useState(null);
    const [redirectTargets, setRedirectTargets] = React.useState({});
    const [selectedUrls, setSelectedUrls] = React.useState(new Set());
    const [applyingRedirects, setApplyingRedirects] = React.useState(false);

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

    const handleAudit404 = async () => {
        setAuditLoading(true);
        setAuditResults(null);
        try {
            const data = await launchService.audit404(basicAuthHeader);
            setAuditResults(data);
            // Inicializar destinos y selección con los valores sugeridos
            const targets = {};
            const selected = new Set();
            (data.results || []).forEach(r => {
                targets[r.url] = r.suggested_redirect;
                selected.add(r.url);
            });
            setRedirectTargets(targets);
            setSelectedUrls(selected);

            if (!data.redirection_plugin_active) {
            const otherPlugins = data.other_redirect_plugins || [];
            if (otherPlugins.length > 0) {
                Swal.fire({
                    title: '⚠️ Plugin detectado pero no compatible',
                    html: `Se detectó el plugin <strong>${otherPlugins[0]}</strong> en WordPress, pero para la aplicación <em>automática</em> de redirecciones se necesita el plugin gratuito <strong>Redirection</strong> de John Godley.<br/><br/>
                    Puedes:<br/>
                    • Instalar <strong>Redirection</strong> (Plugins → Añadir nuevo) para aplicar automáticamente<br/>
                    • O crear las redirecciones manualmente en <strong>${otherPlugins[0]}</strong> usando las URLs de la tabla`,
                    icon: 'info',
                    confirmButtonColor: '#2563eb',
                    confirmButtonText: 'Entendido'
                });
            } else {
                Swal.fire({
                    title: '⚠️ Plugin requerido',
                    html: `Para aplicar redirecciones automáticamente necesitas el plugin gratuito <strong>Redirection</strong> de John Godley activo en WordPress.<br/><br/>Se instala en 1 clic desde <em>Plugins → Añadir nuevo</em>.`,
                    icon: 'warning',
                    confirmButtonColor: '#d97706'
                });
            }
        }
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setAuditLoading(false);
        }
    };

    const handleApplyRedirects = async () => {
        const toApply = (auditResults?.results || [])
            .filter(r => selectedUrls.has(r.url))
            .map(r => ({ source_url: r.url, target_url: redirectTargets[r.url] || r.suggested_redirect }))
            .filter(r => r.target_url);

        if (toApply.length === 0) {
            return Swal.fire('Sin selección', 'Selecciona al menos una URL para redirigir.', 'warning');
        }

        const confirm = await Swal.fire({
            title: `¿Aplicar ${toApply.length} redirección(es)?`,
            text: 'Se crearán reglas 301 permanentes en WordPress vía el plugin Redirection de John Godley. Requiere que ese plugin esté instalado y activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Sí, aplicar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        setApplyingRedirects(true);
        try {
            const res = await launchService.applyRedirects(toApply, basicAuthHeader);
            const failed = (res.details || []).filter(d => !d.ok);
            if (failed.length === 0) {
                Swal.fire('✅ Listo', `${res.applied} redirección(es) aplicadas correctamente.`, 'success');
            } else {
                Swal.fire({
                    title: `Parcialmente completado`,
                    html: `${res.applied} OK · ${failed.length} fallidas<br/><small style="color:#64748b">${failed.map(f => f.source_url).join('<br/>')}</small>`,
                    icon: 'warning'
                });
            }
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setApplyingRedirects(false);
        }
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

                    <button
                        onClick={handleAudit404}
                        disabled={auditLoading}
                        className={`${auditLoading ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20 active:scale-95'} px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm`}
                    >
                        <span>{auditLoading ? '⏳ Auditando...' : '🔗 Auditar 404'}</span>
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

            {/* SECCIÓN AUDITORÍA 404 */}
            {auditResults && (
                <div className="animate-fade-in-up w-full bg-white rounded-2xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
                    {/* Header */}
                    <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                🔗 Resultado Auditoría de URLs
                            </h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Se revisaron <strong>{auditResults.total_checked}</strong> URLs —{' '}
                                <span className={auditResults.total_404 > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                                    {auditResults.total_404} con error 404
                                </span>
                                {auditResults.redirection_plugin_active && (
                                    <span className="ml-3 inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        ✅ Plugin Redirection activo
                                    </span>
                                )}
                                {!auditResults.redirection_plugin_active && (auditResults.other_redirect_plugins || []).length > 0 && (
                                    <span className="ml-3 inline-flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                        ℹ️ {(auditResults.other_redirect_plugins)[0]} (manual)
                                    </span>
                                )}
                                {!auditResults.redirection_plugin_active && (auditResults.other_redirect_plugins || []).length === 0 && (
                                    <span className="ml-3 inline-flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                        ⚠️ Sin plugin de redirecciones
                                    </span>
                                )}
                            </p>
                        </div>
                        {auditResults.total_404 > 0 && (
                            <button
                                onClick={handleApplyRedirects}
                                disabled={applyingRedirects}
                                className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2
                                    ${applyingRedirects
                                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'}`}
                            >
                                {applyingRedirects ? '⏳ Aplicando...' : `✅ Aplicar ${selectedUrls.size} redirección(es)`}
                            </button>
                        )}
                    </div>

                    {/* Tabla de resultados */}
                    {auditResults.total_404 === 0 ? (
                        <div className="p-10 text-center text-emerald-600 font-bold">
                            ✅ No se encontraron URLs con error 404. ¡Todo está en orden!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedUrls.size === auditResults.results.length}
                                                onChange={e => {
                                                    if (e.target.checked) setSelectedUrls(new Set(auditResults.results.map(r => r.url)));
                                                    else setSelectedUrls(new Set());
                                                }}
                                                className="w-4 h-4 accent-emerald-500"
                                            />
                                        </th>
                                        {['URL con 404', 'Servicio', 'Redirigir a (editable)'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {auditResults.results.map((r) => (
                                        <tr key={r.url} className={`transition-colors ${selectedUrls.has(r.url) ? 'bg-emerald-50/40' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUrls.has(r.url)}
                                                    onChange={() => {
                                                        setSelectedUrls(prev => {
                                                            const next = new Set(prev);
                                                            next.has(r.url) ? next.delete(r.url) : next.add(r.url);
                                                            return next;
                                                        });
                                                    }}
                                                    className="w-4 h-4 accent-emerald-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-rose-600 hover:underline font-mono break-all max-w-xs block">
                                                    {r.url}
                                                </a>
                                                <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">404</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 font-medium">{r.service}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={redirectTargets[r.url] || ''}
                                                    onChange={e => setRedirectTargets(prev => ({ ...prev, [r.url]: e.target.value }))}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none font-mono text-slate-700"
                                                    placeholder="https://..."
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

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
        </div>
    );
};

export default SeoView;