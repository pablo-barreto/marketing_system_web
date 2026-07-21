'use client';
import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import Swal from 'sweetalert2';
import AudienceModal from './AudienceModal';
import { URL_IMAGES, API_BASE_URL } from '../app/config';
import { campaignService, launchService } from '../services/api';

// =============================================================================
// HELPER: NORMALIZADOR DE IMÁGENES (Soporta GCS y Local Windows/Linux)
// =============================================================================
const normalizeImagePath = (path) => {
    // 1. Fallback inmediato si es nulo
    if (!path) return '/static/images/default.jpg'; // [cite: 100]

    // 2. Si ya es una URL absoluta, se devuelve intacta
    if (path.startsWith('http')) return path; // [cite: 101]

    // 3. Limpieza profunda para rutas locales heredadas (Legacy)
    // Se reemplazan backslashes de Windows y se extrae solo el nombre del archivo
    const filename = path.replace(/\\/g, '/').split('/').pop(); // [cite: 102]

    // 4. Se construye la URL apuntando al bucket oficial de producción
    return `https://storage.googleapis.com/marketing-system-assets-prod/uploads/${filename}`; // [cite: 103]
};

// =============================================================================
// 1. SUB-COMPONENTES DE PREVISUALIZACIÓN
// =============================================================================

const FacebookPreview = ({ service, imageUrl, domain }) => (
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
                {/* Anuncio solo imagen: sin titular ni texto. Meta muestra el dominio del enlace + el CTA. */}
                <div className="text-[10px] text-[#65676b] uppercase truncate">{domain || 'crconsultores.com'}</div>
            </div>
            <button className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-[12px] font-bold px-3 py-1.5 rounded border border-[#ced0d4] flex items-center gap-1.5 transition-colors">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" className="flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
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


const LinkedInPreview = ({ content, service, imageUrl, domain }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden w-[320px] mx-auto font-sans">

        {/* ENCABEZADO */}
        <div className="p-3 flex gap-2">
            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 font-bold border border-slate-200 text-xs">CR</div>
            <div className="flex flex-col justify-center">
                <div className="font-bold text-[12px] text-slate-900">CR Consultores</div>
                <div className="text-[10px] text-slate-500">Promocionado</div>
            </div>
        </div>

        {/* IMAGEN */}
        <div className="bg-slate-100 h-[200px]">
            <img src={imageUrl} alt={service} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        {/* PIE DE ANUNCIO (CTA) — Anuncio solo imagen: sin titular. El enlace de
            WhatsApp va en el texto del post (commentary); el destino es el dominio. */}
        <div className="bg-[#f3f6f8] p-2 flex justify-between items-center px-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 truncate pr-2">{domain || 'crconsultorescolombia.com'}</div>
            <button className="text-blue-700 border border-blue-700 rounded-full px-3 py-0.5 text-[10px] font-bold">Ver más</button>
        </div>
    </div>
);

// =============================================================================
// 2. MODAL PRINCIPAL
// =============================================================================

const CampaignPreviewModal = ({ campaign, onClose, onApprove, onToggleStatus, onUpdateBudget, onUpdateEndDate, onUpdateBid }) => {
    if (!campaign) return null;

    const [bidInfo, setBidInfo] = useState(null);
    const [bidLoading, setBidLoading] = useState(true);

    useEffect(() => {
        const fetchBid = async () => {
            setBidLoading(true);
            try {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; auth_token=`);
                const token = parts.length === 2 ? decodeURIComponent(parts.pop().split(';').shift()) : null;
                const resp = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaign.id}/bid`, {
                    headers: { 'Authorization': token }
                });
                if (resp.ok) setBidInfo(await resp.json());
            } catch {
                // fallo silencioso
            } finally {
                setBidLoading(false);
            }
        };
        fetchBid();
    }, [campaign.id]);

    const handleEditBidInModal = async () => {
        const isLinkedIn = platform.includes('linkedin');
        const minBid = isLinkedIn ? 4000 : 1000;
        const currentVal = bidInfo?.amount || '';
        const currentLabel = currentVal ? `Actual: $${currentVal.toLocaleString()} COP` : (bidInfo?.strategy ? `Actual: Automática (${bidInfo.strategy})` : '');

        const { value: newBid } = await Swal.fire({
            title: isLinkedIn ? 'Editar Puja CPC (LinkedIn)' : 'Editar Bid Cap (Meta)',
            text: currentLabel,
            input: 'number',
            inputLabel: `Nueva puja (COP) — mínimo $${minBid.toLocaleString()}`,
            inputValue: currentVal,
            inputPlaceholder: isLinkedIn ? 'Ej: 4500' : 'Ej: 2000',
            showCancelButton: true,
            confirmButtonColor: isLinkedIn ? '#0077b5' : '#1877f2',
            confirmButtonText: 'Guardar',
            inputValidator: (value) => {
                if (!value || value < minBid) {
                    return `La puja mínima es $${minBid.toLocaleString()} COP`;
                }
            }
        });
        if (newBid && onUpdateBid) {
            await onUpdateBid(campaign, parseFloat(newBid));
        }
    };

    const handleEditEndDateInModal = async () => {
        const currentVal = campaign.end_date ? campaign.end_date.split('T')[0] : '';
        const { value: newDate, isDismissed } = await Swal.fire({
            title: 'Fecha límite de la campaña',
            input: 'date',
            inputValue: currentVal,
            inputLabel: 'Dejar vacío para quitar la fecha límite',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
        });
        if (!isDismissed && onUpdateEndDate) {
            await onUpdateEndDate(campaign, newDate || null);
        }
    };

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

    // --- DESTINO REAL (sin datos quemados) ---
    // Usamos el enlace y el WhatsApp con que se creó el anuncio. Si la campaña es de
    // WhatsApp y no tiene redirect, el destino es wa.me con el número real.
    const waNumber = (content.whatsapp_number || '').toString().replace(/\D/g, '');
    const destinationLink = content.redirect_url || content.link || (waNumber ? `https://wa.me/${waNumber}` : '');
    let displayDomain = '';
    try {
        displayDomain = destinationLink ? new URL(destinationLink).hostname.replace(/^www\./, '') : '';
    } catch {
        displayDomain = destinationLink;
    }
    // ------------------------------------------

    const platform = (campaign.platform || '').toLowerCase();
    const isMeta = platform.includes('facebook') || platform.includes('instagram');
    const isSyncSupported = isMeta || platform.includes('linkedin');

    const renderPreview = () => {
        if (platform.includes('linkedin')) return <LinkedInPreview content={content} service={campaign.service} imageUrl={previewImage} domain={displayDomain} />;

        if (isMeta) {
            return (
                <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vista Facebook</span>
                        <FacebookPreview service={campaign.service} imageUrl={previewImage} domain={displayDomain} />
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
                            <p className="text-slate-500 text-xs mt-1">ID: <span className="font-mono bg-slate-100 px-1 rounded">{campaign.id.substring(0, 8)}</span></p>
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
                                <div className="p-2 border border-slate-100 rounded-lg">
                                    <span className="block text-slate-400 text-[10px]">Fecha límite</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">
                                            {campaign.end_date
                                                ? new Date(campaign.end_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : <span className="text-slate-400 font-normal">Sin fecha</span>}
                                        </span>
                                        {isSyncSupported && (
                                            <button onClick={handleEditEndDateInModal} className="p-1 text-slate-300 hover:text-blue-500 transition-colors rounded hover:bg-blue-50" title="Editar Fecha Límite">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isSyncSupported && (
                                    <div className="p-2 border border-slate-100 rounded-lg">
                                        <span className="block text-slate-400 text-[10px]">Puja</span>
                                        <div className="flex items-center gap-2">
                                            {bidLoading ? (
                                                <span className="text-slate-400 text-xs animate-pulse">Cargando...</span>
                                            ) : bidInfo?.amount ? (
                                                <span className="font-bold text-slate-800 text-sm">${bidInfo.amount.toLocaleString()} COP</span>
                                            ) : bidInfo?.strategy ? (
                                                <span className="font-bold text-emerald-600 text-xs">Auto ({bidInfo.strategy.replace('LOWEST_COST_', '').replace('_', ' ')})</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">No disponible</span>
                                            )}
                                            <button onClick={handleEditBidInModal} className="p-1 text-slate-300 hover:text-blue-500 transition-colors rounded hover:bg-blue-50" title="Editar Puja">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                        {bidInfo?.strategy && !bidInfo?.amount && isMeta && (
                                            <span className="text-[9px] text-slate-400">Editar activa puja manual (bid cap)</span>
                                        )}
                                    </div>
                                )}
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
const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0, // Sin decimales
        maximumFractionDigits: 0
    }).format(amount || 0);
};

// Fecha de publicación (created_at) en formato legible es-CO. Devuelve '—' si no hay dato.
const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CampaignTable = ({ campaigns: initialCampaigns, onApprove, config }) => {
    const [localCampaigns, setLocalCampaigns] = useState(initialCampaigns || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // --- ESTADOS DE FILTRO MEJORADOS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [platformFilter, setPlatformFilter] = useState('all'); // Nuevo
    const [sortConfig, setSortConfig] = useState('newest');      // Nuevo (Presupuesto)

    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedAudienceCampaign, setSelectedAudienceCampaign] = useState(null);

    useEffect(() => {
        if (initialCampaigns) setLocalCampaigns(initialCampaigns);
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
                const minBudget = config?.min_daily_budget || 20000;

                if (!value || value < minBudget) {
                    return `El presupuesto mínimo recomendado es $${minBudget.toLocaleString()} COP`;
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

    const handleDirectBudgetUpdate = async (campaign, newBudget) => {
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
                const confirmed = data.new_budget ? parseFloat(data.new_budget) : parseFloat(newBudget);
                updateLocalCampaignData(campaign.id, { budget: confirmed });
                Swal.fire({ title: '¡Actualizado!', text: `Nuevo presupuesto: $${confirmed.toLocaleString()}`, icon: 'success', timer: 2000 });
            } else {
                throw new Error(data.error || 'Error al actualizar en plataforma');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDirectBidUpdate = async (campaign, newBid) => {
        Swal.fire({ title: 'Actualizando puja...', didOpen: () => Swal.showLoading() });
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaign.id}/bid`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ bid: newBid })
            });
            const data = await response.json();
            if (response.ok) {
                Swal.fire({ title: '¡Puja actualizada!', text: `Nueva puja CPC: $${parseFloat(newBid).toLocaleString()} COP`, icon: 'success', timer: 2000 });
            } else {
                throw new Error(data.error || 'Error al actualizar la puja');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDirectEndDateUpdate = async (campaign, newEndDate) => {
        Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading() });
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaign.id}/end-date`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ end_date: newEndDate })
            });
            const data = await response.json();
            if (response.ok) {
                updateLocalCampaignData(campaign.id, { end_date: newEndDate });
                const label = newEndDate
                    ? `Fecha límite: ${new Date(newEndDate).toLocaleDateString('es-CO')}`
                    : 'Fecha límite eliminada';
                Swal.fire({ title: '¡Actualizado!', text: label, icon: 'success', timer: 2000 });
            } else {
                throw new Error(data.error || 'Error al actualizar');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
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
    }, [currentPage, searchTerm, statusFilter, platformFilter, sortConfig]);

    // --- FUNCIÓN DE VERIFICACIÓN CON MANEJO DE ERRORES ---
    const handleVerifyMetaStatus = async (campaignId) => {
        Swal.fire({
            title: 'Sincronizando...',
            text: 'Obteniendo costos y estado en tiempo real...',
            didOpen: () => { Swal.showLoading(); }
        });
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/real-status`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();

            if (response.ok) {
                // AQUÍ ESTÁ LA MAGIA: Actualizamos también spend y conversions
                updateLocalCampaignData(campaignId, {
                    status: data.status,
                    budget: data.budget,
                    spend: data.spend,           // <--- Nuevo
                    conversions: data.conversions // <--- Nuevo
                });

                const isError = ['WITH_ISSUES', 'DISAPPROVED', 'REJECTED'].includes(data.status);

                Swal.fire({
                    title: 'Datos Actualizados',
                    html: `
                        <div class="text-sm text-left">
                            <p><strong>Estado:</strong> ${data.label || data.status}</p>
                            ${isError && data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
                            <p><strong>Gasto Real:</strong> $${data.spend?.toLocaleString()}</p>
                            <p><strong>Leads/Conv:</strong> ${data.conversions}</p>
                        </div>
                    `,
                    icon: isError ? 'warning' : 'success',
                    timer: isError ? undefined : 2000,
                    showConfirmButton: isError
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

    const handleResetMetrics = async (campaignId, serviceName) => {
        const result = await Swal.fire({
            title: '¿Resetear contadores?',
            html: `<div class="text-sm">Se pondrá en cero el gasto y leads de:<br/><b>${serviceName}</b>.<br/><br/><i class="text-slate-400">Nota: Esto solo afecta el panel local, no a Meta/LinkedIn.</i></div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', // Rojo
            confirmButtonText: 'Sí, resetear',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const token = getAuthToken();
                await campaignService.resetMetrics(campaignId, token);

                // Actualizamos la UI localmente sin recargar toda la página 
                updateLocalCampaignData(campaignId, {
                    spend: 0,
                    impressions: 0,
                    clicks: 0,
                    conversions: 0
                });

                Swal.fire({
                    title: 'Reseteado',
                    text: 'Los datos locales han vuelto a cero.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleEditTargeting = async (campaign) => {
        const COUNTRIES = [
            { code: 'CO', label: 'Colombia' },
            { code: 'MX', label: 'México' },
            { code: 'PE', label: 'Perú' },
            { code: 'CL', label: 'Chile' },
            { code: 'EC', label: 'Ecuador' },
            { code: 'AR', label: 'Argentina' },
            { code: 'PA', label: 'Panamá' },
            { code: 'ES', label: 'España' },
            { code: 'US', label: 'EE.UU.' },
        ];

        const checkboxesHtml = COUNTRIES.map(({ code, label }) =>
            `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;font-size:13px;color:#334155">
                <input type="checkbox" id="tc-${code}" value="${code}" checked
                    style="width:14px;height:14px;accent-color:#10b981;cursor:pointer" />
                ${label}
            </label>`
        ).join('');

        const result = await Swal.fire({
            title: '🌍 Editar Países Objetivo',
            html: `
                <p style="font-size:12px;color:#64748b;margin-bottom:12px;text-align:left">
                    Selecciona los países para <strong>${campaign.service}</strong>:
                </p>
                <div style="text-align:left;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px">
                    ${checkboxesHtml}
                </div>`,
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const selected = COUNTRIES
                    .filter(({ code }) => document.getElementById(`tc-${code}`)?.checked)
                    .map(({ code }) => code);
                if (selected.length === 0) {
                    Swal.showValidationMessage('Selecciona al menos un país.');
                    return false;
                }
                return selected;
            }
        });

        if (!result.isConfirmed) return;

        Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
        try {
            const token = getAuthToken();
            await campaignService.updateTargeting(campaign.id, result.value, token);
            Swal.fire({
                title: '¡Targeting actualizado!',
                text: `Países: ${result.value.join(', ')}`,
                icon: 'success',
                timer: 2500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDeleteCampaign = async (campaign) => {
        const platform = (campaign.platform || '').toLowerCase();
        const hasPlatformId = !!campaign.platform_id;
        const isMeta = platform.includes('facebook') || platform.includes('instagram');
        const isLinkedIn = platform.includes('linkedin');
        const supportsPlatformDelete = hasPlatformId && (isMeta || isLinkedIn);

        const platformLabel = isMeta ? 'Meta (Facebook/Instagram)' : isLinkedIn ? 'LinkedIn' : '';

        const result = await Swal.fire({
            title: '🗑️ ¿Eliminar campaña?',
            html: `
                <div class="text-sm text-left space-y-3">
                    <p>Se eliminará permanentemente del sistema:</p>
                    <p class="font-bold text-slate-900 text-base">${campaign.service}</p>
                    ${supportsPlatformDelete ? `
                    <div class="flex items-center gap-2 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <input type="checkbox" id="swal-platform-delete" checked style="width:16px;height:16px;cursor:pointer" />
                        <label for="swal-platform-delete" class="text-sm text-slate-700 cursor-pointer">
                            También eliminar en <strong>${platformLabel}</strong>
                        </label>
                    </div>` : ''}
                    <p class="text-xs text-slate-400 pt-1">Esta acción no se puede deshacer.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const deleteOnPlatform = supportsPlatformDelete
                ? document.getElementById('swal-platform-delete')?.checked ?? true
                : false;

            Swal.fire({ title: 'Eliminando...', didOpen: () => Swal.showLoading() });
            try {
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaign.id}/delete`, {
                    method: 'DELETE',
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ delete_on_platform: deleteOnPlatform })
                });
                const data = await response.json();
                if (response.ok) {
                    setLocalCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                    Swal.fire({
                        title: '✅ Eliminada',
                        text: data.message || 'La campaña fue eliminada del sistema.',
                        icon: 'success',
                        timer: 2500,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error(data.message || 'Error al eliminar');
                }
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };


    // =========================================================================
    // LÓGICA DE FILTRADO Y ORDENAMIENTO COMPLETA
    // =========================================================================
    const filteredCampaigns = localCampaigns.filter((campaign) => {
        const search = searchTerm.toLowerCase();
        const p = (campaign.platform || '').toLowerCase();
        const s = (campaign.status || '').toLowerCase();
        const serviceName = (campaign.service || '').toLowerCase();
        const budgetStr = (campaign.budget || '').toString();

        // 1. Buscador global
        const matchesSearch = serviceName.includes(search) ||
            campaign.id.toLowerCase().includes(search) ||
            budgetStr.includes(search);

        // 2. Filtro Estado (con agrupación de estados equivalentes entre plataformas)
        // LinkedIn devuelve REJECTED y Meta DISAPPROVED para un anuncio rechazado.
        const STATUS_GROUPS = {
            rejected: ['rejected', 'disapproved'],
        };
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            const target = statusFilter.toLowerCase();
            const group = STATUS_GROUPS[target];
            matchesStatus = group ? group.includes(s) : s === target;
        }

        // 3. Filtro Plataforma
        let matchesPlatform = true;
        if (platformFilter !== 'all') {
            if (platformFilter === 'meta') matchesPlatform = p.includes('facebook') || p.includes('instagram');
            else matchesPlatform = p.includes(platformFilter);
        }

        // --- NUEVA LÓGICA: FILTRAR GASTO > 0 ---
        // Si el usuario elige ordenar por gasto, ocultamos las que están en $0
        let hasSpend = true;
        if (sortConfig === 'spend_desc' || sortConfig === 'spend_asc') {
            hasSpend = (campaign.spend || 0) > 0;
        }

        return matchesSearch && matchesStatus && matchesPlatform && hasSpend;
    })
        .sort((a, b) => {
            // Mantén la lógica de ordenamiento anterior
            if (sortConfig === 'spend_desc') return (b.spend || 0) - (a.spend || 0);
            if (sortConfig === 'spend_asc') return (a.spend || 0) - (b.spend || 0);
            if (sortConfig === 'budget_desc') return (b.budget || 0) - (a.budget || 0);
            if (sortConfig === 'budget_asc') return (a.budget || 0) - (b.budget || 0);
            if (sortConfig === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            // 'newest' (por defecto): más recientes primero por fecha de publicación.
            // Antes ordenaba por b.id.localeCompare(a.id), pero el ID es un UUID aleatorio,
            // así que el orden no tenía relación con la fecha real.
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
    const currentItems = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleFixLinkedInBids = async () => {
        const result = await Swal.fire({
            title: 'Reparar LinkedIn',
            text: '¿Deseas ajustar las pujas de todas las campañas de LinkedIn a $4.500 COP?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0077b5',
            confirmButtonText: 'Sí, reparar ahora'
        });

        if (result.isConfirmed) {
            Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });
            try {
                const token = getAuthToken();
                const res = await launchService.fixLinkedInBids(token);
                Swal.fire('Completado', `Se repararon ${res.fixed || 0} campañas.`, 'success');
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleFixLinkedInTargeting = async () => {
        const result = await Swal.fire({
            title: '🎯 Corregir Targeting LinkedIn',
            html: `
                <p class="text-sm text-slate-600 mb-3">Esto actualizará el geo-targeting de TODAS las campañas LinkedIn.</p>
                <p class="text-xs text-slate-400">Países por defecto: CO, MX, PE, CL, EC, AR, PA</p>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0077b5',
            confirmButtonText: 'Actualizar Targeting',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            Swal.fire({ title: 'Actualizando targeting...', text: 'Esto puede tomar unos segundos...', didOpen: () => Swal.showLoading() });
            try {
                const token = getAuthToken();
                const res = await launchService.fixLinkedInTargeting(token);
                Swal.fire({
                    title: '✅ Targeting Actualizado',
                    html: `
                        <div class="text-sm text-left">
                            <p><strong>Campañas corregidas:</strong> ${res.details?.fixed || 0}</p>
                            <p><strong>Errores:</strong> ${res.details?.errors || 0}</p>
                            <p class="mt-2 text-xs text-slate-500">Países: ${res.details?.countries?.join(', ') || 'Por defecto'}</p>
                        </div>
                    `,
                    icon: 'success'
                });
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    // =========================================================================
    // VISTA MÓVIL OPTIMIZADA
    // =============================================================================
    const MobileCard = ({ c }) => {
        const budget = c.budget || 0;
        const spend = c.spend || 0;
        const spendPercent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
        const conversions = c.conversions || 0;
        const leadVal = config?.lead_value || 15;
        const roi = spend > 0 ? (((conversions * leadVal) - spend) / spend) * 100 : 0;
        const isSyncSupported = c.platform && (c.platform.toLowerCase().includes('facebook') || c.platform.toLowerCase().includes('instagram') || c.platform.toLowerCase().includes('linkedin'));

        return (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{c.service}</h4>
                        {renderPlatformBadge(c.platform)}
                        <div className="text-[10px] text-slate-400 mt-1">📅 Publicada: {formatDate(c.created_at)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={c.status} />
                        {isSyncSupported && (
                            <button onClick={() => handleVerifyMetaStatus(c.id)} className="p-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm" title="Sincronizar ahora">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Gasto</span>
                            {isSyncSupported && <button onClick={() => handleEditBudget(c, budget)} className="text-blue-500 p-0.5 rounded" title="Editar Presupuesto">✏️</button>}
                        </div>
                        <div className="text-xs font-semibold text-slate-700">
                            {formatMoney(spend)} <span className="text-slate-400 text-[10px] font-normal">/ {formatMoney(budget)}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                            <div style={{ width: `${spendPercent}%` }} className={`h-full rounded-full transition-all duration-500 ${spendPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight block mb-1">ROI & Leads</span>
                        <div className={`text-xs font-bold ${roi > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {roi > 0 ? '+' : ''}{roi.toFixed(0)}% <span className="text-slate-400 font-normal ml-1">({conversions})</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setSelectedCampaign(c)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-2.5 rounded-xl shadow-sm">👁️ Ver</button>
                    {isSyncSupported && (
                        <button onClick={() => handleEditTargeting(c)} className="px-3 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl" title="Editar países">🌍</button>
                    )}
                    {c.status === 'ACTIVE' && <button onClick={() => handleToggleStatus(c.id, c.status)} className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold py-2.5 rounded-xl">⏸️ Pausar</button>}
                    {c.status === 'PAUSED' && <button onClick={() => handleToggleStatus(c.id, c.status)} className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold py-2.5 rounded-xl">▶️ Activar</button>}
                    {c.status === 'pending_approval' && <button onClick={() => handleConfirmApprove(c.id, c.service)} className="flex-1 bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-md">✅ APROBAR</button>}
                    <button onClick={() => handleDeleteCampaign(c)} className="flex items-center justify-center gap-1 px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95" title="Eliminar campaña">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        DEL
                    </button>

                    {/* BOTÓN DE RESETEO AL LADO DE LAS ACCIONES DE ESTADO */}
                    <button
                        onClick={() => handleResetMetrics(c.id, c.service)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-colors active:scale-95"
                        title="Resetear"
                    >
                        <span className="text-[11px] font-bold tracking-tight">RESET</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            {selectedCampaign && <CampaignPreviewModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} onApprove={handleConfirmApprove} onToggleStatus={handleToggleStatus} onUpdateBudget={handleDirectBudgetUpdate} onUpdateEndDate={handleDirectEndDateUpdate} onUpdateBid={handleDirectBidUpdate} />}
            {selectedAudienceCampaign && <AudienceModal campaign={selectedAudienceCampaign} onClose={() => setSelectedAudienceCampaign(null)} />}

            {/* --- BARRA DE HERRAMIENTAS ACTUALIZADA --- */}
            <div className="p-4 md:p-5 border-b border-slate-200 bg-white flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">

                {/* 1. BUSCADOR UNIFICADO */}
                <div className="relative w-full xl:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por servicio, ID o valor..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 pr-4 py-2.5 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>

                {/* 2. SELECTORES DE FILTRO SEPARADOS */}
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">

                    {/* Filtro Plataforma */}
                    <select
                        value={platformFilter}
                        onChange={(e) => { setPlatformFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm min-w-[140px]"
                    >
                        <option value="all">🌐 Todas las Redes</option>
                        <option value="meta">♾️ Meta (FB/IG)</option>
                        <option value="linkedin">💼 LinkedIn</option>
                    </select>

                    {/* Filtro Estado */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm min-w-[140px]"
                    >
                        <option value="all">📊 Todos los Estados</option>
                        <option value="active">🟢 Activos</option>
                        <option value="paused">⏸️ Pausados</option>
                        <option value="pending_approval">⏳ Pendientes</option>
                        <option value="rejected">🔴 Rechazadas</option>
                        <option value="with_issues">⚠️ Con Errores</option>
                        <option value="deleted">🗑️ Eliminadas</option>
                    </select>

                    {/* Ordenar por Presupuesto */}
                    <select
                        value={sortConfig}
                        onChange={(e) => {
                            setSortConfig(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm min-w-[160px]"
                    >
                        <option value="newest">📅 Más Recientes</option>
                        <option value="oldest">📆 Más Antiguas</option>
                        <option value="budget_desc">💰 Mayor Presupuesto</option>
                        <option value="budget_asc">💸 Menor Presupuesto</option>
                        {/* NUEVAS OPCIONES DE GASTO */}
                        <option value="spend_desc">📈 Mayor Gasto Real</option>
                        <option value="spend_asc">📉 Menor Gasto Real</option>
                    </select>
                    {/* Botones administrativos ocultos temporalmente 
                    <button
                        onClick={handleFixLinkedInBids}
                        className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 transition-all font-bold text-xs shadow-sm"
                    >
                        <span>🛠️ Reparar Pujas</span>
                    </button>
                    <button
                        onClick={handleFixLinkedInTargeting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all font-bold text-xs shadow-sm"
                    >
                        <span>🎯 Targeting LinkedIn</span>
                    </button>
                    */}
                </div>
            </div>

            <div className="md:hidden p-4 bg-slate-50">
                {currentItems.length > 0 ? currentItems.map(c => <MobileCard key={c.id} c={c} />) : <div className="text-center text-slate-400 py-10">No hay resultados.</div>}
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Servicio', 'Publicada', 'Plataforma', 'Estado', 'Gasto / Presupuesto', 'Rendimiento', 'Acción'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {currentItems.map((c) => {
                            const budget = c.budget || 0;
                            const spend = c.spend || 0;
                            const spendPercent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
                            const conversions = c.conversions || 0;
                            const leadVal = config?.lead_value || 0;
                            const roi = spend > 0 ? (((conversions * leadVal) - spend) / spend) * 100 : 0;
                            const isSyncSupported = c.platform && (c.platform.toLowerCase().includes('facebook') || c.platform.toLowerCase().includes('instagram') || c.platform.toLowerCase().includes('linkedin'));

                            return (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">{c.service}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {c.id.substring(0, 6)}...</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-600 whitespace-nowrap">{formatDate(c.created_at)}</div>
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
                                                <span className="text-xs font-bold text-slate-700">{formatMoney(spend)} <span className="text-slate-400 font-normal">/ {formatMoney(budget)}</span></span>
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
                                            {isSyncSupported && (
                                                <button onClick={() => handleEditTargeting(c)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="Editar países objetivo">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </button>
                                            )}
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
                                            ) : null}
                                            {/* Botón Eliminar — siempre visible */}
                                            <button onClick={() => handleDeleteCampaign(c)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Eliminar campaña">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>

                                            {/* Botón Resetear gasto/leads (manual) */}
                                            <button
                                                onClick={() => handleResetMetrics(c.id, c.service)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 group"
                                                title="Resetear gasto/leads (manual)"
                                            >
                                                <svg
                                                    className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
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