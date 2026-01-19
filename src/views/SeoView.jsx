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
        <div className="p-2 md:p-6 w-full">
            {/* 3. ENCABEZADO SUPERIOR CON EL BOTÓN DE ACCIÓN */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Estrategia Orgánica</h2>
                    <p className="text-slate-500 text-sm">Monitorización de rankings y generación de contenido automático.</p>
                </div>
                
                <button 
                    onClick={handleForceBoost}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    ⚡ Force SEO Boost
                </button>
            </div>

            {/* 4. GRID DE CONTENIDO (Tu estructura original mejorada) */}
            <div className="animate-fade-in-up flex flex-col lg:flex-row gap-8 w-full">
                
                {/* COLUMNA IZQUIERDA: RANKINGS */}
                <div className="flex-1 w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                        🌍 Rankings Internacionales
                    </h3>
                    <div className="flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                        <SeoRankingTable rankings={rankings} />
                    </div>
                </div>

                {/* COLUMNA DERECHA: CONTENIDO */}
                <div className="flex-1 w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                        📝 Contenido Publicado
                    </h3>
                    <div className="flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                        <ContentTable content={content} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeoView;