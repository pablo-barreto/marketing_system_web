'use client';
import React, { useContext } from 'react';
import SeoRankingTable from '../components/SeoRankingTable';
import ContentTable from '../components/ContentTable';
import { AuthContext } from '../context/AuthContext';
import { launchService } from '../services/api';
import Swal from 'sweetalert2';

const SeoView = ({ rankings, content }) => {
    const { basicAuthHeader } = useContext(AuthContext);

    const handleForceBoost = async () => {
        Swal.fire({
            title: '¿Iniciar Ciclo Intensivo?',
            text: 'La IA analizará rankings, generará contenido legal y lo publicará en el CMS. Esto puede tardar unos minutos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, Potenciar SEO',
            confirmButtonColor: '#d97706'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await launchService.triggerSeoBoost(basicAuthHeader);
                    Swal.fire('Iniciado', 'El motor SEO está trabajando en segundo plano.', 'success');
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    return (
        <div className="p-2 md:p-6 w-full max-w-full overflow-x-hidden">
            {/* 3. ENCABEZADO SUPERIOR CON EL BOTÓN DE ACCIÓN */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Estrategia Orgánica</h2>
                    <p className="text-slate-500 text-sm mt-1">Monitorización de rankings y generación de contenido automático.</p>
                </div>
                
                <button 
                    onClick={handleForceBoost}
                    className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <span>⚡ Force SEO Boost</span>
                </button>
            </div>

            {/* 4. GRID DE CONTENIDO - Optimizado para iOS y Mobile */}
            <div className="animate-fade-in-up flex flex-col lg:flex-row gap-8 w-full">
                
                {/* COLUMNA IZQUIERDA: RANKINGS */}
                {/* CAMBIO: Se elimina h-[600px] y se usa min-h para evitar colapsos en Safari */}
                <div className="flex-1 w-full bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[450px] h-auto">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 shrink-0">
                        <span className="text-xl">🌍</span> Rankings Internacionales
                    </h3>
                    <div className="flex-1 overflow-visible md:overflow-y-auto rounded-xl">
                        <SeoRankingTable rankings={rankings} />
                    </div>
                </div>

                {/* COLUMNA DERECHA: CONTENIDO */}
                {/* CAMBIO: Se elimina h-[600px] para permitir que iOS maneje el scroll natural del dispositivo */}
                <div className="flex-1 w-full bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[450px] h-auto">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 shrink-0">
                        <span className="text-xl">📝</span> Contenido Publicado
                    </h3>
                    <div className="flex-1 overflow-visible md:overflow-y-auto rounded-xl">
                        <ContentTable content={content} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeoView;