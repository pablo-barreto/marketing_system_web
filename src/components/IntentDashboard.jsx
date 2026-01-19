import React from 'react';

const IntentDashboard = ({ urgentCount = 0, generalCount = 0, onSyncLookalikes }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Estrategia 1: URGENCIA (Miedo) */}
      <div className="bg-gradient-to-br from-red-900/40 to-slate-900 border border-red-500/30 p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl">🚨</div>
        <div className="flex justify-between items-center mb-4 relative z-10">
          <span className="text-red-400 font-bold text-xs tracking-widest uppercase">Tráfico de Crisis</span>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        <p className="text-white text-4xl font-black mb-1">{urgentCount}</p>
        <p className="text-red-200/60 text-sm">Leads con riesgo legal (Embargos/DIAN)</p>
      </div>

      {/* Estrategia 1: GENERAL */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-blue-400 font-bold text-xs tracking-widest uppercase">Tráfico Informativo</span>
        </div>
        <p className="text-white text-4xl font-black mb-1">{generalCount}</p>
        <p className="text-slate-400 text-sm">Visitantes generales</p>
      </div>

      {/* Estrategia 3: LOOKALIKES */}
      <div className="flex flex-col justify-center">
        <button 
          onClick={onSyncLookalikes}
          className="h-full w-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/20 flex flex-col items-center justify-center gap-2 group"
        >
          <span className="text-2xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
          <span>Sincronizar Lookalikes</span>
          <span className="text-indigo-200 text-xs font-normal">Crear gemelos en Meta/LinkedIn</span>
        </button>
      </div>
    </div>
  );
};

export default IntentDashboard;