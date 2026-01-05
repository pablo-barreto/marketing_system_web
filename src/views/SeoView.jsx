import React from 'react';
import SeoRankingTable from '../components/SeoRankingTable';
import ContentTable from '../components/ContentTable';

const SeoView = ({ rankings, content }) => {
    return (
        // CLAVE: 'flex-col' por defecto (móvil) y 'lg:flex-row' en pantallas grandes
        <div className="animate-fade-in-up flex flex-col lg:flex-row gap-8 w-full">
            
            {/* COLUMNA IZQUIERDA: RANKINGS */}
            {/* 'w-full' asegura que ocupe todo el ancho en móvil */}
            <div className="flex-1 w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                    🌍 Rankings Internacionales
                </h3>
                {/* Contenedor con overflow para permitir scroll horizontal si la tabla es muy ancha */}
                <div className="flex-1 overflow-x-auto rounded-xl border border-slate-100">
                    <SeoRankingTable rankings={rankings} />
                </div>
            </div>

            {/* COLUMNA DERECHA: CONTENIDO */}
            <div className="flex-1 w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                    📝 Contenido Publicado
                </h3>
                <div className="flex-1 overflow-x-auto rounded-xl border border-slate-100">
                    <ContentTable content={content} />
                </div>
            </div>
        </div>
    );
};

export default SeoView;