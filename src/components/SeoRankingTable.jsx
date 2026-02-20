'use client';
import React, { useState, useMemo } from 'react';

// Mapa de países con banderas y nombres legibles
const COUNTRY_MAP = {
    'CO': { flag: '🇨🇴', name: 'Colombia' },
    'US': { flag: '🇺🇸', name: 'Estados Unidos' },
    'MX': { flag: '🇲🇽', name: 'México' },
    'ES': { flag: '🇪🇸', name: 'España' },
    'AR': { flag: '🇦🇷', name: 'Argentina' },
    'CL': { flag: '🇨🇱', name: 'Chile' },
    'PE': { flag: '🇵🇪', name: 'Perú' },
    'EC': { flag: '🇪🇨', name: 'Ecuador' },
    'PA': { flag: '🇵🇦', name: 'Panamá' },
    'BR': { flag: '🇧🇷', name: 'Brasil' },
    'GB': { flag: '🇬🇧', name: 'Reino Unido' },
    'CA': { flag: '🇨🇦', name: 'Canadá' },
    'DE': { flag: '🇩🇪', name: 'Alemania' },
    'FR': { flag: '🇫🇷', name: 'Francia' },
};

const getCountryDisplay = (code) => {
    const info = COUNTRY_MAP[code];
    return info || { flag: '🌐', name: code };
};

// Badge de estado según posición
const getStatusBadge = (rank) => {
    if (rank <= 3) return { label: '🏆 Top 3', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (rank <= 10) return { label: '✅ Página 1', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    if (rank <= 20) return { label: '📈 Página 2', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    if (rank <= 50) return { label: '⚠️ Lejos', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' };
    return { label: '❌ No visible', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
};

// Tiempo relativo legible
const timeAgo = (isoDate) => {
    if (!isoDate) return '—';
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
};

const getRankingColor = (rank) => {
    if (rank <= 3) return 'text-emerald-600';
    if (rank <= 10) return 'text-green-600';
    if (rank <= 20) return 'text-amber-500';
    if (rank > 50) return 'text-red-500';
    return 'text-orange-500';
};

const SeoRankingTable = ({ rankings }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState('nacional');

    const safeRankings = rankings || [];

    const filteredRankings = useMemo(() => {
        return safeRankings.filter(r => {
            if (activeTab === 'nacional') {
                return r.country === 'CO';
            } else {
                return r.country !== 'CO';
            }
        });
    }, [safeRankings, activeTab]);

    // Contadores de resumen
    const summary = useMemo(() => {
        const top10 = filteredRankings.filter(r => r.ranking <= 10).length;
        const total = filteredRankings.length;
        return { top10, total };
    }, [filteredRankings]);

    const totalPages = Math.ceil(filteredRankings.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRankings.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageSizeChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <div className="flex flex-col w-full min-h-0 overflow-visible">

            {/* PESTAÑAS + RESUMEN */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-slate-100 pb-3 shrink-0">
                <div className="flex gap-4">
                    <button
                        onClick={() => { setActiveTab('nacional'); setCurrentPage(1); }}
                        className={`pb-2 px-1 text-sm font-bold transition-all ${activeTab === 'nacional'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        🇨🇴 Nacional
                    </button>
                    <button
                        onClick={() => { setActiveTab('internacional'); setCurrentPage(1); }}
                        className={`pb-2 px-1 text-sm font-bold transition-all ${activeTab === 'internacional'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        🌍 Internacional
                    </button>
                </div>
                {summary.total > 0 && (
                    <div className="text-xs text-slate-500">
                        <span className="font-bold text-emerald-600">{summary.top10}</span> de {summary.total} en Página 1 de Google
                    </div>
                )}
            </div>

            {/* --- VISTA MÓVIL (CARDS) --- */}
            <div className="block md:hidden space-y-3 w-full">
                {currentItems.length > 0 ? (
                    currentItems.map((r, i) => {
                        const country = getCountryDisplay(r.country);
                        const status = getStatusBadge(r.ranking);
                        return (
                            <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <div className="font-bold text-slate-800 text-sm truncate">{r.service}</div>
                                        <div className="text-xs text-slate-400 mt-0.5 italic truncate">"{r.keyword}"</div>
                                    </div>
                                    <div className={`text-2xl font-black shrink-0 ${getRankingColor(r.ranking)}`}>
                                        #{r.ranking}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{country.flag}</span>
                                        <span className="text-xs text-slate-500">{country.name}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
                                        {status.label}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 text-right">{timeAgo(r.checked_at)}</div>
                            </div>
                        );
                    })
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
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Servicio</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Keyword Buscada</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">País</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Posición</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Estado</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Verificado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {currentItems.length > 0 ? (
                            currentItems.map((r, i) => {
                                const country = getCountryDisplay(r.country);
                                const status = getStatusBadge(r.ranking);
                                return (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-slate-800">{r.service}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-slate-500 italic">"{r.keyword}"</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">{country.flag}</span>
                                                <span className="text-xs text-slate-600">{country.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-lg font-black ${getRankingColor(r.ranking)}`}>
                                                #{r.ranking}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-xs text-slate-400">{timeAgo(r.checked_at)}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">No hay datos.</td>
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