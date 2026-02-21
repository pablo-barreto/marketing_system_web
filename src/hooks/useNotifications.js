import useSWR from 'swr';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, NOTIFICATIONS_ENDPOINT } from '../app/config';

const fetcher = async (url, token) => {
    const res = await fetch(url, {
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('Error fetching notifications');
    return res.json();
};

/**
 * Hook dedicado para polling de notificaciones en tiempo real.
 * Independiente del dashboard pesado — consulta endpoint ligero cada 10s.
 */
export function useNotifications() {
    const { basicAuthHeader } = useContext(AuthContext);

    const { data } = useSWR(
        basicAuthHeader ? [`${API_BASE_URL}${NOTIFICATIONS_ENDPOINT}`, basicAuthHeader] : null,
        ([url, token]) => fetcher(url, token),
        {
            refreshInterval: 10000,    // Poll cada 10 segundos
            revalidateOnFocus: true,
            dedupingInterval: 5000,
            keepPreviousData: true,
            errorRetryCount: 2
        }
    );

    return data || [];
}
