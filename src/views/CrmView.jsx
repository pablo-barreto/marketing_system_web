'use client';
import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

const CrmView = ({ leads, performance }) => {
    // ESTADO 1: ¿Qué universo estamos viendo? (Plataformas vs Escucha Web)
    const [viewMode, setViewMode] = useState('platforms'); // 'platforms' | 'web'
    
    // ESTADO 2: Filtro específico dentro de plataformas
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [selectedLead, setSelectedLead] = useState(null);

    const stats = performance || { total_accumulated: 0, generated_today: 0, weekly_trend: [] };

    // Helper para detectar si es Web Directa (Escucha)
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
        // Estilo especial para Web Directa (Fantasmas)
        return { name: 'Escucha Web', icon: '👻', color: 'text-slate-500', bg: 'bg-slate-100' };
    };

    // --- LÓGICA DE FILTRADO MEJORADA ---
    const filteredLeads = leads?.filter(l => {
        const isWeb = isWebLead(l);

        // 1. Filtro Principal: ¿Estamos en modo Web o Plataformas?
        if (viewMode === 'web') {
            return isWeb; // Solo mostramos los de la escucha
        } else {
            // Modo Plataformas
            if (isWeb) return false; // Ocultamos los de la web
            
            // 2. Sub-filtro (Solo aplica en modo Plataformas)
            return activeFilter === 'Todos' || l.platform?.toLowerCase().includes(activeFilter.toLowerCase());
        }
    });

    // Contadores para las pestañas
    const countPlatforms = leads?.filter(l => !isWebLead(l)).length || 0;
    const countWeb = leads?.filter(l => isWebLead(l)).length || 0;

    return (
        <div className="animate-fade-in-up">
            
            {/* SECCIÓN DE ESTADÍSTICAS (Igual que antes) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 1. Tarjeta Récord de Hoy */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Récord Diario</p>
                        <h3 className="text-4xl font-black text-slate-800">{stats.generated_today}</h3>
                        <p className="text-xs text-slate-400 mt-1">Leads nuevos desde las 00:00h</p>
                    </div>
                    <div className="absolute right-[-10px] top-[-10px] text-9xl opacity-5 select-none">📅</div>
                </div>

                {/* 2. Tarjeta Acumulado Total */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Histórico Total</p>
                        <h3 className="text-4xl font-black">{stats.total_accumulated}</h3>
                        <p className="text-xs text-slate-400 mt-1">Base de datos acumulada</p>
                    </div>
                    <div className="absolute right-[-10px] top-[-10px] text-9xl opacity-10 select-none">👥</div>
                </div>

                {/* 3. Gráfica Simple */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-end">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Tendencia Semanal</p>
                    <div className="flex items-end justify-between h-16 gap-2">
                        {stats.weekly_trend?.map((day, i) => {
                            const maxVal = Math.max(...stats.weekly_trend.map(d => d.count), 1);
                            const height = Math.max((day.count / maxVal) * 100, 15);
                            return (
                                <div key={i} className="flex flex-col items-center gap-1 w-full">
                                    <div className="w-full bg-blue-100 rounded-t-sm" style={{ height: `${height}%` }}></div>
                                </div>
                            )
                        })}
                         {(!stats.weekly_trend || stats.weekly_trend.length === 0) && (
                            <p className="text-xs text-slate-300 w-full text-center self-center">Sin datos</p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* --- NUEVO: SWITCH PRINCIPAL (TABS) --- */}
            <div className="bg-slate-100 p-1 rounded-xl inline-flex mb-6 border border-slate-200">
                <button 
                    onClick={() => setViewMode('platforms')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                        viewMode === 'platforms' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <span>🚀 Campañas & RRSS</span>
                    <span className={`text-xs py-0.5 px-2 rounded-full ${viewMode === 'platforms' ? 'bg-slate-100' : 'bg-slate-200'}`}>
                        {countPlatforms}
                    </span>
                </button>

                <button 
                    onClick={() => setViewMode('web')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                        viewMode === 'web' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <span>👻 Escucha Web</span>
                    <span className={`text-xs py-0.5 px-2 rounded-full ${viewMode === 'web' ? 'bg-slate-100' : 'bg-slate-200'}`}>
                        {countWeb}
                    </span>
                </button>
            </div>

            {/* BARRA DE FILTROS ESPECÍFICOS (Solo visible si estamos en 'platforms') */}
            {viewMode === 'platforms' && (
                <div className="flex gap-3 mb-8 pb-2 overflow-x-auto animate-in fade-in slide-in-from-top-2">
                    {['Todos', 'Facebook', 'Instagram', 'Google'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                activeFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}
            
            {/* Mensaje si estamos en Web (para dar contexto) */}
            {viewMode === 'web' && (
                <div className="mb-6 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-slate-500 text-sm animate-in fade-in">
                    <span className="text-xl">👻</span>
                    <p>Visualizando tráfico web detectado. Estos usuarios son visitantes interesados que aún no han dejado sus datos (fantasmas).</p>
                </div>
            )}

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLeads?.length > 0 ? (
                    filteredLeads.map(lead => {
                        const info = getPlatformInfo(lead.platform);
                        return (
                            <div key={lead.user_id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase ${info.bg} ${info.color}`}>
                                        {info.icon} {info.name}
                                    </div>
                                    <StatusBadge status={lead.status ||'qualified'} />
                                </div>
                                <h4 className="font-extrabold text-slate-800 text-lg mb-1">{lead.role || 'Prospecto'}</h4>
                                <p className="text-sm text-slate-500 mb-4 truncate">🎯 {lead.service_interest}</p>
                                
                                <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Lead Score</p>
                                        <p className={`text-2xl font-black ${lead.lead_score > 80 ? 'text-emerald-500' : 'text-blue-500'}`}>{lead.lead_score}</p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedLead(lead)}
                                        className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-4xl mb-2">📭</p>
                        <p>No hay leads en esta sección</p>
                    </div>
                )}
            </div>

            {/* MODAL DE DETALLE (Mismo código que tenías) */}
            {selectedLead && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black">{selectedLead.role || 'Detalle del Lead'}</h3>
                                <p className="text-slate-400 text-xs font-mono uppercase mt-1">ID: {selectedLead.user_id}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-2xl">✕</button>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Datos de Contacto</h5>
                                <DetailItem icon="📧" label="Email Corporativo" value={selectedLead.email || 'Sin identificación'} />
                                <DetailItem icon="📱" label="WhatsApp / Tel" value={selectedLead.phone || 'Sin identificación'} />
                                <DetailItem icon="🌐" label="Fuente de Adquisición" value={selectedLead.platform || 'Tráfico Directo'} />
                            </div>

                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Perfil de Interés</h5>
                                <DetailItem icon="🎯" label="Servicio Principal" value={selectedLead.service_interest} />
                                <DetailItem icon="⏱️" label="Última Actividad" value={selectedLead.last_activity ? new Date(selectedLead.last_activity).toLocaleDateString() : '-'} />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Potencial de Conversión</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${selectedLead.lead_score > 80 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                                style={{ width: `${selectedLead.lead_score}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-black text-slate-700">{selectedLead.lead_score}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente auxiliar sin cambios
const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg shadow-sm border border-slate-100">{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">{label}</p>
            <p className="text-slate-800 font-bold break-words">{value}</p>
        </div>
    </div>
);

export default CrmView;