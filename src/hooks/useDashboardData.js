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

export function useDashboardData(days = null) {
    const { basicAuthHeader } = useContext(AuthContext);

    const { data, error, isLoading, mutate } = useSWR(
        basicAuthHeader ? [`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, basicAuthHeader, days] : null,
        ([url, token, d]) => {
            const finalUrl = d ? `${url}?days=${d}` : url;
            return fetcher(finalUrl, token);
        },
        {
            refreshInterval: 10000,
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            keepPreviousData: true
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