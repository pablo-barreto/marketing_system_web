'use client';
import { Drawer, Pill, cx, tableClass, tdClass, thClass, trClass } from './ui';

const fmt = (n) => (n || 0).toLocaleString('es-CO');

// Tipo de página: lo manda el backend ('blog' / 'servicio'); si falta, se deduce de la URL
const isBlogVisit = (v) => {
    if (v.type === 'blog') return true;
    if (v.type === 'servicio') return false;
    const url = (v.last_page || '').toLowerCase();
    return url.includes('/blog') || url.includes('/articulo') || url.includes('/noticias');
};

const shortPath = (url) => {
    try {
        const u = new URL(url);
        return u.pathname === '/' ? u.host : u.pathname;
    } catch {
        return url || '/';
    }
};

const when = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
};

// Panel lateral con quién visitó un servicio (muestra de los visitantes más recientes)
export default function ServiceTrafficDrawer({ service, onClose }) {
    const visitors = service?.visitors || [];
    return (
        <Drawer open={!!service} onClose={onClose} title={service?.name || ''} width="max-w-4xl">
            {service && (
                <>
                    <div className="flex flex-wrap gap-2 px-6 pt-4">
                        <Pill tone="blue">{fmt(service.commercial)} comerciales</Pill>
                        <Pill tone="amber">{fmt(service.blog)} blog</Pill>
                        <Pill>{fmt(service.total)} visitas</Pill>
                    </div>
                    <p className="px-6 pt-3 m-0 text-[13px] text-slate-500">Visitantes más recientes de este servicio.</p>
                    {visitors.length === 0 ? (
                        <p className="px-6 py-10 text-center text-slate-500">No hay detalle de visitantes reciente para este servicio.</p>
                    ) : (
                        <div className="overflow-x-auto mt-3">
                            <table className={cx(tableClass, 'min-w-[720px]')}>
                                <thead>
                                    <tr>
                                        <th scope="col" className={thClass}>Visitante</th>
                                        <th scope="col" className={thClass}>Rol detectado</th>
                                        <th scope="col" className={thClass}>Página visitada</th>
                                        <th scope="col" className={thClass}>Ubicación</th>
                                        <th scope="col" className={thClass}>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visitors.map((v, i) => {
                                        const blog = isBlogVisit(v);
                                        const isVisitor = !v.role || v.role === 'visitante';
                                        return (
                                            <tr key={`${v.user_id}-${i}`} className={trClass}>
                                                <td className={cx(tdClass, 'font-mono text-slate-500')}>…{(v.user_id || '').slice(-6)}</td>
                                                <td className={tdClass}><Pill tone={isVisitor ? 'neutral' : 'violet'}>{v.role || 'Desconocido'}</Pill></td>
                                                <td className={tdClass}>
                                                    <div className="flex flex-col gap-1">
                                                        <span className={cx('text-xs font-semibold', blog ? 'text-amber-800' : 'text-blue-800')}>
                                                            {blog ? 'Artículo de blog' : 'Página comercial'}
                                                        </span>
                                                        {v.last_page ? (
                                                            <a href={v.last_page} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 truncate max-w-[300px] inline-block">
                                                                {shortPath(v.last_page)}
                                                            </a>
                                                        ) : <span className="text-slate-400">—</span>}
                                                    </div>
                                                </td>
                                                <td className={tdClass}>{[v.city, v.country].filter(Boolean).join(', ') || '—'}</td>
                                                <td className={cx(tdClass, 'whitespace-nowrap text-slate-500')}>{when(v.last_activity)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </Drawer>
    );
}
