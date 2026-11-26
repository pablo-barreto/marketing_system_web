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
                        <Pill tone="blue">{proposeJob.mode === 'recuperar' ? 'Buscando textos de la IA reemplazados' : proposeJob.mode === 'reescribir' ? 'La IA está escribiendo la página (1–2 min)' : 'Preparando propuestas'}</Pill>
                        {label(proposeJob.kind)}: {fmt(proposeJob.reviewed)} revisadas · {fmt(proposeJob.created)} {proposeJob.mode === 'recuperar' ? 'reemplazadas, vuelven a propuestas' : 'propuestas'}
                        {proposeJob.limit ? ` (máximo ${fmt(proposeJob.limit)})` : ''}
                        {proposeJob.skipped ? <span className="text-amber-700"> · {fmt(proposeJob.skipped)} saltadas porque WordPress no respondió (se pueden volver a preparar)</span> : null}
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

// Página de servicio con la plantilla: se elige la página, una por una
function RewriteCard({ k, busy, onChanged }) {
    const suggestions = k.suggestions || [];
    const [wpId, setWpId] = useState('');
    const [working, setWorking] = useState(false);
    const s = k.by_status;
    const chosen = wpId || (suggestions[0] ? String(suggestions[0].wp_id) : '');
    const custom = wpId && !suggestions.some((p) => String(p.wp_id) === wpId) ? wpId : '';
    const saved = k.kind === 'version_guardada';

    const generate = async () => {
        if (!chosen) return;
        setWorking(true);
        try {
            if (saved) {
                await seoSiteService.proposeSavedVersion(Number(chosen));
                Swal.fire({ icon: 'success', title: 'Propuesta lista', text: 'Está abajo en "Propuestos": abra la vista previa antes de aplicarla.', timer: 3500, showConfirmButton: false });
            } else {
                await seoSiteService.rewritePage(Number(chosen));
                Swal.fire({ icon: 'info', title: 'Generando la página', text: 'La IA tarda uno o dos minutos. La propuesta aparecerá abajo en "Propuestos", con su vista previa.', timer: 4000, showConfirmButton: false });
            }
            onChanged();
        } catch (e) {
            Swal.fire('No se pudo iniciar', e.message, 'error');
        } finally {
            setWorking(false);
        }
    };

    return (
        <Card className="flex flex-col lg:col-span-2">
            <CardHeader title={k.label} subtitle={saved ? 'Páginas con la versión nueva guardada pero tapada por Elementor' : 'Fase 3 · Una página a la vez, con vista previa antes de publicar'} />
            <div className="p-5 flex flex-col gap-4 flex-1">
                <p className="m-0 text-sm text-slate-600">{k.description}</p>
                <dl className="m-0 grid grid-cols-3 gap-3 max-w-xl">
                    {[['Propuestas', s.propuesto], ['Publicadas', s.aplicado], ['Con error', s.error + s.error_revertir]].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-slate-200 px-3 py-2">
                            <dt className="text-xs text-slate-500">{label}</dt>
                            <dd className="m-0 text-lg font-bold text-slate-900">{fmt(value)}</dd>
                        </div>
                    ))}
                </dl>
                <div className="flex flex-wrap items-end gap-2">
                    <label className="flex flex-col gap-1.5 min-w-0 flex-1 max-w-xl">
                        <span className="text-[13px] font-semibold text-slate-700">Página</span>
                        <select value={custom ? '' : chosen} onChange={(e) => setWpId(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm min-w-0">
                            {custom && <option value="">Otra página: {custom}</option>}
                            {suggestions.map((p) => (
                                <option key={p.wp_id} value={p.wp_id}>
                                    {p.title} — {p.url.replace(/^https?:\/\/[^/]+/, '')}{p.score != null ? ` (puntaje ${p.score})` : ''}
                                </option>
                            ))}
                            {suggestions.length === 0 && !custom && <option value="">No quedan páginas sugeridas</option>}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 w-40">
                        <span className="text-[13px] font-semibold text-slate-700">u otra (ID de WordPress)</span>
                        <input inputMode="numeric" placeholder="Ej.: 9969" value={custom}
                            onChange={(e) => setWpId(e.target.value.replace(/\D/g, ''))}
                            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm" />
                    </label>
                    <Button onClick={generate} disabled={(busy && !saved) || working || !chosen}>
                        {working ? 'Iniciando…' : saved ? 'Preparar propuesta' : 'Generar con la plantilla'}
                    </Button>
                </div>
                <span className="text-xs text-slate-500">
                    {saved ? 'Preparar' : 'Generar'} no cambia nada en WordPress. Revise la vista previa en la tabla de abajo y aplíquela solo si le gusta.
                </span>
            </div>
        </Card>
    );
}

