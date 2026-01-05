import React from 'react';

const VisitorBadge = ({ visitor }) => (
    <span style={{ 
        display: 'inline-block', 
        padding: '4px 8px', 
        backgroundColor: '#e0f7fa', 
        color: '#006064', 
        borderRadius: '6px', 
        fontSize: '0.75rem', 
        fontWeight: '500', 
        marginRight: '6px',
        marginBottom: '6px'
    }}>
        👤 {visitor.user_id.substring(0, 8)}... ({visitor.role})
    </span>
);

const ServiceVisitsTable = ({ serviceVisits }) => {
    if (!serviceVisits || serviceVisits.length === 0) {
        return <div style={{ padding: '20px', color: '#64748b' }}>No hay datos de interés de servicio disponibles.</div>;
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
            <h2 style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                Interés de Servicio (Visitas)
            </h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                            <th style={{ padding: '16px', color: '#475569', fontWeight: '600', fontSize: '0.875rem' }}>Servicio</th>
                            <th style={{ padding: '16px', color: '#475569', fontWeight: '600', fontSize: '0.875rem' }}>Total Visitas</th>
                            <th style={{ padding: '16px', color: '#475569', fontWeight: '600', fontSize: '0.875rem' }}>Últimos Visitantes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serviceVisits.map((item) => (
                            <tr key={item.service_name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px', color: '#0f172a', fontWeight: '600' }}>
                                    {item.service_name.toUpperCase().replace('-', ' ')}
                                </td>
                                <td style={{ padding: '16px', color: '#10b981', fontWeight: '700', fontSize: '1.25rem' }}>
                                    {item.total_visits}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {item.visitors.map((v, i) => (
                                        <VisitorBadge key={i} visitor={v} />
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ServiceVisitsTable;
