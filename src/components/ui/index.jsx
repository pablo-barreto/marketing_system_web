'use client';
// Piezas comunes del diseño del panel (canvas "Marketing OS — Panel de Control").
// Paleta: slate de Tailwind para texto y bordes, blue-600 como acento, fondo #F5F6F8.
import Icon from './Icon';

const cx = (...parts) => parts.filter(Boolean).join(' ');

// --- Botones ------------------------------------------------------------------------

const BUTTON = {
    primary: 'bg-blue-600 text-white border-transparent hover:bg-blue-700',
    secondary: 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50',
    danger: 'bg-white text-red-700 border-red-200 hover:bg-red-50',
    ghost: 'bg-transparent text-blue-700 border-transparent hover:bg-blue-50',
};

export function buttonClass(variant = 'secondary', size = 'md', extra = '') {
    const sizes = { sm: 'min-h-9 px-3 text-[13px]', md: 'min-h-10 px-4 text-sm', lg: 'min-h-12 px-5 text-[15px]' };
    return cx(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold cursor-pointer transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        BUTTON[variant], sizes[size], extra
    );
}

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...props }) {
    return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

// --- Contenedores -------------------------------------------------------------------

export function Card({ as: Tag = 'section', className = '', children, ...props }) {
    return (
        <Tag className={cx('bg-white border border-slate-200 rounded-xl', className)} {...props}>
            {children}
        </Tag>
    );
}

export function CardHeader({ title, subtitle, id, actions, className = '' }) {
    return (
        <div className={cx('flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200', className)}>
            <div className="flex flex-col gap-0.5 min-w-0">
                <h2 id={id} className="m-0 text-base font-bold text-slate-900">{title}</h2>
                {subtitle && <span className="text-[13px] text-slate-500">{subtitle}</span>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

export function StatCard({ label, value, suffix, children, className = '' }) {
    return (
        <Card as="article" className={cx('px-5 py-[18px] flex flex-col gap-2.5', className)}>
            <span className="text-[13px] font-semibold text-slate-600">{label}</span>
            <span className="text-[32px] font-bold leading-none text-slate-900">
                {value}
                {suffix && <span className="ml-1.5 text-base font-medium text-slate-500">{suffix}</span>}
            </span>
            {children}
        </Card>
    );
}

export function ProgressBar({ value, color = 'bg-blue-600', className = '' }) {
    const pct = Math.max(0, Math.min(100, value || 0));
    return (
        <div aria-hidden="true" className={cx('h-1.5 rounded-full bg-slate-200 overflow-hidden', className)}>
            <div className={cx('h-full', color)} style={{ width: `${pct}%` }} />
        </div>
    );
}

export function EmptyState({ title, description, action }) {
    return (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <span className="font-semibold text-slate-700">{title}</span>
            {description && <span className="text-[13px] text-slate-500 max-w-md">{description}</span>}
            {action}
        </div>
    );
}

// --- Formularios --------------------------------------------------------------------

export const inputClass =
    'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 ' +
    'focus:outline-2 focus:outline-blue-500 focus:outline-offset-1';

export function Field({ label, required, optional, hint, children, className = '' }) {
    return (
        <label className={cx('flex flex-col gap-1.5', className)}>
            <span className="text-[13px] font-semibold text-slate-700">
                {label}
                {required && <span className="text-red-700"> *</span>}
                {optional && <span className="font-normal text-slate-500"> (opcional)</span>}
            </span>
            {children}
            {hint && <span className="text-xs text-slate-500">{hint}</span>}
        </label>
    );
}

export function SearchInput({ value, onChange, placeholder = 'Buscar', label, className = '' }) {
    return (
        <label className={cx('flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-300 bg-white min-w-[200px]', className)}>
            <Icon name="search" size={16} className="text-slate-500 shrink-0" />
            <input
                type="search"
                aria-label={label || placeholder}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="border-0 outline-none text-sm w-full bg-transparent"
            />
        </label>
    );
}

export function MoneyInput({ value, onChange, className = '', ...props }) {
    return (
        <div className={cx('flex items-center gap-1.5 h-11 rounded-lg border border-slate-300 bg-white px-3', className)}>
            <span className="text-slate-500">$</span>
            <input
                type="number"
                inputMode="numeric"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="border-0 outline-none text-sm w-full bg-transparent"
                {...props}
            />
        </div>
    );
}

// --- Selección ----------------------------------------------------------------------

// Pestañas subrayadas (role=tablist)
export function Tabs({ tabs, value, onChange, label }) {
    return (
        <div role="tablist" aria-label={label} className="flex gap-1 self-stretch">
            {tabs.map((t) => {
                const on = t.value === value;
                return (
                    <button
                        key={t.value}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(t.value)}
                        className={cx(
                            'min-h-11 px-3 border-0 border-b-2 bg-transparent cursor-pointer text-sm font-semibold',
                            on ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'
                        )}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

// Grupo de chips (filtros de una opción)
export function Chips({ options, value, onChange, label }) {
    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-2">
            {options.map((o) => {
                const on = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(o.value)}
                        className={cx(
                            'min-h-9 px-3.5 rounded-full border text-[13px] font-semibold cursor-pointer',
                            on ? 'bg-blue-700 border-blue-700 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        )}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

// Control segmentado (p. ej. periodo 7/30/90 días)
export function Segmented({ options, value, onChange, label }) {
    return (
        <div role="group" aria-label={label} className="inline-flex gap-1 p-1 rounded-[10px] bg-slate-200/70">
            {options.map((o) => {
                const on = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(o.value)}
                        className={cx(
                            'min-h-9 px-3.5 rounded-lg border-0 text-[13px] font-semibold cursor-pointer',
                            on ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-600 hover:text-slate-900'
                        )}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

export function Switch({ checked, onChange, label, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cx(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-0 cursor-pointer transition-colors disabled:opacity-50',
                checked ? 'bg-blue-600' : 'bg-slate-300'
            )}
        >
            <span
                aria-hidden="true"
                className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')}
            />
        </button>
    );
}

// --- Etiquetas ----------------------------------------------------------------------

const TONES = {
    neutral: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-800',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-800',
};

export function Pill({ tone = 'neutral', children, className = '' }) {
    return (
        <span className={cx('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap', TONES[tone], className)}>
            {children}
        </span>
    );
}

// --- Tablas -------------------------------------------------------------------------

export const tableClass = 'w-full border-collapse';
export const thClass = 'text-left px-3 py-3 text-xs font-semibold text-slate-600 bg-slate-50 first:pl-5 last:pr-5';
export const tdClass = 'px-3 py-3.5 text-sm text-slate-700 first:pl-5 last:pr-5 align-middle';
export const trClass = 'border-t border-slate-100 hover:bg-slate-50';

export function Pagination({ page, pages, onPage, pageSize, onPageSize, sizes = [5, 10, 25, 50], total, noun = 'registros' }) {
    const last = Math.max(pages || 1, 1);
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-200">
            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                {onPageSize && (
                    <label className="flex items-center gap-2">
                        Filas por página
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSize(Number(e.target.value))}
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-[13px]"
                        >
                            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                )}
                {total !== undefined && <span>{total.toLocaleString('es-CO')} {noun}</span>}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[13px] text-slate-600">Página {page} de {last}</span>
                <Button size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>Anterior</Button>
                <Button size="sm" onClick={() => onPage(page + 1)} disabled={page >= last}>Siguiente</Button>
            </div>
        </div>
    );
}

// --- Panel lateral (drawer) ---------------------------------------------------------

export function Drawer({ open, onClose, title, children, width = 'max-w-lg' }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[150] flex justify-end">
            <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-slate-900/40 border-0 cursor-default" />
            <aside role="dialog" aria-modal="true" aria-label={title} className={cx('relative h-full w-full bg-white shadow-2xl flex flex-col', width)}>
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200">
                    <h2 className="m-0 text-lg font-bold text-slate-900">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Cerrar panel" className="w-11 h-11 flex items-center justify-center rounded-lg border-0 bg-transparent text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">{children}</div>
            </aside>
        </div>
    );
}

export { Icon, cx };
