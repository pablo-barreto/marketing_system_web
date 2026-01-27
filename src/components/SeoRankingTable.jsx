'use client';
import React, { useState, useMemo } from 'react';

const SeoRankingTable = ({ rankings }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [activeTab, setActiveTab] = useState('nacional');

    const safeRankings = rankings || [];

    // --- FILTRADO DE DATOS ---
    const filteredRankings = useMemo(() => {
        return safeRankings.filter(r => {
            if (activeTab === 'nacional') {
                return r.country === 'CO';
            } else {
                return r.country !== 'CO';
            }
        });
    }, [safeRankings, activeTab]);

    // --- PAGINACIÓN ---
    const totalPages = Math.ceil(filteredRankings.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRankings.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageSizeChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const getRankingColor = (rank) => {
        if (rank <= 10) return 'text-emerald-600';
        if (rank > 50) return 'text-red-500';
        return 'text-amber-500';
    };

    return (
        /* AJUSTE PARA IOS: overflow-visible y min-height 0 para evitar colapso de flexbox */
        <div className="flex flex-col w-full min-h-0 overflow-visible">
            
            {/* PESTAÑAS: shrink-0 evita que desaparezcan en Safari al usar flex-col */}
            <div className="flex gap-4 mb-4 border-b border-slate-100 pb-1 shrink-0">
                <button 
                    onClick={() => { setActiveTab('nacional'); setCurrentPage(1); }}
                    className={`pb-2 px-1 text-sm font-bold transition-all ${
                        activeTab === 'nacional' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    🇨🇴 Nacional
                </button>
                <button 
                    onClick={() => { setActiveTab('internacional'); setCurrentPage(1); }}
                    className={`pb-2 px-1 text-sm font-bold transition-all ${
                        activeTab === 'internacional' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    🌍 Internacional
                </button>
            </div>

            {/* --- VISTA MÓVIL (CARDS) --- */}
            {/* AJUSTE PARA IOS: 'block md:hidden' asegura que Safari renderice el contenedor */}
            <div className="block md:hidden space-y-4 w-full">
                {currentItems.length > 0 ? (
                    currentItems.map((r, i) => (
                        <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                            <div className="min-w-0 flex-1 pr-2">
                                <div className="font-bold text-slate-800 text-sm truncate">{r.service}</div>
                                <div className="text-xs text-slate-500 mt-0.5 mb-2 truncate">{r.keyword}</div>
                                <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] rounded uppercase font-bold">
                                    {r.country}
                                </span>
                            </div>
                            <div className={`text-2xl font-black shrink-0 ${getRankingColor(r.ranking)}`}>
                                #{r.ranking}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-400 py-8 text-sm italic">
                        Sin datos disponibles.
                    </div>
                )}
            </div>

            {/* --- VISTA ESCRITORIO (TABLA) --- */}
            <div className="hidden md:block overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Servicio</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">País</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ranking</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {currentItems.length > 0 ? (
                            currentItems.map((r, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-800">{r.service}</div>
                                        <div className="text-xs text-slate-400">{r.keyword}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200 uppercase">
                                            {r.country}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-lg font-bold ${getRankingColor(r.ranking)}`}>
                                            #{r.ranking}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic">No hay datos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* PAGINACIÓN */}
            {filteredRankings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Filas:</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={handlePageSizeChange} 
                            className="bg-white border border-slate-300 text-slate-700 text-xs rounded p-1 outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{currentPage} / {totalPages}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1} 
                                className="px-3 py-1.5 border border-slate-300 bg-white rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                disabled={currentPage === totalPages} 
                                className="px-3 py-1.5 border border-slate-300 bg-white rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeoRankingTable;