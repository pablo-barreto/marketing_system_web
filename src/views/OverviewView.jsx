'use client';
import SystemLogs from '../components/SystemLogs';
import React, { useState, useMemo } from 'react';
import ServiceTrafficModal from '../components/ServiceTrafficModal';

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
    const [selectedTraffic, setSelectedTraffic] = useState(null);
    
    // --- ESTADOS DE TABLA (Filtro, Orden, Paginación) ---
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'total_visits', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // 1. PROCESAMIENTO RAW
    const rawServices = useMemo(() => {
        if (!data.service_visits) return [];
        const aggregationMap = data.service_visits.reduce((acc, curr) => {
            const normalizedName = curr.service_name.toUpperCase().replace(/-/g, ' ').trim();
            if (!acc[normalizedName]) {
                acc[normalizedName] = { total_visits: 0, commercial_visits: 0, blog_visits: 0, visitors: [] }; 
            }
            acc[normalizedName].total_visits += curr.total_visits;
            acc[normalizedName].commercial_visits += (curr.commercial_visits || 0); 
            acc[normalizedName].blog_visits += (curr.blog_visits || 0);
            if (curr.visitors && Array.isArray(curr.visitors)) {
                acc[normalizedName].visitors = [...acc[normalizedName].visitors, ...curr.visitors];
            }
            return acc;
        }, {});
        return Object.entries(aggregationMap).map(([name, obj]) => ({ 
            service_name: name, 
            total_visits: obj.total_visits,
            commercial_visits: obj.commercial_visits, 
            blog_visits: obj.blog_visits,
            visitors: obj.visitors 
        }));
    }, [data.service_visits]);

    // 2. FILTRADO Y ORDENAMIENTO GLOBAL
    const filteredAndSortedServices = useMemo(() => {
        let result = [...rawServices];

        // A. Filtrar
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(s => s.service_name.toLowerCase().includes(lowerTerm));
        }

        // B. Ordenar
        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [rawServices, searchTerm, sortConfig]);

    // 3. PAGINACIÓN (Corte final)
    const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedServices.slice(start, start + itemsPerPage);
    }, [filteredAndSortedServices, currentPage, itemsPerPage]);

    // Handlers
    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const handlePageSizeChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="opacity-20 ml-1">⇅</span>;
        return <span className="text-blue-600 ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    // KPIs
    const totalVisits = rawServices.reduce((a, b) => a + b.total_visits, 0) || 1;
    const totalLeads = data.crm_leads?.length || 0;
    const conversionRate = ((totalLeads / totalVisits) * 100).toFixed(1);
    const activeCampaigns = data.campaigns?.filter(c => c.status?.toLowerCase() === 'active' || c.status?.toLowerCase() === 'activa').length || 0;
    const topRankings = data.seo_rankings?.filter(r => r.ranking <= 10).length || 0;
    const isAdsApiConnected = data.system_status?.ads_api === 'active' || data.system_status?.ads_api === 'online';
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="animate-fade-in-up pb-10 w-full max-w-full overflow-x-hidden">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 px-1">
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

            {/* --- GRID DE CARDS KPI --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* 1. KPI PRINCIPAL */}
                <div className="col-span-1 lg:col-span-2 bg-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between group min-h-[220px]">
                    <div className="relative z-10 flex justify-between items-start h-full">
                        <div className="flex flex-col justify-between h-full w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Prospectos CRM</span>
                            </div>
                            <div>
                                <div className="text-6xl md:text-7xl font-black tracking-tighter">{totalLeads}</div>
                                <div className="mt-4 inline-flex items-center px-3 py-1 bg-white/10 rounded-full text-sm">
                                    🚀 Tasa de Conversión: <span className="text-emerald-400 font-bold ml-2">{conversionRate}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SALUD DEL SISTEMA */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg flex flex-col justify-center min-h-[220px]">
                    <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-50">
                        <div className="text-emerald-500"><Icons.Server /></div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado Técnico</h4>
                    </div>
                    <div className="space-y-5 flex-1 flex flex-col justify-center">
                        <HealthItem label="Worker IA" active={data.system_status?.worker_ia === 'active'} />
                        <HealthItem label="Base de Datos" active={data.system_status?.database === 'active'} />
                        <HealthItem label="Ads API" active={isAdsApiConnected} />
                    </div>
                </div>

                {/* 3. MÉTRICAS RÁPIDAS */}
                <div className="flex flex-col gap-6 h-full min-h-[220px]">
                    <div className="flex-1 bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex flex-col justify-center">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Ads Activos</div>
                                <div className="text-3xl font-black text-emerald-600 leading-none">{activeCampaigns}</div>
                            </div>
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Icons.Rocket /></div>
                        </div>
                    </div>

                    <div className="flex-1 bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 border border-amber-100 shadow-sm flex flex-col justify-center">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">Top Rankings</div>
                                <div className="text-3xl font-black text-amber-500 leading-none">{topRankings}</div>
                            </div>
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Icons.Globe /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN DE TRÁFICO (TABLA COMPLETA CON PAGINACIÓN) --- */}
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                
                {/* Cabecera + Buscador */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-xl">📊</span> Desglose de Tráfico por Tipo
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Análisis detallado: Ventas vs. Blogs Educativos.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar servicio..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="text-xs font-bold text-slate-500 uppercase bg-white border-b border-slate-100">
                                <th className="p-4 w-1/3 cursor-pointer hover:bg-slate-50 select-none" onClick={() => handleSort('service_name')}>
                                    Interés / Servicio <SortIcon columnKey="service_name" />
                                </th>
                                <th className="p-4 text-center bg-blue-50/50 text-blue-600 border-x border-slate-50 w-1/4 cursor-pointer hover:bg-blue-50 select-none" onClick={() => handleSort('commercial_visits')}>
                                    <div className="flex flex-col items-center">
                                        <span className="flex items-center gap-1">🏢 Páginas Comerciales <SortIcon columnKey="commercial_visits" /></span>
                                        <div className="text-[9px] font-normal text-slate-400 normal-case mt-0.5">(Venta Directa)</div>
                                    </div>
                                </th>
                                <th className="p-4 text-center bg-amber-50/50 text-amber-600 border-r border-slate-50 w-1/4 cursor-pointer hover:bg-amber-50 select-none" onClick={() => handleSort('blog_visits')}>
                                    <div className="flex flex-col items-center">
                                        <span className="flex items-center gap-1">📝 Artículos Blog <SortIcon columnKey="blog_visits" /></span>
                                        <div className="text-[9px] font-normal text-slate-400 normal-case mt-0.5">(Contenido Educativo)</div>
                                    </div>
                                </th>
                                <th className="p-4 text-right w-[15%] cursor-pointer hover:bg-slate-50 select-none" onClick={() => handleSort('total_visits')}>
                                    Total <SortIcon columnKey="total_visits" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {currentItems.length > 0 ? (
                                currentItems.map((svc) => (
                                    <tr 
                                        key={svc.service_name} 
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedTraffic(svc)}
                                    >
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                                {svc.service_name}
                                            </div>
                                            <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Click para ver detalle ↗
                                            </span>
                                        </td>
                                        <td className="p-4 text-center border-x border-slate-50 bg-blue-50/10">
                                            <span className="font-mono text-slate-600 font-semibold">{svc.commercial_visits.toLocaleString()}</span>
                                        </td>
                                        <td className="p-4 text-center border-r border-slate-50 bg-amber-50/10">
                                            <span className="font-mono text-slate-600 font-semibold">{svc.blog_visits.toLocaleString()}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{svc.total_visits.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-400">
                                        {searchTerm ? <p>🔍 No se encontraron resultados.</p> : <p className="mb-2 text-2xl">💤 Esperando datos...</p>}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- CONTROLES DE PAGINACIÓN --- */}
                {filteredAndSortedServices.length > 0 && (
                    <div className="bg-white px-4 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>Filas:</span>
                            <select 
                                value={itemsPerPage} 
                                onChange={handlePageSizeChange} 
                                className="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-blue-500 p-1 cursor-pointer outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">
                                {currentPage} de {totalPages} pág
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1} 
                                    className="px-3 py-1.5 border border-slate-300 bg-white rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Anterior
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages} 
                                    className="px-3 py-1.5 border border-slate-300 bg-white rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 6. CONSOLA */}
            <div className="w-full mt-6">
                <SystemLogs />
            </div>

            {/* MODAL */}
            {selectedTraffic && (
                <ServiceTrafficModal 
                    serviceName={selectedTraffic.service_name}
                    visitors={selectedTraffic.visitors || []} 
                    onClose={() => setSelectedTraffic(null)} 
                />
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
            `}</style>
        </div>
    );
};

const HealthItem = ({ label, active }) => (
    <div className="flex justify-between items-center group py-1">
        <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{label}</span>
        <div className="flex items-center gap-2">
            <span className={`relative flex h-2.5 w-2.5`}>
                {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            </span>
        </div>
    </div>
);

export default OverviewView;