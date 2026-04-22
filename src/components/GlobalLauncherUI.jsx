import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';

const GlobalLauncherUI = ({ onLaunch, onSyncAudience, isProcessing, availableRoles = [], topRoles = [], activeCampaigns = [] }) => {
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [segmentationMode, setSegmentationMode] = useState('all');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [budget, setBudget] = useState(50000);

  // Modo de lanzamiento: 'new' = crear campañas nuevas, 'existing' = enviar a existentes
  const [launchType, setLaunchType] = useState('new');
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleAddRole = (e) => {
    const roleToAdd = e.target.value;
    if (roleToAdd && !selectedRoles.includes(roleToAdd)) {
      setSelectedRoles([...selectedRoles, roleToAdd]);
    }
    e.target.value = "";
  };

  const handleRemoveRole = (roleToRemove) => {
    setSelectedRoles(selectedRoles.filter(r => r !== roleToRemove));
  };

  const handleToggleCampaign = (id) => {
    setSelectedCampaignIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (launchType === 'existing') {
      if (selectedCampaignIds.length === 0) {
        return Swal.fire('Sin campañas', 'Selecciona al menos una campaña existente.', 'warning');
      }
      const rolesString = selectedRoles.join(',');
      onSyncAudience(segmentationMode, rolesString, selectedCampaignIds);
      return;
    }

    // Modo 'new': validaciones estándar
    const file = fileInputRef.current?.files[0];

    if (!file || !title) {
      return Swal.fire('Faltan datos', 'Debes subir una imagen y un título.', 'warning');
    }

    if (segmentationMode === 'specific' && selectedRoles.length === 0) {
      return Swal.fire('Selección vacía', 'Selecciona al menos un rol de la lista para el modo específico.', 'warning');
    }

    if (!budget || budget < 20000) {
      return Swal.fire('Presupuesto inválido', 'El presupuesto mínimo es $20.000 COP.', 'warning');
    }

    const rolesString = selectedRoles.join(',');
    onLaunch(file, title, segmentationMode, rolesString, budget);
  };

  const handleReset = () => {
    setPreview(null);
    setTitle('');
    setSegmentationMode('all');
    setSelectedRoles([]);
    setBudget(50000);
    setLaunchType('new');
    setSelectedCampaignIds([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🚀 Lanzamiento Global
          </h2>
          <p className="text-slate-400 text-sm">
            Configura tu campaña de Retargeting en Meta & LinkedIn.
          </p>
        </div>

        {/* TOGGLE: Modo de lanzamiento */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Modo de Operación</label>
          <div className="flex gap-2">
            <button
              onClick={() => setLaunchType('new')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                launchType === 'new'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              ✨ Crear Nueva Campaña
            </button>
            <button
              onClick={() => setLaunchType('existing')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                launchType === 'existing'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              📡 Enviar a Existentes
            </button>
          </div>
        </div>

        {/* ── MODO NUEVA CAMPAÑA ── */}
        {launchType === 'new' && (
          <>
            {/* Título */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título de Campaña</label>
              <input
                type="text"
                placeholder="Ej: Seminario de Actualización..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-600"
              />
            </div>

            {/* Presupuesto */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presupuesto Diario (COP)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400">$</span>
                <input
                  type="number"
                  placeholder="Ej: 50000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="20000"
                  step="5000"
                  className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-600 font-mono"
                />
              </div>
              <p className="text-xs text-slate-600 mt-1 ml-1">Mínimo recomendado: $20.000 COP</p>
            </div>
          </>
        )}

        {/* Estrategia de Segmentación (compartida por ambos modos) */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estrategia de Segmentación</label>
          <select
            value={segmentationMode}
            onChange={(e) => setSegmentationMode(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
          >
            <option value="all">🌍 Masivo (Toda la Base de Datos)</option>
            <option value="top_roles">🏆 Automático (Top 5 Cargos Frecuentes)</option>
            <option value="specific">🎯 Manual (Cargos Específicos)</option>
          </select>
        </div>

        {/* Top Roles (lectura) */}
        {segmentationMode === 'top_roles' && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 bg-amber-500/10 p-4 rounded-xl border border-amber-500/30">
            <label className="block text-xs font-bold text-amber-500 uppercase mb-2">
              ⚡ El sistema lanzará a estos cargos:
            </label>
            <div className="flex flex-wrap gap-2">
              {topRoles.length > 0 ? (
                topRoles.map((role, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                    {idx + 1}. {role}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs italic">No hay suficientes datos para calcular el Top.</span>
              )}
            </div>
          </div>
        )}

        {/* Selector manual de roles */}
        {segmentationMode === 'specific' && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <label className="block text-xs font-bold text-emerald-500 uppercase mb-2">
              Busca y agrega cargos del CRM ({availableRoles.length} disponibles)
            </label>
            <div className="relative">
              <select
                onChange={handleAddRole}
                defaultValue=""
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer mb-3 appearance-none"
              >
                <option value="" disabled>👇 Seleccionar cargo...</option>
                {availableRoles.map((role, i) => (
                  <option key={i} value={role}>{role}</option>
                ))}
              </select>
              <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">▼</div>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
              {selectedRoles.length === 0 && <span className="text-slate-500 text-xs italic p-1">Ningún cargo seleccionado aún.</span>}
              {selectedRoles.map((role, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-in zoom-in">
                  {role}
                  <button
                    onClick={() => handleRemoveRole(role)}
                    className="ml-1 hover:text-white w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-600 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── MODO CAMPAÑAS EXISTENTES: Selector ── */}
        {launchType === 'existing' && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2">
            <label className="block text-xs font-bold text-blue-400 uppercase mb-2">
              Campañas activas disponibles ({activeCampaigns.length})
            </label>
            {activeCampaigns.length === 0 ? (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-slate-400 text-xs italic text-center">
                No hay campañas activas. Crea una primero o verifica el estado en la vista de Campañas.
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 divide-y divide-slate-700 max-h-48 overflow-y-auto">
                {activeCampaigns.map((camp) => (
                  <label
                    key={camp.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCampaignIds.includes(camp.id)}
                      onChange={() => handleToggleCampaign(camp.id)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-xs">
                      <span className={`font-bold mr-2 ${camp.platform === 'facebook' ? 'text-blue-400' : 'text-sky-400'}`}>
                        {camp.platform === 'facebook' ? '📘 Meta' : '🔗 LinkedIn'}
                      </span>
                      <span className="text-white">{camp.service || camp.name || camp.id}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedCampaignIds.length > 0 && (
              <p className="text-xs text-blue-400 mt-2 ml-1">
                {selectedCampaignIds.length} campaña(s) seleccionada(s)
              </p>
            )}
          </div>
        )}

        {/* ── Carga de imagen (solo en modo nueva) ── */}
        {launchType === 'new' && (
          <>
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
                className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition-all cursor-pointer group mb-6"
              >
                <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">📸</span>
                <span className="text-emerald-400 font-medium text-sm">Subir Arte (JPG/PNG)</span>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 mb-6 bg-black/50 group">
                <img src={preview} alt="Preview" className="w-full h-40 object-contain" />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-black/60 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500 transition-colors shadow-lg"
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}

        {/* Botón Principal */}
        <button
          disabled={isProcessing}
          onClick={handleSubmit}
          className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide mt-2
            ${isProcessing
              ? 'bg-slate-700 text-slate-400 cursor-wait'
              : launchType === 'existing'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 active:scale-[0.98]'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 active:scale-[0.98] hover:shadow-emerald-500/20'
            }
          `}
        >
          {isProcessing
            ? '⏳ Procesando...'
            : launchType === 'existing'
              ? '📡 Sincronizar Audiencia'
              : '🔥 Ejecutar Lanzamiento'}
        </button>
      </div>
    </div>
  );
};

export default GlobalLauncherUI;
