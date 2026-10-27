'use client';
import { useMemo, useState } from 'react';
import { Card, Pagination, Pill, SearchInput, Tabs, cx, tableClass, tdClass, thClass, trClass } from './ui';

// Nombres legibles de los países que verifica el rastreador SEO
const COUNTRY_MAP = {
    // --- PAÍSES DE HABLA HISPANA (21) ---
    'AR': { name: 'Argentina' },
    'BO': { name: 'Bolivia' },
    'CL': { name: 'Chile' },
    'CO': { name: 'Colombia' },
    'CR': { name: 'Costa Rica' },
    'CU': { name: 'Cuba' },
    'DO': { name: 'República Dominicana' },
    'EC': { name: 'Ecuador' },
    'SV': { name: 'El Salvador' },
    'ES': { name: 'España' },
    'GT': { name: 'Guatemala' },
    'GQ': { name: 'Guinea Ecuatorial' },
    'HN': { name: 'Honduras' },
    'MX': { name: 'México' },
    'NI': { name: 'Nicaragua' },
    'PA': { name: 'Panamá' },
    'PY': { name: 'Paraguay' },
    'PE': { name: 'Perú' },
    'PR': { name: 'Puerto Rico' },
    'UY': { name: 'Uruguay' },
    'VE': { name: 'Venezuela' },

    // --- NORTEAMÉRICA & CARIBE (14) ---
    'AG': { name: 'Antigua y Barbuda' },
    'BS': { name: 'Bahamas' },
    'BB': { name: 'Barbados' },
    'BZ': { name: 'Belice' },
    'CA': { name: 'Canadá' },
    'DM': { name: 'Dominica' },
    'US': { name: 'Estados Unidos' },
    'GD': { name: 'Granada' },
    'HT': { name: 'Haití' },
    'JM': { name: 'Jamaica' },
    'KN': { name: 'San Cristóbal y Nieves' },
    'LC': { name: 'Santa Lucía' },
    'VC': { name: 'San Vicente y las Granadinas' },
    'TT': { name: 'Trinidad y Tobago' },

    // --- SUDAMÉRICA ADICIONAL (3) ---
    'BR': { name: 'Brasil' },
    'GY': { name: 'Guyana' },
    'SR': { name: 'Surinam' },

    // --- EUROPA (44) ---
    'AL': { name: 'Albania' },
    'AD': { name: 'Andorra' },
    'AT': { name: 'Austria' },
    'BY': { name: 'Bielorrusia' },
    'BE': { name: 'Bélgica' },
    'BA': { name: 'Bosnia y Herzegovina' },
    'BG': { name: 'Bulgaria' },
    'HR': { name: 'Croacia' },
    'CZ': { name: 'República Checa' },
    'DK': { name: 'Dinamarca' },
    'EE': { name: 'Estonia' },
    'FI': { name: 'Finlandia' },
    'FR': { name: 'Francia' },
    'DE': { name: 'Alemania' },
    'GR': { name: 'Grecia' },
    'HU': { name: 'Hungría' },
    'IS': { name: 'Islandia' },
    'IE': { name: 'Irlanda' },
    'IT': { name: 'Italia' },
    'XK': { name: 'Kosovo' },
    'LV': { name: 'Letonia' },
    'LI': { name: 'Liechtenstein' },
    'LT': { name: 'Lituania' },
    'LU': { name: 'Luxemburgo' },
    'MK': { name: 'Macedonia del Norte' },
    'MT': { name: 'Malta' },
    'MD': { name: 'Moldavia' },
    'MC': { name: 'Mónaco' },
    'ME': { name: 'Montenegro' },
    'NL': { name: 'Países Bajos' },
    'NO': { name: 'Noruega' },
    'PL': { name: 'Polonia' },
    'PT': { name: 'Portugal' },
    'RO': { name: 'Rumanía' },
    'RU': { name: 'Rusia' },
    'SM': { name: 'San Marino' },
    'RS': { name: 'Serbia' },
    'SK': { name: 'Eslovaquia' },
    'SI': { name: 'Eslovenia' },
    'ES': { name: 'España' },
    'SE': { name: 'Suecia' },
    'CH': { name: 'Suiza' },
    'UA': { name: 'Ucrania' },
    'GB': { name: 'Reino Unido' },
    'VA': { name: 'Ciudad del Vaticano' },

    // --- ASIA (48) ---
    'AF': { name: 'Afganistán' },
    'AM': { name: 'Armenia' },
    'AZ': { name: 'Azerbaiyán' },
    'BH': { name: 'Baréin' },
    'BD': { name: 'Bangladés' },
    'BT': { name: 'Bután' },
    'BN': { name: 'Brunéi' },
    'KH': { name: 'Camboya' },
    'CN': { name: 'China' },
    'CY': { name: 'Chipre' },
    'GE': { name: 'Georgia' },
    'IN': { name: 'India' },
    'ID': { name: 'Indonesia' },
    'IR': { name: 'Irán' },
    'IQ': { name: 'Irak' },
    'IL': { name: 'Israel' },
    'JP': { name: 'Japón' },
    'JO': { name: 'Jordania' },
    'KZ': { name: 'Kazajistán' },
    'KW': { name: 'Kuwait' },
    'KG': { name: 'Kirguistán' },
    'LA': { name: 'Laos' },
    'LB': { name: 'Líbano' },
    'MY': { name: 'Malasia' },
    'MV': { name: 'Maldivas' },
    'MN': { name: 'Mongolia' },
    'MM': { name: 'Myanmar' },
    'NP': { name: 'Nepal' },
    'KP': { name: 'Corea del Norte' },
    'OM': { name: 'Omán' },
    'PK': { name: 'Pakistán' },
    'PS': { name: 'Palestina' },
    'PH': { name: 'Filipinas' },
    'QA': { name: 'Catar' },
    'SA': { name: 'Arabia Saudita' },
    'SG': { name: 'Singapur' },
    'KR': { name: 'Corea del Sur' },
    'LK': { name: 'Sri Lanka' },
    'SY': { name: 'Siria' },
    'TW': { name: 'Taiwán' },
    'TJ': { name: 'Tayikistán' },
    'TH': { name: 'Tailandia' },
    'TL': { name: 'Timor Oriental' },
    'TR': { name: 'Turquía' },
    'TM': { name: 'Turkmenistán' },
    'AE': { name: 'Emiratos Árabes Unidos' },
    'UZ': { name: 'Uzbekistán' },
    'VN': { name: 'Vietnam' },
    'YE': { name: 'Yemen' },

    // --- ÁFRICA (54) ---
    'DZ': { name: 'Argelia' },
    'AO': { name: 'Angola' },
    'BJ': { name: 'Benín' },
    'BW': { name: 'Botsuana' },
    'BF': { name: 'Burkina Faso' },
    'BI': { name: 'Burundi' },
    'CV': { name: 'Cabo Verde' },
    'CM': { name: 'Camerún' },
    'CF': { name: 'República Centroafricana' },
    'TD': { name: 'Chad' },
    'KM': { name: 'Comoras' },
    'CG': { name: 'Congo' },
    'CD': { name: 'República Democrática del Congo' },
    'CI': { name: 'Costa de Marfil' },
    'DJ': { name: 'Yibuti' },
    'EG': { name: 'Egipto' },
    'ER': { name: 'Eritrea' },
    'SZ': { name: 'Esuatini' },
    'ET': { name: 'Etiopía' },
    'GA': { name: 'Gabón' },
    'GM': { name: 'Gambia' },
    'GH': { name: 'Ghana' },
    'GN': { name: 'Guinea' },
    'GW': { name: 'Guinea-Bisáu' },
    'KE': { name: 'Kenia' },
    'LS': { name: 'Lesoto' },
    'LR': { name: 'Liberia' },
    'LY': { name: 'Libia' },
    'MG': { name: 'Madagascar' },
    'MW': { name: 'Malaui' },
    'ML': { name: 'Malí' },
    'MR': { name: 'Mauritania' },
    'MU': { name: 'Mauricio' },
    'MA': { name: 'Marruecos' },
    'MZ': { name: 'Mozambique' },
    'NA': { name: 'Namibia' },
    'NE': { name: 'Níger' },
    'NG': { name: 'Nigeria' },
    'RW': { name: 'Ruanda' },
    'ST': { name: 'Santo Tomé y Príncipe' },
    'SN': { name: 'Senegal' },
    'SC': { name: 'Seychelles' },
    'SL': { name: 'Sierra Leona' },
    'SO': { name: 'Somalia' },
    'ZA': { name: 'Sudáfrica' },
    'SS': { name: 'Sudán del Sur' },
    'SD': { name: 'Sudán' },
    'TZ': { name: 'Tanzania' },
    'TG': { name: 'Togo' },
    'TN': { name: 'Túnez' },
    'UG': { name: 'Uganda' },
    'ZM': { name: 'Zambia' },
    'ZW': { name: 'Zimbabue' },

    // --- OCEANÍA (14) ---
    'AU': { name: 'Australia' },
    'FJ': { name: 'Fiyi' },
    'KI': { name: 'Kiribati' },
    'MH': { name: 'Islas Marshall' },
    'FM': { name: 'Micronesia' },
    'NR': { name: 'Nauru' },
    'NZ': { name: 'Nueva Zelanda' },
    'PW': { name: 'Palaos' },
    'PG': { name: 'Papúa Nueva Guinea' },
    'WS': { name: 'Samoa' },
    'SB': { name: 'Islas Salomón' },
    'TO': { name: 'Tonga' },
    'TV': { name: 'Tuvalu' },
    'VU': { name: 'Vanuatu' },
    'AW': { name: 'Aruba' },
    'HK': { name: 'Hong Kong' },
    'MQ': { name: 'Martinica' },
};

