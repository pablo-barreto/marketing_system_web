'use client';
import React from 'react';

const StatusBadge = ({ status }) => {
    // Mapa de textos amigables para el usuario
    const statusLabels = {
        'ACTIVE': '🟢 Activa',
        'PAUSED': '⏸️ Pausada',
        'PENDING_APPROVAL': '⏳ Pendiente',
        'DISAPPROVED': '🔴 Rechazada',
        'WITH_ISSUES': '⚠️ Error Meta', // <--- Así se verá en la tabla
        'CAMPAIGN_PAUSED': '⏸️ Campaña Pausada',
        'ADSET_PAUSED': '⏸️ AdSet Pausado',
        'ARCHIVED': '🗄️ Archivada',
        'review': '🔵 En Revisión'
    };

    const getStyles = (s) => {
        const safeStatus = String(s || '').toUpperCase();

        switch (safeStatus) {
            case 'ACTIVE': 
            case 'QUALIFIED':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            
            case 'HIGH_PERFORMANCE': 
                return 'bg-green-100 text-green-700 border-green-200';
            
            case 'PENDING_APPROVAL': 
            case 'REVIEW':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            
            case 'LEARNING': 
            case 'CONTACTED':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            
            // --- ERRORES EN ROJO ---
            case 'LOW_PERFORMANCE': 
            case 'DISQUALIFIED':
            case 'WITH_ISSUES':   // <--- El error de "Activo no válido" caerá aquí
            case 'DISAPPROVED':
            case 'REJECTED':
                return 'bg-red-100 text-red-700 border-red-200';
            
            case 'PAUSED':
            case 'CAMPAIGN_PAUSED':
            case 'ADSET_PAUSED':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';

            default: 
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const styles = getStyles(status);
    // Usamos el label amigable si existe, si no, limpiamos el código original
    const label = statusLabels[String(status || '').toUpperCase()] || String(status || '').replace(/_/g, ' ');

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border whitespace-nowrap ${styles}`}>
            {label}
        </span>
    );
};

export default StatusBadge;