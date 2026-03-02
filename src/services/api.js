// src/services/api.js
import { API_BASE_URL, ADMIN_PANEL_ENDPOINT, MARK_READ_ENDPOINT } from '../app/config';

export const campaignService = {
  approve: async (campaignId, token) => {
    [cite_start]// ... (código existente) [cite: 948]
    const response = await fetch(`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', campaign_id: campaignId })
    });
    if (!response.ok) throw new Error('Error al aprobar campaña');
    return response.json();
  },

  createOnDemand: async (service, platform, token) => {
    [cite_start]// ... (código existente) [cite: 949]
    const response = await fetch(`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_on_demand_campaign',
        service,
        platform
      })
    });
    if (!response.ok) throw new Error('Error al crear campaña');
    return response.json();
  },

  // --- NUEVA FUNCIÓN PARA SUBIR IMAGEN ---
  uploadCreative: async (formData, token) => {
    // NOTA: No seteamos 'Content-Type': 'multipart/form-data' manualmente.
    // El navegador lo hace automáticamente al detectar FormData e incluye el 'boundary'.
    const response = await fetch(`${API_BASE_URL}/api/v1/assets/upload_creative`, {
      method: 'POST',
      headers: {
        'Authorization': token
      },
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al subir imagen y crear campaña');
    }
    return response.json();
  },

  // --- NUEVAS FUNCIONES ---
  getCreatives: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assets/creatives`, {
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Error al cargar galería');
    return response.json();
  },

  deleteCreative: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assets/creatives/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    });
    if (!response.ok) throw new Error('Error al eliminar imagen');
    return response.json();
  },

  resetMetrics: async (campaignId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/reset`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('No se pudo resetear la base de datos local');
    return response.json();
  },

  deleteCampaign: async (campaignId, token, deleteOnPlatform = true) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ delete_on_platform: deleteOnPlatform })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al eliminar campaña');
    }
    return response.json();
  }

};

export const launchService = {
  // 1. Lanzamiento Masivo (Global Launch) [1]
  executeGlobalLaunch: async (formData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/launch/global`, {
      method: 'POST',
      headers: { 'Authorization': token }, // No poner Content-Type, el navegador pone el boundary
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Error en lanzamiento global');
    }
    return response.json();
  },

  // 2. SEO Boost Manual [2]
  triggerSeoBoost: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/force-boost`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Error al iniciar SEO Boost');
    return response.json();
  },

  // 2b. Ranking Check Manual
  triggerRankingCheck: async (scope, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/manual-ranking-check`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ scope })
    });
    if (!response.ok) throw new Error('Error al iniciar verificación de rankings');
    return response.json();
  },

  // 2c. Scraping Manual de Servicios
  triggerScraping: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/manual-scraping`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Error al iniciar scraping');
    return response.json();
  },

  // 3. Sincronizar Lookalikes (Gemelos) [3]
  syncLookalikes: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/audiences/sync-lookalikes`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Error sincronizando audiencias');
    return response.json();
  },

  fixLinkedInBids: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/linkedin/fix-bids`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Error al intentar reparar las pujas');
    return response.json();
  },

  // 5. Fix LinkedIn Targeting (Geo países)
  fixLinkedInTargeting: async (token, countries = null) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/linkedin/fix-targeting`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ countries }) // null = usa config por defecto del backend
    });
    if (!response.ok) throw new Error('Error al actualizar targeting');
    return response.json();
  },

  // 6. Limpiar historial de contenido SEO publicado
  clearSeoHistory: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/clear-seo-history`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Error al limpiar el historial SEO');
    return response.json();
  },

  // 7. Consultar créditos de SerpHouse
  getSeoCredits: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/credits`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Error al consultar créditos');
    return response.json();
  },

  // 8. Generación Manual de Contenido (Artículo + FAQs)
  triggerManualGenesis: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/manual-genesis`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Error al iniciar generación manual de contenido');
    return response.json();
  }
};

export const notificationService = {
  markAsRead: async (notificationId, token) => {
    const response = await fetch(`${API_BASE_URL}${MARK_READ_ENDPOINT}/${notificationId}`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Error al marcar notificación como leída');
    return response.json();
  }
};