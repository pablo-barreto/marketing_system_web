import React, { useState, useContext, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { launchService, campaignService } from '../services/api';
import GlobalLauncherUI from '../components/GlobalLauncherUI';
import IntentDashboard from '../components/IntentDashboard';

const LaunchView = ({ crmData }) => {
  const { basicAuthHeader } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // --- Campaña Manual ---
  const [manualLoading, setManualLoading] = useState(false);
  const [manualFile, setManualFile] = useState(null);
  const [manualPreview, setManualPreview] = useState(null);
  const [manualForm, setManualForm] = useState({ title: '', body: '', redirect_url: '', platform: 'facebook', budget: 50000 });
  const manualFileInputRef = useRef(null);

  // -----------------------------------------------------------------------
  // 1. LÓGICA DE INTELIGENCIA DE DATOS (CRM)
  // -----------------------------------------------------------------------

  // A. Obtener lista única de todos los roles disponibles para el selector manual
  const availableRoles = useMemo(() => {
    if (!crmData) return [];
    const roles = crmData
      .map(lead => lead.role)
      // Filtramos nulos, vacíos y roles genéricos que no sirven para segmentar
      .filter(role => role && role.trim().length > 2 && !['visitante', 'desconocido', 'n/a', 'otro'].includes(role.toLowerCase()))
      .map(role => role.trim());

    // Retornamos lista única ordenada alfabéticamente
    return [...new Set(roles)].sort();
  }, [crmData]);

  // B. Calcular automáticamente el TOP 5 de roles más frecuentes (Para modo automático)
  const topRolesDetected = useMemo(() => {
    if (!crmData) return [];

    const counts = {};
    crmData.forEach(lead => {
      const r = lead.role?.trim();
      if (r && r.length > 2 && !['visitante', 'desconocido', 'otro'].includes(r.toLowerCase())) {
        counts[r] = (counts[r] || 0) + 1;
      }
    });

    // Ordenamos por frecuencia (Mayor a menor) y tomamos los 5 primeros
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }, [crmData]);

  // Métricas rápidas para el Dashboard
  // Lógica Estricta de Crisis: Solo cuenta si menciona palabras clave de riesgo
  const urgentLeads = crmData?.filter(l => {
    const keywords = ['embargo', 'dian', 'sancion', 'multa', 'urgente', 'tributaria'];
    const interest = (l.service_interest || '').toLowerCase();
    return keywords.some(k => interest.includes(k));
  }).length || 0;

  const generalLeads = (crmData?.length || 0) - urgentLeads;

  // -----------------------------------------------------------------------
  // 2. HANDLERS DE ACCIÓN
  // -----------------------------------------------------------------------

  // A. Lanzamiento Global con Segmentación y Presupuesto
  const handleGlobalLaunch = async (file, title, mode, roles, budget) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', title);
      formData.append('context', 'seminario');

      // Enviamos la configuración de segmentación al Backend
      formData.append('segmentation_mode', mode); // 'all', 'top_roles', 'specific'
      formData.append('budget', budget); // <--- NUEVO: Presupuesto

      if (mode === 'specific' && roles) {
        formData.append('target_roles', roles);
      }

      const res = await launchService.executeGlobalLaunch(formData, basicAuthHeader);

      // Construimos un mensaje de éxito detallado
      let successMsg = `Se impactaron ${res.leads_impacted || 'múltiples'} leads.`;
      if (res.segment === 'top_roles') successMsg += ` Roles Top: [${res.roles_targeted?.join(', ')}]`;
      if (res.segment === 'specific') successMsg += ` Roles: [${res.roles_targeted?.join(', ')}]`;

      Swal.fire({
        title: '¡Lanzamiento Exitoso!',
        text: successMsg,
        icon: 'success'
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Manual Campaign Handler
  const handleManualFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setManualFile(file);
    setManualPreview(URL.createObjectURL(file));
  };

  const handleManualCampaign = async (e) => {
    e.preventDefault();
    const { title, body, redirect_url, platform, budget } = manualForm;
    if (!manualFile || !title.trim() || !body.trim() || !redirect_url.trim()) {
      Swal.fire('Campos incompletos', 'Completa imagen, título, copy y URL de destino.', 'warning');
      return;
    }
    setManualLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', manualFile);
      formData.append('title', title.trim());
      formData.append('body', body.trim());
      formData.append('redirect_url', redirect_url.trim());
      formData.append('platform', platform);
      formData.append('budget', budget);

      const res = await campaignService.createManualCampaign(formData, basicAuthHeader);
      const platforms = res.created?.map(c => c.platform).join(', ') || 'plataformas';
      Swal.fire({ title: '¡Campaña Creada!', text: `Publicada en: ${platforms}`, icon: 'success' });
      setManualForm({ title: '', body: '', redirect_url: '', platform: 'facebook', budget: 50000 });
      setManualFile(null);
      setManualPreview(null);
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setManualLoading(false);
    }
  };

  // B. Sincronización de Lookalikes (CON REPORTE DETALLADO VISUAL)
  const handleSyncLookalikes = async () => {
    // 1. Mostrar estado de carga
    Swal.fire({
      title: 'Analizando Base de Datos...',
      text: 'Filtrando clientes de alto valor (Gerentes, Score > 60)...',
      didOpen: () => Swal.showLoading()
    });

    try {
      // 2. Llamada al Backend
      const res = await launchService.syncLookalikes(basicAuthHeader);

      // 3. Formatear los detalles de las plataformas (HTML)
      const detailsHtml = Object.entries(res.platforms || {})
        .map(([plat, status]) => `<li style="margin-bottom:4px; font-size: 0.85rem;"><b>${plat}:</b> <span style="color:#059669">${status}</span></li>`)
        .join('');

      // 4. Mostrar alerta con los datos reales
      Swal.fire({
        title: '¡Sincronización VIP Completa!',
        html: `
            <div style="text-align: left; font-size: 0.95rem; line-height: 1.5;">
                <p style="margin-bottom: 12px; color: #1e293b;">
                    El sistema detectó <b>${res.vip_leads_count || 0} Leads de Alto Valor</b> en tu CRM y los envió como semilla.
                </p>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
                    <p style="font-size: 0.75rem; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Reporte de Inyección:</p>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${detailsHtml || '<li style="color:#94a3b8">Sin detalles de plataforma</li>'}
                    </ul>
                </div>
                <p style="font-size: 0.75rem; color: #64748b; font-style: italic; text-align: center;">
                    * Meta y LinkedIn tardarán entre 1 y 24 horas en recalcular los públicos similares.
                </p>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#10b981'
      });

    } catch (error) {
      Swal.fire({
        title: 'Error de Sincronización',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Centro de Comando</h1>
        <p className="text-slate-500">Gestión de Audiencias e Inteligencia Artificial</p>
      </div>

      {/* Dashboard de Métricas de Intención */}
      <IntentDashboard
        urgentCount={urgentLeads}
        generalCount={generalLeads}
        onSyncLookalikes={handleSyncLookalikes}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* COMPONENTE PRINCIPAL DE LANZAMIENTO */}
        {/* Le pasamos los datos calculados (availableRoles y topRoles) */}
        <GlobalLauncherUI
          onLaunch={handleGlobalLaunch}
          isProcessing={loading}
          availableRoles={availableRoles}
          topRoles={topRolesDetected}
        />

        {/* Panel Informativo Lateral */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-bold text-slate-700 mb-4">💡 Estrategia de Segmentación</h3>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold text-lg">🌍</span>
              <div>
                <strong>Masivo (All):</strong> Impacta a toda la base de datos histórica. Ideal para branding general.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500 font-bold text-lg">🏆</span>
              <div>
                <strong>Top Roles (IA):</strong> El sistema detecta automáticamente los 5 cargos más frecuentes y lanza solo a ellos.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold text-lg">🎯</span>
              <div>
                <strong>Específico:</strong> Selección quirúrgica manual. Usa el buscador para elegir cargos exactos.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CAMPAÑA MANUAL — WhatsApp CTA + URL de redirección personalizada    */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <span className="text-2xl">✏️</span>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Campaña Manual</h3>
            <p className="text-slate-500 text-sm">Contenido libre · CTA WhatsApp · Enlace de imagen personalizado</p>
          </div>
        </div>

        <form onSubmit={handleManualCampaign} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Columna izquierda: imagen + preview */}
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-400 transition-colors min-h-[180px] bg-slate-50"
              onClick={() => manualFileInputRef.current?.click()}
            >
              {manualPreview ? (
                <img src={manualPreview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <span className="text-4xl text-slate-300">🖼️</span>
                  <p className="text-sm text-slate-400 text-center">Haz clic para subir la imagen del anuncio</p>
                </>
              )}
              <input
                ref={manualFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleManualFileChange}
              />
            </div>
            {manualFile && (
              <p className="text-xs text-slate-400 text-center truncate">{manualFile.name}</p>
            )}

            {/* Plataforma y Presupuesto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Plataforma</label>
                <select
                  value={manualForm.platform}
                  onChange={e => setManualForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="all">Ambas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Presupuesto diario (COP)</label>
                <input
                  type="number"
                  min={20000}
                  step={5000}
                  value={manualForm.budget}
                  onChange={e => setManualForm(f => ({ ...f, budget: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>

          {/* Columna derecha: textos y URL */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Título del anuncio <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="Ej: Webinar Gratuito — Cierre Tributario 2025"
                value={manualForm.title}
                onChange={e => setManualForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                maxLength={150}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Copy / Cuerpo del anuncio <span className="text-red-400">*</span></label>
              <textarea
                rows={4}
                placeholder="Texto principal que verá el usuario en el anuncio..."
                value={manualForm.body}
                onChange={e => setManualForm(f => ({ ...f, body: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-slate-400 text-right">{manualForm.body.length}/500</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                URL de destino (clic en imagen) <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                placeholder="https://crconsultorescolombia.com/webinar"
                value={manualForm.redirect_url}
                onChange={e => setManualForm(f => ({ ...f, redirect_url: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-slate-400 mt-1">El botón CTA abrirá WhatsApp. La imagen lleva a esta URL.</p>
            </div>

            <button
              type="submit"
              disabled={manualLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {manualLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creando campaña...
                </>
              ) : (
                '🚀 Publicar Campaña Manual'
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default LaunchView;