import { API_BASE_URL, ADMIN_PANEL_ENDPOINT } from '../app/config';

export const campaignService = {
    approve: async (campaignId, token) => {
        const response = await fetch(`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve', campaign_id: campaignId })
        });
        if (!response.ok) throw new Error('Error al aprobar campaña');
        return response.json();
    },

    createOnDemand: async (service, platform, token) => {
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
    }
};