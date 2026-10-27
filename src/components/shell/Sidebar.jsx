'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '../ui/Icon';

export const NAV_GROUPS = [
    { label: 'General', items: [{ href: '/', icon: 'overview', label: 'Visión general' }] },
    {
        label: 'Adquisición',
        items: [
            { href: '/campaigns', icon: 'ads', label: 'Campañas (Ads)' },
            { href: '/gallery', icon: 'assets', label: 'Galería de activos' },
            { href: '/seo', icon: 'seo', label: 'SEO y contenido' },
        ],
    },
    {
        label: 'Clientes',
        items: [
            { href: '/crm', icon: 'crm', label: 'CRM · Leads' },
            { href: '/launch', icon: 'launch', label: 'Lanzamiento e IA' },
        ],
    },
    { label: 'Configuración', items: [{ href: '/services', icon: 'services', label: 'Servicios' }] },
];

const isActive = (pathname, href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

export default function Sidebar({ mode, user, terminalOpen, onToggleTerminal, onLogout }) {
    const pathname = usePathname();
    const initial = (user?.username || 'A').charAt(0).toUpperCase();

    return (
        <aside
            aria-label="Navegación principal"
            className="bg-slate-900 text-slate-300 flex flex-col gap-6 px-3.5 py-5 box-border w-full md:w-[248px] md:shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto"
        >
            <div className="flex items-center justify-between gap-2.5 px-2 py-1">
                <div className="flex items-center gap-2.5">
                    <div aria-hidden="true" className="w-[34px] h-[34px] rounded-[9px] bg-blue-600 text-white flex items-center justify-center font-bold text-base">M</div>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-[15px]">Marketing OS</span>
                        <span className="text-slate-400 text-xs">v2.0 · Enterprise</span>
                    </div>
                </div>
                {/* En móvil el pie de la barra se oculta: el cierre de sesión queda aquí */}
                <button
                    type="button"
                    onClick={onLogout}
                    aria-label="Cerrar sesión"
                    className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg border-0 bg-transparent text-red-300 hover:bg-slate-800 cursor-pointer"
                >
                    <Icon name="logout" />
                </button>
            </div>

            <nav className="flex flex-row flex-wrap md:flex-col gap-1 md:gap-[18px]">
                {NAV_GROUPS.map((group) => (
                    <div key={group.label} className="contents md:flex md:flex-col md:gap-1">
                        <span className="hidden md:block text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-400 px-2.5 pb-0.5">
                            {group.label}
                        </span>
                        <div className="contents md:flex md:flex-col md:gap-0.5">
                            {group.items.map((item) => {
                                const on = isActive(pathname, item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={on ? 'page' : undefined}
                                        className={`flex items-center gap-2.5 min-h-10 px-2.5 rounded-lg no-underline text-sm transition-colors ${
                                            on ? 'bg-blue-900 text-white font-semibold' : 'text-slate-300 font-medium hover:bg-slate-800 hover:text-white'
                                        }`}
                                    >
                                        <Icon name={item.icon} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="hidden md:flex mt-auto flex-col gap-2.5 border-t border-slate-800 pt-4">
                <div className="flex justify-between px-2.5">
                    <span className="text-xs text-slate-400">Modo</span>
                    <span className="text-xs font-semibold text-green-400 capitalize">{mode || '—'}</span>
                </div>
                <button
                    type="button"
                    onClick={onToggleTerminal}
                    aria-pressed={terminalOpen}
                    className="flex items-center gap-2.5 min-h-11 px-2.5 border border-slate-700 rounded-lg bg-transparent text-slate-200 text-[13px] font-medium cursor-pointer hover:bg-slate-800 hover:text-white"
                >
                    <Icon name="terminal" />
                    {terminalOpen ? 'Cerrar terminal' : 'Abrir terminal'}
                    {terminalOpen && <span aria-hidden="true" className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                </button>
                <div className="flex items-center gap-2.5 pt-1 pl-2.5 pr-1.5">
                    <div aria-hidden="true" className="w-8 h-8 rounded-full bg-slate-700 text-slate-100 flex items-center justify-center font-semibold text-[13px]">{initial}</div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-slate-100 text-[13px] font-semibold truncate">{user?.username || 'Admin'}</span>
                        <span className="text-slate-400 text-xs">Administrador</span>
                    </div>
                    <button
                        type="button"
                        onClick={onLogout}
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                        className="w-11 h-11 flex items-center justify-center rounded-lg border-0 bg-transparent text-red-300 hover:bg-slate-800 cursor-pointer"
                    >
                        <Icon name="logout" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