function KindCard({ k, busy, onChanged }) {
    const [limit, setLimit] = useState('20');
    const types = k.wp_types || ['post'];
    const [wpType, setWpType] = useState(types[0]);
    const candidates = k.candidates_by_type ? (k.candidates_by_type[wpType] ?? 0) : k.candidates;
    const checked = k.checked_by_type?.[wpType] ?? 0;
    const noun = types.length > 1 ? (wpType === 'page' ? 'páginas' : 'entradas') : 'entradas';
    const [working, setWorking] = useState(false);
    const s = k.by_status;

    const propose = async (recheck = false) => {
        if (recheck && !await confirm('Volver a revisar', `Se revisarán otra vez las ${fmt(checked)} ${noun} que ya se habían revisado sin nada que proponer.`, 'Volver a revisar')) return;
        setWorking(true);
        try {
            await seoSiteService.proposeChanges(k.kind, limit ? Number(limit) : null, wpType, recheck);
            onChanged();
        } catch (e) {
            Swal.fire('No se pudo iniciar', e.message, 'error');
        } finally {
            setWorking(false);
        }
    };

    const restore = async () => {
        if (!await confirm('Recuperar los textos de la IA',
            `Se revisarán los ${fmt(s.aplicado)} cambios aplicados de "${k.label}". Los que en WordPress ya tienen otro texto (los cambió otra herramienta o una persona) vuelven a "Propuestos" para que los apruebes de nuevo. No se escribe nada en WordPress hasta que los apruebes.`,
            'Revisar')) return;
        setWorking(true);
        try {
            await seoSiteService.restoreChanges(k.kind);
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
            <CardHeader title={k.label} subtitle={k.scan ? 'Revisa el texto de todas las entradas' : `Problema en el inventario: ${k.issue_label || k.issue}`} />
            <div className="p-5 flex flex-col gap-4 flex-1">
                <p className="m-0 text-sm text-slate-600">{k.description}</p>
                <dl className="m-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        k.scan
                            ? ['Por revisar', candidates, `${noun} que se revisarán; solo se proponen cambios en las que tengan el problema`]
                            : ['Sin revisar', candidates, `${noun} con el problema que aún no tienen propuesta`],
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
                    {types.length > 1 && (
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-semibold text-slate-700">Qué revisar</span>
                            <select value={wpType} onChange={(e) => setWpType(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                                {types.map((t) => (
                                    <option key={t} value={t}>{t === 'page' ? 'Páginas' : 'Entradas'} ({fmt(k.candidates_by_type?.[t])})</option>
                                ))}
                            </select>
                        </label>
                    )}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-semibold text-slate-700">Cuántas {noun}</span>
                        <select value={limit} onChange={(e) => setLimit(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                            {LIMITS.map((l) => <option key={l.label} value={l.value}>{l.label}</option>)}
                        </select>
                    </label>
                    <Button onClick={() => propose(false)} disabled={busy || working || candidates === 0}>
                        {working ? 'Iniciando…' : 'Preparar propuestas'}
                    </Button>
                    <Button variant="primary" onClick={approveAll} disabled={!s.propuesto}>
                        Aplicar los {fmt(s.propuesto)} propuestos
                    </Button>
                    {k.restorable && s.aplicado > 0 && (
                        <Button variant="ghost" onClick={restore} disabled={busy || working} title="Busca los textos de la IA que otra herramienta o una persona reemplazó en WordPress">
                            Recuperar los de la IA reemplazados
                        </Button>
                    )}
                </div>
                <span className="text-xs text-slate-500">
                    Preparar propuestas no cambia nada en WordPress: solo arma la lista para que la revises.
                    {checked > 0 && (
                        <>
                            {' '}{fmt(checked)} {noun} ya se revisaron sin nada que proponer y no se cuentan como pendientes (se vuelven a revisar si cambian en WordPress).{' '}
                            <button type="button" className="underline text-slate-600 hover:text-slate-900 disabled:opacity-50" disabled={busy || working} onClick={() => propose(true)}>
                                Volver a revisarlas
                            </button>
                        </>
                    )}
                </span>
            </div>
        </Card>
    );
}

// --- Tabla de cambios -----------------------------------------------------------------------------

const EDITABLE = { palabra_clave: { label: 'Introducción', min: 120, max: 320 }, meta_descripcion: { label: 'Meta descripción', min: 70, max: 160 }, titulo_seo: { label: 'Título SEO', min: 30, max: 60 }, alt_imagen: { label: 'Texto alternativo', min: 3, max: 125 } };

async function editChange(c, onDone) {
    const cfg = EDITABLE[c.kind];
    const r = await Swal.fire({
        title: `Editar ${cfg.label.toLowerCase()}`,
        input: 'textarea',
        inputValue: c.payload?.after || '',
        inputAttributes: { maxlength: String(cfg.max + 40), 'aria-label': cfg.label },
        html: `<span style="font-size:13px;color:#64748b">Entre ${cfg.min} y ${cfg.max} caracteres.</span>`,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        inputValidator: (v) => {
            const n = v.trim().replace(/\s+/g, ' ').length;
            return n < cfg.min || n > cfg.max ? `Tiene ${n} caracteres: debe tener entre ${cfg.min} y ${cfg.max}.` : undefined;
        },
    });
    if (!r.isConfirmed) return;
    try {
        await seoSiteService.editChange(c.id, r.value);
        onDone();
    } catch (e) {
        Swal.fire('No se pudo guardar', e.message, 'error');
    }
}

function ChangeDetail({ c, onEdited }) {
    const canEdit = EDITABLE[c.kind] && ['propuesto', 'error'].includes(c.status) && (c.kind !== 'palabra_clave' || !!c.payload?.after);
    if (c.kind === 'pagina_plantilla' || c.kind === 'version_guardada') {
        const p = c.payload || {};
        const b = p.before || {};
        const a = p.after || {};
        const preview = async () => {
            const win = window.open('', '_blank');
            try {
                const r = await seoSiteService.previewChange(c.id);
                const url = URL.createObjectURL(new Blob([r.html], { type: 'text/html' }));
                if (win) win.location.href = url; else window.open(url, '_blank');
            } catch (e) {
                if (win) win.close();
                Swal.fire('No se pudo abrir la vista previa', e.message, 'error');
            }
        };
        const links = (
            <span className="flex flex-wrap gap-2 mt-1">
                <Button size="sm" onClick={preview}>Vista previa</Button>
                <a className="text-xs underline text-slate-600 self-center" href={c.url} target="_blank" rel="noopener noreferrer">Ver la página actual</a>
            </span>
        );
        if (c.kind === 'version_guardada') {
            return (
                <div className="flex flex-col gap-1 text-[13px]">
                    <span>Se quita Elementor para mostrar la versión guardada ({fmt(p.words)} palabras). El texto no cambia.</span>
                    {links}
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-1 text-[13px]">
                <span><span className="text-slate-500">Título (H1):</span> {b.title} → <span className="text-emerald-700">{a.title}</span></span>
                {p.directory > 0 && <span><span className="text-slate-500">Directorio:</span> {fmt(p.directory)} tarjetas, cada una con su enlace a la subpágina</span>}
                <span><span className="text-slate-500">Título SEO:</span> {a.seo_title}</span>
                <span><span className="text-slate-500">Meta descripción:</span> {a.meta_description}</span>
                <span><span className="text-slate-500">Frase clave:</span> {a.keyword || '—'} · {fmt(p.words_before)} → {fmt(p.words)} palabras · {(p.sections || []).length} secciones{b.elementor === 'builder' ? ' · deja de usar Elementor' : ''}</span>
                {(p.notes || []).length > 0 && <span className="text-amber-700">{p.notes.length} aviso(s): {p.notes.slice(0, 2).join(' ')}</span>}
                {links}
            </div>
        );
    }
    if (c.kind === 'palabra_clave') {
        const p = c.payload || {};
        return (
            <div className="flex flex-col gap-1 text-[13px]">
                {p.title_after !== p.title_before && (
                    <span><span className="text-slate-500">Título (H1):</span> <span className="text-red-700 line-through">{p.title_before}</span> → <span className="text-emerald-700">{p.title_after}</span></span>
                )}
                {p.keyword !== p.keyword_before && (
                    <span><span className="text-slate-500">Palabra clave:</span> <span className="text-red-700 line-through">{p.keyword_before || 'vacía'}</span> → <span className="text-emerald-700">{p.keyword}</span></span>
                )}
                {p.after && (
                    <span><span className="text-slate-500">Introducción nueva ({p.after.length} caracteres):</span> <span className="text-slate-900">{`"${p.after}"`}</span></span>
                )}
                <span className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {p.keyword && <>palabra clave: {p.keyword}</>}
                    {p.edited && <Pill tone="neutral">Editado a mano</Pill>}
                    {canEdit && <Button size="sm" variant="ghost" onClick={() => editChange(c, onEdited)}>Editar introducción</Button>}
                </span>
            </div>
        );
    }
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
    if (c.kind === 'datos_personales') {
        const items = c.payload?.items || [];
        return (
            <div className="flex flex-col gap-0.5 text-[13px]">
                {items.map((it, i) => (
                    <span key={i}>
                        <span className="text-slate-500">{it.tipo}:</span> <span className="font-mono">{it.muestra}</span>
                        {' → '}<span className="text-emerald-700">{it.tipo === 'correo' ? '[correo reservado]' : '[datos reservados]'}</span>
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
    const after = c.payload?.after || '';
    const before = c.payload?.shown_before || c.payload?.before || '';
    return (
        <div className="flex flex-col gap-0.5 text-[13px]">
            <span className="text-slate-500">Antes: {before ? `"${before}"` : <em>vacío</em>}{c.payload?.shown_before && ` (${before.length} caracteres)`}</span>
            <span className="text-slate-900">Ahora: {`"${after}"`}</span>
            <span className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {['meta_descripcion', 'titulo_seo'].includes(c.kind) && <>{after.length} caracteres</>}
                {c.payload?.keyword && <>· palabra clave: {c.payload.keyword}</>}
                {c.payload?.recuperar && <Pill tone="blue">Recupera el texto de la IA (otra herramienta lo había cambiado)</Pill>}
                {c.payload?.edited && <Pill tone="neutral">Editado a mano</Pill>}
                {canEdit && <Button size="sm" variant="ghost" onClick={() => editChange(c, onEdited)}>Editar</Button>}
            </span>
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
                                <th scope="col" className={thClass}>Página o entrada</th>
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
                                            <ChangeDetail c={c} onEdited={refresh} />
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
                {kinds.filter((k) => k.manual).map((k) => <RewriteCard key={k.kind} k={k} busy={busy} onChanged={refresh} />)}
                {kinds.filter((k) => !k.manual).map((k) => <KindCard key={k.kind} k={k} busy={busy} onChanged={refresh} />)}
            </section>

            <ChangesTable kinds={kinds} refreshInterval={working ? 5000 : 0} onChanged={refresh} />
        </>
    );
}
