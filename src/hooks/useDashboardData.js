import useSWR, { mutate } from 'swr';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, ADMIN_PANEL_ENDPOINT } from '../app/config';

// Función fetcher genérica
const fetcher = async (url, token) => {
    const res = await fetch(url, {
        headers: { 
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    });
    
    if (!res.ok) {
        const error = new Error('Error al cargar datos');
        error.status = res.status;
        throw error;
    }
    return res.json();
};

export function useDashboardData() {
    const { basicAuthHeader } = useContext(AuthContext);

    // SWR gestiona el caché, reintentos y reconexión
    const { data, error, isLoading } = useSWR(
        basicAuthHeader ? [`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, basicAuthHeader] : null,
        ([url, token]) => fetcher(url, token),
        {
            refreshInterval: 30000, // Refresca cada 30s automáticamente
            revalidateOnFocus: true, // Refresca si el usuario vuelve a la pestaña
            dedupingInterval: 5000,  // Evita duplicar peticiones muy seguidas
        }
    );

    return {
        data,
        loading: isLoading,
        error,
        // Función para forzar recarga (ej: después de aprobar una campaña)
        refresh: () => mutate([`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, basicAuthHeader])
    };
}