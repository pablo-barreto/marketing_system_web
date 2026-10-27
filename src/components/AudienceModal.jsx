'use client';
import { useApi } from '../hooks/useApi';
import FormattedDate from './FormattedDate';
import { Drawer, Pill, cx, tableClass, tdClass, thClass, trClass } from './ui';

// Usuarios del CRM asignados a una campaña (panel lateral)
const AudienceModal = ({ campaign, onClose }) => {
    const { data, loading, error } = useApi(`/api/v1/campaigns/${campaign.id}/audience`);
    const users = Array.isArray(data) ? data : [];

    return (
        <Drawer open onClose={onClose} title={`Audiencia · ${campaign.service}`} width="max-w-2xl">
            <p className="m-0 px-6 pt-4 text-[13px] text-slate-500">
                {loading ? 'Cargando usuarios…' : `${users.length.toLocaleString('es-CO')} usuarios asignados a esta campaña.`}
            </p>
            {error && <p className="m-0 px-6 pt-3 text-sm text-red-700">{error.message}</p>}
            {!loading && users.length === 0 && !error ? (
                <p className="m-0 px-6 py-10 text-center text-slate-500">Aún no hay usuarios asignados a esta campaña.</p>
            ) : (
                <div className="overflow-x-auto mt-3">
                    <table className={cx(tableClass, 'min-w-[520px]')}>
                        <thead>
                            <tr>
                                <th scope="col" className={thClass}>Usuario</th>
                                <th scope="col" className={thClass}>Rol</th>
                                <th scope="col" className={thClass}>País</th>
                                <th scope="col" className={thClass}>Asignado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => (
                                <tr key={`${u.user_id}-${i}`} className={trClass}>
                                    <td className={cx(tdClass, 'font-mono text-xs')}>…{(u.user_id || '').slice(-10)}</td>
                                    <td className={tdClass}><Pill tone="blue">{u.role || '—'}</Pill></td>
                                    <td className={tdClass}>{u.country || '—'}</td>
                                    <td className={cx(tdClass, 'text-slate-500')}><FormattedDate dateString={u.assigned_at} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Drawer>
    );
};

export default AudienceModal;
