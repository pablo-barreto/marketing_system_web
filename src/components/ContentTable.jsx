'use client';
import { useState } from 'react';
import Swal from 'sweetalert2';
import FormattedDate from './FormattedDate';
import { useApi, withQuery } from '../hooks/useApi';
import { Pagination, buttonClass } from './ui';

// type: 'BLOG' o 'Q&A'. La lista pide al servidor solo la página que muestra.
export default function ContentTable({ type }) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const { data, loading } = useApi(withQuery('/api/v1/seo/content', { type, page, page_size: pageSize }));
    const items = data?.items || [];
    const total = data?.total || 0;

    // Sin URL pública (borrador o simulación) se muestra un resumen en lugar de abrir el enlace
    const openContent = (e, item) => {
        if (item.url && item.url !== '#' && item.url.startsWith('http')) return;
        e.preventDefault();
        Swal.fire({
            title: item.title || 'Contenido generado',
            html: `<p><b>Servicio:</b> ${item.service}</p><p style="color:#64748b">Este contenido aún no tiene una URL pública (borrador interno).</p>`,
            icon: 'info',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#2563EB',
        });
    };

    return (
        <div>
            {items.length > 0 ? (
                <ul className="list-none m-0 p-0">
                    {items.map((c, i) => (
                        <li key={`${c.created_at}-${i}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 first:border-t-0">
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="font-semibold text-slate-900">{c.title || c.service}</span>
                                <span className="text-xs text-slate-500">{c.service} · <FormattedDate dateString={c.created_at} /></span>
                            </div>
                            <a
                                href={c.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => openContent(e, c)}
                                className={buttonClass('secondary', 'sm', 'no-underline')}
                            >
                                Ver
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="m-0 px-5 py-10 text-center text-slate-500">{loading ? 'Cargando…' : 'La IA aún no ha publicado contenido de este tipo.'}</p>
            )}
            {total > 0 && (
                <Pagination
                    page={page}
                    pages={data?.pages}
                    onPage={setPage}
                    pageSize={pageSize}
                    onPageSize={(n) => { setPageSize(n); setPage(1); }}
                    sizes={[5, 10, 20]}
                    total={total}
                    noun="publicaciones"
                />
            )}
        </div>
    );
}
