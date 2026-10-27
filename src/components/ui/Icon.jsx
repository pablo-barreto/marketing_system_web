// Iconos de trazo (24×24) del diseño del panel. Decorativos salvo que se pase `label`.
const PATHS = {
    overview: 'M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z',
    ads: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z M15.5 8.5a5 5 0 0 1 0 7 M18.5 5.5a9 9 0 0 1 0 13',
    assets: 'M3 4h18v16H3z M21 16l-5-5-8 9 M9 8a2 2 0 1 0 0 4a2 2 0 1 0 0-4',
    seo: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18',
    crm: 'M9 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7 M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.5a3.5 3.5 0 0 1 0 7 M18 14a6 6 0 0 1 3.5 6',
    launch: 'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
    services: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h6',
    terminal: 'M4 17l6-5-6-5 M12 19h8',
    logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 16l-4-4 4-4 M6 12h10',
    search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14 M20 20l-3.5-3.5',
    image: 'M3 4h18v16H3z M21 16l-5-5-8 9 M9 8a2 2 0 1 0 0 4a2 2 0 1 0 0-4',
    close: 'M6 6l12 12 M18 6L6 18',
    more: 'M5 12h.01 M12 12h.01 M19 12h.01',
    trash: 'M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3',
    plus: 'M12 5v14 M5 12h14',
    upload: 'M12 16V4 M7 9l5-5 5 5 M4 20h16',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
    check: 'M5 12l5 5 9-10',
    chevronLeft: 'M15 6l-6 6 6 6',
    chevronRight: 'M9 6l6 6-6 6',
    external: 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
};

export default function Icon({ name, size = 18, label, className = '', strokeWidth = 1.8 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={name === 'more' ? 3.2 : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
        >
            <path d={PATHS[name]} />
        </svg>
    );
}
