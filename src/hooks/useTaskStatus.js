'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../app/config';

const TERMINAL_STATUSES = new Set(['finished', 'failed', 'unknown']);
const POLL_INTERVAL_MS = 3000;

/**
 * Hace polling al endpoint de estado de tarea RQ hasta que termine o falle.
 *
 * @param {string|null} jobId - ID del job retornado por el backend (null para no hacer nada)
 * @param {string} token - header de autenticación Basic
 * @param {object} options
 *   @param {function} options.onFinished - callback cuando la tarea termina bien
 *   @param {function} options.onFailed   - callback cuando la tarea falla
 *
 * @returns {{ status, isRunning, clear }}
 *   status    - 'queued' | 'started' | 'finished' | 'failed' | 'unknown' | null
 *   isRunning - true mientras la tarea está en curso
 *   clear     - función para resetear el estado manualmente
 */
export function useTaskStatus(jobId, token, { onFinished, onFailed } = {}) {
  const [status, setStatus] = useState(null);
  const intervalRef = useRef(null);
  const jobIdRef = useRef(jobId);

  const clear = useCallback(() => {
    clearInterval(intervalRef.current);
    setStatus(null);
  }, []);

  useEffect(() => {
    jobIdRef.current = jobId;
    if (!jobId || !token) return;

    setStatus('queued');

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${jobIdRef.current}/status`, {
          headers: { Authorization: token }
        });
        if (!res.ok) return;
        const data = await res.json();
        const newStatus = data.status;
        setStatus(newStatus);

        if (TERMINAL_STATUSES.has(newStatus)) {
          clearInterval(intervalRef.current);
          if (newStatus === 'finished') onFinished?.(data);
          if (newStatus === 'failed') onFailed?.(data);
        }
      } catch {
        // Error de red — seguir intentando
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [jobId, token, onFinished, onFailed]);

  const isRunning = status !== null && !TERMINAL_STATUSES.has(status);

  return { status, isRunning, clear };
}
