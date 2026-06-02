'use client';
import React, { useContext } from 'react';
import SeoRankingTable from '../components/SeoRankingTable';
import ContentTable from '../components/ContentTable';
import { AuthContext } from '../context/AuthContext';
import { launchService } from '../services/api';
import Swal from 'sweetalert2';

import { useTaskStatus } from '../hooks/useTaskStatus';
import { API_BASE_URL } from '../app/config';

const SeoView = ({ rankings, content }) => {
    const { basicAuthHeader } = useContext(AuthContext);
    const [credits, setCredits] = React.useState(null);
    const [loadingCredits, setLoadingCredits] = React.useState(true);
    const [rankingStatus, setRankingStatus] = React.useState(null);
    const [activeContentTab, setActiveContentTab] = React.useState('blog');
    const [activeJobId, setActiveJobId] = React.useState(null);

    const { isRunning, progress, message: taskMessage, clear: clearTask } = useTaskStatus(activeJobId, basicAuthHeader, {
        onFinished: () => {
            Swal.fire('Completado', 'La verificación de rankings ha finalizado.', 'success');
            clearTask();
            setActiveJobId(null);
        },
        onFailed: (data) => {
            Swal.fire('Error', data.error || 'La tarea falló', 'error');
            clearTask();
            setActiveJobId(null);
        }
    });


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

    // Estado de cooldown: nacional 1 vez/semana, internacional 1 vez/mes
    const fetchRankingStatus = React.useCallback(async () => {
        try {
            const data = await launchService.getRankingStatus(basicAuthHeader);
            setRankingStatus(data?.data || null);
        } catch (error) {
            console.error("Error fetching ranking status:", error);
        }
    }, [basicAuthHeader]);

    React.useEffect(() => {
        fetchRankingStatus();
    }, [fetchRankingStatus]);

    const hasLowCredits = credits !== null && credits < 100;

    // Formatea una fecha ISO a dd/mm/aaaa (es-CO)
    const formatDate = (iso) => {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const nationalLocked = rankingStatus?.national && !rankingStatus.national.allowed;
    const internationalLocked = rankingStatus?.international && !rankingStatus.international.allowed;
    const allRankingsLocked = nationalLocked && internationalLocked;

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

        // Solo se ofrecen los alcances que NO estén en periodo de espera.
        // Nacional: 1 vez por semana · Internacional: 1 vez por mes.
        const inputOptions = {};
        if (!nationalLocked) {
            inputOptions['national'] = '🇨🇴 Nacional (Colombia) — semanal';
        }
        if (!internationalLocked) {
            inputOptions['international'] = '🌍 Internacional — mensual';
        }

        if (Object.keys(inputOptions).length === 0) {
            const nextNat = formatDate(rankingStatus?.national?.next_allowed);
            const nextInt = formatDate(rankingStatus?.international?.next_allowed);
            Swal.fire({
                title: '⏳ Verificación no disponible',
                icon: 'info',
                html: `Para cuidar los créditos, los rankings tienen una frecuencia fija:<br/><br/>` +
                    `🇨🇴 <b>Nacional</b> (semanal): disponible el <b>${nextNat}</b><br/>` +
                    `🌍 <b>Internacional</b> (mensual): disponible el <b>${nextInt}</b>`,
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const { value: scope } = await Swal.fire({
            title: '🔍 Verificar Rankings',
            text: '¿Qué alcance deseas verificar?',
            icon: 'question',
            input: 'select',
            inputOptions,
            inputValue: Object.keys(inputOptions)[0],
            showCancelButton: true,
            confirmButtonText: 'Verificar',
            confirmButtonColor: '#2563eb'
        });

        if (scope) {
            try {
                // Modificado para usar fetch directo y capturar el job_id
                const res = await fetch(`${API_BASE_URL}/api/v1/seo/manual-ranking-check`, {
                    method: 'POST',
                    headers: {
                        'Authorization': basicAuthHeader,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ scope })
                });
                const data = await res.json();

                if (res.status === 429 || data.status === 'blocked') {
                    // El backend rechazó por cooldown (fuente de verdad). Refrescamos estado.
                    fetchRankingStatus();
                    Swal.fire('Verificación no disponible', data.message || 'Esta verificación aún no está disponible.', 'info');
                    return;
                }

                if (data.status === 'success') {
                    setActiveJobId(data.job_id);
                    fetchRankingStatus();
                    Swal.fire('Iniciado', `Verificación de rankings (${scope}) iniciada. Puedes ver el progreso en la barra superior.`, 'success');
                } else {
                    throw new Error(data.message || 'Error al iniciar');
                }
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

            {/* BARRA DE PROGRESO DE TAREA */}
            {isRunning && (
                <div className="mb-8 bg-blue-50 border border-blue-100 p-4 rounded-2xl shadow-sm animate-pulse">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-blue-700 flex items-center gap-2">
                            <span className="animate-spin">⏳</span> {taskMessage || 'Procesando...'}
                        </span>
                        <span className="text-sm font-black text-blue-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-blue-600 h-full transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

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
                    {/* Próxima verificación disponible (cadencia: nacional semanal · internacional mensual) */}
                    {(nationalLocked || internationalLocked) && (
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                            {nationalLocked && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    🇨🇴 Nacional disponible el {formatDate(rankingStatus?.national?.next_allowed)}
                                </span>
                            )}
                            {internationalLocked && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    🌍 Internacional disponible el {formatDate(rankingStatus?.international?.next_allowed)}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                    <PremiumTooltip message="Se requiere al menos 100 créditos en SerpHouse para realizar una verificación de rankings." enabled={hasLowCredits}>
                        <button
                            onClick={handleRankingCheck}
                            disabled={hasLowCredits || allRankingsLocked}
                            title={allRankingsLocked
                                ? `Disponible: 🇨🇴 ${formatDate(rankingStatus?.national?.next_allowed)} · 🌍 ${formatDate(rankingStatus?.international?.next_allowed)}`
                                : undefined}
                            className={`${(hasLowCredits || allRankingsLocked) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20 active:scale-95'} px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm`}
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
        </div>
    );
};

export default SeoView;