const countryName = (code) => COUNTRY_MAP[code]?.name || code;

// El backend arma la palabra clave como "consulta (dispositivo)"
const splitKeyword = (keyword = '') => {
    const m = keyword.match(/^(.*)\s\((desktop|mobile)\)$/i);
    if (!m) return { query: keyword, device: null };
    return { query: m[1], device: m[2].toLowerCase() === 'mobile' ? 'Móvil' : 'Escritorio' };
};

const STATUS = (rank) => {
    if (rank <= 3) return ['Top 3', 'green'];
    if (rank <= 10) return ['Página 1', 'green'];
    if (rank <= 20) return ['Página 2', 'amber'];
    if (rank <= 50) return ['Lejos', 'amber'];
    return ['No visible', 'red'];
};

const rankColor = (rank) => {
    if (rank <= 10) return 'text-emerald-700';
    if (rank <= 20) return 'text-amber-700';
    if (rank <= 50) return 'text-orange-700';
    return 'text-red-700';
};

// Tiempo relativo legible
export const timeAgo = (isoDate) => {
    if (!isoDate) return '—';
    const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Ayer' : `Hace ${days} días`;
};

export const isNational = (r) => r.country === 'CO';

// Posiciones en Google por servicio. `scope`: 'national' | 'international' (lo controla la página)
const SeoRankingTable = ({ rankings, scope, onScopeChange, loading }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (rankings || [])
            .filter((r) => (scope === 'national' ? isNational(r) : !isNational(r)))
            .filter((r) => !q || r.service.toLowerCase().includes(q) || r.keyword.toLowerCase().includes(q))
            .sort((a, b) => a.ranking - b.ranking);
    }, [rankings, scope, search]);

    const pages = Math.max(Math.ceil(rows.length / pageSize), 1);
    const visible = rows.slice((page - 1) * pageSize, page * pageSize);
    const top10 = rows.filter((r) => r.ranking <= 10).length;

    return (
        <Card aria-labelledby="rank-title" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 border-b border-slate-200">
                <div className="flex items-center gap-5 self-stretch">
                    <h2 id="rank-title" className="m-0 py-4 text-base font-bold">Posiciones</h2>
                    <Tabs
                        label="Mercado"
                        tabs={[{ value: 'national', label: 'Nacional' }, { value: 'international', label: 'Internacional' }]}
                        value={scope}
                        onChange={(v) => { onScopeChange(v); setPage(1); }}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 py-2.5">
                    {rows.length > 0 && <span className="text-[13px] text-slate-600"><strong className="text-emerald-700">{top10}</strong> de {rows.length} en el Top 10</span>}
                    <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar servicio o palabra clave" className="w-full sm:w-72" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className={cx(tableClass, 'min-w-[860px]')}>
                    <thead>
                        <tr>
                            <th scope="col" className={thClass}>Servicio</th>
                            <th scope="col" className={thClass}>Búsqueda en Google</th>
                            <th scope="col" className={thClass}>Dispositivo</th>
                            <th scope="col" className={thClass}>País</th>
                            <th scope="col" className={cx(thClass, 'text-center')}>Posición</th>
                            <th scope="col" className={thClass}>Estado</th>
                            <th scope="col" className={cx(thClass, 'text-right')}>Verificado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((r, i) => {
                            const { query, device } = splitKeyword(r.keyword);
                            const [label, tone] = STATUS(r.ranking);
                            return (
                                <tr key={`${r.service}-${r.country}-${r.keyword}-${i}`} className={trClass}>
                                    <th scope="row" className={cx(tdClass, 'text-left font-semibold text-slate-900 max-w-[240px]')}>{r.service}</th>
                                    <td className={cx(tdClass, 'max-w-[300px]')}>“{query}”</td>
                                    <td className={tdClass}>{device ? <Pill>{device}</Pill> : '—'}</td>
                                    <td className={tdClass}>{countryName(r.country)}</td>
                                    <td className={cx(tdClass, 'text-center text-base font-bold', rankColor(r.ranking))}>#{r.ranking}</td>
                                    <td className={tdClass}><Pill tone={tone}>{label}</Pill></td>
                                    <td className={cx(tdClass, 'text-right text-slate-600 whitespace-nowrap')}>{timeAgo(r.checked_at)}</td>
                                </tr>
                            );
                        })}
                        {visible.length === 0 && (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                                {loading ? 'Cargando posiciones…' : search ? 'Ningún resultado para la búsqueda.' : 'Aún no hay posiciones verificadas en este mercado.'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {rows.length > 0 && (
                <Pagination
                    page={page}
                    pages={pages}
                    onPage={setPage}
                    pageSize={pageSize}
                    onPageSize={(n) => { setPageSize(n); setPage(1); }}
                    sizes={[10, 25, 50]}
                    total={rows.length}
                    noun="búsquedas"
                />
            )}
        </Card>
    );
};

export default SeoRankingTable;
