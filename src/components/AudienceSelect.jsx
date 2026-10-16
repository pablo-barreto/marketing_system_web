import React from 'react';

// Públicos que acepta el backend en el campo `audience_type`
// (ver docs/api/audience_type.md en marketing_system).
export const AUDIENCE_OPTIONS = [
  { value: 'empresa', label: '🏢 Empresas', short: 'Empresas' },
  { value: 'persona_natural', label: '🙋 Personas naturales', short: 'Personas' },
  { value: 'ambos', label: '🤝 Ambos', short: 'Ambos' },
];

export const DEFAULT_AUDIENCE = 'empresa';

const PLATFORM_LABELS = { linkedin: 'LinkedIn', facebook: 'Meta', instagram: 'Instagram' };

// Texto para avisar qué plataformas omitió el backend por el público elegido.
export const skippedNotice = (skipped) => {
  if (!Array.isArray(skipped) || skipped.length === 0) return '';
  const names = skipped.map(p => PLATFORM_LABELS[p] || p).join(', ');
  return `${names} omitido: el público es persona natural.`;
};

// Badge compacto para tablas y tarjetas.
export const AudienceBadge = ({ audienceType }) => {
  const opt = AUDIENCE_OPTIONS.find(o => o.value === audienceType);
  // Sin dato (o valor desconocido) no inventamos un público: mostramos "—".
  if (!opt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-white text-slate-400 border-slate-200">
        —
      </span>
    );
  }
  const styles = {
    empresa: 'bg-slate-50 text-slate-600 border-slate-200',
    persona_natural: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    ambos: 'bg-violet-50 text-violet-700 border-violet-100',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${styles[opt.value]}`}>
      {opt.short}
    </span>
  );
};

/**
 * Selector de público de la campaña.
 * variant: 'light' (formularios blancos) | 'dark' (Lanzamiento Global) | 'compact' (barra de la galería)
 * platform: si se pasa y es 'all', avisa que con personas naturales solo se publica en Meta.
 */
const AudienceSelect = ({ value, onChange, disabled = false, variant = 'light', platform }) => {
  const classes = {
    light: 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300',
    dark: 'w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer',
    compact: 'bg-white border border-slate-200 text-slate-700 text-xs font-bold py-1.5 px-2 rounded w-40 focus:outline-none',
  };
  const labelClass = variant === 'compact'
    ? 'text-[10px] uppercase font-bold text-slate-400 px-1'
    : 'block text-xs font-bold text-slate-500 uppercase mb-2';

  const showMetaOnly = value === 'persona_natural' && (platform === undefined || platform === 'all');

  return (
    <div className={variant === 'compact' ? 'flex flex-col' : ''}>
      <label className={labelClass}>Público</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={classes[variant]}
      >
        {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {showMetaOnly && variant !== 'compact' && (
        <p className={`text-xs mt-1 ml-1 ${variant === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
          Con personas naturales se publica solo en Meta (LinkedIn se omite).
        </p>
      )}
    </div>
  );
};

export default AudienceSelect;
