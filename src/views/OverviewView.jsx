'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageBody, PageHeader } from '../components/shell/AppShell';
import AudienceStatsPanel from '../components/AudienceStatsPanel';
import ServiceTrafficDrawer from '../components/ServiceTrafficModal';
import {
    Card, CardHeader, Pagination, ProgressBar, SearchInput, Segmented, StatCard, cx,
    tableClass, tdClass, thClass, trClass,
} from '../components/ui';
import { useDashboardData } from '../hooks/useDashboardData';

const PERIODS = [
    { value: '7', label: '7 días' },
    { value: '30', label: '30 días' },
    { value: '90', label: '90 días' },
    { value: 'all', label: 'Todo' },
];

const fmt = (n) => (n || 0).toLocaleString('es-CO');

// El backend devuelve el tráfico por nombre de servicio tal como llegó; se agrupan variantes
// ("servicios-tributarios" y "Servicios tributarios") bajo un mismo nombre.
function aggregateVisits(serviceVisits) {
    const map = {};
    (serviceVisits || []).forEach((row) => {
        const key = row.service_name.replace(/-/g, ' ').trim().toLowerCase();
        if (!map[key]) {
            map[key] = { name: row.service_name.replace(/-/g, ' ').trim(), commercial: 0, blog: 0, total: 0, visitors: [] };
        }
        map[key].commercial += row.commercial_visits || 0;
        map[key].blog += row.blog_visits || 0;
        map[key].total += row.total_visits || 0;
        map[key].visitors.push(...(row.visitors || []));
    });
    return Object.values(map).map((s) => ({ ...s, name: s.name.charAt(0).toUpperCase() + s.name.slice(1) }));
}

function SortHeader({ label, column, sort, onSort, align = 'left' }) {
    const on = sort.key === column;
    return (
        <th scope="col" aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cx(thClass, align === 'right' && 'text-right')}>
            <button type="button" onClick={() => onSort(column)} className="border-0 bg-transparent p-0 font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                {label} <span aria-hidden="true" className={on ? 'text-blue-700' : 'text-slate-400'}>{on ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
            </button>
        </th>
    );
}

function HealthRow({ label, ok }) {
    return (
        <div className="flex items-center justify-between py-3 border-t border-slate-100 first:border-t-0">
            <span className="text-slate-700">{label}</span>
            <span className={cx('inline-flex items-center gap-1.5 text-[13px] font-semibold', ok ? 'text-emerald-700' : 'text-red-700')}>
                <span aria-hidden="true" className={cx('w-2 h-2 rounded-full', ok ? 'bg-emerald-500' : 'bg-red-500')} />
                {ok ? 'En línea' : 'Desconectada'}
            </span>
        </div>
    );
}

