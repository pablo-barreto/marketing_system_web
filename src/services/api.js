// src/services/api.js
import { API_BASE_URL, ADMIN_PANEL_ENDPOINT, MARK_READ_ENDPOINT } from '../app/config';

/**
 * Extrae el mensaje de error del servidor si viene en JSON,
 * y lanza un Error con status adjunto para que los componentes
 * puedan distinguir 401/403/500 si lo necesitan.
 */
async function handleApiResponse(response) {
  if (!response.ok) {
    let message;
    try {
      const data = await response.json();
      message = data.message || data.error || data.detail || `Error ${response.status}`;
    } catch {
      message = `Error ${response.status}: ${response.statusText}`;
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

export const campaignService = {
  approve: async (campaignId, token) => {
    const response = await fetch(`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', campaign_id: campaignId })
    });
    return handleApiResponse(response);
  },

  createOnDemand: async (service, platform, token) => {
    const response = await fetch(`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_on_demand_campaign', service, platform })
    });
    return handleApiResponse(response);
  },

  uploadCreative: async (formData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assets/upload_creative`, {
      method: 'POST',
      headers: { 'Authorization': token },
      body: formData
    });
    return handleApiResponse(response);
  },

  relaunchCreative: async (creativeId, budget, platform, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assets/relaunch`, {
      method: 'POST',
      headers: { 
        'Authorization': token, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ creative_id: creativeId, budget, platform })
    });
    return handleApiResponse(response);
  },

  getCreatives: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assets/creatives`, {
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  deleteCreative: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assets/creatives/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    });
    return handleApiResponse(response);
  },

  resetMetrics: async (campaignId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/reset`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  deleteCampaign: async (campaignId, token, deleteOnPlatform = true) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_on_platform: deleteOnPlatform })
    });
    return handleApiResponse(response);
  },

  createManualCampaign: async (formData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/manual`, {
      method: 'POST',
      headers: { 'Authorization': token },
      body: formData
    });
    return handleApiResponse(response);
  },

  updateTargeting: async (campaignId, countries, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/targeting`, {
      method: 'PUT',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ countries })
    });
    return handleApiResponse(response);
  }

};

export const launchService = {
  executeGlobalLaunch: async (formData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/launch/global`, {
      method: 'POST',
      headers: { 'Authorization': token },
      body: formData
    });
    return handleApiResponse(response);
  },

  getActiveCampaigns: async (token) => {
    const response = await fetch(`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    const data = await handleApiResponse(response);
    const all = data.campaigns || data.campaigns_list || [];
    return all.filter(c => (c.status || '').toLowerCase() === 'active');
  },

  syncAudienceToCampaigns: async (body, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/launch/sync-audience`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleApiResponse(response);
  },

  triggerSeoBoost: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/force-boost`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  triggerRankingCheck: async (scope, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/manual-ranking-check`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope })
    });
    return handleApiResponse(response);
  },

  triggerScraping: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/manual-scraping`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  syncLookalikes: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/audiences/sync-lookalikes`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  fixLinkedInBids: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/linkedin/fix-bids`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  fixLinkedInTargeting: async (token, countries = null) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/linkedin/fix-targeting`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ countries })
    });
    return handleApiResponse(response);
  },

  getBrokenLinks: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/broken-links`, {
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  clearSeoHistory: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/clear-seo-history`, {
      method: 'DELETE',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  clearSeoRankings: async (scope, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/rankings/clear?scope=${scope}`, {
      method: 'DELETE',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  getSeoCredits: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/credits`, {
      method: 'GET',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  triggerManualGenesis: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/seo/manual-genesis`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  }
};

export const servicesService = {
  list: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/services`, {
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  },

  add: async (service, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/services`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    return handleApiResponse(response);
  },

  setPromoted: async (name, value, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/services/${encodeURIComponent(name)}/promoted`, {
      method: 'PUT',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    });
    return handleApiResponse(response);
  },

  setActive: async (name, value, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/services/${encodeURIComponent(name)}/active`, {
      method: 'PUT',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    });
    return handleApiResponse(response);
  },

  remove: async (name, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/services/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  }
};

export const notificationService = {
  markAsRead: async (notificationId, token) => {
    const response = await fetch(`${API_BASE_URL}${MARK_READ_ENDPOINT}/${notificationId}`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    });
    return handleApiResponse(response);
  }
};