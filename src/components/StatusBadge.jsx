'use client';
import React from 'react';

const StatusBadge = ({ status }) => {
    const getStyles = (s) => {
        // Aseguramos que s sea string para evitar errores
        const safeStatus = String(s || '').toUpperCase(); 

        switch (safeStatus) {
            case 'ACTIVE': 
            case 'QUALIFIED':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            
            case 'HIGH_PERFORMANCE': 
                return 'bg-green-100 text-green-700 border-green-200';
            
            case 'PENDING_APPROVAL': 
            case 'REVIEW': // Agregado para Meta
                return 'bg-amber-100 text-amber-700 border-amber-200';
            
            case 'LEARNING': 
            case 'CONTACTED':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            
            // --- AQUÍ AGREGAMOS LOS ERRORES DE META ---
            case 'LOW_PERFORMANCE': 
            case 'DISQUALIFIED':
            case 'WITH_ISSUES':   // <--- Meta: Error técnico / Activo no válido
            case 'DISAPPROVED':   // <--- Meta: Rechazado
            case 'REJECTED':
                return 'bg-red-100 text-red-700 border-red-200';
            
            case 'PAUSED':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';

            default: 
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };
}
export default StatusBadge;