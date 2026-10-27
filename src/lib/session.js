// Sesión del panel: token firmado por el backend (no contiene la contraseña).
// Se guarda con su fecha de expiración para no usar un token vencido.
const STORAGE_KEY = 'mos_session';
const LEGACY_COOKIE = 'auth_token';

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  const session = readStorage();
  if (!session?.token || !session?.expiresAt || Date.now() >= session.expiresAt) {
    return null;
  }
  return session;
}

export function getToken() {
  return getSession()?.token || null;
}

export function saveSession(token, expiresInSeconds, user) {
  const session = { token, user, expiresAt: Date.now() + expiresInSeconds * 1000 };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Almacenamiento bloqueado: la sesión dura lo que dure la pestaña
  }
  return session;
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que limpiar
  }
  // Cookie de la versión anterior, que guardaba las credenciales en Basic Auth
  document.cookie = `${LEGACY_COOKIE}=; Max-Age=0; path=/`;
}
