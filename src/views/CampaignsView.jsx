import React from 'react';
import CampaignTable from '../components/CampaignTable';

// Icono de Robot/IA SVG
const RobotIcon = () => (
    <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const CampaignsView = ({ 
    campaigns, 
    isCreating, 
    availableServices, 
    selectedService, 
    setSelectedService, 
    selectedPlatform, 
    setSelectedPlatform, 
    handleCreateOnDemand, 
    handleApprove 
}) => {
    return (
        <div className="animate-fade-in-up space-y-8">
            
            {/* --- ACTION BAR (GENERADOR IA) --- */}
            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                {/* Fondo decorativo */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                    
                    {/* Texto e Icono */}
                    <div className="flex items-center gap-5 text-center lg:text-left">
                        <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hidden sm:block">
                            <RobotIcon />
                        </div>
                        <div>
                            <h3 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                                Generador de Campañas <span className="text-blue-400">IA</span>
                            </h3>
                            <p className="text-slate-400 text-sm font-medium">
                                Selecciona parámetros y deja que la inteligencia artificial redacte y configure tu anuncio.
                            </p>
                        </div>
                    </div>

                    {/* Controles */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <select 
                            value={selectedService} 
                            onChange={e => setSelectedService(e.target.value)} 
                            className="px-4 py-3 rounded-xl border border-transparent bg-slate-800 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 outline-none transition-all w-full lg:w-64 cursor-pointer hover:bg-slate-700/80"
                        >
                            {availableServices.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        
                        <select 
                            value={selectedPlatform} 
                            onChange={e => setSelectedPlatform(e.target.value)} 
                            className="px-4 py-3 rounded-xl border border-transparent bg-slate-800 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 outline-none transition-all w-full lg:w-40 cursor-pointer hover:bg-slate-700/80"
                        >
                            <option value="facebook">Facebook</option>
                            <option value="google">Google</option>
                            <option value="linkedin">LinkedIn</option>
                        </select>
                        
                        <button 
                            onClick={handleCreateOnDemand} 
                            disabled={isCreating} 
                            className={`
                                px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 
                                transition-all transform active:scale-95 flex items-center justify-center gap-2 min-w-[160px]
                                ${isCreating ? 'opacity-70 cursor-not-allowed animate-pulse' : ''}
                            `}
                        >
                            {isCreating ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <span>+ Crear</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TABLA DE CAMPAÑAS --- */}
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