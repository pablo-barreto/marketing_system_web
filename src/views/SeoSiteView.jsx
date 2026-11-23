'use client';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { PageBody, PageHeader } from '../components/shell/AppShell';
import {
    Button, Card, CardHeader, Chips, Drawer, EmptyState, Pagination, Pill, SearchInput, StatCard, Tabs, cx,
    tableClass, tdClass, thClass, trClass,
} from '../components/ui';
import { useApi, withQuery } from '../hooks/useApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { seoSiteService } from '../services/api';

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CO');
const when = (iso) => (iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const ESTADOS = {
    critico: { label: 'Crítico', tone: 'red' },
    mejorable: { label: 'Mejorable', tone: 'amber' },
    bien: { label: 'Bien', tone: 'green' },
    no_indexada: { label: 'No indexada', tone: 'blue' },
    error: { label: 'Error', tone: 'neutral' },
    pendiente: { label: 'Pendiente', tone: 'neutral' },
};
const LEVEL_TONE = { critico: 'red', advertencia: 'amber', info: 'blue' };
const LEVEL_LABEL = { critico: 'Crítico', advertencia: 'Advertencia', info: 'Información' };
const TYPE_LABEL = { page: 'Página', post: 'Entrada' };

function ScoreBadge({ score }) {
    if (score === null || score === undefined) return <span className="text-slate-400">—</span>;
    const tone = score >= 85 ? 'bg-emerald-50 text-emerald-700' : score >= 50 ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700';
    return <span className={cx('inline-flex items-center justify-center min-w-10 h-7 px-2 rounded-full font-semibold text-[13px]', tone)}>{score}</span>;
}

function EstadoPill({ estado }) {
    const e = ESTADOS[estado || 'pendiente'] || ESTADOS.pendiente;
    return <Pill tone={e.tone}>{e.label}</Pill>;
}

// --- Actualización del inventario ------------------------------------------------------------

function SyncCard({ sync, onStarted }) {
    const [scope, setScope] = useState('all');
    const [starting, setStarting] = useState(false);
    const running = !!sync?.running;

    const start = async (full) => {
        if (full) {
            const ok = await Swal.fire({
                title: 'Revisar todo de nuevo',
                text: 'Se vuelve a revisar cada página aunque no haya cambiado. Con todas las entradas puede tardar más de una hora.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Revisar todo',
                cancelButtonText: 'Cancelar',
            });
            if (!ok.isConfirmed) return;
        }
        setStarting(true);
        try {
            await seoSiteService.sync(scope, full);
            onStarted();
        } catch (e) {
            Swal.fire('No se pudo iniciar', e.message, 'error');
        } finally {
            setStarting(false);
        }
    };

    const listed = sync?.listed || 0;
    const audited = sync?.audited || 0;
    const pending = sync?.pending || 0;
    const progress = audited + pending > 0 ? Math.round((audited / (audited + pending)) * 100) : 0;
    const listing = running && listed === 0;
    // Terminó sin revisar nada: no había cambios en WordPress desde la última vez
    const nothingChanged = !running && !!sync?.finished_at && !sync?.last_error && listed > 0 && audited === 0;

    return (
        <Card aria-labelledby="sync-title">
            <CardHeader
                id="sync-title"
                title="Inventario del sitio"
                subtitle="Revisa las páginas y entradas publicadas en crconsultorescolombia.com. Solo lectura: no cambia nada en WordPress. Después de la primera vez solo revisa lo nuevo o modificado."
            />
            <div className="p-5 flex flex-col gap-3">
                {running ? (
                    <>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                            <Pill tone="blue">Actualizando</Pill>
                            {listing
                                ? 'Paso 1 de 2: listando el contenido de WordPress (con todas las entradas tarda unos minutos)…'
                                : `Paso 2 de 2: ${fmt(audited)} revisadas · ${fmt(pending)} pendientes de ${fmt(listed)} publicadas`}
                        </div>
                        {listing ? (
                            <div className="h-2 rounded-full bg-blue-100 overflow-hidden" role="progressbar" aria-label="Listando el contenido de WordPress">
                                <div className="h-full w-full bg-blue-500 animate-pulse" />
                            </div>
                        ) : (
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del inventario">
                                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        )}
                        <span className="text-xs text-slate-500">Puedes salir de esta página: el proceso sigue en segundo plano.</span>
                    </>
                ) : (
                    <div className="flex flex-wrap items-end gap-2">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-semibold text-slate-700">Qué revisar</span>
                            <select value={scope} onChange={(e) => setScope(e.target.value)} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                                <option value="all">Páginas y entradas</option>
                                <option value="pages">Solo páginas</option>
                                <option value="posts">Solo entradas del blog</option>
                            </select>
                        </label>
                        <Button variant="primary" onClick={() => start(false)} disabled={starting}>
                            {starting ? 'Iniciando…' : 'Actualizar inventario'}
                        </Button>
                        <Button onClick={() => start(true)} disabled={starting}>Revisar todo de nuevo</Button>
                    </div>
                )}
                <span className="text-[13px] text-slate-600">
                    Última actualización: <strong className="text-slate-800">{when(sync?.finished_at)}</strong>
                    {sync?.errors ? <> · <span className="text-amber-800">{fmt(sync.errors)} página(s) no se pudieron descargar</span></> : null}
                </span>
                {nothingChanged && (
                    <span className="text-[13px] text-slate-600 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                        La última actualización no encontró páginas nuevas ni modificadas, así que no revisó nada.
                        Si cambiaste ajustes de Yoast o del tema (no cambian la fecha de las páginas), usa <strong>Revisar todo de nuevo</strong>.
                    </span>
                )}
                {sync?.last_error && <span className="text-[13px] text-red-700">Error: {sync.last_error}</span>}
                {!sync?.focus_known && sync?.finished_at && (
                    <span className="text-[13px] text-slate-500">
                        La palabra clave principal de Yoast aún no se revisa: estará disponible al instalar el conector de WordPress (Fase 0).
                    </span>
                )}
            </div>
        </Card>
    );
}

// --- Detalle de una página --------------------------------------------------------------------

function Length({ text, min, max }) {
    const n = (text || '').length;
    const ok = n >= min && n <= max;
    return <span className={cx('text-xs font-semibold', ok ? 'text-emerald-700' : 'text-amber-800')}>{n} caracteres (recomendado {min}–{max})</span>;
}

function ItemDetail({ wpType, wpId }) {
    const { data, loading } = useApi(`/api/v1/seo-site/inventory/${wpType}/${wpId}`);
    const it = data?.item;
    if (loading && !it) return <p className="px-6 py-10 text-center text-slate-500">Cargando…</p>;
    if (!it) return <p className="px-6 py-10 text-center text-slate-500">No se encontró.</p>;
    const issues = it.issues || [];

    return (
        <div className="px-6 py-5 flex flex-col gap-5 text-sm">
            <div className="flex flex-col gap-1">
                <a href={it.url} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold break-all">{it.url}</a>
                <div className="flex flex-wrap items-center gap-2 text-slate-600">
                    <ScoreBadge score={it.score} /> <EstadoPill estado={it.estado} />
                    <span>{TYPE_LABEL[it.wp_type]}</span>
                    {it.service && <Pill tone="violet">{it.service}</Pill>}
                    <span className="text-xs">Revisada: {when(it.audited_at)}</span>
                </div>
                {it.error && <p className="m-0 text-red-700">{it.error}</p>}
            </div>

            <section className="flex flex-col gap-2">
                <h3 className="m-0 text-[13px] font-bold text-slate-900 uppercase tracking-wide">Problemas ({issues.length})</h3>
                {issues.length === 0 ? <p className="m-0 text-emerald-700">Sin problemas detectados.</p> : (
                    <ul className="m-0 p-0 list-none flex flex-col gap-2">
                        {issues.map((i) => (
                            <li key={i.code} className="flex flex-col gap-0.5 rounded-lg border border-slate-200 px-3 py-2">
                                <span className="flex items-center gap-2"><Pill tone={LEVEL_TONE[i.level]}>{LEVEL_LABEL[i.level]}</Pill> <strong className="text-slate-900">{i.label}</strong></span>
                                {i.detail && <span className="text-slate-600 break-words">{i.detail}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="flex flex-col gap-3">
                <h3 className="m-0 text-[13px] font-bold text-slate-900 uppercase tracking-wide">Yoast SEO (lo que ve Google)</h3>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">Título SEO</span>
                    <span className="text-slate-900">{it.seo_title || <em className="text-red-700">Sin título</em>}</span>
                    <Length text={it.seo_title} min={30} max={60} />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">Meta descripción</span>
                    <span className="text-slate-900">{it.meta_description || <em className="text-red-700">Sin descripción</em>}</span>
                    <Length text={it.meta_description} min={70} max={160} />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">Palabra clave principal</span>
                    <span className="text-slate-900">{it.focus_keyword || <em className="text-slate-500">No disponible</em>}</span>
                </div>
                {it.noindex && <Pill tone="blue">No se muestra en Google (noindex)</Pill>}
            </section>

            <section className="grid grid-cols-2 gap-3">
                {[
                    ['Palabras', fmt(it.word_count)],
                    ['H1', fmt(it.h1_count)],
                    ['Imágenes sin texto alternativo', `${fmt(it.images_no_alt)} de ${fmt(it.images_total)}`],
                    ['Enlaces internos / externos', `${fmt(it.internal_links)} / ${fmt(it.external_links)}`],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-200 px-3 py-2">
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="text-base font-bold text-slate-900">{value}</div>
                    </div>
                ))}
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="m-0 text-[13px] font-bold text-slate-900 uppercase tracking-wide">Estructura de encabezados</h3>
                {(it.headings || []).length === 0 ? <p className="m-0 text-slate-500">Sin encabezados.</p> : (
                    <ol className="m-0 p-0 list-none flex flex-col gap-1">
                        {it.headings.map(([level, text], idx) => (
                            <li key={idx} className="flex gap-2" style={{ paddingLeft: `${(level - 1) * 16}px` }}>
                                <span className={cx('shrink-0 text-[11px] font-bold rounded px-1.5 py-0.5', level === 1 ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700')}>H{level}</span>
                                <span className="text-slate-800">{text || <em className="text-slate-400">vacío</em>}</span>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}

// --- Vista ----------------------------------------------------------------------------------------

export default function SeoSiteView() {
    const [type, setType] = useState('all');
    const [estado, setEstado] = useState('all');
    const [issue, setIssue] = useState('all');
    const [service, setService] = useState('all');
    const [sort, setSort] = useState('score');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [selected, setSelected] = useState(null);
    const q = useDebouncedValue(search).trim();

    // El resumen sigue la pestaña (Todo / Páginas / Entradas)
    const { data: status, refresh: refreshStatus } = useApi(withQuery('/api/v1/seo-site/status', { type }), { refreshInterval: 5000 });
    const running = !!status?.sync?.running;
    const { data: list, loading, refresh: refreshList } = useApi(withQuery('/api/v1/seo-site/inventory', {
        type, estado, issue, service, sort, q, page, page_size: pageSize,
    }), { refreshInterval: running ? 10000 : 0 });

    const summary = status?.summary;
    const items = list?.items || [];
    const total = list?.total || 0;
    const byEstado = summary?.by_estado || {};
    const reset = (setter) => (v) => { setter(v); setPage(1); };

    return (
        <>
            <PageHeader eyebrow="Adquisición" title="SEO del sitio" />
            <PageBody>
                <SyncCard sync={status?.sync} onStarted={() => { refreshStatus(); refreshList(); }} />

                {summary && summary.total > 0 && (
                    <section aria-label="Resumen" className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                        <StatCard label={type === 'page' ? 'Páginas publicadas' : type === 'post' ? 'Entradas publicadas' : 'Publicadas'} value={fmt(summary.total)}>
                            {type === 'all' && <span className="text-xs text-slate-500">{fmt(summary.by_type.page)} páginas · {fmt(summary.by_type.post)} entradas</span>}
                        </StatCard>
                        <StatCard label="Puntaje promedio" value={summary.avg_score ?? '—'} suffix="/ 100" />
                        <StatCard label="Críticas" value={fmt(byEstado.critico)} />
                        <StatCard label="Mejorables" value={fmt(byEstado.mejorable)} />
                        <StatCard label="Bien" value={fmt(byEstado.bien)} />
                        <StatCard label="No indexadas" value={fmt(byEstado.no_indexada)}>
                            <span className="text-xs text-slate-500">Ocultas de Google a propósito: no se califican</span>
                        </StatCard>
                    </section>
                )}

                {summary?.issues?.length > 0 && (
                    <Card aria-labelledby="issues-title">
                        <CardHeader
                            id="issues-title"
                            title={type === 'page' ? 'Problemas más frecuentes en páginas' : type === 'post' ? 'Problemas más frecuentes en entradas' : 'Problemas más frecuentes'}
                            subtitle="Haz clic en uno para ver las páginas que lo tienen."
                        />
                        <div className="p-5 flex flex-wrap gap-2">
                            {summary.issues.map((i) => (
                                <button
                                    key={i.code}
                                    type="button"
                                    aria-pressed={issue === i.code}
                                    onClick={() => reset(setIssue)(issue === i.code ? 'all' : i.code)}
                                    className={cx(
                                        'inline-flex items-center gap-2 min-h-9 px-3 rounded-full border text-[13px] cursor-pointer',
                                        issue === i.code ? 'bg-blue-700 border-blue-700 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                    )}
                                >
                                    <span className={cx('w-2 h-2 rounded-full', i.level === 'critico' ? 'bg-red-600' : i.level === 'advertencia' ? 'bg-amber-500' : 'bg-blue-500')} />
                                    {i.label}
                                    <strong>{fmt(i.count)}</strong>
                                </button>
                            ))}
                        </div>
                    </Card>
                )}

                <Card aria-labelledby="inventory-title" className="overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 border-b border-slate-200">
                        <div className="flex items-center gap-5 self-stretch">
                            <h2 id="inventory-title" className="m-0 py-4 text-base font-bold">Contenido</h2>
                            <Tabs
                                label="Tipo"
                                tabs={[
                                    { value: 'all', label: 'Todo' },
                                    { value: 'page', label: 'Páginas' },
                                    { value: 'post', label: 'Entradas' },
                                ]}
                                value={type}
                                onChange={reset(setType)}
                            />
                        </div>
                        <SearchInput value={search} onChange={reset(setSearch)} placeholder="Buscar por URL o título" className="w-full sm:w-72 my-2.5" />
                    </div>

                    <div className="px-5 pt-4 flex flex-wrap items-center gap-3">
                        <Chips
                            label="Estado"
                            options={[
                                { value: 'all', label: 'Todos' },
                                { value: 'critico', label: `Críticos (${fmt(byEstado.critico)})` },
                                { value: 'mejorable', label: `Mejorables (${fmt(byEstado.mejorable)})` },
                                { value: 'bien', label: `Bien (${fmt(byEstado.bien)})` },
                                { value: 'no_indexada', label: `No indexadas (${fmt(byEstado.no_indexada)})` },
                                { value: 'error', label: `Con error (${fmt(byEstado.error)})` },
                            ]}
                            value={estado}
                            onChange={reset(setEstado)}
                        />
                        <span className="flex-1" />
                        <select value={service} onChange={(e) => reset(setService)(e.target.value)} aria-label="Servicio" className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-[13px]">
                            <option value="all">Todos los servicios</option>
                            {(summary?.services || []).map((s) => <option key={s.service} value={s.service}>{s.service} ({s.count})</option>)}
                            <option value="__none__">Sin servicio asociado</option>
                        </select>
                        <select value={sort} onChange={(e) => reset(setSort)(e.target.value)} aria-label="Ordenar" className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-[13px]">
                            <option value="score">Peor puntaje primero</option>
                            <option value="-score">Mejor puntaje primero</option>
                            <option value="words">Más palabras primero</option>
                            <option value="url">Por URL</option>
                        </select>
                        {issue !== 'all' && (
                            <Button size="sm" onClick={() => reset(setIssue)('all')}>
                                Quitar filtro: {status?.issue_labels?.[issue] || issue}
                            </Button>
                        )}
                    </div>

                    {!loading && total === 0 && !q && type === 'all' && estado === 'all' && issue === 'all' && service === 'all' ? (
                        <EmptyState
                            title={running ? 'Revisando el sitio…' : 'Aún no hay inventario'}
                            description={running ? 'Las páginas aparecerán aquí a medida que se revisan.' : 'Presiona "Actualizar inventario" para revisar las páginas del sitio.'}
                        />
                    ) : (
                        <div className="overflow-x-auto mt-2">
                            <table className={cx(tableClass, 'min-w-[920px]')}>
                                <caption className="sr-only">Páginas y entradas con su diagnóstico SEO</caption>
                                <thead>
                                    <tr>
                                        <th scope="col" className={thClass}>Puntaje</th>
                                        <th scope="col" className={thClass}>Página</th>
                                        <th scope="col" className={thClass}>Tipo</th>
                                        <th scope="col" className={thClass}>Título SEO</th>
                                        <th scope="col" className={thClass}>Problemas</th>
                                        <th scope="col" className={thClass}>Estado</th>
                                        <th scope="col" className={cx(thClass, 'text-right')}><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it) => {
                                        const issues = (it.issues || []).filter((i) => i.level !== 'info');
                                        let path = it.url;
                                        try { path = new URL(it.url).pathname; } catch { /* URL no válida: se muestra tal cual */ }
                                        return (
                                            <tr key={`${it.wp_type}-${it.wp_id}`} className={trClass}>
                                                <td className={tdClass}><ScoreBadge score={it.score} /></td>
                                                <th scope="row" className={cx(tdClass, 'text-left max-w-[320px]')}>
                                                    <div className="font-semibold text-slate-900 truncate">{it.wp_title || it.h1_text || '(sin título)'}</div>
                                                    <div className="text-xs text-slate-500 truncate font-normal">{path}</div>
                                                    {it.service && <div className="text-xs text-violet-700 font-normal">{it.service}</div>}
                                                </th>
                                                <td className={tdClass}>{TYPE_LABEL[it.wp_type]}</td>
                                                <td className={cx(tdClass, 'max-w-[260px]')}>
                                                    <div className="truncate">{it.seo_title || <em className="text-red-700">Sin título</em>}</div>
                                                    <div className="text-xs text-slate-500">{(it.seo_title || '').length} caracteres</div>
                                                </td>
                                                <td className={cx(tdClass, 'max-w-[260px]')}>
                                                    {issues.length === 0 ? <span className="text-emerald-700">Ninguno</span> : (
                                                        <span className="text-[13px]">
                                                            <strong>{issues.length}</strong> · {issues.slice(0, 2).map((i) => i.label).join(', ')}{issues.length > 2 ? '…' : ''}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={tdClass}><EstadoPill estado={it.estado} /></td>
                                                <td className={cx(tdClass, 'text-right')}>
                                                    <Button size="sm" onClick={() => setSelected(it)}>Ver detalle</Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">{loading ? 'Cargando…' : 'Ningún contenido coincide con los filtros.'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {total > 0 && (
                        <Pagination
                            page={page}
                            pages={list?.pages}
                            onPage={setPage}
                            pageSize={pageSize}
                            onPageSize={(n) => { setPageSize(n); setPage(1); }}
                            sizes={[25, 50, 100]}
                            total={total}
                            noun="contenidos"
                        />
                    )}
                </Card>
            </PageBody>

            <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.wp_title || 'Detalle SEO'} width="max-w-2xl">
                {selected && <ItemDetail wpType={selected.wp_type} wpId={selected.wp_id} />}
            </Drawer>
        </>
    );
}
