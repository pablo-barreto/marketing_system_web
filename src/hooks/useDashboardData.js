import { useApi, withQuery } from './useApi';

// Resumen del panel: menú, configuración y cifras de la portada.
// Las listas (campañas, leads, SEO) las pide cada vista por su cuenta.
export function useDashboardData(days = null) {
    return useApi(withQuery('/api/v1/dashboard/summary', { days }), { refreshInterval: 60000 });
}
