'use client';
import React, { createContext, useState } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL, ADMIN_PANEL_ENDPOINT } from '../app/config';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    // 1. Lazy Initialization: Leemos la cookie solo al arrancar
    const [basicAuthHeader, setBasicAuthHeader] = useState(() => {
        return Cookies.get('auth_token') || null;
    });

    const isAuthenticated = !!basicAuthHeader;

    const login = async (username, password) => {
        // A. Preparamos la cabecera (Igual que antes)
        const credentials = btoa(`${username}:${password}`);
        const header = `Basic ${credentials}`;

        try {
            // B. PASO DE SEGURIDAD: Intentamos conectar al servidor
            // Hacemos una petición ligera al panel solo para ver si nos deja entrar
            const response = await fetch(`${API_BASE_URL}${ADMIN_PANEL_ENDPOINT}`, {
                method: 'GET',
                headers: { 
                    'Authorization': header,
                    'Content-Type': 'application/json'
                }
            });

            // C. Si el servidor dice "401 Unauthorized" o "403 Forbidden"...
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Usuario o contraseña incorrectos');
                } else {
                    throw new Error(`Error del servidor: ${response.status}`);
                }
            }

            // D. SOLO SI EL SERVIDOR RESPONDIÓ 200 OK, GUARDAMOS
            setBasicAuthHeader(header);
            
            // Seguridad de Cookies para Producción
            Cookies.set('auth_token', header, { 
                expires: 1, // 1 día
                secure: window.location.protocol === 'https:', // Solo enviar por HTTPS
                sameSite: 'strict' // Previene ataques CSRF
            });

            return true; // Éxito

        } catch (error) {
            // Si falló, no guardamos nada y lanzamos el error para que la pantalla lo muestre
            console.error("Login fallido:", error);
            throw error;
        }
    };

    const logout = () => {
        setBasicAuthHeader(null);
        Cookies.remove('auth_token');
        // Opcional: Redirigir o recargar para limpiar estados
        window.location.href = '/'; 
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, basicAuthHeader, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };