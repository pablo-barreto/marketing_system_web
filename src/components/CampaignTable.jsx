'use client';
import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import { Button, Icon, Pagination, Pill, ProgressBar, SearchInput, cx, tableClass, tdClass, thClass, trClass } from './ui';
import Swal from 'sweetalert2';
import AudienceModal from './AudienceModal';
import { AudienceBadge } from './AudienceSelect';
import { URL_IMAGES } from '../app/config';
import { campaignService, launchService } from '../services/api';
import { apiFetch } from '../lib/apiClient';
import { useApi, withQuery } from '../hooks/useApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

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
                setBidInfo(await apiFetch(`/api/v1/campaigns/${campaign.id}/bid`));
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

const CampaignTable = ({ onApprove, config }) => {
    const [localCampaigns, setLocalCampaigns] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // --- ESTADOS DE FILTRO MEJORADOS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [platformFilter, setPlatformFilter] = useState('all'); // Nuevo
    const [sortConfig, setSortConfig] = useState('newest');      // Nuevo (Presupuesto)
    const debouncedSearch = useDebouncedValue(searchTerm);

    // Solo la página visible, con los filtros aplicados en el servidor
    const { data: campaignsPage, loading, refresh } = useApi(withQuery('/api/v1/campaigns', {
        page: currentPage,
        page_size: itemsPerPage,
        q: debouncedSearch.trim(),
        status: statusFilter,
        platform: platformFilter,
        sort: sortConfig
    }), { refreshInterval: 30000 });
    const initialCampaigns = campaignsPage?.items;

    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedAudienceCampaign, setSelectedAudienceCampaign] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        if (initialCampaigns) setLocalCampaigns(initialCampaigns);
    }, [initialCampaigns]);

    // Si la página actual quedó vacía (p. ej. al eliminar la última campaña), volver a la última que existe
    const serverPages = campaignsPage?.pages;
    useEffect(() => {
        if (serverPages && currentPage > serverPages) setCurrentPage(serverPages);
    }, [serverPages, currentPage]);


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
                const data = await apiFetch(`/api/v1/campaigns/${campaign.id}/budget`, {
                    method: 'PUT',
                    json: { budget: newBudget }
                });
                const confirmedBudget = data.new_budget ? parseFloat(data.new_budget) : parseFloat(newBudget);
                updateLocalCampaignData(campaign.id, { budget: confirmedBudget });
                Swal.fire({ title: '¡Actualizado!', text: `Nuevo presupuesto: $${confirmedBudget.toLocaleString()}`, icon: 'success', timer: 2000 });
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleDirectBudgetUpdate = async (campaign, newBudget) => {
        Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading() });
        try {
            const data = await apiFetch(`/api/v1/campaigns/${campaign.id}/budget`, {
                method: 'PUT',
                json: { budget: newBudget }
            });
            const confirmed = data.new_budget ? parseFloat(data.new_budget) : parseFloat(newBudget);
            updateLocalCampaignData(campaign.id, { budget: confirmed });
            Swal.fire({ title: '¡Actualizado!', text: `Nuevo presupuesto: $${confirmed.toLocaleString()}`, icon: 'success', timer: 2000 });
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDirectBidUpdate = async (campaign, newBid) => {
        Swal.fire({ title: 'Actualizando puja...', didOpen: () => Swal.showLoading() });
        try {
            await apiFetch(`/api/v1/campaigns/${campaign.id}/bid`, {
                method: 'PUT',
                json: { bid: newBid }
            });
            Swal.fire({ title: '¡Puja actualizada!', text: `Nueva puja CPC: $${parseFloat(newBid).toLocaleString()} COP`, icon: 'success', timer: 2000 });
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDirectEndDateUpdate = async (campaign, newEndDate) => {
        Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading() });
        try {
            await apiFetch(`/api/v1/campaigns/${campaign.id}/end-date`, {
                method: 'PUT',
                json: { end_date: newEndDate }
            });
            updateLocalCampaignData(campaign.id, { end_date: newEndDate });
            const label = newEndDate
                ? `Fecha límite: ${new Date(newEndDate).toLocaleDateString('es-CO')}`
                : 'Fecha límite eliminada';
            Swal.fire({ title: '¡Actualizado!', text: label, icon: 'success', timer: 2000 });
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const visibleIdsKey = (initialCampaigns || []).map(c => c.id).join(',');
    useEffect(() => {
        const checkVisibleCampaigns = async () => {
            const campaignsToCheck = currentItems.filter(c =>
                c.platform && (c.platform.toLowerCase().includes('facebook') || c.platform.toLowerCase().includes('instagram') || c.platform.toLowerCase().includes('linkedin'))
            );
            if (campaignsToCheck.length === 0) return;

            campaignsToCheck.forEach(async (campaign) => {
                try {
                    const data = await apiFetch(`/api/v1/campaigns/${campaign.id}/real-status`);
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
                } catch (e) { console.error("Auto-check failed", e); }
            });
        };
        checkVisibleCampaigns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleIdsKey]);

    // --- FUNCIÓN DE VERIFICACIÓN CON MANEJO DE ERRORES ---
    const handleVerifyMetaStatus = async (campaignId) => {
        Swal.fire({
            title: 'Sincronizando...',
            text: 'Obteniendo costos y estado en tiempo real...',
            didOpen: () => { Swal.showLoading(); }
        });
        try {
            const data = await apiFetch(`/api/v1/campaigns/${campaignId}/real-status`);

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
                    await apiFetch(`/api/v1/campaigns/${campaignId}/status`, {
                        method: 'PUT',
                        json: { status: targetStatus }
                    });
                    updateLocalCampaignData(campaignId, { status: targetStatus });
                    Swal.fire({ title: '¡Listo!', text: `Campaña ${targetStatus === 'ACTIVE' ? 'activada' : 'pausada'}.`, icon: 'success', timer: 1500, showConfirmButton: false });
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
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
                await campaignService.resetMetrics(campaignId);

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
            await campaignService.updateTargeting(campaign.id, result.value);
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
                const data = await campaignService.deleteCampaign(campaign.id, deleteOnPlatform);
                setLocalCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                refresh();
                Swal.fire({
                    title: '✅ Eliminada',
                    text: data.message || 'La campaña fue eliminada del sistema.',
                    icon: 'success',
                    timer: 2500,
                    showConfirmButton: false
                });
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };


    // El filtrado, el orden y la paginación los hace el servidor (ver /api/v1/campaigns)
    const currentItems = localCampaigns;
    const totalItems = campaignsPage?.total || 0;
    const totalPages = Math.max(campaignsPage?.pages || 1, 1);

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
                const res = await launchService.fixLinkedInBids();
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
                const res = await launchService.fixLinkedInTargeting();
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
    // TABLA (diseño "Historial de campañas")
    // =========================================================================
    const isSyncable = (c) => {
        const p = (c.platform || '').toLowerCase();
        return p.includes('facebook') || p.includes('instagram') || p.includes('linkedin');
    };

    // Acción principal de cada fila según su estado; el resto va al menú "Más acciones"
    const primaryAction = (c) => {
        const s = String(c.status || '').toUpperCase();
        if (s === 'PENDING_APPROVAL') return { label: 'Aprobar', variant: 'primary', run: () => handleConfirmApprove(c.id, c.service) };
        if (s === 'ACTIVE' || s === 'LOW PERFORMANCE' || s === 'LOW_PERFORMANCE') return { label: 'Pausar', run: () => handleToggleStatus(c.id, 'ACTIVE') };
        if (s === 'PAUSED') return { label: 'Reanudar', run: () => handleToggleStatus(c.id, 'PAUSED') };
        return { label: 'Ver anuncio', run: () => setSelectedCampaign(c) };
    };

    const menuItems = (c) => [
        { label: 'Ver detalle del anuncio', run: () => setSelectedCampaign(c) },
        { label: 'Ver audiencia asignada', run: () => setSelectedAudienceCampaign(c) },
        isSyncable(c) && { label: 'Editar presupuesto', run: () => handleEditBudget(c, c.budget || 0) },
        isSyncable(c) && { label: 'Editar países objetivo', run: () => handleEditTargeting(c) },
        isSyncable(c) && { label: 'Sincronizar métricas', run: () => handleVerifyMetaStatus(c.id) },
        { label: 'Resetear gasto y leads', run: () => handleResetMetrics(c.id, c.service) },
        'separator',
        { label: 'Eliminar campaña', danger: true, run: () => handleDeleteCampaign(c) },
    ].filter(Boolean);

    const channels = (platform) => {
        const p = (platform || '').toLowerCase();
        if (p.includes('linkedin')) return ['LinkedIn'];
        if (p.includes('google')) return ['Google Ads'];
        return ['Facebook', 'Instagram'];
    };

    const selectClass = 'h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm';

    return (
        <div className="w-full">
            {selectedCampaign && <CampaignPreviewModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} onApprove={handleConfirmApprove} onToggleStatus={handleToggleStatus} onUpdateBudget={handleDirectBudgetUpdate} onUpdateEndDate={handleDirectEndDateUpdate} onUpdateBid={handleDirectBidUpdate} />}
            {selectedAudienceCampaign && <AudienceModal campaign={selectedAudienceCampaign} onClose={() => setSelectedAudienceCampaign(null)} />}

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
                <h2 id="hist-title" className="m-0 text-base font-bold">Historial de campañas</h2>
                <div className="flex flex-wrap items-center gap-2.5">
                    <SearchInput
                        value={searchTerm}
                        onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
                        placeholder="Buscar por servicio, ID o valor"
                        label="Buscar campaña"
                        className="w-full sm:w-64"
                    />
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                        Red
                        <select value={platformFilter} onChange={(e) => { setPlatformFilter(e.target.value); setCurrentPage(1); }} className={selectClass}>
                            <option value="all">Todas</option>
                            <option value="meta">Meta (Facebook / Instagram)</option>
                            <option value="linkedin">LinkedIn</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                        Estado
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className={selectClass}>
                            <option value="all">Todos</option>
                            <option value="active">Activas</option>
                            <option value="paused">Pausadas</option>
                            <option value="pending_approval">Pendientes</option>
                            <option value="rejected">Rechazadas</option>
                            <option value="with_issues">Con errores</option>
                            <option value="deleted">Eliminadas</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                        Orden
                        <select value={sortConfig} onChange={(e) => { setSortConfig(e.target.value); setCurrentPage(1); }} className={selectClass}>
                            <option value="newest">Más recientes</option>
                            <option value="oldest">Más antiguas</option>
                            <option value="budget_desc">Mayor presupuesto</option>
                            <option value="budget_asc">Menor presupuesto</option>
                            <option value="spend_desc">Mayor gasto real</option>
                            <option value="spend_asc">Menor gasto real</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className={cx(tableClass, 'min-w-[980px]')}>
                    <thead>
                        <tr>
                            <th scope="col" className={thClass}>Campaña</th>
                            <th scope="col" className={thClass}>Canales</th>
                            <th scope="col" className={thClass}>Público</th>
                            <th scope="col" className={thClass}>Estado</th>
                            <th scope="col" className={thClass}>Gasto / presupuesto</th>
                            <th scope="col" className={thClass}>Resultado</th>
                            <th scope="col" className={cx(thClass, 'text-right')}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((c) => {
                            const budget = c.budget || 0;
                            const spend = c.spend || 0;
                            const spendPercent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
                            const conversions = c.conversions || 0;
                            const leadVal = config?.lead_value || 0;
                            const roi = spend > 0 ? (((conversions * leadVal) - spend) / spend) * 100 : null;
                            const primary = primaryAction(c);
                            const menuOpen = openMenuId === c.id;

                            return (
                                <tr key={c.id} className={trClass}>
                                    <td className={tdClass}>
                                        <div className="flex flex-col gap-0.5 max-w-[260px]">
                                            <span className="font-semibold text-slate-900">{c.service}</span>
                                            <span className="text-xs text-slate-500">
                                                {formatDate(c.created_at)} · <span className="font-mono">{c.id.substring(0, 8)}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className={tdClass}>
                                        <div className="flex flex-wrap gap-1">
                                            {channels(c.platform).map((ch) => <Pill key={ch} tone={ch === 'LinkedIn' ? 'blue' : 'neutral'}>{ch}</Pill>)}
                                        </div>
                                    </td>
                                    <td className={tdClass}><AudienceBadge audienceType={c.audience_type} /></td>
                                    <td className={tdClass}><StatusBadge status={c.status} /></td>
                                    <td className={tdClass}>
                                        <div className="flex flex-col gap-1.5 min-w-[150px]">
                                            <span className="text-[13px]">
                                                <strong className="text-slate-900">{formatMoney(spend)}</strong>{' '}
                                                <span className="text-slate-500">de {formatMoney(budget)}</span>
                                            </span>
                                            <ProgressBar value={spendPercent} color={spendPercent > 90 ? 'bg-red-500' : 'bg-blue-600'} />
                                        </div>
                                    </td>
                                    <td className={tdClass}>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-slate-900">{conversions} leads</span>
                                            <span className={cx('text-xs', roi === null ? 'text-slate-400' : roi > 0 ? 'text-emerald-700' : 'text-amber-700')}>
                                                {roi === null ? 'Sin gasto' : `${roi > 0 ? '+' : ''}${roi.toFixed(0)} % ROI`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={cx(tdClass, 'text-right')}>
                                        <div className="relative inline-flex items-center gap-1.5">
                                            <Button size="sm" variant={primary.variant || 'secondary'} onClick={primary.run}>{primary.label}</Button>
                                            <button
                                                type="button"
                                                aria-label={`Más acciones para ${c.service}`}
                                                aria-haspopup="menu"
                                                aria-expanded={menuOpen}
                                                onClick={() => setOpenMenuId(menuOpen ? null : c.id)}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                                            >
                                                <Icon name="more" size={16} />
                                            </button>
                                            {menuOpen && (
                                                <>
                                                    <button type="button" aria-label="Cerrar menú" onClick={() => setOpenMenuId(null)} className="fixed inset-0 z-10 cursor-default border-0 bg-transparent" />
                                                    <div role="menu" className="absolute right-0 top-full mt-1 z-20 w-56 py-1.5 bg-white border border-slate-200 rounded-lg shadow-lg text-left">
                                                        {menuItems(c).map((item, i) => item === 'separator' ? (
                                                            <div key={`sep-${i}`} className="my-1 border-t border-slate-100" />
                                                        ) : (
                                                            <button
                                                                key={item.label}
                                                                type="button"
                                                                role="menuitem"
                                                                onClick={() => { setOpenMenuId(null); item.run(); }}
                                                                className={cx('w-full min-h-10 px-3.5 text-left text-sm border-0 bg-transparent cursor-pointer hover:bg-slate-50', item.danger ? 'text-red-700' : 'text-slate-800')}
                                                            >
                                                                {item.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {currentItems.length === 0 && (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">{loading ? 'Cargando campañas…' : 'No hay campañas con estos filtros.'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalItems > 0 && (
                <Pagination
                    page={currentPage}
                    pages={totalPages}
                    onPage={setCurrentPage}
                    pageSize={itemsPerPage}
                    onPageSize={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
                    sizes={[5, 10, 25]}
                    total={totalItems}
                    noun="campañas"
                />
            )}
        </div>
    );
};

export default CampaignTable;
