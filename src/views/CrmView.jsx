import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

const CrmView = ({ leads }) => {
    const [activeFilter, setActiveFilter] = useState('Todos');

    // Mapeo de estilos por procedencia del lead
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
            {/* Barra de Filtros de Atribución */}
            <div className="flex gap-3 mb-8 pb-2 overflow-x-auto">
                {['Todos', 'Facebook', 'Instagram', 'Google'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            activeFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

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
                            <h4 className="font-extrabold text-slate-800 text-lg mb-1">{lead.role}</h4>
                            <p className="text-sm text-slate-500 mb-4 truncate">🎯 {lead.service_interest}</p>
                            <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Lead Score</p>
                                    <p className={`text-2xl font-black ${lead.lead_score > 80 ? 'text-emerald-500' : 'text-blue-500'}`}>{lead.lead_score}</p>
                                </div>
                                <button className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CrmView;