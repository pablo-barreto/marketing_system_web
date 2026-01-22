'use client';
import React from 'react';

const ServiceTrafficModal = ({ serviceName, visitors, onClose }) => {
    if (!visitors) return null;

    // Función auxiliar para detectar el tipo de link basado en la URL si el backend no mandó el 'type'
    // Aunque tu backend YA debería estar mandando 'type' gracias al cambio SQL anterior.
    const getPageType = (visitor) => {
        // Prioridad: Dato del backend
        if (visitor.type === 'blog') return 'blog';
        if (visitor.type === 'servicio') return 'commercial';
        
        // Fallback: Adivinar por URL
        const url = (visitor.last_page || '').toLowerCase();
        if (url.includes('/blog') || url.includes('/articulo') || url.includes('/noticias')) return 'blog';
        return 'commercial'; // Por defecto asumimos venta
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Cabecera */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                            🕵️ Detalle de Tráfico: <span className="text-blue-600">{serviceName}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Historial de navegación detallado (Ventas vs Educación).
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-100 transition text-slate-500 font-bold">✕</button>
                </div>

                {/* Tabla con Scroll */}
                <div className="overflow-y-auto p-0 flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/95 w-1/6">Visitante</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/95 w-1/6">Rol Detectado</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/95 w-5/12">Página Visitada (Link)</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/95">Ubicación</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b bg-slate-50/95">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visitors.map((visitor, idx) => {
                                const pageType = getPageType(visitor);
                                const isBlog = pageType === 'blog';

                                return (
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
                                        
                                        {/* --- COLUMNA DE URL MEJORADA (VISTA PREVIA TIPO TARJETA) --- */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                {/* Badge de Tipo */}
                                                <div className="flex items-center gap-2">
                                                    {isBlog ? (
                                                        <span className="bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit">
                                                            📝 Artículo Blog
                                                        </span>
                                                    ) : (
                                                        <span className="bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit">
                                                            🏢 Página Venta
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Link Estilizado */}
                                                <a 
                                                    href={visitor.last_page || '#'} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors group/link mt-1"
                                                    title="Abrir página en nueva pestaña"
                                                >
                                                    <span className="text-lg opacity-50 group-hover/link:opacity-100 transition-opacity">
                                                        {isBlog ? '📰' : '🔗'}
                                                    </span>
                                                    <span className="font-medium truncate max-w-[350px] underline decoration-slate-200 underline-offset-2 group-hover/link:decoration-blue-300">
                                                        {visitor.last_page || '/home'}
                                                    </span>
                                                    <span className="opacity-0 group-hover/link:opacity-100 text-[10px] bg-slate-100 px-1 rounded border border-slate-200">↗</span>
                                                </a>
                                            </div>
                                        </td>
                                        {/* ----------------------------------------------------------- */}

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
                                );
                            })}
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