'use client';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { servicesService } from '../services/api';
import { useApi, useRevalidate } from '../hooks/useApi';
import { PageBody, PageHeader } from '../components/shell/AppShell';
import {
    Button, Card, EmptyState, Field, Icon, SearchInput, Switch, Tabs, cx, inputClass,
    tableClass, tdClass, thClass, trClass,
} from '../components/ui';

const EMPTY = { name: '', url: '', description: '', is_promoted: false };

const shortUrl = (url) => {
    try {
        const u = new URL(url);
        return `${u.host.replace(/^www\./, '')}${u.pathname === '/' ? '' : u.pathname}`;
    } catch {
        return url;
    }
};

function AddServiceForm({ onCancel, onSaved }) {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            await servicesService.add({ ...form, name: form.name.trim() });
            onSaved();
        } catch (err) {
            Swal.fire('No se pudo agregar', err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card as="form" onSubmit={submit} aria-label="Nuevo servicio" className="p-5 flex flex-col gap-4">
            <h2 className="m-0 text-base font-bold">Nuevo servicio</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Field label="Nombre" required>
                    <input type="text" required value={form.name} onChange={set('name')} placeholder="Ej.: Auditoría interna" className={inputClass} />
                </Field>
                <Field label="URL" optional>
                    <input type="url" value={form.url} onChange={set('url')} placeholder="https://crconsultorescolombia.com/…" className={inputClass} />
                </Field>
                <Field label="Descripción" optional className="sm:col-span-2">
                    <input type="text" value={form.description} onChange={set('description')} placeholder="Breve descripción del servicio" className={inputClass} />
                </Field>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none self-start min-h-11">
                <input type="checkbox" checked={form.is_promoted} onChange={set('is_promoted')} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-slate-700">Marcar como servicio principal</span>
            </label>
            <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Guardando…' : 'Agregar servicio'}</Button>
                <Button onClick={onCancel}>Cancelar</Button>
            </div>
        </Card>
    );
}

export default function ServicesView() {
    const revalidate = useRevalidate();
    const { data, loading, refresh } = useApi('/api/v1/admin/services');
    const services = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    const [tab, setTab] = useState('all');
    const [query, setQuery] = useState('');
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState(null);

    const promotedCount = services.filter((s) => s.is_promoted).length;
    const disabledCount = services.filter((s) => !s.is_active).length;

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return services
            .filter((s) => (tab === 'promoted' ? s.is_promoted : tab === 'disabled' ? !s.is_active : true))
            .filter((s) => !q || s.name.toLowerCase().includes(q))
            .sort((a, b) => Number(b.is_promoted) - Number(a.is_promoted) || a.name.localeCompare(b.name, 'es'));
    }, [services, tab, query]);

    // El menú de las demás secciones (selector de servicios) sale del resumen: se refresca también
    const afterChange = () => {
        refresh();
        revalidate('/api/v1/dashboard/summary');
    };

    const toggle = async (service, field) => {
        const key = `${service.name}:${field}`;
        setSaving(key);
        try {
            if (field === 'is_promoted') await servicesService.setPromoted(service.name, !service.is_promoted);
            else await servicesService.setActive(service.name, !service.is_active);
            afterChange();
        } catch (e) {
            Swal.fire('No se pudo guardar', e.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    const remove = async (service) => {
        const ok = await Swal.fire({
            title: `Eliminar “${service.name}”`,
            text: 'Las piezas de la galería asociadas quedarán sin servicio. Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#B91C1C',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
        });
        if (!ok.isConfirmed) return;
        try {
            await servicesService.remove(service.name);
            afterChange();
        } catch (e) {
            Swal.fire('No se pudo eliminar', e.message, 'error');
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Configuración"
                title="Servicios"
                actions={!adding && <Button variant="primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Agregar servicio</Button>}
            />
            <PageBody>
                <p className="m-0 text-slate-600">
                    {services.length} servicios · {promotedCount} principales · {disabledCount} deshabilitados. Los <strong>principales</strong> tienen prioridad en campañas automáticas y SEO.
                </p>

                {adding && <AddServiceForm onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); afterChange(); }} />}

                <Card aria-labelledby="svc-title" className="overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 border-b border-slate-200">
                        <div className="flex items-center gap-5 self-stretch">
                            <h2 id="svc-title" className="m-0 py-4 text-base font-bold">Listado de servicios</h2>
                            <Tabs
                                label="Filtrar servicios"
                                tabs={[
                                    { value: 'all', label: `Todos (${services.length})` },
                                    { value: 'promoted', label: `Principales (${promotedCount})` },
                                    { value: 'disabled', label: `Deshabilitados (${disabledCount})` },
                                ]}
                                value={tab}
                                onChange={setTab}
                            />
                        </div>
                        <SearchInput value={query} onChange={setQuery} placeholder="Buscar servicio" className="w-full sm:w-64 my-2.5" />
                    </div>

                    {loading && !data ? (
                        <p className="m-0 px-5 py-10 text-center text-slate-500">Cargando servicios…</p>
                    ) : rows.length === 0 ? (
                        <EmptyState
                            title={services.length ? 'Ningún servicio coincide' : 'No hay servicios registrados'}
                            description={services.length ? 'Prueba con otra búsqueda o pestaña.' : 'Agrega uno o sincroniza desde el sitio web en SEO y contenido.'}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={cx(tableClass, 'min-w-[640px]')}>
                                <thead>
                                    <tr>
                                        <th scope="col" className={thClass}>Servicio</th>
                                        <th scope="col" className={cx(thClass, 'text-center')}>Principal</th>
                                        <th scope="col" className={cx(thClass, 'text-center')}>Habilitado</th>
                                        <th scope="col" className={cx(thClass, 'text-right')}><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((s) => (
                                        <tr key={s.name} className={cx(trClass, !s.is_active && 'text-slate-500')}>
                                            <th scope="row" className={cx(tdClass, 'text-left')}>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={cx('font-semibold', s.is_active ? 'text-slate-900' : 'text-slate-500')}>{s.name}</span>
                                                    {s.url && (
                                                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-blue-700 hover:text-blue-900 truncate max-w-[420px]">
                                                            {shortUrl(s.url)}
                                                        </a>
                                                    )}
                                                </div>
                                            </th>
                                            <td className={cx(tdClass, 'text-center')}>
                                                <Switch
                                                    checked={!!s.is_promoted}
                                                    onChange={() => toggle(s, 'is_promoted')}
                                                    disabled={saving === `${s.name}:is_promoted`}
                                                    label={`${s.name}: servicio principal`}
                                                />
                                            </td>
                                            <td className={cx(tdClass, 'text-center')}>
                                                <Switch
                                                    checked={!!s.is_active}
                                                    onChange={() => toggle(s, 'is_active')}
                                                    disabled={saving === `${s.name}:is_active`}
                                                    label={`${s.name}: habilitado`}
                                                />
                                            </td>
                                            <td className={cx(tdClass, 'text-right')}>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(s)}
                                                    aria-label={`Eliminar ${s.name}`}
                                                    className="w-10 h-10 inline-flex items-center justify-center rounded-lg border-0 bg-transparent text-slate-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                                >
                                                    <Icon name="trash" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </PageBody>
        </>
    );
}
