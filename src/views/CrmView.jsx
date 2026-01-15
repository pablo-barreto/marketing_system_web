'use client';
import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

const CrmView = ({ leads }) => {
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [selectedLead, setSelectedLead] = useState(null); // Controla qué lead mostrar en detalle

    // Mapeo de estilos por procedencia
    const getPlatformInfo = (platform) => {
        const p = (platform || 'web').toLowerCase();
        if (p.includes('facebook')) return { name: 'Facebook', icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (p.includes('instagram')) return { name: 'Instagram', icon: '📸', color: 'text-pink-600', bg: 'bg-pink-50' };
        if (p.includes('google')) return { name: 'Google', icon: '🔍', color: 'text-orange-600', bg: 'bg-orange-50' };
        return { name: 'Web Directa', icon: '🌐', color: 'text-slate-500', bg: 'bg-slate-100' };
    };

    const filteredLeads = leads?.filter(l => 
        activeFilter === 'Todos' || l.platform?.toLowerCase().includes(activeFilter.toLowerCase())
    );

    return (
        <div className="animate-fade-in-up">
            {/* Barra de Filtros */}
            <div className="flex gap-3 mb-8 pb-2 overflow-x-auto">
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

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLeads?.map(lead => {
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
                                {/* ACCIÓN: Abrir Modal al dar clic */}
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
                })}
            </div>

            {/* MODAL DE DETALLE DE LEAD */}
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
                            {/* Información de Contacto (Enriquecida por el Backend) */}
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Datos de Contacto</h5>
                                <DetailItem icon="📧" label="Email Corporativo" value={selectedLead.email || 'Sin identificación'} />
                                <DetailItem icon="📱" label="WhatsApp / Tel" value={selectedLead.phone || 'Sin identificación'} />
                                <DetailItem icon="🌐" label="Fuente de Adquisición" value={selectedLead.platform || 'Tráfico Directo'} />
                            </div>

                            {/* Inteligencia de Comportamiento */}
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Perfil de Interés</h5>
                                <DetailItem icon="🎯" label="Servicio Principal" value={selectedLead.service_interest} />
                                <DetailItem icon="⏱️" label="Última Actividad" value={new Date(selectedLead.last_activity).toLocaleString()} />
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

// Componente auxiliar para ítems del modal
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