'use client';
import { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '../components/StatusBadge';
import { PageBody, PageHeader } from '../components/shell/AppShell';
import {
    Button, Card, Chips, Drawer, EmptyState, Pagination, Pill, SearchInput, StatCard, Tabs, cx,
    tableClass, tdClass, thClass, trClass,
} from '../components/ui';
import { useApi, withQuery } from '../hooks/useApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const PLATFORM_CHIPS = ['Todos', 'Facebook', 'Instagram', 'LinkedIn', 'Google'].map((v) => ({ value: v, label: v }));

const fmt = (n) => (n || 0).toLocaleString('es-CO');

const origin = (platform) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('facebook')) return ['Facebook', 'blue'];
    if (p.includes('instagram')) return ['Instagram', 'violet'];
    if (p.includes('linkedin')) return ['LinkedIn', 'blue'];
    if (p.includes('google')) return ['Google', 'amber'];
    return ['Visitante web', 'neutral'];
};

const when = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
};

function Trend({ points }) {
    const max = Math.max(...points.map((p) => p.count), 1);
    const label = points.map((p) => `${p.date}: ${p.count}`).join(', ');
    return (
        <div role="img" aria-label={`Leads por día: ${label}`} className="flex items-end gap-1 h-12">
            {points.map((p) => (
                <div key={p.date} title={`${p.date}: ${p.count}`} className="flex-1 rounded-t-sm bg-blue-200" style={{ height: `${Math.max(6, (p.count / max) * 100)}%` }} />
            ))}
            {points.length === 0 && <span className="text-xs text-slate-500 self-center">Sin datos esta semana</span>}
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex flex-col gap-0.5 py-3 border-t border-slate-100 first:border-t-0">
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd className="m-0 text-slate-900 break-words">{value || '—'}</dd>
        </div>
    );
}

export default function CrmView() {
    const [kind, setKind] = useState('web');
    const [platform, setPlatform] = useState('Todos');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [selected, setSelected] = useState(null);
    const q = useDebouncedValue(search).trim();

    const { data: performance } = useApi('/api/v1/crm/performance', { refreshInterval: 60000 });
    const { data: leadsPage, loading } = useApi(withQuery('/api/v1/crm/leads', {
        kind,
        platform: kind === 'platforms' && platform !== 'Todos' ? platform : null,
        q,
        page,
        page_size: pageSize,
    }), { refreshInterval: 60000 });

    const items = leadsPage?.items || [];
    const total = leadsPage?.total || 0;
    const counts = leadsPage?.counts || {};
    const stats = performance || { total_accumulated: 0, generated_today: 0, weekly_trend: [] };

    const changeKind = (k) => { setKind(k); setPage(1); };

    return (
        <>
            <PageHeader eyebrow="Clientes" title="Inteligencia de clientes" />
            <PageBody>
                <section aria-label="Resumen" className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <StatCard label="Leads de hoy" value={fmt(stats.generated_today)} />
                    <StatCard label="Histórico total" value={fmt(stats.total_accumulated)} />
                    <StatCard label="Tendencia (7 días)" value="">
                        <Trend points={stats.weekly_trend || []} />
                    </StatCard>
                </section>

                <Card aria-labelledby="leads-title" className="overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 border-b border-slate-200">
                        <div className="flex items-center gap-5 self-stretch">
                            <h2 id="leads-title" className="m-0 py-4 text-base font-bold">Leads</h2>
                            <Tabs
                                label="Origen"
                                tabs={[
                                    { value: 'web', label: `Visitantes web (${fmt(counts.web)})` },
                                    { value: 'platforms', label: `Redes sociales (${fmt(counts.platforms)})` },
                                ]}
                                value={kind}
                                onChange={changeKind}
                            />
                        </div>
                        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por rol, interés o ID" className="w-full sm:w-72 my-2.5" />
                    </div>

                    {kind === 'platforms' && (
                        <div className="px-5 pt-4">
                            <Chips label="Filtrar por red" options={PLATFORM_CHIPS} value={platform} onChange={(v) => { setPlatform(v); setPage(1); }} />
                        </div>
                    )}

                    {!loading && items.length === 0 && kind === 'platforms' && !q && platform === 'Todos' ? (
                        <EmptyState
                            title="Aún no hay leads de redes sociales"
                            description="Aparecerán aquí cuando una campaña activa genere contactos."
                            action={<Link href="/campaigns" className="text-blue-700 font-semibold text-[13px]">Ir a campañas →</Link>}
                        />
                    ) : (
                        <div className="overflow-x-auto mt-2">
                            <table className={cx(tableClass, 'min-w-[860px]')}>
                                <thead>
                                    <tr>
                                        <th scope="col" className={thClass}>Puntaje</th>
                                        <th scope="col" className={thClass}>Rol detectado</th>
                                        <th scope="col" className={thClass}>Interés</th>
                                        <th scope="col" className={thClass}>Origen</th>
                                        <th scope="col" className={thClass}>Estado</th>
                                        <th scope="col" className={thClass}>ID</th>
                                        <th scope="col" className={cx(thClass, 'text-right')}><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((lead) => {
                                        const [originLabel, tone] = origin(lead.platform);
                                        return (
                                            <tr key={lead.user_id} className={trClass}>
                                                <td className={tdClass}>
                                                    <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-full bg-blue-50 text-blue-800 font-semibold text-[13px]">{lead.lead_score ?? '—'}</span>
                                                </td>
                                                <th scope="row" className={cx(tdClass, 'text-left font-semibold text-slate-900 capitalize')}>{lead.role || 'Visitante'}</th>
                                                <td className={cx(tdClass, 'max-w-[280px]')}>{lead.service_interest || '—'}</td>
                                                <td className={tdClass}><Pill tone={tone}>{originLabel}</Pill></td>
                                                <td className={tdClass}><StatusBadge status={lead.status} /></td>
                                                <td className={cx(tdClass, 'font-mono text-slate-500')}>…{(lead.user_id || '').slice(-8)}</td>
                                                <td className={cx(tdClass, 'text-right')}>
                                                    <Button size="sm" onClick={() => setSelected(lead)}>Ver perfil</Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">{loading ? 'Cargando leads…' : 'Ningún lead coincide con la búsqueda.'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {total > 0 && (
                        <Pagination
                            page={page}
                            pages={leadsPage?.pages}
                            onPage={setPage}
                            pageSize={pageSize}
                            onPageSize={(n) => { setPageSize(n); setPage(1); }}
                            sizes={[10, 25, 50, 100]}
                            total={total}
                            noun="leads"
                        />
                    )}
                </Card>
            </PageBody>

            <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.role || 'Visitante'} · …${(selected.user_id || '').slice(-8)}` : ''}>
                {selected && (
                    <dl className="m-0 px-6 py-2">
                        <DetailRow label="Puntaje" value={selected.lead_score} />
                        <DetailRow label="Interés detectado" value={selected.service_interest} />
                        <DetailRow label="Canal de contacto" value={selected.email || 'No identificado'} />
                        <DetailRow label="Origen" value={origin(selected.platform)[0]} />
                        <DetailRow label="Estado" value={<StatusBadge status={selected.status} />} />
                        <DetailRow label="Última interacción" value={when(selected.last_activity)} />
                        <DetailRow label="ID completo" value={<span className="font-mono text-[13px]">{selected.user_id}</span>} />
                    </dl>
                )}
            </Drawer>
        </>
    );
}
