import React, { useState, useContext, useMemo } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { launchService } from '../services/api';
import GlobalLauncherUI from '../components/GlobalLauncherUI';
import IntentDashboard from '../components/IntentDashboard';

const LaunchView = ({ crmData }) => {
  const { basicAuthHeader } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // -----------------------------------------------------------------------
  // 1. LÓGICA DE INTELIGENCIA DE DATOS (CRM)
  // -----------------------------------------------------------------------
  
  // A. Obtener lista única de todos los roles disponibles para el selector
  const availableRoles = useMemo(() => {
    if (!crmData) return [];
    const roles = crmData
      .map(lead => lead.role)
      // Filtramos nulos, vacíos y roles genéricos que no sirven para segmentar
      .filter(role => role && role.trim().length > 2 && !['visitante', 'desconocido', 'n/a'].includes(role.toLowerCase()))
      .map(role => role.trim());
      
    // Retornamos lista única ordenada alfabéticamente
    return [...new Set(roles)].sort(); 
  }, [crmData]);

  // B. Calcular automáticamente el TOP 5 de roles más frecuentes
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
  const urgentLeads = crmData?.filter(l => l.lead_score > 80 || l.service_interest?.includes('Tributaria')).length || 0;
  const generalLeads = (crmData?.length || 0) - urgentLeads;

  // -----------------------------------------------------------------------
  // 2. HANDLERS DE ACCIÓN
  // -----------------------------------------------------------------------

  // Lanzamiento Global con Segmentación
  const handleGlobalLaunch = async (file, title, mode, roles) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', title);
      formData.append('context', 'seminario');
      
      // Enviamos la configuración de segmentación al Backend
      formData.append('segmentation_mode', mode); // 'all', 'top_roles', 'specific'
      
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

  // Sincronización de Lookalikes
  const handleSyncLookalikes = async () => {
    Swal.fire({ title: 'Sincronizando...', didOpen: () => Swal.showLoading() });
    try {
      await launchService.syncLookalikes(basicAuthHeader);
      Swal.fire('Sincronizado', 'Las audiencias Lookalike se han actualizado en Meta/LinkedIn.', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Centro de Comando</h1>
        <p className="text-slate-500">Gestión de Audiencias e Inteligencia Artificial</p>
      </div>

      {/* Dashboard de Métricas */}
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
    </div>
  );
};

export default LaunchView;