'use client';
import { useContext, useState } from 'react';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import LoginScreen from '../LoginScreen';
import NotificationToast from '../NotificationToast';
import SystemLogs from '../SystemLogs';
import Sidebar from './Sidebar';

// Marco del panel: exige sesión y pinta la barra lateral, la terminal y los avisos
export default function AppShell({ children }) {
    const { isAuthenticated, isAuthChecked, user, logout } = useContext(AuthContext);
    const [terminalOpen, setTerminalOpen] = useState(false);
    // Mismo periodo por defecto que la portada, para compartir la consulta en caché
    const { data: summary } = useDashboardData('30');

    if (!isAuthChecked) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">Cargando Marketing OS…</div>;
    }
    if (!isAuthenticated) return <LoginScreen />;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F6F8] text-slate-900 text-sm leading-[1.45]">
            <Sidebar
                mode={summary?.system_mode}
                user={user}
                terminalOpen={terminalOpen}
                onToggleTerminal={() => setTerminalOpen((o) => !o)}
                onLogout={logout}
            />
            <main className="flex-1 min-w-0 flex flex-col">{children}</main>
            <SystemLogs isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />
            <NotificationToast />
        </div>
    );
}

// Barra superior de cada sección: ruta o grupo, título y acciones
export function PageHeader({ eyebrow, title, breadcrumb, actions }) {
    return (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-8 py-4 bg-white border-b border-slate-200">
            <div className="flex flex-col gap-0.5 min-w-0">
                {breadcrumb ? (
                    <nav aria-label="Ruta" className="text-xs text-slate-500">
                        {breadcrumb.map((b, i) => (
                            <span key={b.label}>
                                {i > 0 && ' / '}
                                {b.href ? <Link href={b.href} className="text-slate-600 hover:text-slate-900">{b.label}</Link> : b.label}
                            </span>
                        ))}
                    </nav>
                ) : (
                    eyebrow && <span className="text-xs text-slate-500">{eyebrow}</span>
                )}
                <h1 className="m-0 text-xl font-bold text-slate-900">{title}</h1>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}

export function PageBody({ children, className = '' }) {
    return (
        <div className={`w-full max-w-[1240px] mx-auto px-4 md:px-8 pt-7 pb-12 box-border flex flex-col gap-5 ${className}`}>
            {children}
        </div>
    );
}
