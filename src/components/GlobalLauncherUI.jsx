import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';

const GlobalLauncherUI = ({ onLaunch, isProcessing }) => {
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files;
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    const file = fileInputRef.current?.files;
    if (!file || !title) {
      return Swal.fire('Faltan datos', 'Debes subir una imagen y un título.', 'warning');
    }
    onLaunch(file, title);
  };

  return (
    <div className="p-6 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Efecto de fondo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🚀 Lanzamiento Global
          </h2>
          <p className="text-slate-400 text-sm">
            Impacta a toda tu base de datos histórica con una sola acción.
          </p>
        </div>

        {/* Input Título */}
        <input 
          type="text" 
          placeholder="Título del Seminario o Promoción..." 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
        />

        {/* Área de Carga */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />

        {!preview ? (
          <div 
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-10 text-center hover:bg-slate-800/50 transition-all cursor-pointer group"
          >
            <span className="text-4xl mb-2 block group-hover:scale-110 transition-transform">📸</span>
            <span className="text-emerald-400 font-medium">Click para subir Arte (JPG/PNG)</span>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-700">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover opacity-80" />
            <button 
              onClick={() => { setPreview(null); fileInputRef.current.value = ''; }}
              className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-500"
            >
              ✕
            </button>
          </div>
        )}

        <button 
          disabled={isProcessing}
          onClick={handleSubmit}
          className={`w-full mt-6 py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2
            ${isProcessing 
              ? 'bg-slate-700 text-slate-400 cursor-wait' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 active:scale-[0.98]'}
          `}
        >
          {isProcessing ? '⏳ Sincronizando Audiencias...' : '🔥 LANZAR A TODA LA BASE DE DATOS'}
        </button>
      </div>
    </div>
  );
};

export default GlobalLauncherUI;