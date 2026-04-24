'use client';
import { useState, useCallback } from 'react';

/**
 * Hook para envolver llamadas a la API con estado de carga, error y éxito.
 *
 * Uso:
 *   const { loading, error, execute, clearError } = useApiCall();
 *   await execute(() => campaignService.approve(id, token), {
 *     onSuccess: (data) => refresh(),
 *     onError: (err) => console.error(err),
 *   });
 */
export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, { onSuccess, onError } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const message = err?.message || 'Error inesperado. Intenta de nuevo.';
      setError(message);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, execute, clearError };
}
