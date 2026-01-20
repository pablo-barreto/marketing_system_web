'use client';
import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import Swal from 'sweetalert2';
import AudienceModal from './AudienceModal';
import { URL_IMAGES, API_BASE_URL } from '../app/config';

// =============================================================================
// HELPER: NORMALIZADOR DE IMÁGENES (Soporta GCS y Local Windows/Linux)
// =============================================================================
const normalizeImagePath = (path) => {
    // 1. Si es nulo o vacío, devolver imagen por defecto
    if (!path) return '/static/images/default.jpg';
    
    // 2. Si es una URL de Google Cloud Storage (o cualquier nube), devolverla intacta
    // Tu URL ejemplo: "https://storage.googleapis.com/..." entra aquí y retorna directo.
    if (path.startsWith('http')) return path; 
    
    // 3. Si es local antigua, limpiar las barras invertidas de Windows (\)
    const filename = path.replace(/\\/g, '/').split('/').pop();
    
    // 4. Construir la URL final apuntando a tu servidor local
    return `${URL_IMAGES}/static/images/uploads/${filename}`;
};

// =============================================================================
// 1. SUB-COMPONENTES DE PREVISUALIZACIÓN
// =============================================================================

const FacebookPreview = ({ service, imageUrl }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden w-[320px] font-sans flex-shrink-0">
        <div className="p-3 flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] border border-slate-200">CR</div>
            <div>
                <div className="font-bold text-[13px] text-[#050505] leading-snug">CR Consultores</div>
                <div className="text-[10px] text-[#65676b] flex items-center gap-1">Publicidad · 🌎</div>
            </div>
        </div>
        <div className="bg-slate-100 relative h-[320px] border-t border-b border-gray-100">
             <img src={imageUrl} alt={service} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <div className="bg-[#f0f2f5] p-2 flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-2">
                <div className="text-[10px] text-[#65676b] uppercase truncate">crconsultores.com</div>
                <div className="text-[13px] font-bold text-[#050505] truncate">{service}</div>
            </div>
            <button className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-[12px] font-bold px-3 py-1.5 rounded border border-[#ced0d4] flex items-center gap-1.5 transition-colors">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" className="flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
            </button>
        </div>
    </div>
);

const InstagramPreview = ({ service, imageUrl }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-[320px] font-sans flex-shrink-0">
        <div className="p-3 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-800">CR</div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-900">cr_consultores</span>
                    <span className="text-[10px] text-slate-500">Publicidad</span>
                </div>
            </div>
            <div className="text-slate-900 text-xs">•••</div>
        </div>
        <div className="bg-slate-100 h-[320px] relative">
             <img src={imageUrl} alt={service} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <div className="bg-blue-50 px-3 py-2 flex justify-between items-center border-b border-blue-100">
            <span className="text-[12px] font-bold text-blue-900">Enviar mensaje de WhatsApp</span>
            <span className="text-blue-900 text-xs">›</span>
        </div>
    </div>
);

const GooglePreview = ({ content }) => {
  const title = (content.headlines && content.headlines) 
    ? content.headlines 
    : (content.title || "Servicio Profesional");
    
  const desc = (content.descriptions && content.descriptions) 
    ? content.descriptions 
    : "Asesoría experta y soluciones profesionales en Colombia. Contáctanos hoy.";

  return (
    <div className="bg-white p-4 rounded border border-slate-200 font-sans max-w-sm">
      <div className="flex items-center gap-1 mb-1">
        <span className="font-bold text-xs text-slate-800">Anuncio</span>
        <span className="text-xs text-slate-500">· www.crconsultorescolombia.com/servicios</span>
      </div>
      <div className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium leading-tight mb-1">
        {title}
      </div>
      <div className="text-sm text-[#4d5156] leading-snug">
        {desc}
      </div>
      <div className="mt-2 flex gap-2 text-xs text-[#1a0dab]">
        <span className="hover:underline cursor-pointer">Cotizar Ahora</span> · 
        <span className="hover:underline cursor-pointer">Ver Servicios</span>
      </div>
    </div>
  );
};

const LinkedInPreview = ({ content, service, imageUrl }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden w-[320px] mx-auto font-sans">
        <div className="p-3 flex gap-2 border-b border-gray-50">
            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 font-bold border border-slate-200 text-xs">CR</div>
            <div className="flex flex-col justify-center">
                <div className="font-bold text-[12px] text-slate-900">CR Consultores</div>
                <div className="text-[10px] text-slate-500">Promocionado</div>
            </div>
        </div>
        <div className="bg-slate-100 h-[200px]">
            <img src={imageUrl} alt={service} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }}/>
        </div>
        <div className="bg-[#f3f6f8] p-2 flex justify-between items-center px-3">
            <div className="text-[12px] font-bold text-slate-800 truncate pr-2">{content.title || service}</div>
            <button className="text-blue-700 border border-blue-700 rounded-full px-3 py-0.5 text-[10px] font-bold">Ver más</button>
        </div>
    </div>
);

