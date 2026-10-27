'use client';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authService } from '../services/api';
import { UNAUTHORIZED_EVENT } from '../lib/apiClient';
import { clearSession, getSession, saveSession } from '../lib/session';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    // La sesión vive en localStorage: se lee después de montar para no romper la hidratación
    const [session, setSession] = useState(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    const isAuthenticated = !!session;

    const logout = useCallback(() => {
        clearSession();
        setSession(null);
    }, []);

    useEffect(() => {
        const stored = getSession();
        if (!stored) {
            clearSession(); // limpia también la cookie con credenciales de la versión anterior
        }
        setSession(stored);
        setIsAuthChecked(true);

        // Confirmar con el servidor que la sesión guardada sigue siendo válida.
        // Si no lo es, apiFetch recibe 401 y dispara UNAUTHORIZED_EVENT.
        if (stored) authService.me().catch(() => {});
    }, []);

    useEffect(() => {
        window.addEventListener(UNAUTHORIZED_EVENT, logout);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
    }, [logout]);

    useEffect(() => {
        if (!session) return;
        // Cerrar sesión justo cuando el token expira
        const timeout = setTimeout(logout, Math.max(session.expiresAt - Date.now(), 0));
        return () => clearTimeout(timeout);
    }, [session, logout]);

    const login = async (username, password) => {
        try {
            const data = await authService.login(username, password);
            setSession(saveSession(data.token, data.expires_in, data.user));
            return true;
        } catch (error) {
            console.error("Login fallido:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isAuthChecked, user: session?.user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
