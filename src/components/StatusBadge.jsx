'use client';
import { Pill } from './ui';

// Estados de campañas (Meta / LinkedIn / internos) y de leads, con texto en español
const STATUS = {
    ACTIVE: ['Activa', 'green'],
    QUALIFIED: ['Calificado', 'green'],
    HIGH_PERFORMANCE: ['Alto rendimiento', 'green'],
    PAUSED: ['Pausada', 'amber'],
    CAMPAIGN_PAUSED: ['Campaña pausada', 'amber'],
    ADSET_PAUSED: ['Conjunto pausado', 'amber'],
    PENDING_APPROVAL: ['Pendiente', 'blue'],
    REVIEW: ['En revisión', 'blue'],
    IN_PROCESS: ['En revisión', 'blue'],
    LEARNING: ['Aprendizaje', 'blue'],
    CONTACTED: ['Contactado', 'blue'],
    DISAPPROVED: ['Rechazada', 'red'],
    REJECTED: ['Rechazada', 'red'],
    WITH_ISSUES: ['Error en Meta', 'red'],
    LOW_PERFORMANCE: ['Bajo rendimiento', 'red'],
    DISQUALIFIED: ['Descartado', 'red'],
    ARCHIVED: ['Archivada', 'neutral'],
    DELETED: ['Eliminada', 'neutral'],
    VISITANTE_WEB: ['Visitante web', 'neutral'],
};

export default function StatusBadge({ status }) {
    const key = String(status || '').toUpperCase().replace(/ /g, '_');
    const [label, tone] = STATUS[key] || [String(status || '—').replace(/_/g, ' ').toLowerCase(), 'neutral'];
    return <Pill tone={tone} className="first-letter:uppercase">{label}</Pill>;
}
