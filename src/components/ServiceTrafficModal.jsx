'use client';
import React from 'react';

const ServiceTrafficModal = ({ serviceName, visitors, onClose }) => {
    if (!visitors) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                
                {/* Cabecera */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                            🕵️ Origen del Tráfico: <span className="text-blue-600">{serviceName}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Detalle de navegación de los últimos visitantes únicos detectados.
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-100 transition text-slate-500 font-bold">✕</button>
                </div>

                {/* Tabla con Scroll */}
                <div className="overflow-y-auto p-0 flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/50">Visitante</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/50">Rol Detectado</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/50 w-5/12">Página Vista (URL)</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/50">Ubicación</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/50">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visitors.map((visitor, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors text-xs group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">👻</span>
                                            <span className="font-mono text-slate-500 font-bold">
                                                ...{visitor.user_id ? visitor.user_id.slice(-6) : '????'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded border font-bold uppercase text-[10px] ${
                                            visitor.role === 'visitante' 
                                            ? 'bg-slate-100 border-slate-200 text-slate-500' 
                                            : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                        }`}>
                                            {visitor.role || 'Desconocido'}
                                        </span>
                                    </td>
                                    
                                    {/* --- COLUMNA DE URL --- */}
                                    <td className="p-4">
                                        <a href={visitor.last_page || '#'} target="_blank" rel="noopener noreferrer" 
                                           className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group-hover:underline decoration-blue-200 underline-offset-2">
                                            <span className="truncate max-w-[280px] font-medium" title={visitor.last_page}>
                                                {visitor.last_page || '/home'}
                                            </span>
                                            <span className="opacity-0 group-hover:opacity-100 text-[10px]">↗</span>
                                        </a>
                                    </td>
                                    
                                    <td className="p-4 text-slate-600">
                                        {visitor.city ? `${visitor.city}, ` : ''}{visitor.country || 'Global'}
                                    </td>
                                    <td className="p-4 text-slate-400 whitespace-nowrap font-mono">
                                        {visitor.last_activity ? new Date(visitor.last_activity).toLocaleDateString() : '-'}
                                        <span className="ml-1 opacity-50 text-[10px]">
                                            {visitor.last_activity ? new Date(visitor.last_activity).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {visitors.length === 0 && (
                        <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                            <span className="text-2xl mb-2">📊</span>
                            <p>No hay detalle de visitantes reciente para este servicio.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceTrafficModal;