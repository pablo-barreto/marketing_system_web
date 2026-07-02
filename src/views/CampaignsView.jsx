// src/views/CampaignsView.jsx
import React, { useState, useRef, useContext } from 'react';
import Swal from 'sweetalert2';
import CampaignTable from '../components/CampaignTable';
import { campaignService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../app/config';

// --- MODAL: CAMPAÑA MANUAL ---
const ManualCampaignModal = ({ onClose, token, services = [] }) => {
    const [form, setForm] = useState({ title: '', body: '', redirect_url: '', whatsapp_number: '', service: '', platform: 'facebook', budget: 50000, end_date: '' });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef(null);

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !form.title.trim() || !form.body.trim() || !form.redirect_url.trim()) {
            Swal.fire('Campos incompletos', 'Completa todos los campos requeridos.', 'warning');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('title', form.title.trim());
            formData.append('body', form.body.trim());
            formData.append('redirect_url', form.redirect_url.trim());
            if (form.whatsapp_number.trim()) formData.append('whatsapp_number', form.whatsapp_number.trim());
            if (form.service) formData.append('service', form.service);
            formData.append('platform', form.platform);
            formData.append('budget', form.budget);
            if (form.end_date) formData.append('end_date', form.end_date);

            const res = await campaignService.createManualCampaign(formData, token);
            const platforms = res.created?.map(c => c.platform).join(', ') || 'plataformas';
            Swal.fire({ title: '¡Campaña Creada!', text: `Publicada en: ${platforms}`, icon: 'success' });
            onClose();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">✏️ Campaña Manual</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Contenido libre · CTA WhatsApp · URL de destino personalizada</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Imagen */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Imagen del anuncio <span className="text-red-400">*</span></label>
                        <div
                            className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors min-h-[140px] bg-slate-50"
                            onClick={() => fileRef.current?.click()}
                        >
                            {preview ? (
                                <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-contain py-2" />
                            ) : (
                                <>
                                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm text-slate-400">Haz clic para subir la imagen del anuncio</p>
                                    <p className="text-xs text-slate-300">JPG, PNG (Máx 5MB)</p>
                                </>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                        </div>
                        {file && <p className="text-xs text-slate-400 mt-1 truncate">{file.name}</p>}
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Título <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Webinar Gratuito — Cierre Tributario 2025"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            maxLength={150}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    </div>

                    {/* Copy */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Copy del anuncio <span className="text-red-400">*</span></label>
                        <textarea
                            rows={3}
                            placeholder="Texto principal que verá el usuario..."
                            value={form.body}
                            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                            maxLength={500}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        />
                        <p className="text-xs text-slate-400 text-right">{form.body.length}/500</p>
                    </div>

                    {/* Servicio asociado */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Servicio asociado</label>
                        <select
                            value={form.service}
                            onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                            <option value="">— Sin servicio (usar el título) —</option>
                            {services.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Opcional · Los leads y métricas de la campaña se atribuyen a este servicio.</p>
                    </div>

                    {/* URL + WhatsApp */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">URL de destino (clic en imagen) <span className="text-red-400">*</span></label>
                            <input
                                type="url"
                                placeholder="https://crconsultorescolombia.com/webinar"
                                value={form.redirect_url}
                                onChange={e => setForm(f => ({ ...f, redirect_url: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                            <p className="text-xs text-slate-400 mt-1">La imagen del anuncio lleva a esta URL.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Número WhatsApp CTA</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+</span>
                                <input
                                    type="text"
                                    placeholder="573144768061"
                                    value={form.whatsapp_number}
                                    onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value.replace(/\D/g, '') }))}
                                    maxLength={15}
                                    className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Opcional · Si no se indica usa el número por defecto.</p>
                        </div>
                    </div>

                    {/* Plataforma + Presupuesto */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plataforma</label>
                            <select
                                value={form.platform}
                                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                <option value="facebook">👤 Solo Meta (FB/IG)</option>
                                <option value="linkedin">💼 Solo LinkedIn</option>
                                <option value="all">✨ Ambas plataformas</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Presupuesto diario (COP)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                <input
                                    type="number"
                                    min={20000}
                                    step={5000}
                                    value={form.budget}
                                    onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                                    className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fecha límite */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Fecha límite <span className="text-slate-400 font-normal normal-case">(opcional)</span>
                        </label>
                        <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={form.end_date}
                            onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            {form.end_date
                                ? 'La campaña se pausará al llegar a esta fecha aunque no se agote el presupuesto.'
                                : 'Sin fecha: la campaña se pausa automáticamente al agotar el presupuesto.'}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Publicando...
                                </>
                            ) : '🚀 Publicar Campaña Manual'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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
    handleApprove,
    config
}) => {
    const { basicAuthHeader } = useContext(AuthContext);

    // Estados Locales
    const [showManualModal, setShowManualModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [budget, setBudget] = useState(config?.default_budget || 50000);
    const [previewImage, setPreviewImage] = useState(null);
    // True solo si el USUARIO cambió el selector a mano. Cuando la IA hace
    // setSelectedService NO se activa, así que la IA puede volver a detectar el
    // servicio en cada imagen nueva. Se reinicia al terminar cada publicación.
    const [serviceTouched, setServiceTouched] = useState(false);
    const fileInputRef = useRef(null);

    // --- FUNCIÓN 1: ANALIZAR Y DISPARAR CREACIÓN (VERSIÓN FINAL) ---
    const analyzeAndAutoCreate = async (file) => {
        setIsProcessing(true);
        setStatusMessage("🧠 Leyendo texto de la imagen...");

        // 🔥 Guardamos el servicio que el usuario tenía seleccionado ANTES de que la IA lo cambie
        const userSelectedService = selectedService;
        // Solo respetamos la selección si el USUARIO la tocó a mano. Antes se comparaba
        // contra availableServices[0], pero tras la 1ª publicación el selector quedaba en
        // el servicio detectado por la IA y el código lo confundía con elección manual,
        // ignorando la detección de las imágenes siguientes.
        const isDefaultSelection = !serviceTouched;

        try {
            const formData = new FormData();
            formData.append('image', file);

            // 1. ANÁLISIS IA
            const response = await fetch(`${API_BASE_URL}/api/v1/assets/analyze`, {
                method: 'POST',
                headers: { 'Authorization': basicAuthHeader },
                body: formData
            });

            let detectedService = "";
            let platformToUse = selectedPlatform;

            if (response.ok) {
                const result = await response.json();

                if (result.status === 'success' && result.data) {
                    const aiServiceName = result.data.service;

                    // Verificación final simple
                    if (availableServices.includes(aiServiceName)) {
                        detectedService = aiServiceName;

                        // 🔥 Solo actualizar UI si el usuario NO cambió manualmente el selector
                        if (isDefaultSelection) {
                            setSelectedService(aiServiceName);
                            setStatusMessage(`✅ Texto detectado: ${aiServiceName}`);
                        } else {
                            // El usuario ya eligió manualmente, respetamos su elección
                            detectedService = userSelectedService;
                            setStatusMessage(`✅ Usando servicio seleccionado: ${userSelectedService}`);
                        }
                    } else {
                        // Fallback: usar lo que el usuario eligió
                        detectedService = userSelectedService;
                    }
                }
            } else {
                // Si falla el análisis, usar lo que el usuario seleccionó
                detectedService = userSelectedService;
            }

            // 2. CREACIÓN AUTOMÁTICA
            setTimeout(() => {
                executeCreation(file, detectedService, platformToUse, budget);
            }, 800);

        } catch (error) {
            console.error("Error flujo automático:", error);
            Swal.fire('Error', 'Falló el análisis.', 'error');
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
        // Reiniciamos para que la próxima imagen vuelva a detectar servicio con la IA
        // (sin esto, el selector quedaba "pegado" en el último servicio).
        setServiceTouched(false);
        if (availableServices?.length) setSelectedService(availableServices[0]);
    };

    const handleManualUpload = () => {
        const file = fileInputRef.current?.files[0];
        if (file) executeCreation(file, selectedService, selectedPlatform, budget);
    };

    return (
        <div className="animate-fade-in-up space-y-8">

            {showManualModal && (
                <ManualCampaignModal
                    token={basicAuthHeader}
                    services={availableServices}
                    onClose={() => setShowManualModal(false)}
                />
            )}

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Icons.Image />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Nueva Campaña Automática</h3>
                            <p className="text-slate-500 text-sm">Solo sube la imagen. La IA hará todo el resto.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowManualModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Campaña Manual
                    </button>
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
                                    onChange={e => { setSelectedService(e.target.value); setServiceTouched(true); }}
                                    className={`w-full px-4 py-3 rounded-xl border transition-colors outline-none text-sm text-slate-700 ${isProcessing ? 'bg-slate-100' : 'bg-white border-slate-200'}`}
                                >
                                    {availableServices.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plataformas</label>
                                <select
                                    value={selectedPlatform}
                                    onChange={(e) => setSelectedPlatform(e.target.value)}
                                    disabled={isProcessing}
                                    className={`w-full px-4 py-3 rounded-xl border transition-colors outline-none text-sm text-slate-700 ${isProcessing ? 'bg-slate-100' : 'bg-white border-slate-200'}`}
                                >
                                    {/* 2. AGREGAMOS LAS OPCIONES REALES */}
                                    <option value="all">✨ Redes Sociales (Meta + LinkedIn)</option>
                                    <option value="google">🔍 Google Ads (Búsqueda)</option>
                                    <option value="facebook">👤 Solo Meta (FB/IG)</option>
                                    <option value="linkedin">💼 Solo LinkedIn</option>
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
                    <CampaignTable campaigns={campaigns} onApprove={handleApprove} config={config} />
                </div>
            </div>
        </div>
    );
};

export default CampaignsView;