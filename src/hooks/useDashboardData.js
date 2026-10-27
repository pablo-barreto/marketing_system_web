import useSWR from 'swr';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ADMIN_PANEL_ENDPOINT } from '../app/config';
import { apiFetch } from '../lib/apiClient';

export function useDashboardData(days = null) {
    const { isAuthenticated } = useContext(AuthContext);

    const { data, error, isLoading, mutate } = useSWR(
        isAuthenticated ? [ADMIN_PANEL_ENDPOINT, days] : null,
        ([path, d]) => apiFetch(d ? `${path}?days=${d}` : path, { headers: { 'Content-Type': 'application/json' } }),
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