// =============================================================================
// 2. MODAL PRINCIPAL
// =============================================================================

const CampaignPreviewModal = ({ campaign, onClose, onApprove, onToggleStatus, onUpdateBudget }) => {
    if (!campaign) return null;

    const handleEditBudgetInModal = async () => {
        const currentBudget = campaign.budget || 0;
        const { value: newBudget } = await Swal.fire({
            title: 'Editar Presupuesto Diario',
            text: `Actual: $${currentBudget.toLocaleString()}`,
            input: 'number',
            inputValue: currentBudget,
            inputLabel: 'Nuevo valor (COP)',
            inputPlaceholder: 'Ej: 50000',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Guardar',
            inputValidator: (value) => {
                if (!value || value < 20000) {
                    return 'El presupuesto mínimo recomendado es $40.000 COP';
                }
            }
        });

        if (newBudget && onUpdateBudget) {
            await onUpdateBudget(campaign, parseFloat(newBudget));
        }
    };

    const getContent = (c) => {
        if (!c) return {};
        if (typeof c === 'object') return c;
        try { return JSON.parse(c); } catch { return { body: c }; }
    };

    const content = getContent(campaign.content);
    
    // --- LÓGICA DE IMAGEN CORREGIDA ---
    // Usamos el helper normalizeImagePath para soportar URL de Google Cloud y locales
    const previewImage = normalizeImagePath(
        content.local_image_path || content.image || content.preview_image
    );
    // ----------------------------------
    
    const platform = (campaign.platform || '').toLowerCase();
    const isMeta = platform.includes('facebook') || platform.includes('instagram');
    const isSyncSupported = isMeta || platform.includes('linkedin');

    const renderPreview = () => {
        if (platform.includes('google')) return <GooglePreview content={content} />;
        if (platform.includes('linkedin')) return <LinkedInPreview content={content} service={campaign.service} imageUrl={previewImage} />;
        
        if (isMeta) {
            return (
                <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vista Facebook</span>
                        <FacebookPreview service={campaign.service} imageUrl={previewImage} content={{ title: content.title }} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">Vista Instagram</span>
                        <InstagramPreview service={campaign.service} imageUrl={previewImage} />
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh]">
                
                {/* IZQUIERDA: PREVIEW */}
                <div className="w-full md:w-[70%] bg-[#eef0f4] p-6 flex flex-col items-center justify-center border-r border-slate-200 overflow-y-auto relative custom-scrollbar">
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full shadow-sm font-bold uppercase tracking-wide flex items-center gap-2 z-10">
                        <span className={`w-2 h-2 rounded-full ${isMeta ? 'bg-indigo-600' : platform.includes('google') ? 'bg-orange-500' : 'bg-blue-700'}`}></span>
                        Vista Previa: {isMeta ? 'Meta (FB + IG)' : campaign.platform}
                    </div>
                    <div className="w-full flex justify-center py-4">
                        {renderPreview()}
                    </div>
                </div>

                {/* DERECHA: DATOS */}
                <div className="w-full md:w-[30%] p-6 flex flex-col h-full bg-white overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Revisión</h2>
                            <p className="text-slate-500 text-xs mt-1">ID: <span className="font-mono bg-slate-100 px-1 rounded">{campaign.id.substring(0,8)}</span></p>
                        </div>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase">Estado</span>
                            <StatusBadge status={campaign.status} />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Resumen</label>
                            <div className="space-y-2">
                                <div className="p-3 border border-slate-100 rounded-lg">
                                    <span className="block text-slate-400 text-[10px] mb-0.5">Servicio</span>
                                    <span className="font-bold text-slate-800 text-sm block leading-tight">{campaign.service}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 border border-slate-100 rounded-lg relative group">
                                        <span className="block text-slate-400 text-[10px]">Presupuesto</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 text-sm">${campaign.budget?.toLocaleString()}</span>
                                            {isSyncSupported && (
                                                <button onClick={handleEditBudgetInModal} className="p-1 text-slate-300 hover:text-blue-500 transition-colors rounded hover:bg-blue-50" title="Editar Presupuesto">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-2 border border-slate-100 rounded-lg">
                                        <span className="block text-slate-400 text-[10px]">ROI Est.</span>
                                        <span className="font-bold text-emerald-600 text-sm">
                                            {campaign.spend > 0 ? (((campaign.conversions * 15) - campaign.spend) / campaign.spend * 100).toFixed(0) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                        {campaign.status === 'pending_approval' && (
                            <button onClick={() => { onApprove(campaign.id, campaign.service); onClose(); }} className="w-full py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 shadow-md shadow-emerald-200 transition-all active:scale-[0.98]">Aprobar Campaña</button>
                        )}
                        {(campaign.status === 'ACTIVE' || campaign.status === 'LOW PERFORMANCE') && (
                            <button onClick={() => { onToggleStatus(campaign.id, 'ACTIVE'); onClose(); }} className="w-full py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 shadow-md shadow-amber-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">⏸️ Pausar Campaña</button>
                        )}
                        {campaign.status === 'PAUSED' && (
                            <button onClick={() => { onToggleStatus(campaign.id, 'PAUSED'); onClose(); }} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">▶️ Activar Campaña</button>
                        )}
                        <button onClick={onClose} className="w-full py-3 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// 3. COMPONENTE DE TABLA
// =============================================================================

const CampaignTable = ({ campaigns: initialCampaigns, onApprove }) => {
    const [localCampaigns, setLocalCampaigns] = useState(initialCampaigns || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCampaign, setSelectedCampaign] = useState(null); 
    const [selectedAudienceCampaign, setSelectedAudienceCampaign] = useState(null);

    const ESTIMATED_LEAD_VALUE = 15;

    useEffect(() => {
        if(initialCampaigns) setLocalCampaigns(initialCampaigns);
    }, [initialCampaigns]);

    const handlePageSizeChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };
    
    const getAuthToken = () => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; auth_token=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return null;
    };

    const updateLocalCampaignData = (campaignId, newData) => {
        setLocalCampaigns(prev => prev.map(c => 
            c.id === campaignId ? { ...c, ...newData } : c
        ));
    };

    const handleEditBudget = async (campaign, currentBudget) => {
        const { value: newBudget } = await Swal.fire({
            title: 'Editar Presupuesto Diario',
            text: `Actual: $${currentBudget.toLocaleString()}`,
            input: 'number',
            inputValue: currentBudget,
            inputLabel: 'Nuevo valor (COP)',
            inputPlaceholder: 'Ej: 50000',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Guardar',
            inputValidator: (value) => {
                if (!value || value < 20000) {
                    return 'El presupuesto mínimo recomendado es $40.000 COP';
                }
            }
        });

        if (newBudget) {
            Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading() });
            try {
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaign.id}/budget`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token },
                    body: JSON.stringify({ budget: newBudget })
                });
                const data = await response.json();
                if (response.ok) {
                    const confirmedBudget = data.new_budget ? parseFloat(data.new_budget) : parseFloat(newBudget);
                    updateLocalCampaignData(campaign.id, { budget: confirmedBudget });
                    Swal.fire({ title: '¡Actualizado!', text: `Nuevo presupuesto: $${confirmedBudget.toLocaleString()}`, icon: 'success', timer: 2000 });
                } else {
                    throw new Error(data.error || 'Error al actualizar en plataforma');
                }
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    useEffect(() => {
        const checkVisibleCampaigns = async () => {
            const campaignsToCheck = currentItems.filter(c => 
                c.platform && (c.platform.toLowerCase().includes('facebook') || c.platform.toLowerCase().includes('instagram') || c.platform.toLowerCase().includes('linkedin'))
            );
            if (campaignsToCheck.length === 0) return;
            const token = getAuthToken();
            if (!token) return; 

            campaignsToCheck.forEach(async (campaign) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaign.id}/real-status`, {
                        headers: { 'Authorization': token }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const updates = {};
                        let hasChanges = false;
                        if (data.status && data.status !== campaign.status) {
                            updates.status = data.status;
                            hasChanges = true;
                        }
                        if (data.budget && Math.abs(data.budget - campaign.budget) > 1) {
                            updates.budget = data.budget;
                            hasChanges = true;
                        }
                        if (hasChanges) updateLocalCampaignData(campaign.id, updates);
                    }
                } catch (e) { console.error("Auto-check failed", e); }
            });
        };
        checkVisibleCampaigns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm, statusFilter]);

    const handleVerifyMetaStatus = async (campaignId) => {
        // Mostrar cargando
        Swal.fire({ 
            title: 'Verificando...', 
            text: 'Sincronizando estado y presupuesto...', 
            didOpen: () => { Swal.showLoading(); } 
        });

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/real-status`, { 
                headers: { 'Authorization': token } 
            });
            const data = await response.json();

            if (response.ok) {
                // 1. Actualizar tabla local
                updateLocalCampaignData(campaignId, { 
                    status: data.status, 
                    budget: data.budget 
                });

                // 2. ¿Hay error? (WITH_ISSUES es el código de Meta para "Activo no válido")
                const isError = data.status === 'WITH_ISSUES' || 
                                data.status === 'DISAPPROVED' || 
                                data.status === 'REJECTED' ||
                                data.status === 'ERROR';

                // 3. Construir mensaje de error visual
                let errorHtml = '';
                if (data.reason) {
                    errorHtml = `
                        <div style="margin-top: 15px; padding: 10px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; text-align: left;">
                            <p style="color: #991b1b; font-weight: bold; font-size: 12px; margin-bottom: 4px; text-transform: uppercase;">⚠️ Diagnóstico Detectado:</p>
                            <p style="color: #b91c1c; font-size: 14px; margin: 0;">${data.reason}</p>
                        </div>
                    `;
                }

                // 4. Mostrar Alerta Final
                Swal.fire({
                    title: isError ? 'Atención Requerida' : 'Sincronizado',
                    html: `
                        <div class="text-sm">
                            <p><strong>Estado:</strong> ${data.label || data.status}</p>
                            <p><strong>Presupuesto:</strong> $${data.budget?.toLocaleString()}</p>
                            ${errorHtml}
                        </div>
                    `,
                    icon: isError ? 'error' : 'success',
                    // Si es error, dejamos la alerta abierta para que la leas
                    timer: isError ? null : 1500, 
                    showConfirmButton: isError,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#ef4444'
                });

            } else {
                throw new Error(data.error || 'Error API');
            }
        } catch (error) {
            Swal.fire({ title: 'Error', text: error.message, icon: 'warning' });
        }
    };

    const handleToggleStatus = async (campaignId, currentStatus) => {
        const isPaused = currentStatus === 'PAUSED';
        const actionVerb = isPaused ? 'Activar' : 'Pausar';
        const targetStatus = isPaused ? 'ACTIVE' : 'PAUSED';
        const confirmColor = isPaused ? '#10b981' : '#f59e0b';

        Swal.fire({
            title: `¿${actionVerb} Campaña?`,
            text: `Se cambiará el estado en la plataforma.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            confirmButtonText: `Sí, ${actionVerb}`
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = getAuthToken();
                    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': token },
                        body: JSON.stringify({ status: targetStatus })
                    });
                    if (response.ok) {
                        updateLocalCampaignData(campaignId, { status: targetStatus }); 
                        Swal.fire({ title: '¡Listo!', text: `Campaña ${targetStatus === 'ACTIVE' ? 'activada' : 'pausada'}.`, icon: 'success', timer: 1500, showConfirmButton: false });
                    } else {
                        throw new Error('Error servidor');
                    }
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    };

    const renderPlatformBadge = (platform) => {
        const p = (platform || '').toLowerCase();
        if (p.includes('google')) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border bg-orange-50 text-orange-700 border-orange-100">G Google Ads</span>;
        if (p.includes('linkedin')) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border bg-sky-50 text-sky-700 border-sky-100">in LinkedIn</span>;
        return (
            <div className="flex items-center gap-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-100">Facebook</span>
                <span className="text-slate-300 text-[10px]">/</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-pink-50 text-pink-700 border-pink-100">Instagram</span>
            </div>
        );
    };

    const handleConfirmApprove = (campaignId, serviceName) => {
        Swal.fire({
            title: '¿Aprobar Campaña?',
            html: `<div class="text-slate-600 text-sm">Vas a activar la inversión real para:<br/><strong class="text-slate-900 text-lg">${serviceName}</strong></div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Sí, Activar'
        }).then((result) => {
            if (result.isConfirmed) {
                onApprove(campaignId);
                updateLocalCampaignData(campaignId, { status: 'ACTIVE' });
            }
        });
    };

    const filteredCampaigns = localCampaigns.filter((campaign) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (campaign.service || '').toLowerCase().includes(search) || (campaign.platform || '').toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
    const currentItems = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const MobileCard = ({ c }) => {
        const budget = c.budget || 0;
        const spend = c.spend || 0;
        const spendPercent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
        const conversions = c.conversions || 0;
        const roi = spend > 0 ? (((conversions * ESTIMATED_LEAD_VALUE) - spend) / spend) * 100 : 0;

        return (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{c.service}</h4>
                        {renderPlatformBadge(c.platform)}
                    </div>
                    <StatusBadge status={c.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 p-2 rounded">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Gasto</div>
                        <div className="text-sm font-semibold text-slate-700">${spend.toFixed(0)} <span className="text-slate-400 text-xs">/ ${budget}</span></div>
                        <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5">
                            <div style={{ width: `${spendPercent}%` }} className={`h-full rounded-full ${spendPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">ROI & Leads</div>
                        <div className={`text-sm font-bold ${roi > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {roi > 0 ? '+' : ''}{roi.toFixed(0)}% <span className="text-slate-400 font-normal">({conversions})</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setSelectedCampaign(c)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors">👁️ Ver</button>
                    {c.status === 'ACTIVE' && <button onClick={() => handleToggleStatus(c.id, c.status)} className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold py-2.5 rounded-lg">⏸️ Pausar</button>}
                    {c.status === 'PAUSED' && <button onClick={() => handleToggleStatus(c.id, c.status)} className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold py-2.5 rounded-lg">▶️ Activar</button>}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            {selectedCampaign && <CampaignPreviewModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} onApprove={handleConfirmApprove} onToggleStatus={handleToggleStatus} onUpdateBudget={handleEditBudget} />}
            {selectedAudienceCampaign && <AudienceModal campaign={selectedAudienceCampaign} onClose={() => setSelectedAudienceCampaign(null)} />}

            <div className="p-4 md:p-5 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-auto">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input type="text" placeholder="Buscar campaña..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 pr-4 py-2.5 w-full md:w-64 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full md:w-auto px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="pending_approval">Pendientes</option>
                    </select>
                </div>
            </div>

            <div className="md:hidden p-4 bg-slate-50">
                {currentItems.length > 0 ? currentItems.map(c => <MobileCard key={c.id} c={c} />) : <div className="text-center text-slate-400 py-10">No hay resultados.</div>}
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Servicio', 'Plataforma', 'Estado', 'Gasto / Presupuesto', 'Rendimiento', 'Acción'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {currentItems.map((c) => {
                            const budget = c.budget || 0;
                            const spend = c.spend || 0;
                            const spendPercent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
                            const conversions = c.conversions || 0;
                            const roi = spend > 0 ? (((conversions * ESTIMATED_LEAD_VALUE) - spend) / spend) * 100 : 0;
                            const isSyncSupported = c.platform && (c.platform.toLowerCase().includes('facebook') || c.platform.toLowerCase().includes('instagram') || c.platform.toLowerCase().includes('linkedin'));

                            return (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">{c.service}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {c.id.substring(0,6)}...</div>
                                    </td>
                                    <td className="px-6 py-4">{renderPlatformBadge(c.platform)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={c.status} />
                                            {isSyncSupported && (
                                                <button onClick={() => handleVerifyMetaStatus(c.id)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50" title="Sincronizar ahora">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-700">${spend.toFixed(0)} <span className="text-slate-400 font-normal">/ ${budget.toLocaleString()}</span></span>
                                                {isSyncSupported && <button onClick={() => handleEditBudget(c, budget)} className="text-slate-300 hover:text-blue-500 transition-colors" title="Editar Presupuesto">✏️</button>}
                                            </div>
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div style={{ width: `${spendPercent}%` }} className={`h-full ${spendPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-sm font-bold ${roi > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>{roi > 0 ? '+' : ''}{roi.toFixed(0)}% ROI</div>
                                        <div className="text-xs text-slate-500">{conversions} leads</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setSelectedCampaign(c)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Ver Anuncio Real">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                            <button onClick={() => setSelectedAudienceCampaign(c)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100" title="Ver Audiencia Asignada">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            </button>
                                            {c.status === 'pending_approval' ? (
                                                <button onClick={() => handleConfirmApprove(c.id, c.service)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm active:scale-95 transition-all">APROBAR</button>
                                            ) : (c.status === 'ACTIVE' || c.status === 'LOW PERFORMANCE') ? (
                                                <button onClick={() => handleToggleStatus(c.id, 'ACTIVE')} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Pausar Campaña">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </button>
                                            ) : (c.status === 'PAUSED') ? (
                                                <button onClick={() => handleToggleStatus(c.id, 'PAUSED')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Reactivar Campaña">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </button>
                                            ) : (
                                                <span className="text-slate-300 px-3 cursor-not-allowed" title="Gestionado automáticamente">🔒</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {filteredCampaigns.length > 0 && (
                <div className="bg-white px-4 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>Filas:</span>
                        <select value={itemsPerPage} onChange={handlePageSizeChange} className="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-blue-500 focus:border-blue-500 p-1 cursor-pointer outline-none">
                            <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                        </select>
                    </div>
                    <div className="text-xs text-slate-500">{currentPage} de {totalPages} pág</div>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Anterior</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Siguiente</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignTable;