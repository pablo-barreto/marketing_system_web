'use client';
import React from 'react';

const StatCard = ({ title, value, subtext, accentColor }) => (
    <div style={{
        backgroundColor: 'white', padding: '24px', borderRadius: '12px',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        borderLeft: `4px solid ${accentColor}`
    }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
            {title}
        </h3>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '1.875rem', fontWeight: '700' }}>
            {value}
        </p>
        {subtext && <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: accentColor }}>{subtext}</p>}
    </div>
);

export default StatCard;
