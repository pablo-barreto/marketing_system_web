'use client';
import React from 'react';

const StatusBadge = ({ status }) => {
    const getStyles = (s) => {
        switch (s) {
            case 'active': 
            case 'qualified':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'high_performance': 
                return 'bg-green-100 text-green-700 border-green-200';
            case 'pending_approval': 
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'learning': 
            case 'contacted':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'low_performance': 
            case 'disqualified':
                return 'bg-red-100 text-red-700 border-red-200';
            default: 
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const styles = getStyles(status);

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${styles}`}>
            {String(status || '').replace(/_/g, ' ')}
        </span>
    );
};

export default StatusBadge;