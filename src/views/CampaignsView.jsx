// src/views/CampaignsView.jsx
import React, { useState, useRef, useContext } from 'react';
import Swal from 'sweetalert2';
import CampaignTable from '../components/CampaignTable';
import { campaignService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

// Iconos SVG
const Icons = {
    Image: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    Upload: () => <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
};

const CampaignsView = ({ 
    campaigns, 
    availableServices, 
    selectedService, 
    setSelectedService, 
    selectedPlatform, 
    setSelectedPlatform, 
    handleApprove 
}) => {
    const { basicAuthHeader } = useContext(AuthContext);
    
    // Estados Locales
    const [isUploading, setIsUploading] = useState(false);
    const [budget, setBudget] = useState(500000);
    const [previewImage, setPreviewImage] = useState(null);
    const fileInputRef = useRef(null);

    // --- MANEJO DE IMAGEN ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // --- SUBIDA DE IMAGEN ---
    const handleUploadCreative = async () => {
        const file = fileInputRef.current?.files[0];
        
        if (!file) {
            Swal.fire('Atención', 'Debes seleccionar una imagen para subir.', 'warning');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('service_name', selectedService);
            formData.append('budget', budget);
            formData.append('platform', selectedPlatform);

            await campaignService.uploadCreative(formData, basicAuthHeader);

            Swal.fire({
                title: '¡Campaña Creada!',
                text: 'La imagen se subió y el anuncio está activo.',
                icon: 'success',
                confirmButtonColor: '#10b981'
            });

            handleRemoveImage();
            
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="animate-fade-in-up space-y-8">
            
            {/* --- BLOQUE DE CREACIÓN DE CAMPAÑA VISUAL --- */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                
                {/* Header del Bloque */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Icons.Image />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Nueva Campaña Visual</h3>
                        <p className="text-slate-500 text-sm">Sube tu creativo y lanza el anuncio inmediatamente.</p>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* A. CONFIGURACIÓN (Izquierda) */}
                        <div className="lg:col-span-1 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Servicio a Promocionar</label>
                                <select 
                                    value={selectedService} 
                                    onChange={e => setSelectedService(e.target.value)} 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {availableServices.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plataforma Destino</label>
                                <select 
                                    value={selectedPlatform} 
                                    onChange={e => setSelectedPlatform(e.target.value)} 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="facebook">Facebook / Instagram</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="google">Google Ads</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Presupuesto (COP)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input 
                                        type="number" 
                                        value={budget} 
                                        onChange={e => setBudget(e.target.value)}
                                        className="w-full pl-7 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Presupuesto total para esta campaña.</p>
                            </div>
                        </div>

                        {/* B. ÁREA DE CARGA (Derecha) */}
                        <div className="lg:col-span-2">
                            <div className="h-full flex flex-col">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Creativo del Anuncio</label>
                                
                                {/* Input oculto siempre presente en el DOM */}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*"
                                />

                                {!previewImage ? (
                                    <div 
                                        onClick={triggerFileInput}
                                        className="flex-1 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center justify-center p-8 min-h-[300px]"
                                    >
                                        <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                                            <Icons.Upload />
                                        </div>
                                        <p className="text-slate-700 font-bold text-sm">Haz clic para subir tu imagen</p>
                                        <p className="text-slate-400 text-xs mt-1">JPG, PNG (Máx 5MB)</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black min-h-[300px] flex items-center justify-center group shadow-md">
                                        <img src={previewImage} alt="Preview" className="max-h-[350px] w-auto object-contain" />
                                        
                                        {/* Overlay de acciones */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                            <button 
                                                onClick={triggerFileInput} 
                                                className="px-5 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 shadow-lg"
                                            >
                                                Cambiar
                                            </button>
                                            <button 
                                                onClick={handleRemoveImage} 
                                                className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 shadow-lg"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Botón de Acción Principal */}
                                <div className="mt-6 flex justify-end">
                                    <button 
                                        onClick={handleUploadCreative}
                                        disabled={isUploading || !previewImage}
                                        className={`
                                            px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 
                                            transition-all transform active:scale-95 flex items-center gap-2
                                            ${isUploading || !previewImage ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {isUploading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span>Procesando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🚀 Publicar Anuncio</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABLA DE HISTORIAL --- */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Historial de Operaciones</h3>
                </div>
                <div className="p-0">
                    <CampaignTable campaigns={campaigns} onApprove={handleApprove} />
                </div>
            </div>
        </div>
    );
};

export default CampaignsView;