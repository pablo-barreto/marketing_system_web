'use client';
import React, { useState, useMemo } from 'react';

// Mapa de países con banderas y nombres legibles
const COUNTRY_MAP = {
    // --- PAÍSES DE HABLA HISPANA (21) ---
    'AR': { flag: '🇦🇷', name: 'Argentina' },
    'BO': { flag: '🇧🇴', name: 'Bolivia' },
    'CL': { flag: '🇨🇱', name: 'Chile' },
    'CO': { flag: '🇨🇴', name: 'Colombia' },
    'CR': { flag: '🇨🇷', name: 'Costa Rica' },
    'CU': { flag: '🇨🇺', name: 'Cuba' },
    'DO': { flag: '🇩🇴', name: 'República Dominicana' },
    'EC': { flag: '🇪🇨', name: 'Ecuador' },
    'SV': { flag: '🇸🇻', name: 'El Salvador' },
    'ES': { flag: '🇪🇸', name: 'España' },
    'GT': { flag: '🇬🇹', name: 'Guatemala' },
    'GQ': { flag: '🇬🇶', name: 'Guinea Ecuatorial' },
    'HN': { flag: '🇭🇳', name: 'Honduras' },
    'MX': { flag: '🇲🇽', name: 'México' },
    'NI': { flag: '🇳🇮', name: 'Nicaragua' },
    'PA': { flag: '🇵🇦', name: 'Panamá' },
    'PY': { flag: '🇵🇾', name: 'Paraguay' },
    'PE': { flag: '🇵🇪', name: 'Perú' },
    'PR': { flag: '🇵🇷', name: 'Puerto Rico' },
    'UY': { flag: '🇺🇾', name: 'Uruguay' },
    'VE': { flag: '🇻🇪', name: 'Venezuela' },

    // --- NORTEAMÉRICA & CARIBE (14) ---
    'AG': { flag: '🇦🇬', name: 'Antigua y Barbuda' },
    'BS': { flag: '🇧🇸', name: 'Bahamas' },
    'BB': { flag: '🇧🇧', name: 'Barbados' },
    'BZ': { flag: '🇧🇿', name: 'Belice' },
    'CA': { flag: '🇨🇦', name: 'Canadá' },
    'DM': { flag: '🇩🇲', name: 'Dominica' },
    'US': { flag: '🇺🇸', name: 'Estados Unidos' },
    'GD': { flag: '🇬🇩', name: 'Granada' },
    'HT': { flag: '🇭🇹', name: 'Haití' },
    'JM': { flag: '🇯🇲', name: 'Jamaica' },
    'KN': { flag: '🇰🇳', name: 'San Cristóbal y Nieves' },
    'LC': { flag: '🇱🇨', name: 'Santa Lucía' },
    'VC': { flag: '🇻🇨', name: 'San Vicente y las Granadinas' },
    'TT': { flag: '🇹🇹', name: 'Trinidad y Tobago' },

    // --- SUDAMÉRICA ADICIONAL (3) ---
    'BR': { flag: '🇧🇷', name: 'Brasil' },
    'GY': { flag: '🇬🇾', name: 'Guyana' },
    'SR': { flag: '🇸🇷', name: 'Surinam' },

    // --- EUROPA (44) ---
    'AL': { flag: '🇦🇱', name: 'Albania' },
    'AD': { flag: '🇦🇩', name: 'Andorra' },
    'AT': { flag: '🇦🇹', name: 'Austria' },
    'BY': { flag: '🇧🇾', name: 'Bielorrusia' },
    'BE': { flag: '🇧🇪', name: 'Bélgica' },
    'BA': { flag: '🇧🇦', name: 'Bosnia y Herzegovina' },
    'BG': { flag: '🇧🇬', name: 'Bulgaria' },
    'HR': { flag: '🇭🇷', name: 'Croacia' },
    'CZ': { flag: '🇨🇿', name: 'República Checa' },
    'DK': { flag: '🇩🇰', name: 'Dinamarca' },
    'EE': { flag: '🇪🇪', name: 'Estonia' },
    'FI': { flag: '🇫🇮', name: 'Finlandia' },
    'FR': { flag: '🇫🇷', name: 'Francia' },
    'DE': { flag: '🇩🇪', name: 'Alemania' },
    'GR': { flag: '🇬🇷', name: 'Grecia' },
    'HU': { flag: '🇭🇺', name: 'Hungría' },
    'IS': { flag: '🇮🇸', name: 'Islandia' },
    'IE': { flag: '🇮🇪', name: 'Irlanda' },
    'IT': { flag: '🇮🇹', name: 'Italia' },
    'XK': { flag: '🇽🇰', name: 'Kosovo' },
    'LV': { flag: '🇱🇻', name: 'Letonia' },
    'LI': { flag: '🇱🇮', name: 'Liechtenstein' },
    'LT': { flag: '🇱🇹', name: 'Lituania' },
    'LU': { flag: '🇱🇺', name: 'Luxemburgo' },
    'MK': { flag: '🇲🇰', name: 'Macedonia del Norte' },
    'MT': { flag: '🇲🇹', name: 'Malta' },
    'MD': { flag: '🇲🇩', name: 'Moldavia' },
    'MC': { flag: '🇲🇨', name: 'Mónaco' },
    'ME': { flag: '🇲🇪', name: 'Montenegro' },
    'NL': { flag: '🇳🇱', name: 'Países Bajos' },
    'NO': { flag: '🇳🇴', name: 'Noruega' },
    'PL': { flag: '🇵🇱', name: 'Polonia' },
    'PT': { flag: '🇵🇹', name: 'Portugal' },
    'RO': { flag: '🇷🇴', name: 'Rumanía' },
    'RU': { flag: '🇷🇺', name: 'Rusia' },
    'SM': { flag: '🇸🇲', name: 'San Marino' },
    'RS': { flag: '🇷🇸', name: 'Serbia' },
    'SK': { flag: '🇸🇰', name: 'Eslovaquia' },
    'SI': { flag: '🇸🇮', name: 'Eslovenia' },
    'ES': { flag: '🇪🇸', name: 'España' },
    'SE': { flag: '🇸🇪', name: 'Suecia' },
    'CH': { flag: '🇨🇭', name: 'Suiza' },
    'UA': { flag: '🇺🇦', name: 'Ucrania' },
    'GB': { flag: '🇬🇧', name: 'Reino Unido' },
    'VA': { flag: '🇻🇦', name: 'Ciudad del Vaticano' },

    // --- ASIA (48) ---
    'AF': { flag: '🇦🇫', name: 'Afganistán' },
    'AM': { flag: '🇦🇲', name: 'Armenia' },
    'AZ': { flag: '🇦🇿', name: 'Azerbaiyán' },
    'BH': { flag: '🇧🇭', name: 'Baréin' },
    'BD': { flag: '🇧🇩', name: 'Bangladés' },
    'BT': { flag: '🇧🇹', name: 'Bután' },
    'BN': { flag: '🇧🇳', name: 'Brunéi' },
    'KH': { flag: '🇰🇭', name: 'Camboya' },
    'CN': { flag: '🇨🇳', name: 'China' },
    'CY': { flag: '🇨🇾', name: 'Chipre' },
    'GE': { flag: '🇬🇪', name: 'Georgia' },
    'IN': { flag: '🇮🇳', name: 'India' },
    'ID': { flag: '🇮🇩', name: 'Indonesia' },
    'IR': { flag: '🇮🇷', name: 'Irán' },
    'IQ': { flag: '🇮🇶', name: 'Irak' },
    'IL': { flag: '🇮🇱', name: 'Israel' },
    'JP': { flag: '🇯🇵', name: 'Japón' },
    'JO': { flag: '🇯🇴', name: 'Jordania' },
    'KZ': { flag: '🇰🇿', name: 'Kazajistán' },
    'KW': { flag: '🇰🇼', name: 'Kuwait' },
    'KG': { flag: '🇰🇬', name: 'Kirguistán' },
    'LA': { flag: '🇱🇦', name: 'Laos' },
    'LB': { flag: '🇱🇧', name: 'Líbano' },
    'MY': { flag: '🇲🇾', name: 'Malasia' },
    'MV': { flag: '🇲🇻', name: 'Maldivas' },
    'MN': { flag: '🇲🇳', name: 'Mongolia' },
    'MM': { flag: '🇲🇲', name: 'Myanmar' },
    'NP': { flag: '🇳🇵', name: 'Nepal' },
    'KP': { flag: '🇰🇵', name: 'Corea del Norte' },
    'OM': { flag: '🇴🇲', name: 'Omán' },
    'PK': { flag: '🇵🇰', name: 'Pakistán' },
    'PS': { flag: '🇵🇸', name: 'Palestina' },
    'PH': { flag: '🇵🇭', name: 'Filipinas' },
    'QA': { flag: '🇶🇦', name: 'Catar' },
    'SA': { flag: '🇸🇦', name: 'Arabia Saudita' },
    'SG': { flag: '🇸🇬', name: 'Singapur' },
    'KR': { flag: '🇰🇷', name: 'Corea del Sur' },
    'LK': { flag: '🇱🇰', name: 'Sri Lanka' },
    'SY': { flag: '🇸🇾', name: 'Siria' },
    'TW': { flag: '🇹🇼', name: 'Taiwán' },
    'TJ': { flag: '🇹🇯', name: 'Tayikistán' },
    'TH': { flag: '🇹🇭', name: 'Tailandia' },
    'TL': { flag: '🇹🇱', name: 'Timor Oriental' },
    'TR': { flag: '🇹🇷', name: 'Turquía' },
    'TM': { flag: '🇹🇲', name: 'Turkmenistán' },
    'AE': { flag: '🇦🇪', name: 'Emiratos Árabes Unidos' },
    'UZ': { flag: '🇺🇿', name: 'Uzbekistán' },
    'VN': { flag: '🇻🇳', name: 'Vietnam' },
    'YE': { flag: '🇾🇪', name: 'Yemen' },

    // --- ÁFRICA (54) ---
    'DZ': { flag: '🇩🇿', name: 'Argelia' },
    'AO': { flag: '🇦🇴', name: 'Angola' },
    'BJ': { flag: '🇧🇯', name: 'Benín' },
    'BW': { flag: '🇧🇼', name: 'Botsuana' },
    'BF': { flag: '🇧🇫', name: 'Burkina Faso' },
    'BI': { flag: '🇧🇮', name: 'Burundi' },
    'CV': { flag: '🇨🇻', name: 'Cabo Verde' },
    'CM': { flag: '🇨🇲', name: 'Camerún' },
    'CF': { flag: '🇨🇫', name: 'República Centroafricana' },
    'TD': { flag: '🇹🇩', name: 'Chad' },
    'KM': { flag: '🇰🇲', name: 'Comoras' },
    'CG': { flag: '🇨🇬', name: 'Congo' },
    'CD': { flag: '🇨🇩', name: 'República Democrática del Congo' },
    'CI': { flag: '🇨🇮', name: 'Costa de Marfil' },
    'DJ': { flag: '🇩🇯', name: 'Yibuti' },
    'EG': { flag: '🇪🇬', name: 'Egipto' },
    'ER': { flag: '🇪🇷', name: 'Eritrea' },
    'SZ': { flag: '🇸🇿', name: 'Esuatini' },
    'ET': { flag: '🇪🇹', name: 'Etiopía' },
    'GA': { flag: '🇬🇦', name: 'Gabón' },
    'GM': { flag: '🇬🇲', name: 'Gambia' },
    'GH': { flag: '🇬🇭', name: 'Ghana' },
    'GN': { flag: '🇬🇳', name: 'Guinea' },
    'GW': { flag: '🇬🇼', name: 'Guinea-Bisáu' },
    'KE': { flag: '🇰🇪', name: 'Kenia' },
    'LS': { flag: '🇱🇸', name: 'Lesoto' },
    'LR': { flag: '🇱🇷', name: 'Liberia' },
    'LY': { flag: '🇱🇾', name: 'Libia' },
    'MG': { flag: '🇲🇬', name: 'Madagascar' },
    'MW': { flag: '🇲🇼', name: 'Malaui' },
    'ML': { flag: '🇲🇱', name: 'Malí' },
    'MR': { flag: '🇲🇷', name: 'Mauritania' },
    'MU': { flag: '🇲🇺', name: 'Mauricio' },
    'MA': { flag: '🇲🇦', name: 'Marruecos' },
    'MZ': { flag: '🇲🇿', name: 'Mozambique' },
    'NA': { flag: '🇳🇦', name: 'Namibia' },
    'NE': { flag: '🇳🇪', name: 'Níger' },
    'NG': { flag: '🇳🇬', name: 'Nigeria' },
    'RW': { flag: '🇷🇼', name: 'Ruanda' },
    'ST': { flag: '🇸🇹', name: 'Santo Tomé y Príncipe' },
    'SN': { flag: '🇸🇳', name: 'Senegal' },
    'SC': { flag: '🇸🇨', name: 'Seychelles' },
    'SL': { flag: '🇸🇱', name: 'Sierra Leona' },
    'SO': { flag: '🇸🇴', name: 'Somalia' },
    'ZA': { flag: '🇿🇦', name: 'Sudáfrica' },
    'SS': { flag: '🇸🇸', name: 'Sudán del Sur' },
    'SD': { flag: '🇸🇩', name: 'Sudán' },
    'TZ': { flag: '🇹🇿', name: 'Tanzania' },
    'TG': { flag: '🇹🇬', name: 'Togo' },
    'TN': { flag: '🇹🇳', name: 'Túnez' },
    'UG': { flag: '🇺🇬', name: 'Uganda' },
    'ZM': { flag: '🇿🇲', name: 'Zambia' },
    'ZW': { flag: '🇿🇼', name: 'Zimbabue' },

    // --- OCEANÍA (14) ---
    'AU': { flag: '🇦🇺', name: 'Australia' },
    'FJ': { flag: '🇫🇯', name: 'Fiyi' },
    'KI': { flag: '🇰🇮', name: 'Kiribati' },
    'MH': { flag: '🇲🇭', name: 'Islas Marshall' },
    'FM': { flag: '🇫🇲', name: 'Micronesia' },
    'NR': { flag: '🇳🇷', name: 'Nauru' },
    'NZ': { flag: '🇳🇿', name: 'Nueva Zelanda' },
    'PW': { flag: '🇵🇼', name: 'Palaos' },
    'PG': { flag: '🇵🇬', name: 'Papúa Nueva Guinea' },
    'WS': { flag: '🇼🇸', name: 'Samoa' },
    'SB': { flag: '🇸🇧', name: 'Islas Salomón' },
    'TO': { flag: '🇹🇴', name: 'Tonga' },
    'TV': { flag: '🇹🇻', name: 'Tuvalu' },
    'VU': { flag: '🇻🇺', name: 'Vanuatu' },
    'AW': { flag: '🇦🇼', name: 'Aruba' },
    'HK': { flag: '🇭🇰', name: 'Hong Kong' },
    'MQ': { flag: '🇲🇶', name: 'Martinica' },
};

