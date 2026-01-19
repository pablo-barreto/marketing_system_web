import React, { useState, useContext } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { launchService } from '../services/api';
import GlobalLauncherUI from '../components/GlobalLauncherUI';
import IntentDashboard from '../components/IntentDashboard';

const LaunchView = ({ crmData }) => {
  const { basicAuthHeader } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Calcular métricas simples para el dashboard
  const urgentLeads = crmData?.filter(l => l.lead_score > 80 || l.service_interest?.includes('Tributaria')).length || 0;
  const generalLeads = (crmData?.length || 0) - urgentLeads;

  // Handler: Lanzamiento Masivo
  const handleGlobalLaunch = async (file, title) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', title);
      formData.append('context', 'seminario'); // Default context

      const res = await launchService.executeGlobalLaunch(formData, basicAuthHeader);

      Swal.fire({
        title: '¡Lanzamiento Exitoso!',
        text: `Se impactaron ${res.leads_impacted || 'múltiples'} leads en Meta y LinkedIn.`,
        icon: 'success'
      });
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Lookalikes
  const handleSyncLookalikes = async () => {
    Swal.fire({ title: 'Sincronizando...', didOpen: () => Swal.showLoading() });
    try {
      await launchService.syncLookalikes(basicAuthHeader);
      Swal.fire('Sincronizado', 'Las audiencias Lookalike se han actualizado.', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Centro de Comando</h1>
        <p className="text-slate-500">Gestión de Audiencias e Inteligencia Artificial</p>
      </div>

      {/* 1. Dashboard de Inteligencia */}
      <IntentDashboard 
        urgentCount={urgentLeads}
        generalCount={generalLeads}
        onSyncLookalikes={handleSyncLookalikes}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Lanzador Global */}
        <GlobalLauncherUI 
          onLaunch={handleGlobalLaunch} 
          isProcessing={loading} 
        />

        {/* 3. Panel Informativo / Logs Rápidos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">💡 Estrategia Activa</h3>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Enrutamiento por Miedo:</strong> Activo. Palabras clave como "Sanción" o "Embargo" disparan campañas de urgencia.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Retargeting Omnicanal:</strong> Meta y LinkedIn sincronizados.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">ℹ</span>
              <span>Usa el lanzador de la izquierda para promocionar Seminarios o Webinars a toda la lista histórica.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LaunchView;