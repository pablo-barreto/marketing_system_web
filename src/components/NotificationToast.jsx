'use client';
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { notificationService } from '../services/api';
import { API_BASE_URL, NOTIFICATIONS_ENDPOINT } from '../app/config';

// Íconos por tipo de notificación
const NOTIFICATION_ICONS = {
    seo_ranking_alert: '🌍',
    seo_content_published: '📝',
    qa_content_published: '📝',
    campaign_alert: '🚀',
    system_error: '🔴',
    lead_alert: '👤',
    default: '🔔'
};

// Color del borde izquierdo por tipo
const NOTIFICATION_COLORS = {
    seo_ranking_alert: 'border-l-emerald-500',
    seo_content_published: 'border-l-blue-500',
    qa_content_published: 'border-l-blue-500',
    campaign_alert: 'border-l-violet-500',
    system_error: 'border-l-red-500',
    lead_alert: 'border-l-amber-500',
    default: 'border-l-slate-400'
};

const AUTO_DISMISS_MS = 6000;
const MAX_VISIBLE_TOASTS = 3;
const POLL_INTERVAL_MS = 10000; // Polling cada 10 segundos

// ─── TOAST INDIVIDUAL ────────────────────────────────────────
const Toast = ({ notification, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const timerRef = useRef(null);
    const startRef = useRef(Date.now());

    const icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
    const borderColor = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.default;

    const handleDismiss = useCallback(() => {
        if (isExiting) return;
        setIsExiting(true);
        clearInterval(timerRef.current);
        setTimeout(() => onDismiss(notification.id), 300);
    }, [isExiting, notification.id, onDismiss]);

    useEffect(() => {
        startRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                handleDismiss();
            }
        }, 50);

        return () => clearInterval(timerRef.current);
    }, [handleDismiss]);

    // Formatear tiempo relativo
    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
        return `Hace ${Math.floor(diff / 86400)}d`;
    };

    return (
        <div
            className={`
                relative w-[380px] max-w-[calc(100vw-2rem)] bg-slate-800/95 backdrop-blur-xl
                rounded-xl shadow-2xl shadow-black/40
                border border-slate-700/50 border-l-4 ${borderColor}
                overflow-hidden cursor-pointer
                transition-all duration-300 ease-out
                ${isExiting
                    ? 'opacity-0 translate-x-[120%]'
                    : 'opacity-100 translate-x-0 animate-slideIn'
                }
            `}
            onClick={handleDismiss}
            role="alert"
        >
            {/* Contenido */}
            <div className="flex items-start gap-3 p-4">
                <span className="text-2xl mt-0.5 flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                            {notification.type?.replace(/_/g, ' ') || 'Sistema'}
                        </span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                            {timeAgo(notification.created_at)}
                        </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
                        {notification.message}
                    </p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                    className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 p-1 -mt-1 -mr-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Barra de progreso */}
            <div className="h-[3px] bg-slate-700/50">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// ─── CONTENEDOR AUTOCONTENIDO CON POLLING DIRECTO ────────────
const NotificationToast = () => {
    const { basicAuthHeader } = useContext(AuthContext);
    const [visibleToasts, setVisibleToasts] = useState([]);
    const seenIdsRef = useRef(new Set());
    const initialLoadDone = useRef(false);

    // Polling directo con setInterval + fetch (sin SWR, sin caching)
    useEffect(() => {
        if (!basicAuthHeader) return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINT}`, {
                    headers: {
                        'Authorization': basicAuthHeader,
                        'Content-Type': 'application/json'
                    }
                });
                if (!res.ok) return;
                const notifications = await res.json();

                if (!notifications || notifications.length === 0) return;

                // Primera carga: solo registrar IDs existentes sin mostrar toasts
                // (evita mostrar todas las notificaciones antiguas al abrir la página)
                if (!initialLoadDone.current) {
                    notifications.forEach(n => seenIdsRef.current.add(n.id));
                    initialLoadDone.current = true;
                    return;
                }

                // Detectar NUEVAS notificaciones (que no hemos visto antes)
                const newOnes = notifications.filter(n => !seenIdsRef.current.has(n.id));

                if (newOnes.length > 0) {
                    newOnes.forEach(n => seenIdsRef.current.add(n.id));
                    setVisibleToasts(prev => {
                        const updated = [...newOnes.slice(0, MAX_VISIBLE_TOASTS), ...prev];
                        return updated.slice(0, MAX_VISIBLE_TOASTS);
                    });
                }
            } catch (err) {
                // Silenciar errores de red — no interrumpir la UI
            }
        };

        // Fetch inmediato al montar (para registrar IDs existentes)
        fetchNotifications();

        // Polling cada 10 segundos
        const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [basicAuthHeader]);

    // Dismiss: quitar del stack visual + marcar como leída en backend
    const handleDismiss = useCallback(async (notificationId) => {
        setVisibleToasts(prev => prev.filter(n => n.id !== notificationId));

        try {
            if (basicAuthHeader) {
                await notificationService.markAsRead(notificationId, basicAuthHeader);
            }
        } catch (err) {
            console.error('Error marcando notificación como leída:', err);
        }
    }, [basicAuthHeader]);

    if (visibleToasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
            {visibleToasts.map((notif) => (
                <div key={notif.id} className="pointer-events-auto">
                    <Toast notification={notif} onDismiss={handleDismiss} />
                </div>
            ))}
        </div>
    );
};

export default NotificationToast;