export default function OverviewView() {
    const [days, setDays] = useState('30');
    const { data, loading, error, refresh } = useDashboardData(days);

    const [query, setQuery] = useState('');
    const [sort, setSort] = useState({ key: 'total', dir: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [detail, setDetail] = useState(null);

    const services = useMemo(() => aggregateVisits(data?.service_visits), [data?.service_visits]);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const dir = sort.dir === 'asc' ? 1 : -1;
        return services
            .filter((s) => !q || s.name.toLowerCase().includes(q))
            .sort((a, b) => (sort.key === 'name' ? a.name.localeCompare(b.name, 'es') : a[sort.key] - b[sort.key]) * dir);
    }, [services, query, sort]);

    const pages = Math.max(Math.ceil(rows.length / pageSize), 1);
    const visible = rows.slice((page - 1) * pageSize, page * pageSize);

    const onSort = (key) => {
        setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }));
        setPage(1);
    };

    const kpis = data?.kpis || {};
    const totalVisits = services.reduce((a, s) => a + s.total, 0);
    const conversion = totalVisits ? (kpis.total_leads / totalVisits) * 100 : 0;
    const status = data?.system_status || {};
    const adsOnline = status.ads_api === 'active' || status.ads_api === 'online';
    const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <>
            <PageHeader
                eyebrow="General"
                title="Visión general"
                actions={
                    <>
                        <span className="hidden sm:inline text-[13px] text-slate-600 first-letter:uppercase">{today}</span>
                        <span role="status" className="inline-flex items-center gap-2 text-[13px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
                            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-500" />
                            Sistema operativo
                        </span>
                    </>
                }
            />
            <PageBody>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="m-0 text-2xl font-bold">Hola, Admin</h2>
                        <p className="m-0 mt-1 text-slate-600">Resumen de captación, tráfico y resultados por público.</p>
                    </div>
                    <Segmented label="Periodo" options={PERIODS} value={days} onChange={(d) => { setDays(d); setPage(1); }} />
                </div>

                {error && !data && (
                    <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-red-700 font-semibold">No se pudo cargar el resumen: {error.message}</span>
                        <button type="button" onClick={refresh} className="text-blue-700 font-semibold border-0 bg-transparent cursor-pointer">Reintentar</button>
                    </Card>
                )}

                <section aria-label="Indicadores clave" className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Prospectos CRM" value={loading && !data ? '…' : fmt(kpis.total_leads)}>
                        <Link href="/crm" className="text-[13px] font-semibold text-blue-700 no-underline hover:underline">Ver prospectos →</Link>
                    </StatCard>
                    <StatCard label="Tasa de conversión" value={`${conversion.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`}>
                        <ProgressBar value={conversion * 10} />
                    </StatCard>
                    <StatCard label="Ads activos" value={fmt(kpis.active_campaigns)}>
                        <Link href="/campaigns" className="text-[13px] font-semibold text-blue-700 no-underline hover:underline">Gestionar campañas →</Link>
                    </StatCard>
                    <StatCard label="Búsquedas en el Top 10" value={fmt(kpis.top_rankings)}>
                        <Link href="/seo" className="text-[13px] font-semibold text-blue-700 no-underline hover:underline">Ver posiciones →</Link>
                    </StatCard>
                </section>

                <div className="grid gap-5 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] items-start">
                    <Card aria-labelledby="traffic-title" className="overflow-hidden">
                        <CardHeader
                            id="traffic-title"
                            title="Tráfico por servicio"
                            subtitle="Haz clic en un servicio para ver quién lo visitó."
                            actions={<SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Buscar servicio" />}
                        />
                        <div className="flex flex-wrap gap-4 px-5 pt-3 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-blue-700" />Páginas comerciales (venta directa)</span>
                            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-orange-400" />Artículos de blog (educativo)</span>
                        </div>
                        <div className="overflow-x-auto mt-2">
                            <table className={cx(tableClass, 'min-w-[680px]')}>
                                <thead>
                                    <tr>
                                        <SortHeader label="Servicio" column="name" sort={sort} onSort={onSort} />
                                        <SortHeader label="Comerciales" column="commercial" sort={sort} onSort={onSort} />
                                        <SortHeader label="Blog" column="blog" sort={sort} onSort={onSort} />
                                        <th scope="col" className={thClass}>Mezcla</th>
                                        <SortHeader label="Total" column="total" sort={sort} onSort={onSort} align="right" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((s) => {
                                        const pc = s.total ? Math.round((s.commercial / s.total) * 100) : 0;
                                        return (
                                            <tr key={s.name} className={trClass}>
                                                <th scope="row" className={cx(tdClass, 'text-left font-semibold max-w-[280px]')}>
                                                    <button type="button" onClick={() => setDetail(s)} className="border-0 bg-transparent p-0 text-left font-semibold text-blue-800 cursor-pointer hover:underline">
                                                        {s.name}
                                                    </button>
                                                </th>
                                                <td className={tdClass}>{fmt(s.commercial)}</td>
                                                <td className={tdClass}>{fmt(s.blog)}</td>
                                                <td className={tdClass}>
                                                    <div className="flex flex-col gap-1 min-w-[140px]">
                                                        <div aria-hidden="true" className="flex h-1.5 rounded-full overflow-hidden bg-slate-200">
                                                            <div className="bg-blue-700" style={{ width: `${pc}%` }} />
                                                            <div className="bg-orange-400" style={{ width: `${100 - pc}%` }} />
                                                        </div>
                                                        <span className="text-xs text-slate-500">{pc} % comercial · {100 - pc} % blog</span>
                                                    </div>
                                                </td>
                                                <td className={cx(tdClass, 'text-right font-semibold text-slate-900')}>{fmt(s.total)}</td>
                                            </tr>
                                        );
                                    })}
                                    {visible.length === 0 && (
                                        <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                                            {loading ? 'Cargando tráfico…' : query ? 'Ningún servicio coincide con la búsqueda.' : 'Sin visitas en el periodo.'}
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={page}
                            pages={pages}
                            onPage={setPage}
                            pageSize={pageSize}
                            onPageSize={(n) => { setPageSize(n); setPage(1); }}
                            sizes={[10, 25, 50]}
                        />
                    </Card>

                    <Card aria-labelledby="status-title" className="px-5 py-4">
                        <h2 id="status-title" className="m-0 mb-1 text-base font-bold">Estado técnico</h2>
                        <HealthRow label="Worker IA" ok={status.worker_ia === 'active'} />
                        <HealthRow label="Base de datos" ok={status.database === 'active'} />
                        <HealthRow label="Ads API (Google)" ok={adsOnline} />
                    </Card>
                </div>

                <AudienceStatsPanel days={days} />
            </PageBody>

            <ServiceTrafficDrawer service={detail} onClose={() => setDetail(null)} />
        </>
    );
}
