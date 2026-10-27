import { API_BASE_URL } from '../app/config';
import { clearSession, getToken } from './session';

// Evento que AuthContext escucha para volver a la pantalla de login
export const UNAUTHORIZED_EVENT = 'mos:unauthorized';

/**
 * Llamada a la API del backend con la sesión del panel.
 *
 * - `json`: objeto que se envía como JSON (agrega Content-Type).
 * - `body`: cuerpo crudo, p. ej. FormData para subir archivos.
 * - Lanza un Error con `status` y el mensaje del servidor si la respuesta no es 2xx.
 * - Un 401 cierra la sesión y avisa a la app para mostrar el login.
 */
export async function apiFetch(path, { method = 'GET', json, body, headers = {}, auth = true } = {}) {
  const finalHeaders = { ...headers };
  if (json !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : body,
  });

  if (!response.ok) {
    let message;
    try {
      const data = await response.json();
      message = data.message || data.error || data.detail || `Error ${response.status}`;
    } catch {
      message = `Error ${response.status}: ${response.statusText}`;
    }
    if (response.status === 401 && auth) {
      clearSession();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) return null;
  return response.json();
}
