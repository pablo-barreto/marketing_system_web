'use client';
import { useApi } from '../hooks/useApi';
import { Card, CardHeader, cx, tableClass, tdClass, thClass } from './ui';

// Compara resultados por público (empresa vs persona natural) con
// GET /api/v1/stats/audience. El backend acepta days entre 1 y 365.
const MAX_DAYS = 365;

const TYPE_LABELS = {
    empresa: 'Empresas',
    persona_natural: 'Personas naturales',
    ambos: 'Ambos',
    desconocido: 'Sin clasificar',
};

const toApiDays = (days) => {
    const n = parseInt(days, 10);
    if (Number.isNaN(n)) return MAX_DAYS; // "Todo" → máximo permitido
    return Math.min(Math.max(n, 1), MAX_DAYS);
};

const money = (v) => (v === null || v === undefined ? '—' : `$ ${Math.round(v).toLocaleString('es-CO')}`);
const fmt = (n) => (n || 0).toLocaleString('es-CO');

function BarList({ title, rows, valueKey, meta, color, empty }) {
    const max = Math.max(...rows.map((r) => r[valueKey] || 0), 1);
    return (
        <div className="flex flex-col gap-3">
            <h3 className="m-0 text-[13px] font-semibold text-slate-700">{title}</h3>
            {rows.length === 0 && <p className="m-0 text-[13px] text-slate-500">{empty}</p>}
            {rows.map((r) => (
                <div key={r.customer_type} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-3">
                        <span className="text-slate-700">{TYPE_LABELS[r.customer_type] || r.customer_type}</span>
                        <span className="font-semibold text-slate-900">{fmt(r[valueKey])}</span>
                    </div>
                    <div aria-hidden="true" className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={cx('h-full', color)} style={{ width: `${Math.max(2, Math.round(((r[valueKey] || 0) / max) * 100))}%` }} />
                    </div>
                    {meta && <span className="text-xs text-slate-500">{meta(r)}</span>}
                </div>
            ))}
        </div>
    );
}

export default function AudienceStatsPanel({ days }) {
    const apiDays = toApiDays(days);
    const { data: stats, error } = useApi(`/api/v1/stats/audience?days=${apiDays}`);

    const leads = stats?.leads_by_customer_type || [];
    const campaigns = stats?.campaigns_by_audience_type || [];
    const visits = stats?.visits_by_customer_type || [];
    const period = Number.isNaN(parseInt(days, 10)) ? `último año (${MAX_DAYS} días)` : `últimos ${apiDays} días`;

    return (
        <Card aria-labelledby="aud-title" className="overflow-hidden">
            <CardHeader id="aud-title" title="Resultados por público" subtitle={`Empresas frente a personas naturales · ${period}`} />
            {error && <p className="m-0 px-5 py-4 text-sm text-red-700">{error.message || 'No se pudieron cargar las métricas.'}</p>}
            {!stats && !error && <p className="m-0 px-5 py-4 text-sm text-slate-500">Cargando métricas…</p>}
            {stats && (
                <div className="grid gap-6 p-5 grid-cols-1 lg:grid-cols-2">
                    <div className="flex flex-col gap-3 min-w-0">
                        <h3 className="m-0 text-[13px] font-semibold text-slate-700">Campañas pagadas</h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className={cx(tableClass, 'min-w-[520px]')}>
                                <thead>
                                    <tr>
                                        <th scope="col" className={thClass}>Público</th>
                                        <th scope="col" className={thClass}>Campañas</th>
                                        <th scope="col" className={thClass}>Gasto</th>
                                        <th scope="col" className={thClass}>Clics</th>
                                        <th scope="col" className={thClass}>Conv.</th>
                                        <th scope="col" className={thClass}>CPC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.length === 0 && (
                                        <tr className="border-t border-slate-100"><td colSpan={6} className={cx(tdClass, 'text-slate-500')}>Sin campañas en el periodo.</td></tr>
                                    )}
                                    {campaigns.map((row) => (
                                        <tr key={row.audience_type} className="border-t border-slate-100">
                                            <th scope="row" className={cx(tdClass, 'text-left font-semibold text-slate-900')}>{TYPE_LABELS[row.audience_type] || row.audience_type}</th>
                                            <td className={tdClass}>{fmt(row.campaigns)}</td>
                                            <td className={tdClass}>{money(row.spend)}</td>
                                            <td className={tdClass}>{fmt(row.clicks)}</td>
                                            <td className={tdClass}>{fmt(row.conversions)}</td>
                                            <td className={tdClass}>{money(row.cpc)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                        <BarList
                            title="Leads"
                            rows={leads}
                            valueKey="total"
                            color="bg-blue-600"
                            empty="Sin leads en el periodo."
                            meta={(r) => `${fmt(r.with_contact)} con contacto · puntaje promedio ${r.avg_score ?? '—'}`}
                        />
                        <BarList title="Visitas web" rows={visits} valueKey="total" color="bg-slate-500" empty="Sin visitas en el periodo." />
                    </div>
                </div>
            )}
        </Card>
    );
}
