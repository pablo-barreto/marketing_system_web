'use client';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { campaignService } from '../services/api';

// Compara resultados por público (empresa vs persona natural) con
// GET /api/v1/stats/audience. El backend acepta days entre 1 y 365.
const MAX_DAYS = 365;

const TYPE_LABELS = {
    empresa: '🏢 Empresas',
    persona_natural: '🙋 Personas naturales',
    ambos: '🤝 Ambos',
    desconocido: '❔ Sin clasificar',
};

const toApiDays = (days) => {
    const n = parseInt(days, 10);
    if (Number.isNaN(n)) return MAX_DAYS; // "Histórico total" → máximo permitido
    return Math.min(Math.max(n, 1), MAX_DAYS);
};

const money = (v) => (v === null || v === undefined ? '—' : `$${Math.round(v).toLocaleString('es-CO')}`);

const AudienceStatsPanel = ({ days }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const apiDays = toApiDays(days);

    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        campaignService.getAudienceStats(apiDays)
            .then(data => { if (!cancelled) { setStats(data); setError(''); } })
            .catch(err => {
                if (cancelled) return;
                setStats(null); // no dejar métricas de otro periodo junto al error
                setError(err.message || 'No se pudieron cargar las métricas.');
            });
        return () => { cancelled = true; };
    }, [apiDays, isAuthenticated]);

    const leads = stats?.leads_by_customer_type || [];
    const campaigns = stats?.campaigns_by_audience_type || [];
    const visits = stats?.visits_by_customer_type || [];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Resultados por público</h3>
                    <p className="text-sm text-slate-500">Empresas frente a personas naturales.</p>
                </div>
                <span className="text-xs text-slate-400">
                    {Number.isNaN(parseInt(days, 10)) ? `Último año (${MAX_DAYS} días)` : `Últimos ${apiDays} días`}
                </span>
            </div>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {!stats && !error && <p className="text-sm text-slate-400">Cargando métricas…</p>}

            {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Campañas */}
                    <div className="lg:col-span-2 overflow-x-auto">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Campañas</h4>
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-400 uppercase">
                                    <th className="py-2 pr-4">Público</th>
                                    <th className="py-2 pr-4">Campañas</th>
                                    <th className="py-2 pr-4">Gasto</th>
                                    <th className="py-2 pr-4">Clics</th>
                                    <th className="py-2 pr-4">Conv.</th>
                                    <th className="py-2">CPC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {campaigns.length === 0 && (
                                    <tr><td className="py-3 text-slate-400" colSpan={6}>Sin campañas en el periodo.</td></tr>
                                )}
                                {campaigns.map(row => (
                                    <tr key={row.audience_type}>
                                        <td className="py-2 pr-4 font-semibold text-slate-700">{TYPE_LABELS[row.audience_type] || row.audience_type}</td>
                                        <td className="py-2 pr-4">{row.campaigns}</td>
                                        <td className="py-2 pr-4 font-mono">{money(row.spend)}</td>
                                        <td className="py-2 pr-4">{row.clicks}</td>
                                        <td className="py-2 pr-4">{row.conversions}</td>
                                        <td className="py-2 font-mono">{money(row.cpc)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Leads y visitas */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Leads</h4>
                            {leads.length === 0 && <p className="text-sm text-slate-400">Sin leads en el periodo.</p>}
                            <ul className="space-y-1">
                                {leads.map(row => (
                                    <li key={row.customer_type} className="flex justify-between text-sm">
                                        <span className="text-slate-700">{TYPE_LABELS[row.customer_type] || row.customer_type}</span>
                                        <span className="text-slate-500">
                                            {row.total} · {row.with_contact} con contacto · puntaje {row.avg_score ?? '—'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Visitas web</h4>
                            {visits.length === 0 && <p className="text-sm text-slate-400">Sin visitas en el periodo.</p>}
                            <ul className="space-y-1">
                                {visits.map(row => (
                                    <li key={row.customer_type} className="flex justify-between text-sm">
                                        <span className="text-slate-700">{TYPE_LABELS[row.customer_type] || row.customer_type}</span>
                                        <span className="text-slate-500">{row.total}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudienceStatsPanel;
