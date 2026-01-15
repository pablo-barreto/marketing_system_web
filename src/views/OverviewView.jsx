'use client';
import SystemLogs from '@/components/SystemLogs';
import React from 'react';

// Iconos SVG (Sin cambios)
const Icons = {
    Users: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    TrendingUp: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    Activity: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    Server: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
    Rocket: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>,
    Globe: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

const OverviewView = ({ data }) => {

    // ========================================================================
    // 1. LÓGICA DE AGRUPACIÓN Y LIMPIEZA (FIX DUPLICADOS)
    // ========================================================================
    const processedServices = React.useMemo(() => {
        if (!data.service_visits) return [];

        // A. Crear diccionario para sumar visitas por nombre único
        const aggregationMap = data.service_visits.reduce((acc, curr) => {
            // Normalizamos el nombre: Mayúsculas y quitamos guiones extraños
            const normalizedName = curr.service_name.toUpperCase().replace(/-/g, ' ').trim();

            if (!acc[normalizedName]) {
                acc[normalizedName] = 0;
            }
            // Sumamos las visitas
            acc[normalizedName] += curr.total_visits;
            return acc;
        }, {});

        // B. Convertir de vuelta a array y ordenar por mayor tráfico
        return Object.entries(aggregationMap)
            .map(([name, count]) => ({
                service_name: name,
                total_visits: count
            }))
            .sort((a, b) => b.total_visits - a.total_visits); // Orden Descendente
    }, [data.service_visits]);

    // ========================================================================
    // 2. CÁLCULOS KPI (Usando los datos ya procesados)
    // ========================================================================
    const totalVisits = processedServices.reduce((a, b) => a + b.total_visits, 0) || 1;
    const totalLeads = data.crm_leads?.length || 0;
    const conversionRate = ((totalLeads / (totalVisits === 0 ? 1 : totalVisits)) * 100).toFixed(1);
    const activeCampaigns = data.campaigns?.filter(c => c.status === 'active').length || 0;
    const topRankings = data.seo_rankings?.filter(r => r.ranking <= 10).length || 0;

    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="animate-fade-in-up pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        Hola, Admin <span className="animate-wave text-3xl">👋</span>
                    </h2>
                    <p className="text-slate-500 mt-1 text-lg">Resumen ejecutivo del sistema.</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">{today}</p>
                </div>
            </div>

            {/* --- GRID PRINCIPAL --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">

                {/* 1. KPI PRINCIPAL */}
                <div className="col-span-1 lg:col-span-2 bg-slate-900 text-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between group h-full min-h-[220px]">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>

                    <div className="relative z-10 flex justify-between items-start h-full">
                        <div className="flex flex-col justify-between h-full">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-white/10 rounded-md backdrop-blur-sm">
                                    <Icons.Users />
                                </div>
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Prospectos CRM</span>
                            </div>
                            <div>
                                <div className="text-7xl font-black tracking-tighter">{totalLeads}</div>
                                <div className="mt-2 inline-flex items-center px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm border border-white/5">
                                    🚀 Tasa de Conversión: <span className="text-emerald-400 font-bold ml-2">{conversionRate}%</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-8xl opacity-10 grayscale group-hover:scale-110 transition-transform duration-700 absolute bottom-[-20px] right-[-20px]">👥</div>
                    </div>
                </div>

                {/* 2. SALUD DEL SISTEMA */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-100/50 flex flex-col justify-center h-full">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
                        <div className="text-emerald-500"><Icons.Server /></div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado Técnico</h4>
                    </div>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        <HealthItem label="Worker IA" active={true} />
                        <HealthItem label="Base de Datos" active={true} />
                        <HealthItem label="Ads API" active={activeCampaigns > 0} />
                    </div>
                </div>

                {/* 3. COLUMNA DE MÉTRICAS RÁPIDAS */}
                <div className="flex flex-col gap-6 h-full">
                    {/* Ads */}
                    <div className="flex-1 bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-center relative overflow-hidden">
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Ads Activos</div>
                                <div className="text-3xl font-black text-emerald-600 leading-none">{activeCampaigns}</div>
                            </div>
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Icons.Rocket /></div>
                        </div>
                    </div>

                    {/* SEO */}
                    <div className="flex-1 bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 border border-amber-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-center relative overflow-hidden">
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">Top Rankings</div>
                                <div className="text-3xl font-black text-amber-500 leading-none">{topRankings}</div>
                            </div>
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Icons.Globe /></div>
                        </div>
                    </div>
                </div>

                {/* --- SEGUNDA FILA --- */}

                {/* 4. TRÁFICO (MODIFICADO PARA USAR LISTA SIN DUPLICADOS) */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-100/50 h-full max-h-[350px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="text-blue-500"><Icons.TrendingUp /></div>
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Interés (Tráfico)</h4>
                        </div>
                        <span className="text-xs text-slate-400">Total: {totalVisits} visitas</span>
                    </div>

                    <div className="flex flex-col gap-5 overflow-y-auto pr-2 max-h-[240px] custom-scrollbar">
                        {/* AQUÍ USAMOS LA LISTA PROCESADA 'processedServices' */}
                        {processedServices.length > 0 ? (
                            processedServices.map((svc, index) => {
                                const percent = Math.round((svc.total_visits / totalVisits) * 100);
                                const barColors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500'];

                                return (
                                    <div key={svc.service_name} className="group">
                                        <div className="flex justify-between mb-1 text-sm">
                                            <span className="font-bold text-slate-700 truncate max-w-[70%]">
                                                {svc.service_name}
                                            </span>
                                            <span className="text-slate-500 font-mono text-xs bg-slate-50 px-2 py-0.5 rounded">
                                                {svc.total_visits}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                            <div style={{ width: `${percent}%` }} className={`h-full rounded-full ${barColors[index % 4]}`}></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-slate-400 text-sm text-center py-4">No hay datos de tráfico aún.</p>
                        )}
                    </div>
                </div>

                {/* 5. ACTIVIDAD (Sin cambios, solo ajuste de layout) */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-100/50 h-full max-h-[350px] flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="text-blue-500 animate-pulse"><Icons.Activity /></div>
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Actividad en Vivo</h4>
                    </div>

                    <div className="relative pl-2 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                        <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-slate-100"></div>

                        <div className="flex flex-col gap-6 pb-2">
                            {data.notifications?.slice(0, 8).map((notif, idx) => (
                                <div key={idx} className="flex gap-4 relative group">
                                    <div className="w-6 h-6 rounded-full bg-white border-[3px] border-blue-500 z-10 flex-shrink-0 shadow-sm group-hover:border-blue-600 transition-colors mt-0.5"></div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-600 leading-snug line-clamp-2 hover:line-clamp-none transition-all cursor-default" title={notif.message}>
                                            {notif.message}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-medium uppercase mt-1 block">Hace un momento</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. CONSOLA DE SISTEMA */}
                <div className="col-span-1 lg:col-span-4 mt-6">
                    <SystemLogs />
                </div>

            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
};

const HealthItem = ({ label, active }) => (
    <div className="flex justify-between items-center group">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className="flex items-center gap-2">
            <span className={`relative flex h-2.5 w-2.5`}>
                {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            </span>
        </div>
    </div>
);

export default OverviewView;