const getCountryDisplay = (code) => {
    const info = COUNTRY_MAP[code];
    return info || { flag: '🌐', name: code };
};

// Badge de estado según posición
const getStatusBadge = (rank) => {
    if (rank <= 3) return { label: '🏆 Top 3', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (rank <= 10) return { label: '✅ Página 1', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    if (rank <= 20) return { label: '📈 Página 2', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    if (rank <= 50) return { label: '⚠️ Lejos', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' };
    return { label: '❌ No visible', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
};

// Tiempo relativo legible
const timeAgo = (isoDate) => {
    if (!isoDate) return '—';
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
};

const getRankingColor = (rank) => {
    if (rank <= 3) return 'text-emerald-600';
    if (rank <= 10) return 'text-green-600';
    if (rank <= 20) return 'text-amber-500';
    if (rank > 50) return 'text-red-500';
    return 'text-orange-500';
};

const SeoRankingTable = ({ rankings }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState('nacional');

    const safeRankings = rankings || [];

    const filteredRankings = useMemo(() => {
        return safeRankings
            .filter(r => {
                if (activeTab === 'nacional') {
                    return r.country === 'CO';
                } else {
                    return r.country !== 'CO';
                }
            })
            .sort((a, b) => a.ranking - b.ranking);
    }, [safeRankings, activeTab]);

    // Contadores de resumen
    const summary = useMemo(() => {
        const top10 = filteredRankings.filter(r => r.ranking <= 10).length;
        const total = filteredRankings.length;
        return { top10, total };
    }, [filteredRankings]);

    const totalPages = Math.ceil(filteredRankings.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRankings.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageSizeChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <div className="flex flex-col w-full min-h-0 overflow-visible">

            {/* PESTAÑAS + RESUMEN */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-slate-100 pb-3 shrink-0">
                <div className="flex gap-4">
                    <button
                        onClick={() => { setActiveTab('nacional'); setCurrentPage(1); }}
                        className={`pb-2 px-1 text-sm font-bold transition-all ${activeTab === 'nacional'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        🇨🇴 Nacional
                    </button>
                    <button
                        onClick={() => { setActiveTab('internacional'); setCurrentPage(1); }}
                        className={`pb-2 px-1 text-sm font-bold transition-all ${activeTab === 'internacional'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        🌍 Internacional
                    </button>
                </div>
                {summary.total > 0 && (
                    <div className="text-xs text-slate-500">
                        <span className="font-bold text-emerald-600">{summary.top10}</span> de {summary.total} en Página 1 de Google
                    </div>
                )}
            </div>

            {/* --- VISTA MÓVIL (CARDS) --- */}
            <div className="block md:hidden space-y-3 w-full">
                {currentItems.length > 0 ? (
                    currentItems.map((r, i) => {
                        const country = getCountryDisplay(r.country);
                        const status = getStatusBadge(r.ranking);
                        return (
                            <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <div className="font-bold text-slate-800 text-sm truncate">{r.service}</div>
                                        <div className="text-xs text-slate-400 mt-0.5 italic truncate">"{r.keyword}"</div>
                                    </div>
                                    <div className={`text-2xl font-black shrink-0 ${getRankingColor(r.ranking)}`}>
                                        #{r.ranking}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{country.flag}</span>
                                        <span className="text-xs text-slate-500">{country.name}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
                                        {status.label}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 text-right">{timeAgo(r.checked_at)}</div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-slate-400 py-8 text-sm italic">
                        Sin datos disponibles.
                    </div>
                )}
            </div>

            {/* --- VISTA ESCRITORIO (TABLA) --- */}
            <div className="hidden md:block overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nombre del Servicio</th>
                            <th className="px-4 py-3 text-left text-s font-semibold text-slate-500 uppercase">Busqueda en Google</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">País</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Posición de página</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Estado</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Verificado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {currentItems.length > 0 ? (
                            currentItems.map((r, i) => {
                                const country = getCountryDisplay(r.country);
                                const status = getStatusBadge(r.ranking);
                                return (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-slate-800">{r.service}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-s text-slate-500 italic">"{r.keyword}"</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">{country.flag}</span>
                                                <span className="text-xs text-slate-600">{country.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-lg font-black ${getRankingColor(r.ranking)}`}>
                                                #{r.ranking}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-xs text-slate-400">{timeAgo(r.checked_at)}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">No hay datos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINACIÓN */}
            {filteredRankings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Filas:</span>
                        <select
                            value={itemsPerPage}
                            onChange={handlePageSizeChange}
                            className="bg-white border border-slate-300 text-slate-700 text-xs rounded p-1 outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{currentPage} / {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-slate-300 bg-white rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-slate-300 bg-white rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeoRankingTable;