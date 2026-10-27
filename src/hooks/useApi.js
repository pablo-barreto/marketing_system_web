import useSWR, { useSWRConfig } from 'swr';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';

// Arma "path?a=1&b=2" omitiendo los parámetros vacíos o 'all'
export function withQuery(path, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || value === 'all') return;
        query.append(key, String(value));
    });
    const qs = query.toString();
    return qs ? `${path}?${qs}` : path;
}

/**
 * Lectura de un endpoint con SWR y la sesión del panel.
 * Por defecto no hace polling: cada vista decide su `refreshInterval`.
 * SWR no consulta mientras la pestaña está oculta.
 */
export function useApi(path, { refreshInterval = 0, keepPreviousData = true } = {}) {
    const { isAuthenticated } = useContext(AuthContext);

    const { data, error, isLoading, isValidating, mutate } = useSWR(
        isAuthenticated && path ? path : null,
        (url) => apiFetch(url),
        {
            refreshInterval,
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            keepPreviousData
        }
    );

    return { data, error, loading: isLoading, validating: isValidating, refresh: () => mutate() };
}

// Vuelve a pedir todas las lecturas cacheadas cuyo path empiece por `prefix`
// (p. ej. tras aprobar o crear una campaña, refrescar todas las páginas de /api/v1/campaigns)
export function useRevalidate() {
    const { mutate } = useSWRConfig();
    return (prefix) => mutate(key => typeof key === 'string' && key.startsWith(prefix));
}
