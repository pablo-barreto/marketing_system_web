// src/app/page.js
'use client';

import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import LoginScreen from '../components/LoginScreen';

// Componente visual de carga (Skeleton)
const LoadingSkeleton = () => (
  <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: '#94a3b8' }}>
    <div className="animate-pulse">Cargando Marketing OS...</div>
  </div>
);

const MainContent = () => {
  const { isAuthenticated, isAuthChecked } = useContext(AuthContext);

  // Si no hemos terminado de verificar la autenticación, mostramos Skeleton
  // Esto renderiza algo visual en lugar de nada, evitando el layout shift brusco
  if (!isAuthChecked) {
    return <LoadingSkeleton />;
  }

  return isAuthenticated ? <AdminDashboard /> : <LoginScreen />;
};

export default function Home() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}