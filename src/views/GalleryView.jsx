'use client';
import React, { useEffect, useState, useContext, useRef } from 'react';
import Swal from 'sweetalert2';
import { campaignService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, URL_IMAGES } from '../app/config';
import FormattedDate from '../components/FormattedDate';

const GalleryView = ({ config }) => {
    const { basicAuthHeader } = useContext(AuthContext);
    const [creatives, setCreatives] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados de UI para la barra superior
    const [isProcessing, setIsProcessing] = useState(false);
    const [detectedService, setDetectedService] = useState("---"); // Estado visual
    const [fixedBudget] = useState(config?.default_budget || 50000); // Presupuesto fijo visual
    const fileInputRef = useRef(null);

    // Función para normalizar rutas de imágenes (Novedad para corregir fallos de carga)
    const normalizeImagePath = (path) => {
        if (!path) return '/static/images/default.jpg';
        if (path.startsWith('http')) return path;
        const filename = path.replace(/\\/g, '/').split('/').pop();
        return `${URL_IMAGES}/static/images/uploads/${filename}`;
    };

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

    // --- FLUJO 100% AUTOMÁTICO ---
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        setDetectedService("Analizando IA..."); // Feedback visual inmediato

        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

        try {
            // 1. ANÁLISIS IA
            const formData = new FormData();
            formData.append('image', file);

            const analyzeRes = await fetch(`${API_BASE_URL}/api/v1/assets/analyze`, {
                method: 'POST',
                headers: { 'Authorization': basicAuthHeader },
                body: formData
            });

            let serviceName = "General";
            if (analyzeRes.ok) {
                const result = await analyzeRes.json();
                if (result.data?.service) {
                    serviceName = result.data.service;
                }
            }

            // 2. ACTUALIZACIÓN VISUAL (El usuario ve el cambio aquí)
            setDetectedService(serviceName);
            Toast.fire({ icon: 'info', title: `Detectado: ${serviceName}. Creando...` });

            // 3. CREACIÓN INMEDIATA (Sin espera)
            const createForm = new FormData();
            createForm.append('image', file);
            createForm.append('service_name', serviceName);
            createForm.append('budget', fixedBudget);
            createForm.append('platform', 'all');

            await campaignService.uploadCreative(createForm, basicAuthHeader);

            Swal.fire({
                title: '¡Campaña Lanzada!',
                text: `Se creó exitosamente para: ${serviceName}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            loadImages(); // Refrescar galería

        } catch (error) {
            console.error(error);
            setDetectedService("Error");
            Swal.fire('Error', 'Falló el proceso automático.', 'error');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            try {
                await campaignService.deleteCreative(id, basicAuthHeader);
                setCreatives(prev => prev.filter(img => img.id !== id));
                Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1000, showConfirmButton: false });
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Cargando galería...</div>;

    return (
        <div className="animate-fade-in-up">
            {/* HEADER COMPACTO CON CONTROLES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">

                <div>
                    <h2 className="text-xl font-bold text-slate-800">Galería de Activos</h2>
                </div>

                {/* BARRA DE HERRAMIENTAS AUTOMÁTICA */}
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">

                    {/* Campo Visual: Servicio */}
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Servicio IA</span>
                        <input
                            type="text"
                            value={detectedService}
                            readOnly
                            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold py-1.5 px-2 rounded w-32 focus:outline-none cursor-default"
                        />
                    </div>

                    {/* Campo Visual: Presupuesto */}
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Presupuesto</span>
                        <input
                            type="text"
                            value={`$${fixedBudget.toLocaleString()}`}
                            readOnly
                            className="bg-slate-100 border border-transparent text-slate-500 text-xs font-medium py-1.5 px-2 rounded w-24 focus:outline-none cursor-not-allowed"
                        />
                    </div>

                    {/* Separador */}
                    <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

                    {/* Botón de Carga */}
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <button
                            onClick={() => !isProcessing && fileInputRef.current.click()}
                            disabled={isProcessing}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white text-xs shadow-md transition-all
                                ${isProcessing ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
                            `}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Procesando</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    <span>Nueva Automática</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* GRID DE IMÁGENES */}
            {creatives.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h3 className="text-slate-900 font-bold text-sm">Galería Vacía</h3>
                    <p className="text-slate-400 text-xs mt-1">Usa el botón superior para subir y activar campañas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {creatives.map((img) => (
                        <div key={img.id} className="group bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all relative">
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                <img
                                    src={normalizeImagePath(img.url)}
                                    alt={img.service}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Error' }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => handleDelete(img.id)} className="bg-white text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors shadow-lg" title="Eliminar">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-2.5">
                                <p className="font-bold text-slate-800 text-[11px] truncate" title={img.service}>{img.service}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5"><FormattedDate dateString={img.date} /></p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GalleryView;