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
        if (hasLowCredits) {
            Swal.fire('Sin Créditos', 'No tienes créditos suficientes (< 100) para generar contenido IA.', 'error');
            return;
        }
        Swal.fire({
            title: '¿Generar Contenido IA?',
            text: 'Se buscará el servicio con peor ranking y se generará un Artículo SEO + Set de Q&A. Esto gasta créditos y puede tardar.',
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
                    <button
                        onClick={handleRankingCheck}
                        disabled={hasLowCredits}
                        title={hasLowCredits ? "Créditos insuficientes (< 100) para realizar esta acción" : ""}
                        className={`${hasLowCredits ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20 active:scale-95'} px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm`}
                    >
                        <span>🔍 Verificar Rankings</span>
                    </button>

                    <button
                        onClick={handleScraping}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
                    >
                        <span>📡 Sync Servicios</span>
                    </button>

                    <button
                        onClick={handleManualGenesis}
                        disabled={hasLowCredits}
                        title={hasLowCredits ? "Créditos insuficientes (< 100) para realizar esta acción" : ""}
                        className={`${hasLowCredits ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20 active:scale-95'} px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm`}
                    >
                        <span>🚀 Contenido IA</span>
                    </button>

                    <button
                        onClick={handleForceBoost}
                        disabled={hasLowCredits}
                        title={hasLowCredits ? "Créditos insuficientes (< 100) para realizar esta acción" : ""}
                        className={`${hasLowCredits ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20 active:scale-95'} px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm`}
                    >
                        <span>⚡ Force SEO Boost</span>
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

                {/* COLUMNA DERECHA: CONTENIDO */}
                <div className="flex-1 w-full bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[450px] h-auto">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center justify-between border-b border-slate-50 pb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📝</span> Contenido Publicado
                        </div>
                        {content && content.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider"
                            >
                                🗑️ Limpiar Historial
                            </button>
                        )}
                    </h3>
                    <div className="flex-1 overflow-visible md:overflow-y-auto rounded-xl">
                        <ContentTable content={content} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeoView;