'use client';
import React, { useContext } from 'react';
import SeoRankingTable from '../components/SeoRankingTable';
import ContentTable from '../components/ContentTable';
import { AuthContext } from '../context/AuthContext';
import { launchService } from '../services/api';
import Swal from 'sweetalert2';

const SeoView = ({ rankings, content }) => {
    const { basicAuthHeader } = useContext(AuthContext);

    const handleForceBoost = async () => {
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
                    <p className="text-slate-500 text-sm mt-1">Monitorización de rankings y generación de contenido automático.</p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                    <button
                        onClick={handleRankingCheck}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
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
                        onClick={handleForceBoost}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
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