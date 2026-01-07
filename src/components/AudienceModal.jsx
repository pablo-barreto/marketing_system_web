'use client';
import React, { useEffect, useState, useContext } from 'react';
import { API_BASE_URL } from '../app/config';
import { AuthContext } from '../context/AuthContext';
import FormattedDate from './FormattedDate';

const AudienceModal = ({ campaign, onClose }) => {
    const { basicAuthHeader } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudience = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaign.id}/audience`, {
                    headers: { 'Authorization': basicAuthHeader }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error("Error cargando audiencia", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAudience();
    }, [campaign, basicAuthHeader]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Audiencia Asignada</h3>
                        <p className="text-xs text-slate-500">Campaña: {campaign.service}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                        <div className="p-10 text-center text-slate-400">Cargando usuarios...</div>
                    ) : users.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                            <span className="text-4xl mb-2">👻</span>
                            <p>Aún no hay usuarios asignados a esta campaña.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase sticky top-0">
                                <tr>
                                    <th className="p-4 border-b border-slate-100">Usuario ID</th>
                                    <th className="p-4 border-b border-slate-100">Rol</th>
                                    <th className="p-4 border-b border-slate-100">País</th>
                                    <th className="p-4 border-b border-slate-100">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700">
                                {users.map((user, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-xs">{user.user_id}</td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">{user.country}</td>
                                        <td className="p-4 text-slate-400 text-xs">
                                            <FormattedDate dateString={user.assigned_at} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
                    <span className="text-xs text-slate-400 font-bold mr-4">Total: {users.length} usuarios</span>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudienceModal;