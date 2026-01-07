// src/services/api.js
import { API_BASE_URL, ADMIN_PANEL_ENDPOINT } from '../app/config';

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
    }
};