'use client';
import React, { useState, useEffect, useContext } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { campaignService } from '../services/api';

// Imports de Vistas
import OverviewView from '../views/OverviewView';
import CampaignsView from '../views/CampaignsView';
import SeoView from '../views/SeoView';
import CrmView from '../views/CrmView';
import GalleryView from '../views/GalleryView';

// Importar componente de Logs
import SystemLogs from './SystemLogs';
import LaunchView from '@/views/LaunchView';

const AdminDashboard = () => {
    const { data, loading, error, refresh } = useDashboardData();
    const { basicAuthHeader, isAuthenticated, logout } = useContext(AuthContext);

    // Estados de UI
    const [activeView, setActiveView] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedService, setSelectedService] = useState('asesoria-financiera');
    const [selectedPlatform, setSelectedPlatform] = useState('facebook');

    // --- ESTADO PARA VISIBILIDAD DE LOGS ---
    const [showLogs, setShowLogs] = useState(false);

    const availableServices = (data?.services && data.services.length > 0) ? data.services : ['asesoria-financiera'];

    useEffect(() => {
        if (!loading && availableServices.length > 0 && !availableServices.includes(selectedService)) {
            setSelectedService(availableServices[0]);
        }
    }, [availableServices, loading, selectedService]);

    // Handlers
    const handleApprove = async (campaignId) => {
        Swal.fire({
            title: 'Activando Campaña...',
            text: 'Sincronizando con la plataforma de anuncios (Meta/Google/LinkedIn)...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            await campaignService.approve(campaignId, basicAuthHeader);
            Swal.fire({
                title: '¡Aprobada!',
                text: 'Campaña activada correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            await refresh();
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Error de Activación',
                text: err.message || 'No se pudo activar la campaña. Revisa los logs del servidor.',
                icon: 'error'
            });
            refresh();
        }
    };

    const handleCreateOnDemand = async () => {
        setIsCreating(true);
        try {
            await campaignService.createOnDemand(selectedService, selectedPlatform, basicAuthHeader);
            Swal.fire({ title: '¡Creada!', text: 'La IA ha generado la campaña.', icon: 'success', confirmButtonColor: '#10b981' });
            refresh();
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleNavClick = (view) => {
        setActiveView(view);
        setIsMobileMenuOpen(false);
    };

    if (!isAuthenticated) return null;

    if (loading) return (
        <div className="h-screen flex justify-center items-center bg-slate-50 text-slate-400 text-xl font-medium">
            <div className="animate-pulse">Cargando Sistema...</div>
        </div>
    );

    if (error) return (
        <div className="h-screen flex flex-col justify-center items-center bg-slate-50 gap-4 text-red-600">
            <h3 className="font-bold text-lg">No se pudo conectar con el sistema.</h3>
            <button onClick={() => refresh()} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Reintentar</button>
        </div>
    );

    if (!data) return null;

    const renderContent = () => {
        switch (activeView) {
            case 'overview': return <OverviewView data={data} />;
            case 'campaigns': return <CampaignsView campaigns={data.campaigns} isCreating={isCreating} availableServices={availableServices} selectedService={selectedService} setSelectedService={setSelectedService} selectedPlatform={selectedPlatform} setSelectedPlatform={setSelectedPlatform} handleCreateOnDemand={handleCreateOnDemand} handleApprove={handleApprove} />;
            case 'launch': return <LaunchView crmData={data.crm_leads} />;
            case 'seo': return <SeoView rankings={data.seo_rankings} content={data.published_content} />;
            case 'gallery': return <GalleryView />;
            case 'crm': return <CrmView leads={data.crm_leads} performance={data.lead_performance} />;
            default: return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">

            {/* --- 1. VENTANA FLOTANTE DE LOGS (GLOBAL) --- */}
            <SystemLogs isOpen={showLogs} onClose={() => setShowLogs(false)} />

            {/* Overlay Móvil */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* --- SIDEBAR --- */}
            <aside
                className={`
                    fixed top-0 left-0 h-screen w-[280px] bg-slate-900 text-white flex flex-col z-50 shadow-2xl transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0
                `}
            >
                <div className="p-8 border-b border-slate-800 flex items-center gap-4 justify-between md:justify-start">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">M</div>
                        <div>
                            <div className="font-extrabold tracking-wide">MARKETING OS</div>
                            <div className="text-xs text-slate-400">v2.0 Enterprise</div>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">✕</button>
                </div>

                <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
                    <SidebarItem icon="📊" label="Visión General" active={activeView === 'overview'} onClick={() => handleNavClick('overview')} />
                    <SidebarItem icon="🚀" label="Gestión de Ads" active={activeView === 'campaigns'} onClick={() => handleNavClick('campaigns')} />
                    <SidebarItem icon="🖼️" label="Galería Activos" active={activeView === 'gallery'} onClick={() => handleNavClick('gallery')} />
                    <SidebarItem icon="🌍" label="SEO & Contenido" active={activeView === 'seo'} onClick={() => handleNavClick('seo')} />
                    <SidebarItem icon="👥" label="CRM Leads" active={activeView === 'crm'} onClick={() => handleNavClick('crm')} />
                    <SidebarItem icon={<span>🚀</span>} label="Lanzamiento & IA" active={activeView === 'launch'} onClick={() => handleNavClick('launch')}
                    />
                </nav>

                <div className="p-8 border-t border-slate-800 bg-slate-900/50">

                    {/* --- 2. BOTÓN PARA ABRIR/CERRAR LOGS --- */}
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className={`w-full mb-4 py-2 px-3 rounded-lg flex items-center gap-3 text-xs font-bold transition-all border ${showLogs ? 'bg-slate-800 text-emerald-400 border-emerald-500/30' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'}`}
                    >
                        <span className="text-base">cmd_</span>
                        {showLogs ? 'Ocultar Terminal' : 'Abrir Terminal'}
                        {showLogs && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                    </button>

                    <div className="mb-6 text-xs text-slate-400 flex flex-col gap-1">
                        <span className="opacity-50 uppercase tracking-wider text-[10px]">Sistema</span>
                        <div>
                            Modo: <span className="text-emerald-400 font-bold tracking-wide">{data.system_mode?.toUpperCase()}</span>
                        </div>
                    </div>

                    <button onClick={logout} className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:shadow-red-600/30 hover:scale-[1.02] transition-all duration-200 text-sm">
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 min-h-screen bg-slate-50 transition-all duration-300 ml-0 md:ml-[280px] w-full">

                <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 md:px-12 py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>

                        <h2 className="text-lg md:text-2xl font-bold text-slate-900 truncate">
                            {activeView === 'overview' && 'Panel de Control'}
                            {activeView === 'campaigns' && 'Centro de Operaciones'}
                            {activeView === 'seo' && 'Estrategia Orgánica'}
                            {activeView === 'crm' && 'Inteligencia de Clientes'}
                            {activeView === 'gallery' && 'Galería de Activos'}
                        </h2>
                    </div>

                    <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-100">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Sistema Operativo
                    </div>
                    <div className="md:hidden w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </header>

                <div className="p-4 md:p-10 max-w-7xl mx-auto w-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

// Componente SidebarItem
const SidebarItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
            w-full flex items-center px-6 md:px-8 py-4 text-left transition-all duration-200 border-l-4
            ${active
                ? 'bg-slate-800 border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }
        `}
    >
        <span className="mr-3 text-lg">{icon}</span>
        <span className="font-medium text-sm">{label}</span>
    </button>
);

export default AdminDashboard;