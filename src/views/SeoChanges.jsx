'use client';
// SEO del sitio → Cambios: el sistema propone, la persona aprueba y se aplica en WordPress.
// Todo cambio aplicado se puede revertir.
import { useState } from 'react';
import Swal from 'sweetalert2';
import {
    Button, Card, CardHeader, Chips, EmptyState, Pagination, Pill, ProgressBar, SearchInput, cx,
    tableClass, tdClass, thClass, trClass,
} from '../components/ui';
import { useApi, withQuery } from '../hooks/useApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { seoSiteService } from '../services/api';

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CO');
const when = (iso) => (iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const STATUS = {
    propuesto: { label: 'Propuesto', tone: 'blue' },
    aprobado: { label: 'En cola', tone: 'violet' },
    aplicado: { label: 'Aplicado', tone: 'green' },
    error: { label: 'Error al aplicar', tone: 'red' },
    por_revertir: { label: 'Revirtiendo', tone: 'violet' },
    error_revertir: { label: 'Error al revertir', tone: 'red' },
    revertido: { label: 'Revertido', tone: 'neutral' },
    descartado: { label: 'Descartado', tone: 'neutral' },
};
const LIMITS = [
    { value: '20', label: '20 (prueba)' },
    { value: '100', label: '100' },
    { value: '500', label: '500' },
    { value: '', label: 'Todas' },
];

async function confirm(title, text, confirmButtonText) {
    const r = await Swal.fire({ title, text, icon: 'question', showCancelButton: true, confirmButtonText, cancelButtonText: 'Cancelar' });
    return r.isConfirmed;
}

// --- Procesos en curso ---------------------------------------------------------------------------

function JobBanner({ proposeJob, applyJob, kinds }) {
    const label = (k) => kinds.find((x) => x.kind === k)?.label || k;
    if (!proposeJob?.running && !applyJob?.running) return null;
    return (
        <Card className="p-5 flex flex-col gap-4" aria-live="polite">
            {proposeJob?.running && (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                        <Pill tone="blue">Preparando propuestas</Pill>
                        {label(proposeJob.kind)}: {fmt(proposeJob.reviewed)} revisadas · {fmt(proposeJob.created)} propuestas
                        {proposeJob.limit ? ` (máximo ${fmt(proposeJob.limit)})` : ''}
                    </div>
                    <ProgressBar value={proposeJob.limit
                        ? Math.min(100, Math.round((proposeJob.created / proposeJob.limit) * 100))
                        : Math.round((proposeJob.reviewed / Math.max(1, proposeJob.reviewed + proposeJob.pending)) * 100)} />
                </div>
            )}
            {applyJob?.running && (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                        <Pill tone="violet">Aplicando en WordPress</Pill>
                        {fmt(applyJob.done)} listos · {fmt(applyJob.pending)} en cola
                        {applyJob.errors ? <span className="text-red-700"> · {fmt(applyJob.errors)} con error</span> : null}
                    </div>
                    <ProgressBar value={Math.round(((applyJob.done + applyJob.errors) / Math.max(1, applyJob.done + applyJob.errors + applyJob.pending)) * 100)} color="bg-violet-600" />
                </div>
            )}
            <span className="text-xs text-slate-500">Puedes salir de esta página: el proceso sigue en segundo plano.</span>
        </Card>
    );
}

// --- Tipos de corrección ------------------------------------------------------------------------

function KindCard({ k, busy, onChanged }) {
    const [limit, setLimit] = useState('20');
    const [working, setWorking] = useState(false);
    const s = k.by_status;

    const propose = async () => {
        setWorking(true);
        try {
            await seoSiteService.proposeChanges(k.kind, limit ? Number(limit) : null);
            onChanged();
        } catch (e) {
            Swal.fire('No se pudo iniciar', e.message, 'error');
        } finally {
            setWorking(false);
        }
    };

    const approveAll = async () => {
        if (!await confirm('Aplicar en WordPress', `Se aplicarán los ${fmt(s.propuesto)} cambios propuestos de "${k.label}". Cada uno se puede revertir después.`, 'Aplicar todos')) return;
        try {
            const r = await seoSiteService.changeAction('aprobar', { kind: k.kind, all: true });
            Swal.fire({ icon: 'success', title: `${fmt(r.count)} cambios en cola`, timer: 1800, showConfirmButton: false });
            onChanged();
        } catch (e) {
            Swal.fire('No se pudo aplicar', e.message, 'error');
        }
    };

    return (
        <Card className="flex flex-col">
            <CardHeader title={k.label} subtitle={`Problema en el inventario: ${k.issue_label || k.issue}`} />
            <div className="p-5 flex flex-col gap-4 flex-1">
                <p className="m-0 text-sm text-slate-600">{k.description}</p>
                <dl className="m-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        ['Sin revisar', k.candidates, 'Entradas con el problema que aún no tienen propuesta'],
                        ['Propuestos', s.propuesto, 'Esperando tu aprobación'],
                        ['Aplicados', s.aplicado, 'Ya cambiados en WordPress'],
                        ['Con error', s.error + s.error_revertir, 'Revisa el motivo en la tabla'],
                    ].map(([label, value, title]) => (
                        <div key={label} className="rounded-lg border border-slate-200 px-3 py-2" title={title}>
                            <dt className="text-xs text-slate-500">{label}</dt>
                            <dd className="m-0 text-lg font-bold text-slate-900">{fmt(value)}</dd>
                        </div>
                    ))}
                </dl>
                <div className="flex flex-wrap items-end gap-2 mt-auto">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-semibold text-slate-700">Cuántas entradas</span>
                        <select value={limit} onChange={(e) => setLimit(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                            {LIMITS.map((l) => <option key={l.label} value={l.value}>{l.label}</option>)}
                        </select>
                    </label>
                    <Button onClick={propose} disabled={busy || working || k.candidates === 0}>
                        {working ? 'Iniciando…' : 'Preparar propuestas'}
                    </Button>
                    <Button variant="primary" onClick={approveAll} disabled={!s.propuesto}>
                        Aplicar los {fmt(s.propuesto)} propuestos
                    </Button>
                </div>
                <span className="text-xs text-slate-500">
                    Preparar propuestas no cambia nada en WordPress: solo arma la lista para que la revises.
                </span>
            </div>
        </Card>
    );
}

// --- Tabla de cambios -----------------------------------------------------------------------------

function ChangeDetail({ c }) {
    if (c.kind === 'h1_a_h2') {
        const actions = c.payload?.actions || [];
        return (
            <div className="flex flex-col gap-1">
                {(c.payload?.headings || []).map((h, i) => (
                    <span key={i} className="text-[13px]">
                        <span className="font-mono text-red-700 line-through">H1</span>
                        {actions[i] === 'eliminar'
                            ? <span className="text-slate-500"> vacío → se elimina</span>
                            : <> → <span className="font-mono text-emerald-700">H2</span> {h || <em className="text-slate-500">(vacío)</em>}</>}
                    </span>
                ))}
            </div>
        );
    }
    if (c.kind === 'titulos_vacios') {
        const levels = c.payload?.levels || [];
        return (
            <span className="text-[13px]">
                Se eliminan {levels.length} título(s) vacío(s): <span className="font-mono text-red-700">{levels.join(', ')}</span>
            </span>
        );
    }
    return (
        <div className="flex flex-col gap-0.5 text-[13px]">
            <span className="text-slate-500">Antes: {c.payload?.before ? `"${c.payload.before}"` : <em>vacío</em>}</span>
            <span className="text-slate-900">Ahora: {`"${c.payload?.after}"`}</span>
        </div>
    );
}

function ChangesTable({ kinds, refreshInterval, onChanged }) {
    const [kind, setKind] = useState('all');
    const [status, setStatus] = useState('propuesto');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [selected, setSelected] = useState(new Set());
    const q = useDebouncedValue(search).trim();

    const { data, loading, refresh } = useApi(withQuery('/api/v1/seo-site/changes', { kind, status, q, page, page_size: pageSize }), { refreshInterval });
    const items = data?.items || [];
    const total = data?.total || 0;
    const reset = (setter) => (v) => { setter(v); setPage(1); setSelected(new Set()); };

    const toggle = (id) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const allOnPage = items.length > 0 && items.every((c) => selected.has(c.id));
    const toggleAll = () => setSelected(allOnPage ? new Set() : new Set(items.map((c) => c.id)));

    const chosen = items.filter((c) => selected.has(c.id));
    const canApprove = chosen.filter((c) => ['propuesto', 'error'].includes(c.status));
    const canRevert = chosen.filter((c) => ['aplicado', 'error_revertir'].includes(c.status));

    const run = async (action, list, title, text, button) => {
        if (!await confirm(title, text, button)) return;
        try {
            const r = await seoSiteService.changeAction(action, { ids: list.map((c) => c.id) });
            Swal.fire({ icon: 'success', title: `${fmt(r.count)} cambio(s) actualizados`, timer: 1600, showConfirmButton: false });
            setSelected(new Set());
            refresh();
            onChanged();
        } catch (e) {
            Swal.fire('No se pudo completar', e.message, 'error');
        }
    };

    return (
        <Card aria-labelledby="changes-title" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200">
                <h2 id="changes-title" className="m-0 text-base font-bold">Cambios</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <select value={kind} onChange={(e) => reset(setKind)(e.target.value)} aria-label="Tipo de cambio" className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-[13px]">
                        <option value="all">Todos los tipos</option>
                        {kinds.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
                    </select>
                    <SearchInput value={search} onChange={reset(setSearch)} placeholder="Buscar por URL o título" className="w-full sm:w-64" />
                </div>
            </div>

            <div className="px-5 pt-4 flex flex-col gap-3">
                <Chips
                    label="Estado"
                    options={[
                        { value: 'propuesto', label: 'Propuestos' },
                        { value: 'aprobado', label: 'En cola' },
                        { value: 'aplicado', label: 'Aplicados' },
                        { value: 'error', label: 'Error al aplicar' },
                        { value: 'error_revertir', label: 'Error al revertir' },
                        { value: 'revertido', label: 'Revertidos' },
                        { value: 'descartado', label: 'Descartados' },
                        { value: 'all', label: 'Todos' },
                    ]}
                    value={status}
                    onChange={reset(setStatus)}
                />
                {selected.size > 0 && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                        <span className="text-[13px] font-semibold text-blue-900">{fmt(selected.size)} seleccionado(s)</span>
                        {canApprove.length > 0 && <>
                            <Button size="sm" variant="primary" onClick={() => run('aprobar', canApprove, 'Aplicar en WordPress', `Se aplicarán ${canApprove.length} cambio(s). Se pueden revertir después.`, 'Aplicar')}>
                                Aplicar ({canApprove.length})
                            </Button>
                            <Button size="sm" onClick={() => run('descartar', canApprove, 'Descartar', `Se descartarán ${canApprove.length} propuesta(s). No se cambia nada en WordPress.`, 'Descartar')}>
                                Descartar ({canApprove.length})
                            </Button>
                        </>}
                        {canRevert.length > 0 && (
                            <Button size="sm" variant="danger" onClick={() => run('revertir', canRevert, 'Revertir', `Se deshará ${canRevert.length} cambio(s) en WordPress y quedará como estaba antes.`, 'Revertir')}>
                                Revertir ({canRevert.length})
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Quitar selección</Button>
                    </div>
                )}
            </div>

            {!loading && total === 0 ? (
                <EmptyState
                    title={status === 'propuesto' ? 'No hay propuestas pendientes' : 'Nada por aquí'}
                    description={status === 'propuesto' ? 'Usa "Preparar propuestas" en una de las correcciones de arriba.' : 'Ningún cambio coincide con los filtros.'}
                />
            ) : (
                <div className="overflow-x-auto mt-2">
                    <table className={cx(tableClass, 'min-w-[860px]')}>
                        <caption className="sr-only">Cambios SEO propuestos y aplicados</caption>
                        <thead>
                            <tr>
                                <th scope="col" className={cx(thClass, 'w-10')}>
                                    <input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="Seleccionar todos los de esta página" className="w-4 h-4 accent-blue-600" />
                                </th>
                                <th scope="col" className={thClass}>Entrada</th>
                                <th scope="col" className={thClass}>Cambio</th>
                                <th scope="col" className={thClass}>Estado</th>
                                <th scope="col" className={thClass}>Actualizado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((c) => {
                                const st = STATUS[c.status] || { label: c.status, tone: 'neutral' };
                                let path = c.url;
                                try { path = new URL(c.url).pathname; } catch { /* URL no válida */ }
                                return (
                                    <tr key={c.id} className={trClass}>
                                        <td className={tdClass}>
                                            <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} aria-label={`Seleccionar ${c.title || path}`} className="w-4 h-4 accent-blue-600" />
                                        </td>
                                        <th scope="row" className={cx(tdClass, 'text-left max-w-[320px]')}>
                                            <div className="font-semibold text-slate-900 truncate">{c.title || '(sin título)'}</div>
                                            <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 truncate block font-normal">{path}</a>
                                        </th>
                                        <td className={cx(tdClass, 'max-w-[380px]')}>
                                            <ChangeDetail c={c} />
                                            {c.error && <div className="text-xs text-red-700 mt-1">{c.error}</div>}
                                        </td>
                                        <td className={tdClass}><Pill tone={st.tone}>{st.label}</Pill></td>
                                        <td className={cx(tdClass, 'text-xs text-slate-500 whitespace-nowrap')}>{when(c.updated_at)}</td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Cargando…</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {total > 0 && (
                <Pagination
                    page={page}
                    pages={data?.pages}
                    onPage={(p) => { setPage(p); setSelected(new Set()); }}
                    pageSize={pageSize}
                    onPageSize={(n) => { setPageSize(n); setPage(1); setSelected(new Set()); }}
                    sizes={[25, 50, 100]}
                    total={total}
                    noun="cambios"
                />
            )}
        </Card>
    );
}

// --- Vista ----------------------------------------------------------------------------------------

export default function SeoChanges() {
    const { data, refresh } = useApi('/api/v1/seo-site/changes/overview', { refreshInterval: 5000 });
    const kinds = data?.kinds || [];
    const busy = !!data?.propose_job?.running;
    const working = busy || !!data?.apply_job?.running;

    return (
        <>
            <Card className="px-5 py-4 text-sm text-slate-600 flex flex-col gap-1">
                <strong className="text-slate-900">Cómo funciona</strong>
                <span>
                    1. <strong>Preparar propuestas</strong> revisa las entradas y arma la lista de cambios, sin tocar WordPress.
                    2. Revisa la lista y <strong>aplica</strong> los que quieras (sugerencia: empieza con 20 y revisa esas entradas en la página).
                    3. Si algo no te gusta, <strong>revierte</strong>: la entrada queda exactamente como estaba.
                    Después usa <strong>Actualizar inventario</strong> en la pestaña Diagnóstico para ver el puntaje nuevo.
                </span>
            </Card>

            <JobBanner proposeJob={data?.propose_job} applyJob={data?.apply_job} kinds={kinds} />
            {data?.propose_job?.last_error && !busy && <p className="m-0 text-[13px] text-red-700">Error al preparar propuestas: {data.propose_job.last_error}</p>}
            {data?.apply_job?.last_error && !data?.apply_job?.running && <p className="m-0 text-[13px] text-red-700">Error al aplicar: {data.apply_job.last_error}</p>}

            <section aria-label="Correcciones disponibles" className="grid gap-4 lg:grid-cols-2">
                {kinds.map((k) => <KindCard key={k.kind} k={k} busy={busy} onChanged={refresh} />)}
            </section>

            <ChangesTable kinds={kinds} refreshInterval={working ? 5000 : 0} onChanged={refresh} />
        </>
    );
}
