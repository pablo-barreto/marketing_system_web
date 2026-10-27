// src/services/api.js
// Todas las llamadas pasan por apiFetch, que agrega la sesión y maneja los errores.
import { ADMIN_PANEL_ENDPOINT, MARK_READ_ENDPOINT } from '../app/config';
import { apiFetch } from '../lib/apiClient';

// Algunos endpoints POST sin cuerpo se llamaban con Content-Type JSON; se conserva igual
const JSON_CT = { 'Content-Type': 'application/json' };

export const campaignService = {
  approve: (campaignId) =>
    apiFetch(ADMIN_PANEL_ENDPOINT, { method: 'POST', json: { action: 'approve', campaign_id: campaignId } }),

  createOnDemand: (service, platform) =>
    apiFetch(ADMIN_PANEL_ENDPOINT, { method: 'POST', json: { action: 'create_on_demand_campaign', service, platform } }),

  uploadCreative: (formData) =>
    apiFetch('/api/v1/assets/upload_creative', { method: 'POST', body: formData }),

  relaunchCreative: (creativeId, budget, platform, audienceType = 'empresa') =>
    apiFetch('/api/v1/assets/relaunch', {
      method: 'POST',
      json: { creative_id: creativeId, budget, platform, audience_type: audienceType }
    }),

  // Métricas comparadas por público (empresa / persona natural)
  getAudienceStats: (days) =>
    apiFetch(`/api/v1/stats/audience?days=${encodeURIComponent(days)}`),

  getCreatives: () => apiFetch('/api/v1/assets/creatives', { headers: JSON_CT }),

  deleteCreative: (id) => apiFetch(`/api/v1/assets/creatives/${id}`, { method: 'DELETE' }),

  resetMetrics: (campaignId) =>
    apiFetch(`/api/v1/campaigns/${campaignId}/reset`, { method: 'POST', headers: JSON_CT }),

  deleteCampaign: (campaignId, deleteOnPlatform = true) =>
    apiFetch(`/api/v1/campaigns/${campaignId}/delete`, {
      method: 'DELETE',
      json: { delete_on_platform: deleteOnPlatform }
    }),

  createManualCampaign: (formData) =>
    apiFetch('/api/v1/campaigns/manual', { method: 'POST', body: formData }),

  updateTargeting: (campaignId, countries) =>
    apiFetch(`/api/v1/campaigns/${campaignId}/targeting`, { method: 'PUT', json: { countries } })
};

export const launchService = {
  executeGlobalLaunch: (formData) =>
    apiFetch('/api/v1/launch/global', { method: 'POST', body: formData }),

  getActiveCampaigns: async () => {
    const data = await apiFetch('/api/v1/campaigns?status=active&page_size=200');
    return data.items || [];
  },

  syncAudienceToCampaigns: (body) =>
    apiFetch('/api/v1/launch/sync-audience', { method: 'POST', json: body }),

  triggerSeoBoost: () => apiFetch('/api/v1/seo/force-boost', { method: 'POST', headers: JSON_CT }),

  triggerRankingCheck: (scope) =>
    apiFetch('/api/v1/seo/manual-ranking-check', { method: 'POST', json: { scope } }),

  triggerScraping: () => apiFetch('/api/v1/admin/manual-scraping', { method: 'POST', headers: JSON_CT }),

  syncLookalikes: () => apiFetch('/api/v1/audiences/sync-lookalikes', { method: 'POST', headers: JSON_CT }),

  fixLinkedInBids: () => apiFetch('/api/v1/linkedin/fix-bids', { method: 'POST', headers: JSON_CT }),

  fixLinkedInTargeting: (countries = null) =>
    apiFetch('/api/v1/linkedin/fix-targeting', { method: 'POST', json: { countries } }),

  getBrokenLinks: () => apiFetch('/api/v1/seo/broken-links', { headers: JSON_CT }),

  clearSeoHistory: () => apiFetch('/api/v1/admin/clear-seo-history', { method: 'DELETE', headers: JSON_CT }),

  getRankingStatus: () => apiFetch('/api/v1/seo/ranking-status', { headers: JSON_CT }),

  getSeoCredits: () => apiFetch('/api/v1/seo/credits', { headers: JSON_CT }),

  triggerManualGenesis: () => apiFetch('/api/v1/seo/manual-genesis', { method: 'POST', headers: JSON_CT })
};

export const servicesService = {
  list: () => apiFetch('/api/v1/admin/services', { headers: JSON_CT }),

  add: (service) => apiFetch('/api/v1/admin/services', { method: 'POST', json: service }),

  setPromoted: (name, value) =>
    apiFetch(`/api/v1/admin/services/${encodeURIComponent(name)}/promoted`, { method: 'PUT', json: { value } }),

  setActive: (name, value) =>
    apiFetch(`/api/v1/admin/services/${encodeURIComponent(name)}/active`, { method: 'PUT', json: { value } }),

  remove: (name) =>
    apiFetch(`/api/v1/admin/services/${encodeURIComponent(name)}`, { method: 'DELETE', headers: JSON_CT })
};

export const notificationService = {
  markAsRead: (notificationId) =>
    apiFetch(`${MARK_READ_ENDPOINT}/${notificationId}`, { method: 'POST', headers: JSON_CT })
};

export const authService = {
  login: (username, password) =>
    apiFetch('/api/v1/auth/login', { method: 'POST', json: { username, password }, auth: false }),

  me: () => apiFetch('/api/v1/auth/me')
};
