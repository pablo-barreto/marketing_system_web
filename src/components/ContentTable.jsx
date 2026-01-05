import React, { useState } from 'react';
import Swal from 'sweetalert2'; // <--- 1. IMPORTAR SWEETALERT
import FormattedDate from './FormattedDate';

const ContentTable = ({ content }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const safeContent = content || [];
    const totalPages = Math.ceil(safeContent.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = safeContent.slice(indexOfFirstItem, indexOfLastItem);

    const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
    const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
    const handlePageSizeChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };

    // --- 2. NUEVA FUNCIÓN PARA MANEJAR EL CLIC ---
    const handleViewContent = (e, item) => {
        e.preventDefault(); // Evita que la página salte al inicio (#)

        // A. Si el backend nos mandó una URL real (ej: WordPress link), la abrimos
        if (item.url && item.url !== '#' && item.url.startsWith('http')) {
            window.open(item.url, '_blank');
            return;
        }

        // B. Si no hay URL (Simulación/Borrador), mostramos alerta
        Swal.fire({
            title: 'Vista Previa de Contenido',
            html: `
                <div style="text-align: left; font-size: 0.9rem">
                    <p><b>Título:</b> ${item.title || 'Sin título'}</p>
                    <p><b>Servicio:</b> ${item.service}</p>
                    <p><b>Tipo:</b> ${item.type}</p>
                    <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee" />
                    <p style="color: #64748b; font-style: italic;">
                        ⚠️ Este contenido fue generado por la IA pero aún no tiene una URL pública o es un borrador interno.
                        <br/><br/>
                        En producción, este botón te llevará directamente a tu blog o CMS.
                    </p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3b82f6'
        });
    };

    // Estilos
    const buttonStyle = (disabled) => ({
        padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0',
        backgroundColor: disabled ? '#f1f5f9' : 'white', color: disabled ? '#94a3b8' : '#0f172a',
        cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: '600'
    });

    const selectStyle = { padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#475569', backgroundColor: 'white', cursor: 'pointer' };

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>📝 Contenido Publicado</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>Total: {safeContent.length}</span>
            </div>

            {/* Lista Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {currentItems.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {currentItems.map((c, i) => (
                            <li key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}>
                                <div>
                                    <span style={{ display: 'block', fontWeight: '600', color: '#334155', fontSize: '0.9rem', marginBottom: '2px' }}>
                                        {c.title || c.service}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                        {c.type || 'BLOG'} • <FormattedDate dateString={c.created_at} />
                                    </span>
                                </div>
                                
                                {/* --- 3. BOTÓN DE ACCIÓN CONECTADO --- */}
                                <a 
                                    href={c.url || '#'} 
                                    onClick={(e) => handleViewContent(e, c)} 
                                    style={{ 
                                        color: '#2563eb', textDecoration: 'none', fontSize: '0.75rem', 
                                        fontWeight: '600', padding: '6px 12px', backgroundColor: '#eff6ff', 
                                        borderRadius: '6px', cursor: 'pointer', border: '1px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#dbeafe'; e.target.style.borderColor = '#bfdbfe'; }}
                                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#eff6ff'; e.target.style.borderColor = 'transparent'; }}
                                >
                                    Ver &rarr;
                                </a>
                                {/* ----------------------------------- */}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        La IA aún no ha publicado contenido.
                    </div>
                )}
            </div>

            {/* Footer */}
            {safeContent.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Filas:</span>
                        <select value={itemsPerPage} onChange={handlePageSizeChange} style={selectStyle}>
                            <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '4px' }}>{currentPage} / {totalPages}</span>
                        <button onClick={goToPrevPage} disabled={currentPage === 1} style={buttonStyle(currentPage === 1)}>Anterior</button>
                        <button onClick={goToNextPage} disabled={currentPage === totalPages} style={buttonStyle(currentPage === totalPages)}>Siguiente</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentTable;