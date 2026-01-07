'use client';
import React, { useEffect, useState, useContext } from 'react';
import Swal from 'sweetalert2';
import { campaignService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import FormattedDate from '../components/FormattedDate';

const GalleryView = () => {
    const { basicAuthHeader } = useContext(AuthContext);
    const [creatives, setCreatives] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadImages = async () => {
        setLoading(true);
        try {
            const data = await campaignService.getCreatives(basicAuthHeader);
            setCreatives(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadImages();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar imagen?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await campaignService.deleteCreative(id, basicAuthHeader);
                setCreatives(prev => prev.filter(img => img.id !== id));
                Swal.fire('Eliminado', 'La imagen ha sido borrada.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Cargando galería...</div>;

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Galería de Activos</h2>
                <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">
                    {creatives.length} Imágenes
                </span>
            </div>

            {creatives.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
                    No has subido ninguna imagen todavía.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {creatives.map((img) => (
                        <div key={img.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all relative">
                            
                            {/* Imagen */}
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                <img 
                                    src={img.url} 
                                    alt={img.service} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=Error+Carga'}}
                                />
                                {/* Overlay hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => handleDelete(img.id)}
                                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                        title="Eliminar"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <p className="font-bold text-slate-800 text-sm truncate" title={img.service}>
                                    {img.service}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    <FormattedDate dateString={img.date} />
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GalleryView;