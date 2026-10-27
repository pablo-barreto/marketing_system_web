'use client';
import { Field, Pill, inputClass } from './ui';

// Públicos que acepta el backend en el campo `audience_type`
// (ver docs/api/audience_type.md en marketing_system).
export const AUDIENCE_OPTIONS = [
  { value: 'empresa', label: 'Empresas', short: 'Empresas' },
  { value: 'persona_natural', label: 'Personas naturales', short: 'Personas' },
  { value: 'ambos', label: 'Ambos públicos', short: 'Ambos' },
];

export const DEFAULT_AUDIENCE = 'empresa';

const PLATFORM_LABELS = { linkedin: 'LinkedIn', facebook: 'Meta', instagram: 'Instagram' };

// Texto para avisar qué plataformas omitió el backend por el público elegido.
export const skippedNotice = (skipped) => {
  if (!Array.isArray(skipped) || skipped.length === 0) return '';
  const names = skipped.map(p => PLATFORM_LABELS[p] || p).join(', ');
  return `${names} omitido: el público es persona natural.`;
};

// Etiqueta compacta para tablas y tarjetas. Sin dato no inventamos un público: "—".
export const AudienceBadge = ({ audienceType }) => {
  const opt = AUDIENCE_OPTIONS.find(o => o.value === audienceType);
  if (!opt) return <span className="text-slate-400">—</span>;
  const tone = { empresa: 'neutral', persona_natural: 'green', ambos: 'violet' }[opt.value];
  return <Pill tone={tone}>{opt.short}</Pill>;
};

/**
 * Selector de público de la campaña.
 * platform: si se pasa y es 'all', avisa que con personas naturales solo se publica en Meta.
 */
const AudienceSelect = ({ value, onChange, disabled = false, platform, className = '' }) => {
  const showMetaOnly = value === 'persona_natural' && (platform === undefined || platform === 'all');
  return (
    <Field
      label="Público"
      className={className}
      hint={showMetaOnly ? 'Con personas naturales se publica solo en Meta (LinkedIn se omite).' : undefined}
    >
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={inputClass}>
        {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
};

export default AudienceSelect;
