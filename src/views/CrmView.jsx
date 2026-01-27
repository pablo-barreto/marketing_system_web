'use client';
import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

const CrmView = ({ leads, performance }) => {
    const [viewMode, setViewMode] = useState('platforms'); 
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [selectedLead, setSelectedLead] = useState(null);
    
    // Estados para la paginación y búsqueda (Estructura de Tabla)
    const [webCurrentPage, setWebCurrentPage] = useState(1);
    const [webItemsPerPage, setWebItemsPerPage] = useState(12); // 8 para que queden bien en el grid
    const [webSearchTerm, setWebSearchTerm] = useState('');

    const stats = performance || { total_accumulated: 0, generated_today: 0, weekly_trend: [] };

    const isWebLead = (lead) => {
        const p = (lead.platform || '').toLowerCase();
        const s = (lead.status || '').toLowerCase();
        return p.includes('web') || s === 'visitante_web';
    };

    const getPlatformInfo = (platform) => {
        const p = (platform || 'web').toLowerCase();
        if (p.includes('facebook')) return { name: 'Facebook', icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (p.includes('instagram')) return { name: 'Instagram', icon: '📸', color: 'text-pink-600', bg: 'bg-pink-50' };
        if (p.includes('google')) return { name: 'Google', icon: '🔍', color: 'text-orange-600', bg: 'bg-orange-50' };
        return { name: 'Escucha Web', icon: '👻', color: 'text-slate-500', bg: 'bg-slate-100' };
    };

    // Lógica de filtrado para Escucha Web
    const webLeads = leads?.filter(l => isWebLead(l)) || [];
    const filteredWebLeads = webLeads.filter(l =>
        l.role?.toLowerCase().includes(webSearchTerm.toLowerCase()) ||
        l.service_interest?.toLowerCase().includes(webSearchTerm.toLowerCase()) ||
        l.user_id?.toLowerCase().includes(webSearchTerm.toLowerCase())
    );

    // Paginación
    const totalWebPages = Math.ceil(filteredWebLeads.length / webItemsPerPage);
    const currentWebItems = filteredWebLeads.slice(
        (webCurrentPage - 1) * webItemsPerPage,
        webCurrentPage * webItemsPerPage
    );

    // Filtrado para RRSS
    const filteredPlatformsLeads = leads?.filter(l => {
        if (isWebLead(l)) return false;
        return activeFilter === 'Todos' || l.platform?.toLowerCase().includes(activeFilter.toLowerCase());
    }) || [];

    const countPlatforms = leads?.filter(l => !isWebLead(l)).length || 0;
    const countWeb = webLeads.length;

    return (
        <div className="animate-fade-in-up">
            {/* KPI Cards Superiores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-blue-500 uppercase mb-1">Récord Diario</p>
                    <h3 className="text-4xl font-black text-slate-800">{stats.generated_today}</h3>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg">
                    <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Histórico Total</p>
                    <h3 className="text-4xl font-black">{stats.total_accumulated}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-end">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Tendencia</p>
                    <div className="flex items-end justify-between h-12 gap-1">
                        {stats.weekly_trend?.map((day, i) => (
                            <div key={i} className="w-full bg-blue-100 rounded-t-sm" 
                                 style={{ height: `${(day.count / Math.max(...stats.weekly_trend.map(d => d.count), 1)) * 100}%` }}>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Tabs de Selección Estilo Móvil */}
            <div className="bg-slate-100 p-1 rounded-xl inline-flex mb-6 border border-slate-200">
                <button onClick={() => setViewMode('platforms')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'platforms' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                    🚀 RRSS ({countPlatforms})
                </button>
                <button onClick={() => setViewMode('web')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'web' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                    👻 Escucha Web ({countWeb})
                </button>
            </div>

            {/* CONTENEDOR TIPO TABLA QUE ENVUELVE LAS CARDS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* Header de la "Tabla" (Buscador y Filtros) */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 gap-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {viewMode === 'web' ? '👻 Tráfico Web (Fantasmas)' : '🚀 Leads de Campañas'}
                    </h3>
                    
                    <div className="flex gap-4 w-full sm:w-auto">
                        {viewMode === 'platforms' && (
                            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}
                                    className="px-3 py-2 bg-white border rounded-lg text-xs font-bold outline-none">
                                {['Todos', 'Facebook', 'Instagram', 'Google'].map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        )}
                        <input type="text" placeholder="Buscar por rol o interés..." 
                               value={webSearchTerm} onChange={(e) => { setWebSearchTerm(e.target.value); setWebCurrentPage(1); }}
                               className="px-4 py-2 border rounded-lg text-sm outline-none w-full sm:w-64 focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                {/* Grid de Cards (Diseño Original de image_2faba1.png) */}
                <div className="p-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(viewMode === 'web' ? currentWebItems : filteredPlatformsLeads).map((lead) => {
                            const info = getPlatformInfo(lead.platform);
                            return (
                                <div key={lead.user_id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        {/* Score Circular (Como en image_2faba1.png) */}
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                            {lead.lead_score}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${info.bg} ${info.color}`}>
                                                {info.icon} {info.name}
                                            </span>
                                            <StatusBadge status={lead.status || 'qualified'} />
                                        </div>
                                    </div>

                                    <h4 className="font-extrabold text-slate-800 text-lg mb-1 capitalize">{lead.role || 'Visitante'}</h4>
                                    <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                                        <span className="text-blue-500">🎯</span> {lead.service_interest}
                                    </p>
                                    
                                    <div className="pt-4 border-t border-slate-50 flex flex-col gap-3">
                                        <div className="text-[10px] text-slate-400 font-mono">ID: ...{lead.user_id?.slice(-8)}</div>
                                        <button onClick={() => setSelectedLead(lead)} 
                                                className="w-full py-2.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all transform active:scale-95">
                                            Ver Perfil Completo
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mensaje de No Resultados */}
                    {(viewMode === 'web' ? currentWebItems : filteredPlatformsLeads).length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            <p className="text-4xl mb-2">📭</p>
                            <p>No se encontraron registros en esta sección.</p>
                        </div>
                    )}
                </div>

                {/* Footer de Paginación (Solo para Web Mode) */}
                {viewMode === 'web' && (
                    <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-bold">Mostrando {currentWebItems.length} de {filteredWebLeads.length} registros</span>
                        <div className="flex gap-2">
                            <button onClick={() => setWebCurrentPage(p => Math.max(1, p - 1))} disabled={webCurrentPage === 1}
                                    className="px-4 py-1.5 border rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-50 transition-colors">
                                Anterior
                            </button>
                            <button onClick={() => setWebCurrentPage(p => Math.min(totalWebPages, p + 1))} disabled={webCurrentPage === totalWebPages}
                                    className="px-4 py-1.5 border rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-50 transition-colors">
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalle (Se mantiene igual) */}
            {selectedLead && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black">{selectedLead.role}</h3>
                                <p className="text-slate-400 text-[10px] font-mono mt-1">UUID: {selectedLead.user_id}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="text-2xl hover:text-red-400 transition-colors">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <DetailItem icon="📧" label="Canal de Contacto" value={selectedLead.email || 'No identificado'} />
                            <DetailItem icon="🎯" label="Interés Detectado" value={selectedLead.service_interest} />
                            <DetailItem icon="🕒" label="Última Interacción" value={selectedLead.last_activity} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100">{icon}</div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-slate-800 font-black text-lg">{value}</p>
        </div>
    </div>
);

export default CrmView;