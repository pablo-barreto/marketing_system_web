// src/views/CampaignsView.jsx
import React, { useState, useRef, useContext } from 'react';
import Swal from 'sweetalert2';
import CampaignTable from '../components/CampaignTable';
import { campaignService } from '../services/api'; 
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../app/config'; 

// Iconos SVG
const Icons = {
    Image: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    Upload: () => <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
    Rocket: () => <svg className="w-5 h-5 text-blue-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [budget, setBudget] = useState(50000);
    const [previewImage, setPreviewImage] = useState(null);
    const fileInputRef = useRef(null);

    // --- FUNCIÓN 1: ANALIZAR Y DISPARAR CREACIÓN (AUTOMÁTICO) ---
    const analyzeAndAutoCreate = async (file) => {
        setIsProcessing(true);
        setStatusMessage("🧠 La IA está analizando tu imagen...");
        
        try {
            const formData = new FormData();
            formData.append('image', file);

            // 1. ANÁLISIS IA
            const response = await fetch(`${API_BASE_URL}/api/v1/assets/analyze`, {
                method: 'POST',
                headers: { 'Authorization': basicAuthHeader },
                body: formData
            });

            let detectedService = selectedService; // Fallback al actual
            let platformToUse = 'all';

            if (response.ok) {
                const result = await response.json();
                
                if (result.status === 'success' && result.data) {
                    const { service: aiServiceName } = result.data;
                    
                    // --- NORMALIZACIÓN ROBUSTA ---
                    const normalize = (text) => {
                        if (!text || typeof text !== 'string') return ""; 
                        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    };

                    const aiClean = normalize(String(aiServiceName || ""));

                    // ESTRATEGIA: Búsqueda flexible (contiene o está contenido)
                    const bestMatch = availableServices.find(s => {
                        const sClean = normalize(String(s || ""));
                        if (!aiClean || !sClean) return false;
                        return aiClean.includes(sClean) || sClean.includes(aiClean);
                    });

                    if (bestMatch) {
                        detectedService = bestMatch;
                        setSelectedService(bestMatch);
                        setSelectedPlatform('all');
                        setStatusMessage(`✅ Detectado: ${bestMatch}. Creando campañas...`);
                    } else {
                        console.warn("⚠️ No hubo coincidencia exacta. Usando default o fallback.");
                        // Si la IA devolvió algo pero no match, usamos el primero de la lista por seguridad
                        if (availableServices.length > 0) detectedService = availableServices[0];
                    }
                }
            }

            // 2. CREACIÓN AUTOMÁTICA INMEDIATA
            await executeCreation(file, detectedService, platformToUse, budget);

        } catch (error) {
            console.error("Error en flujo automático:", error);
            Swal.fire('Error', 'Falló el análisis automático.', 'error');
            setIsProcessing(false);
        }
    };

    // --- FUNCIÓN 2: EJECUTAR LA CREACIÓN EN BACKEND ---
    const executeCreation = async (file, serviceName, platformName, budgetAmount) => {
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('service_name', serviceName || "General"); 
            formData.append('budget', budgetAmount);
            formData.append('platform', platformName);

            await campaignService.uploadCreative(formData, basicAuthHeader);

            Swal.fire({
                title: '¡Proceso Completo!',
                html: `Se detectó <b>${serviceName}</b> y se crearon las campañas en <b>Meta y LinkedIn</b> automáticamente.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });

            handleRemoveImage();

        } catch (error) {
            console.error(error);
            Swal.fire('Error al crear campaña', error.message, 'error');
        } finally {
            setIsProcessing(false);
            setStatusMessage("");
        }
    };

    // --- MANEJO DE SELECCIÓN DE ARCHIVO ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);
            
            // Disparar automático
            analyzeAndAutoCreate(file);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleManualUpload = () => {
        const file = fileInputRef.current?.files[0];
        if (file) executeCreation(file, selectedService, selectedPlatform, budget);
    };

    return (
        <div className="animate-fade-in-up space-y-8">
            
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                
                <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Icons.Image />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Nueva Campaña Automática</h3>
                        <p className="text-slate-500 text-sm">Solo sube la imagen. La IA hará todo el resto.</p>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* A. CONFIGURACIÓN (Visual, se actualiza sola) */}
                        <div className="lg:col-span-1 space-y-5">
                            <div className="relative">
                                {/* Indicador de Estado Flotante */}
                                {isProcessing && (
                                    <div className="absolute -top-8 left-0 right-0 bg-indigo-600 text-white text-xs font-bold py-1 px-3 rounded-full flex items-center justify-center gap-2 animate-pulse shadow-lg z-20">
                                        <Icons.Rocket /> {statusMessage}
                                    </div>
                                )}
                                
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Servicio Detectado</label>
                                <select 
                                    value={selectedService} 
                                    disabled={isProcessing} 
                                    onChange={e => setSelectedService(e.target.value)} 
                                    className={`w-full px-4 py-3 rounded-xl border transition-colors outline-none text-sm text-slate-700 ${isProcessing ? 'bg-slate-100' : 'bg-white border-slate-200'}`}
                                >
                                    {availableServices.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plataformas</label>
                                <select 
                                    value={selectedPlatform} 
                                    disabled={true} 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm outline-none cursor-not-allowed"
                                >
                                    <option value="all">✨ Todas (Meta + LinkedIn)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Presupuesto Base</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input 
                                        type="number" 
                                        value={budget} 
                                        onChange={e => setBudget(e.target.value)}
                                        className="w-full pl-7 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* B. ÁREA DE CARGA */}
                        <div className="lg:col-span-2">
                            <div className="h-full flex flex-col">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cargar Imagen</label>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*"
                                />

                                {!previewImage ? (
                                    <div 
                                        onClick={!isProcessing ? triggerFileInput : undefined}
                                        className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 min-h-[300px] transition-all
                                            ${isProcessing ? 'border-slate-200 bg-slate-50 cursor-wait' : 'border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'}
                                        `}
                                    >
                                        <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                                            <Icons.Upload />
                                        </div>
                                        <p className="text-slate-700 font-bold text-sm">Haz clic para subir y procesar</p>
                                        <p className="text-slate-400 text-xs mt-1">JPG, PNG (Máx 5MB)</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black min-h-[300px] flex items-center justify-center group shadow-md">
                                        <img src={previewImage} alt="Preview" className={`max-h-[350px] w-auto object-contain transition-opacity duration-500 ${isProcessing ? 'opacity-50' : 'opacity-100'}`} />
                                        
                                        {/* Overlay de Procesamiento */}
                                        {isProcessing && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                                <div className="w-16 h-16 border-4 border-white border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                                <span className="text-white font-bold text-lg shadow-black drop-shadow-md">Procesando...</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Botón Manual */}
                                {previewImage && !isProcessing && (
                                    <div className="mt-4 flex justify-end">
                                        <button onClick={handleManualUpload} className="text-xs text-blue-500 underline">Reintentar Manualmente</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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