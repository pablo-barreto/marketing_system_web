'use client';
import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import Swal from 'sweetalert2';
import AudienceModal from './AudienceModal';
import { API_BASE_URL } from '../app/config'; // <--- 1. IMPORTAR LA CONFIGURACIÓN

// =============================================================================
// 1. SUB-COMPONENTES DE PREVISUALIZACIÓN (LIMPIOS)
// =============================================================================

// --- VISTA FACEBOOK / INSTAGRAM ---
const FacebookPreview = ({ content, service, imageUrl }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden max-w-[500px] mx-auto font-sans">
        {/* Header */}
        <div className="p-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs border border-slate-200">CR</div>
            <div>
                <div className="font-semibold text-[15px] text-[#050505] leading-snug">CR Consultores Colombia</div>
                <div className="text-xs text-[#65676b] flex items-center gap-1">
                    Publicidad <span aria-hidden="true">·</span> 🌎
                </div>
            </div>
        </div>
        
        {/* Image Real */}
        <div className="bg-slate-100 relative min-h-[250px] border-t border-b border-gray-100">
             <img 
                src={imageUrl} 
                alt={service} 
                className="w-full h-auto object-cover"
                onError={(e) => { 
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="flex flex-col items-center justify-center h-[250px] text-slate-400 bg-slate-100 p-4 text-center"><span class="text-2xl mb-2">🖼️</span>Imagen no disponible<br/><span class="text-xs text-slate-300 truncate w-full">${imageUrl}</span></div>`;
                }} 
             />
        </div>
        
        {/* CTA Bar */}
        <div className="bg-[#f0f2f5] p-3 flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-2">
                <div className="text-[12px] text-[#65676b] uppercase truncate">crconsultorescolombia.com</div>
                <div className="text-[16px] font-bold text-[#050505] leading-tight mt-0.5 line-clamp-2">
                    {content.title || service}
                </div>
            </div>
            <button className="bg-[#d1d5db] text-[#050505] text-[15px] font-semibold px-4 py-2 rounded-[6px] whitespace-nowrap border border-[#ced0d4]">
                Más información
            </button>
        </div>
        
        {/* Footer Actions */}
        <div className="px-2 py-1 flex items-center justify-between border-t border-gray-200 text-[#65676b] text-[14px] font-medium">
            <div className="flex-1 text-center py-2 cursor-pointer hover:bg-gray-50">Me gusta</div>
            <div className="flex-1 text-center py-2 cursor-pointer hover:bg-gray-50">Comentar</div>
            <div className="flex-1 text-center py-2 cursor-pointer hover:bg-gray-50">Compartir</div>
        </div>
    </div>
);

// --- VISTA GOOGLE ADS ---
const GooglePreview = ({ content }) => {
    const title = (content.headlines && content.headlines[0]) ? content.headlines[0] : (content.title || "Servicio Profesional");
    const desc = (content.descriptions && content.descriptions[0]) ? content.descriptions[0] : "Soluciones profesionales.";

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-transparent max-w-[600px] mx-auto font-arial">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-bold text-slate-900">Anuncio</span>
                <span className="text-[12px] text-[#202124]">· crconsultorescolombia.com/servicios</span>
            </div>
            <div className="text-[20px] text-[#1a0dab] font-medium leading-snug hover:underline cursor-pointer mb-1">
                {title} | CR Consultores
            </div>
            <div className="text-[14px] text-[#4d5156] leading-relaxed">
                {desc}
            </div>
        </div>
    );
};

// --- VISTA LINKEDIN ---
const LinkedInPreview = ({ content, service, imageUrl }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden max-w-[500px] mx-auto font-sans">
        <div className="p-3 flex gap-2 border-b border-gray-50">
            <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-500 font-bold border border-slate-200">CR</div>
            <div className="flex flex-col justify-center">
                <div className="font-semibold text-sm text-slate-900 flex items-center gap-1">
                    CR Consultores Colombia <span className="text-[10px] text-gray-500">• 1er</span>
                </div>
                <div className="text-xs text-slate-500">Promocionado</div>
            </div>
        </div>
        <div className="bg-slate-100 min-h-[220px]">
            <img 
                src={imageUrl} 
                alt={service} 
                className="w-full h-auto object-cover" 
                onError={(e) => { e.target.style.display='none'; }}
            />
        </div>
        <div className="bg-[#f3f6f8] p-3 flex justify-between items-center px-4">
            <div className="text-sm font-semibold text-slate-800 truncate pr-4">
                {content.title || service}
            </div>
            <button className="text-blue-700 border border-blue-700 rounded-full px-4 py-1 text-sm font-semibold hover:bg-blue-50 hover:ring-1 ring-blue-700 transition-all">
                Ver más
            </button>
        </div>
    </div>
);

// =============================================================================
// 2. MODAL PRINCIPAL
// =============================================================================

const CampaignPreviewModal = ({ campaign, onClose, onApprove }) => {
    if (!campaign) return null;

    const getContent = (c) => {
        if (!c) return {};
        if (typeof c === 'object') return c;
        try { return JSON.parse(c); } catch { return { body: c }; }
    };

    const content = getContent(campaign.content);
    
    // --- LÓGICA DE IMAGEN CORREGIDA ---
    let previewImage = '/static/images/servicios 1.jpg'; // Fallback

    if (content.local_image_path) {
        // Obtenemos solo el nombre del archivo (ej: servicios_1.jpg)
        // Esto limpia cualquier ruta absoluta de Windows/Linux que se haya guardado
        const filename = content.local_image_path.split('\\').pop().split('/').pop();
        
        // Usamos la API_BASE_URL configurada
        previewImage = `${API_BASE_URL}/static/images/uploads/${filename}`;
        
    } else if (content.image) {
        previewImage = content.image;
    } else if (content.preview_image) {
        previewImage = content.preview_image;
    }
    
    const platform = (campaign.platform || '').toLowerCase();
    
    const renderPreview = () => {
        if (platform.includes('google')) return <GooglePreview content={content} />;
        if (platform.includes('linkedin')) return <LinkedInPreview content={content} service={campaign.service} imageUrl={previewImage} />;
        return <FacebookPreview content={content} service={campaign.service} imageUrl={previewImage} />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                
                {/* IZQUIERDA: PREVIEW VISUAL */}
                <div className="w-full md:w-[60%] bg-[#eef0f4] p-6 flex flex-col items-center justify-center border-r border-slate-200 overflow-y-auto relative custom-scrollbar">
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full shadow-sm font-bold uppercase tracking-wide flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${platform.includes('google') ? 'bg-orange-500' : platform.includes('linkedin') ? 'bg-blue-700' : 'bg-blue-600'}`}></span>
                        Vista Previa: {campaign.platform}
                    </div>
                    <div className="w-full flex justify-center py-8">
                        {renderPreview()}
                    </div>
                </div>

                {/* DERECHA: DATOS TÉCNICOS */}
                <div className="w-full md:w-[40%] p-6 md:p-8 flex flex-col h-full bg-white overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Revisión de Anuncio</h2>
                            <p className="text-slate-500 text-sm mt-1">ID: <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded">{campaign.id.substring(0,8)}...</span></p>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-600">Estado</span>
                            <StatusBadge status={campaign.status} />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Detalles</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border border-slate-100 rounded-lg">
                                    <span className="block text-slate-400 text-xs mb-1">Servicio</span>
                                    <span className="font-bold text-slate-800 text-sm truncate block" title={campaign.service}>{campaign.service}</span>
                                </div>
                                <div className="p-3 border border-slate-100 rounded-lg">
                                    <span className="block text-slate-400 text-xs mb-1">Presupuesto</span>
                                    <span className="font-bold text-slate-800 text-sm">${campaign.budget?.toLocaleString()}</span>
                                </div>
                                <div className="p-3 border border-slate-100 rounded-lg">
                                    <span className="block text-slate-400 text-xs mb-1">Público</span>
                                    <span className="font-bold text-slate-800 text-sm truncate block" title={campaign.audience}>{campaign.audience || 'Auto'}</span>
                                </div>
                                <div className="p-3 border border-slate-100 rounded-lg">
                                    <span className="block text-slate-400 text-xs mb-1">ROI Est.</span>
                                    <span className="font-bold text-emerald-600 text-sm">
                                        {campaign.spend > 0 ? (((campaign.conversions * 15) - campaign.spend) / campaign.spend * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded border border-slate-200 overflow-hidden flex-shrink-0 relative">
                                <img src={previewImage} alt="mini" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-500 uppercase">Recurso Visual</div>
                                <div className="text-xs text-slate-700 truncate" title={previewImage}>
                                    {previewImage.startsWith('http') ? 'URL Externa' : previewImage.split('/').pop()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            Cerrar
                        </button>
                        {campaign.status === 'pending_approval' && (
                            <button 
                                onClick={() => { onApprove(campaign.id, campaign.service); onClose(); }} 
                                className="flex-1 py-3.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 hover:shadow-xl transition-all transform active:scale-[0.98]"
                            >
                                Aprobar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// 3. COMPONENTE DE TABLA (Wrapper Principal)
// =============================================================================

const CampaignTable = ({ campaigns, onApprove }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCampaign, setSelectedCampaign] = useState(null); 
    const [selectedAudienceCampaign, setSelectedAudienceCampaign] = useState(null);

    const ESTIMATED_LEAD_VALUE = 15;

    const handlePageSizeChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };
    
    const getPlatformStyle = (platform) => {
        const p = (platform || '').toLowerCase();
        if (p.includes('google')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', icon: 'G' };
        if (p.includes('facebook')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: 'f' };
        if (p.includes('linkedin')) return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', icon: 'in' };
        return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: '?' };
    };

    const handleConfirmApprove = (campaignId, serviceName) => {
        Swal.fire({
            title: '¿Aprobar Campaña?',
            html: `<div class="text-slate-600 text-sm">Vas a activar la inversión real para:<br/><strong class="text-slate-900 text-lg">${serviceName}</strong></div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, Activar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) onApprove(campaignId);
        });
    };

    const filteredCampaigns = campaigns?.filter((campaign) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (campaign.service || '').toLowerCase().includes(search) || (campaign.platform || '').toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) || [];

    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
    const currentItems = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // --- CARD MÓVIL ---
    const MobileCard = ({ c }) => {
        const pStyle = getPlatformStyle(c.platform);
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
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                            {pStyle.icon} {c.platform || 'General'}
                        </span>
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
                    <button 
                        onClick={() => setSelectedCampaign(c)}
                        className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        👁️ Ver
                    </button>
                    {/* Botón Audiencia */}
                    <button 
                        onClick={() => setSelectedAudienceCampaign(c)} 
                        className="flex-1 bg-white border border-slate-200 hover:bg-purple-50 text-slate-600 hover:text-purple-600 text-sm font-bold py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        👥 Users
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            {selectedCampaign && (
                <CampaignPreviewModal 
                    campaign={selectedCampaign} 
                    onClose={() => setSelectedCampaign(null)} 
                    onApprove={handleConfirmApprove}
                />
            )}

            {selectedAudienceCampaign && (
                <AudienceModal 
                    campaign={selectedAudienceCampaign} 
                    onClose={() => setSelectedAudienceCampaign(null)} 
                />
            )}

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
                            {['Servicio', 'Plataforma', 'Estado', 'Gasto / Presupuesto', 'Rendimiento', 'Acción'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {currentItems.map((c) => {
                            const pStyle = getPlatformStyle(c.platform);
                            const budget = c.budget || 0;
                            const spend = c.spend || 0;
                            const spendPercent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
                            const conversions = c.conversions || 0;
                            const roi = spend > 0 ? (((conversions * ESTIMATED_LEAD_VALUE) - spend) / spend) * 100 : 0;
                            
                            return (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">{c.service}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {c.id.substring(0,6)}...</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                                            {pStyle.icon} {c.platform}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-xs font-bold text-slate-700">${spend.toFixed(0)} <span className="text-slate-400 font-normal">/ ${budget.toLocaleString()}</span></div>
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
                                            
                                            {/* BOTÓN AUDIENCIA (NUEVO EN ESCRITORIO) */}
                                            <button 
                                                onClick={() => setSelectedAudienceCampaign(c)} 
                                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100" 
                                                title="Ver Audiencia Asignada"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            </button>

                                            {c.status === 'pending_approval' ? (
                                                <button onClick={() => handleConfirmApprove(c.id, c.service)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm active:scale-95 transition-all">APROBAR</button>
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
                        <span>Filas por pág:</span>
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