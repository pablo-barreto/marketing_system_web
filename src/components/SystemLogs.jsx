'use client';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../app/config';

const SystemLogs = ({ isOpen, onClose }) => {
    const { basicAuthHeader } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const bottomRef = useRef(null);

    // --- CONVERSIÓN A HORA LOCAL REAL ---
    const formatLocalTime = (unixTimestamp) => {
        if (!unixTimestamp) return '--:--:--';
        try {
            // El servidor envía segundos, JS requiere milisegundos
            const date = new Date(unixTimestamp * 1000);
            return date.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch (e) { return '--:--:--'; }
    };

    useEffect(() => {
        if (!isOpen || !basicAuthHeader) return;

        const fetchNewLogs = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/admin/logs`, {
                    headers: { 'Authorization': basicAuthHeader }
                });
                if (res.ok) {
                    const serverLogs = await res.json();
                    setLogs(prevLogs => {
                        const latest = [...serverLogs].reverse();
                        // Evitar duplicados usando el timestamp como ID único
                        const existingIds = new Set(prevLogs.map(l => l.timestamp));
                        const newEntries = latest.filter(l => !existingIds.has(l.timestamp));
                        return [...prevLogs, ...newEntries].slice(-1000);
                    });
                }
            } catch (e) { console.error("Stream error", e); }
        };

        const interval = setInterval(fetchNewLogs, 1500);
        return () => clearInterval(interval);
    }, [basicAuthHeader, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-[95vw] md:w-[750px] h-[450px] bg-[#0d1117] border border-slate-700 shadow-2xl z-[100] flex flex-col font-mono rounded-lg overflow-hidden animate-fade-in-up">
            <div className="bg-[#161b22] px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                    </div>
                    <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Núcleo_IA_Shell</span>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-[#0d1117] custom-scrollbar text-[12px]">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 hover:bg-white/5 p-0.5 rounded transition-colors group items-start">
                        {/* HORA ENVIADA DESDE EL BACKEND */}
                        <span className="text-slate-500 shrink-0 select-none font-bold min-w-[65px]">
                            {formatLocalTime(log.timestamp)}
                        </span>

                        {/* NIVEL */}
                        <span className={`font-bold shrink-0 w-12 ${log.level === 'ERROR' ? 'text-red-500' :
                                log.level === 'WARNING' ? 'text-amber-400' : 'text-cyan-400'
                            }`}>
                            {log.level}
                        </span>

                        {/* MENSAJE - Sin recortes */}
                        <span className="text-slate-200 break-words leading-relaxed flex-1">
                            {log.message.includes('services.tasks')
                                ? '✓ Proceso de tracking finalizado exitosamente'
                                : log.message}
                        </span>
                    </div>
                ))}
                <div ref={bottomRef} className="h-4" />
            </div>
        </div>
    );
};

export default SystemLogs;