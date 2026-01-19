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

    const { data, error, isLoading, mutate } = useSWR( // Importante: desestructurar mutate aquí también
        basicAuthHeader ? [`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, basicAuthHeader] : null,
        ([url, token]) => fetcher(url, token),
        {
            refreshInterval: 30000, // CAMBIO: Bajar a 10s para ver cambios externos más rápido
            revalidateOnFocus: false, // Si cambias de pestaña y vuelves, refresca inmediato
            dedupingInterval: 5000,
            keepPreviousData: false   // Evita parpadeos de carga mientras refresca
        }
    );

    return {
        data,
        loading: isLoading,
        error,
        // Exponemos la función mutate directa para actualizaciones instantáneas
        refresh: () => mutate() 
    };
}