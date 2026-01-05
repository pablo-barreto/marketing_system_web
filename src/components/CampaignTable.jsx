'use client';
import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import Swal from 'sweetalert2';

const CampaignTable = ({ campaigns, onApprove }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const ESTIMATED_LEAD_VALUE = 15;

    const handlePageSizeChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // --- HELPERS (Estilos de plataforma) ---
    const getPlatformStyle = (platform) => {
        const p = (platform || '').toLowerCase();
        if (p.includes('google')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', icon: 'G' };
        if (p.includes('facebook')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: 'f' };
        if (p.includes('linkedin')) return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', icon: 'in' };
        return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: '?' };
    };

    // --- LÓGICA (Aprobación y Filtros) ---
    const handleConfirmApprove = (campaignId, serviceName) => {
        Swal.fire({
            title: '¿Aprobar Campaña?',
            html: `Vas a activar la inversión real para: <br/><b>${serviceName}</b>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, Activar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) onApprove(campaignId);
        });
    };

    const filteredCampaigns = campaigns?.filter((campaign) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (campaign.service || '').toLowerCase().includes(search) || (campaign.platform || '').toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) || [];

    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
    const currentItems = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // --- COMPONENTE DE TARJETA MÓVIL (NUEVO) ---
    const MobileCard = ({ c }) => {
        const pStyle = getPlatformStyle(c.platform);
        const budget = c.budget || 0;
        const spend = c.spend || 0;
        const spendPercent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
        const conversions = c.conversions || 0;
        const roi = spend > 0 ? (((conversions * ESTIMATED_LEAD_VALUE) - spend) / spend) * 100 : 0;

        return (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
                {/* Header Card */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{c.service}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                            {pStyle.icon} {c.platform || 'General'}
                        </span>
                    </div>
                    <StatusBadge status={c.status} />
                </div>

                {/* Body Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 p-2 rounded">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Gasto</div>
                        <div className="text-sm font-semibold text-slate-700">${spend.toFixed(0)} <span className="text-slate-400 text-xs">/ ${budget}</span></div>
                        <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5">
                            <div style={{ width: `${spendPercent}%` }} className={`h-full rounded-full ${spendPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">ROI & Leads</div>
                        <div className={`text-sm font-bold ${roi > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {roi > 0 ? '+' : ''}{roi.toFixed(0)}% <span className="text-slate-400 font-normal">({conversions})</span>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                {c.status === 'pending_approval' ? (
                    <button 
                        onClick={() => handleConfirmApprove(c.id, c.service)} 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2.5 rounded-lg shadow-sm active:scale-95 transition-all"
                    >
                        APROBAR CAMPAÑA
                    </button>
                ) : (
                    <div className="text-center text-xs text-slate-400 py-1 bg-slate-50 rounded italic">
                        🔒 Campaña gestionada automáticamente
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* --- CONTROLES (Full width en móvil) --- */}
            <div className="p-4 md:p-5 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-auto">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm} 
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 pr-4 py-2.5 w-full md:w-64 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <select 
                        value={statusFilter} 
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} 
                        className="w-full md:w-auto px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="active">🟢 Activos</option>
                        <option value="pending_approval">🟠 Pendientes</option>
                    </select>
                </div>
            </div>

            {/* --- VISTA MÓVIL (CARDS) --- */}
            <div className="md:hidden p-4 bg-slate-50">
                {currentItems.length > 0 ? (
                    currentItems.map(c => <MobileCard key={c.id} c={c} />)
                ) : (
                    <div className="text-center text-slate-400 py-10">No hay resultados.</div>
                )}
            </div>

            {/* --- VISTA ESCRITORIO (TABLA) - hidden en móvil --- */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Servicio', 'Plataforma', 'Estado', 'Gasto', 'ROI', 'Leads', 'Acción'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {currentItems.map((c) => {
                             const pStyle = getPlatformStyle(c.platform);
                             const budget = c.budget || 0;
                             const spend = c.spend || 0;
                             const spendPercent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
                             const conversions = c.conversions || 0;
                             const roi = spend > 0 ? (((conversions * ESTIMATED_LEAD_VALUE) - spend) / spend) * 100 : 0;
                             
                             return (
                                <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">{c.service}</div>
                                        <div className="text-xs text-slate-400 font-mono">ID: {c.id.substring(0,6)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                                            {pStyle.icon} {c.platform}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-700">${spend.toFixed(0)} <span className="text-slate-400 font-normal">/ ${budget}</span></div>
                                        <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                            <div style={{ width: `${spendPercent}%` }} className={`h-full ${spendPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-sm font-bold ${roi > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>{roi > 0 ? '+' : ''}{roi.toFixed(0)}%</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{conversions}</td>
                                    <td className="px-6 py-4">
                                        {c.status === 'pending_approval' ? (
                                            <button onClick={() => handleConfirmApprove(c.id, c.service)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded">APROBAR</button>
                                        ) : <span className="text-slate-300">🔒</span>}
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- PAGINACIÓN (Mejorada para móvil) --- */}
            {filteredCampaigns.length > 0 && (
                <div className="bg-white px-4 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>Filas:</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={handlePageSizeChange} 
                            className="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-blue-500 focus:border-blue-500 p-1 cursor-pointer outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                    <div className="text-xs text-slate-500">
                        Mostrando {currentItems.length} de {filteredCampaigns.length}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1}
                            className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            ← Anterior
                        </button>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages}
                            className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignTable;