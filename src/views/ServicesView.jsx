'use client';
import React, { useState, useEffect, useContext } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { servicesService } from '../services/api';

const ServicesView = () => {
    const { basicAuthHeader } = useContext(AuthContext);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newService, setNewService] = useState({ name: '', url: '', description: '', is_promoted: false });
    const [saving, setSaving] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await servicesService.list(basicAuthHeader);
            setServices(data);
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleToggle = async (name, field, currentValue) => {
        setSaving(`${name}_${field}`);
        try {
            if (field === 'is_promoted') {
                await servicesService.setPromoted(name, !currentValue, basicAuthHeader);
            } else {
                await servicesService.setActive(name, !currentValue, basicAuthHeader);
            }
            setServices(prev =>
                prev.map(s => s.name === name ? { ...s, [field]: !currentValue } : s)
            );
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    const handleDelete = async (name) => {
        const result = await Swal.fire({
            title: `¿Eliminar "${name}"?`,
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;

        try {
            await servicesService.remove(name, basicAuthHeader);
            setServices(prev => prev.filter(s => s.name !== name));
            Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1200, showConfirmButton: false });
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newService.name.trim()) return;
        setSaving('new');
        try {
            await servicesService.add(newService, basicAuthHeader);
            await load();
            setNewService({ name: '', url: '', description: '', is_promoted: false });
            setShowAddForm(false);
            Swal.fire({ title: 'Servicio agregado', icon: 'success', timer: 1200, showConfirmButton: false });
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    const promoted = services.filter(s => s.is_promoted);
    const rest = services.filter(s => !s.is_promoted);

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-slate-400 animate-pulse text-lg">
            Cargando servicios...
        </div>
    );

    return (
        <div className="space-y-8">

            {/* ENCABEZADO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Gestión de Servicios</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        {services.length} servicios · {promoted.length} promovidos · {services.filter(s => !s.is_active).length} deshabilitados
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
                >
                    {showAddForm ? 'Cancelar' : '+ Agregar Servicio'}
                </button>
            </div>

            {/* FORMULARIO AGREGAR */}
            {showAddForm && (
                <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="font-semibold text-slate-800">Nuevo Servicio</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={newService.name}
                                onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                                placeholder="Ej: Auditoría Interna"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">URL (opcional)</label>
                            <input
                                type="text"
                                value={newService.url}
                                onChange={e => setNewService(p => ({ ...p, url: e.target.value }))}
                                placeholder="https://crconsultorescolombia.com/..."
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Descripción (opcional)</label>
                            <input
                                type="text"
                                value={newService.description}
                                onChange={e => setNewService(p => ({ ...p, description: e.target.value }))}
                                placeholder="Breve descripción del servicio"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                        <input
                            type="checkbox"
                            checked={newService.is_promoted}
                            onChange={e => setNewService(p => ({ ...p, is_promoted: e.target.checked }))}
                            className="w-4 h-4 accent-yellow-500"
                        />
                        <span className="text-sm text-slate-600">Marcar como servicio principal</span>
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving === 'new'}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
                        >
                            {saving === 'new' ? 'Guardando...' : 'Agregar'}
                        </button>
                        <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all">
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* TABLA DE SERVICIOS PRINCIPALES */}
            {promoted.length > 0 && (
                <ServiceGroup
                    title="Servicios Principales"
                    badge={`${promoted.length}`}
                    badgeColor="bg-yellow-100 text-yellow-700"
                    services={promoted}
                    saving={saving}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                />
            )}

            {/* TABLA RESTO DE SERVICIOS */}
            {rest.length > 0 && (
                <ServiceGroup
                    title="Otros Servicios"
                    badge={`${rest.length}`}
                    badgeColor="bg-slate-100 text-slate-600"
                    services={rest}
                    saving={saving}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                />
            )}

            {services.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="font-medium">No hay servicios registrados.</p>
                    <p className="text-sm mt-1">Agrega uno manualmente o sincroniza desde el sitio web.</p>
                </div>
            )}
        </div>
    );
};

const ServiceGroup = ({ title, badge, badgeColor, services, saving, onToggle, onDelete }) => (
    <div>
        <div className="flex items-center gap-2 mb-3">
            <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{title}</h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-medium">Servicio</th>
                        <th className="text-center px-4 py-3 font-medium">Principal</th>
                        <th className="text-center px-4 py-3 font-medium">Habilitado</th>
                        <th className="text-right px-5 py-3 font-medium"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {services.map(s => (
                        <ServiceRow
                            key={s.name}
                            service={s}
                            saving={saving}
                            onToggle={onToggle}
                            onDelete={onDelete}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const ServiceRow = ({ service, saving, onToggle, onDelete }) => {
    const { name, url, is_promoted, is_active } = service;
    const isLoadingPromoted = saving === `${name}_is_promoted`;
    const isLoadingActive = saving === `${name}_is_active`;

    return (
        <tr className={`transition-colors hover:bg-slate-50 ${!is_active ? 'opacity-50' : ''}`}>
            <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                    {is_promoted && <span className="text-yellow-500 text-base">★</span>}
                    <div>
                        <p className="font-medium text-slate-800">{name}</p>
                        {url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:underline truncate max-w-xs block"
                            >
                                {url}
                            </a>
                        )}
                    </div>
                </div>
            </td>

            <td className="px-4 py-4 text-center">
                <Toggle
                    value={is_promoted}
                    loading={isLoadingPromoted}
                    onColor="bg-yellow-500"
                    onClick={() => onToggle(name, 'is_promoted', is_promoted)}
                />
            </td>

            <td className="px-4 py-4 text-center">
                <Toggle
                    value={is_active}
                    loading={isLoadingActive}
                    onColor="bg-emerald-500"
                    onClick={() => onToggle(name, 'is_active', is_active)}
                />
            </td>

            <td className="px-5 py-4 text-right">
                <button
                    onClick={() => onDelete(name)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                    title="Eliminar"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        </tr>
    );
};

const Toggle = ({ value, loading, onColor, onClick }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 ${value ? onColor : 'bg-slate-200'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

export default ServicesView;
