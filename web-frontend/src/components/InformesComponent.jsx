import { useEffect, useState } from 'react';
import '../styles/InformesComponent.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BookText } from 'lucide-react';

const BASE = (import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:3000');

/* ---- helpers de formato y compat ---- */
function fmtCL(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d)) return '-';
  const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${hora} ${fecha}`;
}
function getCliente(inf) { return inf?.cliente || inf?.cliente_id || {}; }
function getTecnicoNombre(inf) {
  if (inf?.tecnico && typeof inf.tecnico === 'object') return inf.tecnico.nombre || '-';
  if (inf?.firmaTecnico?.nombre) return inf.firmaTecnico.nombre;
  if (Array.isArray(inf?.firma_tecnico)) return inf.firma_tecnico[0] || '-';
  return '-';
}
function getFechaActividad(inf) { return inf?.fechaActividad || inf?.fecha_actividad || null; }
function getUbicacion(inf) { return inf?.ubicacion || {}; }
function getMateriales(inf) {
  if (Array.isArray(inf?.materialesUtilizados)) return inf.materialesUtilizados;
  if (Array.isArray(inf?.materiales_utilizados)) {
    const [nombre = '', cantidad = '', valor = ''] = inf.materiales_utilizados;
    return [{ nombre, cantidad, valor }];
  }
  return [];
}
function getFirma(inf) {
  if (inf?.firmaTecnico) return inf.firmaTecnico;
  if (Array.isArray(inf?.firma_tecnico)) {
    const [nombre = '', rut = '', fecha = ''] = inf.firma_tecnico;
    return { nombre, rut, fecha };
  }
  return { nombre: '', rut: '', fecha: '' };
}
function getTipoAislador(inf) { return inf?.tipoAislador || inf?.tipo_aislador || '-'; }
function getEstado(inf) { return inf?.estado || 'pendiente'; }
function getFacturado(inf) { return !!inf?.facturado; }

// IMÁGENES (opcional)
async function getImageBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function InformesComponent() {
  const [informes, setInformes] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInforme, setSelectedInforme] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem('informes_list');
    if (cached) {
      try { setInformes(JSON.parse(cached)); } catch { localStorage.removeItem('informes_list'); }
    }
    const obtenerInformes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setError('No hay token de autenticación'); return; }
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rol = payload.rol;
        const endpoint = rol === 'admin'
          ? `${BASE}/api/informes`
          : `${BASE}/api/informes/mios`;

        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('No se pudieron obtener los informes');

        const data = await res.json();
        const list = data.informes || [];
        setInformes(list);
        localStorage.setItem('informes_list', JSON.stringify(list));
      } catch (err) {
        setError(err.message);
      }
    };
    obtenerInformes();
  }, []);

  /* ---------- Exportar ---------- */
  const exportarPDF = async () => {
    if (!selectedInforme) return;
    const doc = new jsPDF();
    doc.text('Detalle del Informe', 14, 16);

    const cliente = getCliente(selectedInforme);
    const ubicacion = getUbicacion(selectedInforme);
    const firma = getFirma(selectedInforme);
    const materiales = getMateriales(selectedInforme);

    const rows = [
      ['Cliente', cliente.nombre || '-'],
      ['Correo', cliente.correo || '-'],
      ['RUT', cliente.rut || '-'],
      ['Estado', getEstado(selectedInforme)],
      ['Facturado', getFacturado(selectedInforme) ? 'Sí' : 'No'],
      ['Fecha Actividad', (() => {
        const v = selectedInforme.fechaActividad ?? selectedInforme.fecha_actividad;
        return v ? fmtCL(v) : '-';
      })()],
      ['Fecha Aprobación', (() => {
        const v = selectedInforme.fechaAprobacion ?? selectedInforme.fecha_aprobacion;
        return v ? fmtCL(v) : '-';
      })()],
      ['Fecha Envío', (() => {
        const v = selectedInforme.fechaEnvio ?? selectedInforme.fecha_envio;
        return v ? fmtCL(v) : '-';
      })()],
      ['Fecha Facturación', (() => {
        const v = selectedInforme.fechaFacturacion ?? selectedInforme.fecha_facturacion;
        return v ? fmtCL(v) : '-';
      })()],
      ['Firma Técnico',
        `Nombre: ${firma.nombre || '-'}\nRUT: ${firma.rut || '-'}\nFecha: ${firma.fecha ? fmtCL(firma.fecha) : '-'}`],
      ['Materiales Utilizados',
        (materiales.length
          ? materiales.map(m => `Nombre: ${m?.nombre || '-'} — Cantidad: ${m?.cantidad || '-'} — Valor: ${m?.valor || '-'}`).join('\n')
          : '-')],
      ['Observaciones', selectedInforme.observaciones || '-'],
      ['Tipo Aislador', getTipoAislador(selectedInforme)],
      ['Ubicación', [ubicacion.direccion, ubicacion.comuna].filter(Boolean).join(', ') || '-'],
    ];

    autoTable(doc, { body: rows, startY: 22, styles: { cellWidth: 'wrap' }, headStyles: { fillColor: [24, 93, 200] } });

    // IMÁGENES (opcional)
    if (Array.isArray(selectedInforme.imagenes) && selectedInforme.imagenes.length) {
      let y = (doc.lastAutoTable?.finalY || 22) + 10;
      for (let i = 0; i < selectedInforme.imagenes.length && i < 3; i++) {
        try {
          const imgData = await getImageBase64(selectedInforme.imagenes[i]);
          const fmt = String(imgData).startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.text(`Imagen ${i + 1}:`, 14, y);
          doc.addImage(imgData, fmt, 14, y + 2, 50, 38);
          y += 45;
        } catch {
          doc.text(`No se pudo cargar la imagen ${i + 1}`, 14, y);
          y += 10;
        }
      }
    }

    doc.save(`informe-${selectedInforme._id || 'sin-id'}.pdf`);
  };

  const exportarExcel = () => {
    if (!selectedInforme) return;

    const cliente = getCliente(selectedInforme);
    const ubicacion = getUbicacion(selectedInforme);
    const firma = getFirma(selectedInforme);
    const materiales = getMateriales(selectedInforme);

    const data = [
      ['Cliente', cliente.nombre || '-'],
      ['Correo', cliente.correo || '-'],
      ['RUT', cliente.rut || '-'],
      ['Estado', getEstado(selectedInforme)],
      ['Facturado', getFacturado(selectedInforme) ? 'Sí' : 'No'],
      ['Fecha Actividad', (() => {
        const v = selectedInforme.fechaActividad ?? selectedInforme.fecha_actividad;
        return v ? fmtCL(v) : '-';
      })()],
      ['Fecha Aprobación', (() => {
        const v = selectedInforme.fechaAprobacion ?? selectedInforme.fecha_aprobacion;
        return v ? fmtCL(v) : '-';
      })()],
      ['Fecha Envío', (() => {
        const v = selectedInforme.fechaEnvio ?? selectedInforme.fecha_envio;
        return v ? fmtCL(v) : '-';
      })()],
      ['Fecha Facturación', (() => {
        const v = selectedInforme.fechaFacturacion ?? selectedInforme.fecha_facturacion;
        return v ? fmtCL(v) : '-';
      })()],
      ['Firma Técnico',
        `Nombre: ${firma.nombre || '-'}\nRUT: ${firma.rut || '-'}\nFecha: ${firma.fecha ? fmtCL(firma.fecha) : '-'}`],
      ['Materiales Utilizados',
        (materiales.length
          ? materiales.map(m => `Nombre: ${m?.nombre || '-'} — Cantidad: ${m?.cantidad || '-'} — Valor: ${m?.valor || '-'}`).join('\n')
          : '-')],
      ['Observaciones', selectedInforme.observaciones || '-'],
      ['Tipo Aislador', getTipoAislador(selectedInforme)],
      ['Ubicación', [ubicacion.direccion, ubicacion.comuna].filter(Boolean).join(', ') || '-'],
    ];

    // IMÁGENES (opcional)
    if (Array.isArray(selectedInforme.imagenes) && selectedInforme.imagenes.length > 0) {
      selectedInforme.imagenes.forEach((url, idx) => data.push([`Imagen ${idx + 1}`, url]));
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe');
    XLSX.writeFile(wb, `informe-${selectedInforme._id || 'sin-id'}.xlsx`);
  };

  /* ---------- modal ---------- */
  const renderModal = () => {
    if (!modalOpen || !selectedInforme) return null;
    const cliente = getCliente(selectedInforme);
    const ubicacion = getUbicacion(selectedInforme);
    const firma = getFirma(selectedInforme);
    const fechaAct = getFechaActividad(selectedInforme);

    return (
      <div className="modal-informe-bg" onClick={() => setModalOpen(false)}>
        <div className="modal-informe" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
          <h3>Detalle del Informe</h3>
          <div className="modal-informe-content">
            <table className="modal-informe-table">
              <tbody>
                <tr><th>Cliente</th><td>{cliente.nombre || '-'}</td></tr>
                <tr><th>Correo</th><td>{cliente.correo || '-'}</td></tr>
                <tr><th>RUT</th><td>{cliente.rut || '-'}</td></tr>
                <tr><th>Estado</th><td>{getEstado(selectedInforme)}</td></tr>
                <tr><th>Facturado</th><td>{getFacturado(selectedInforme) ? 'Sí' : 'No'}</td></tr>
                <tr><th>Fecha Actividad</th><td>{fechaAct ? fmtCL(fechaAct) : '-'}</td></tr>
                <tr><th>Fecha Aprobación</th><td>{selectedInforme.fechaAprobacion ? fmtCL(selectedInforme.fechaAprobacion) : (selectedInforme.fecha_aprobacion ? fmtCL(selectedInforme.fecha_aprobacion) : '-')}</td></tr>
                <tr><th>Fecha Envío</th><td>{selectedInforme.fechaEnvio ? fmtCL(selectedInforme.fechaEnvio) : (selectedInforme.fecha_envio ? fmtCL(selectedInforme.fecha_envio) : '-')}</td></tr>
                <tr><th>Fecha Facturación</th><td>{selectedInforme.fechaFacturacion ? fmtCL(selectedInforme.fechaFacturacion) : (selectedInforme.fecha_facturacion ? fmtCL(selectedInforme.fecha_facturacion) : '-')}</td></tr>
                <tr>
                  <th>Firma Técnico</th>
                  <td>
                    <div><b>Nombre:</b> {firma.nombre || '-'}</div>
                    <div><b>RUT:</b> {firma.rut || '-'}</div>
                    <div><b>Fecha:</b> {firma.fecha ? fmtCL(firma.fecha) : '-'}</div>
                  </td>
                </tr>
                <tr>
                  <th>Materiales Utilizados</th>
                  <td>
                    {getMateriales(selectedInforme).length
                      ? getMateriales(selectedInforme).map((m, i) => (
                          <div key={i}>
                            <b>Nombre:</b> {m?.nombre || '-'}&nbsp;&nbsp;
                            <b>Cantidad:</b> {m?.cantidad || '-'}&nbsp;&nbsp;
                            <b>Valor:</b> {m?.valor || '-'}
                          </div>
                        ))
                      : '-'}
                  </td>
                </tr>
                <tr><th>Observaciones</th><td>{selectedInforme.observaciones || '-'}</td></tr>
                <tr><th>Tipo Aislador</th><td>{getTipoAislador(selectedInforme)}</td></tr>
                <tr><th>Ubicación</th><td>{[ubicacion.direccion, ubicacion.comuna].filter(Boolean).join(', ') || '-'}</td></tr>
              </tbody>
            </table>

            <div style={{ textAlign: 'center', paddingTop: '1.2rem' }}>
              <button onClick={exportarPDF} style={{ background: '#d12e2e', color: '#fff', border: 'none', borderRadius: 4, padding: '0.5rem 1rem', cursor: 'pointer', marginRight: 8 }}>PDF</button>
              <button onClick={exportarExcel} style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 4, padding: '0.5rem 1rem', cursor: 'pointer' }}>EXCEL</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- render ---------- */
  return (
    <div className="informes-containerComponent informes-full-height">
      <div className="informes-container">
        <div className="informes-header-icon">
          <BookText size={36} color="#185dc8" />
        </div>
        <div>
          <h1 className="informes-title">Informes</h1>
          <p className="informes-subtitle">Consulta, visualiza y exporta los informes técnicos registrados en el sistema.</p>
        </div>
      </div>

      {error && <p className="informes-error">{error}</p>}

      {informes.length === 0 ? (
        <div className="no-informes">No hay informes disponibles.</div>
      ) : (
        <table className="informes-table">
          <thead>
            <tr>
              <th>Técnico</th>
              <th>Cliente</th>
              <th>Correo</th>
              <th>RUT</th>
              <th>Estado</th>
              <th>Facturado</th>
              <th>Fecha Actividad</th>
            </tr>
          </thead>
          <tbody>
            {informes.map((informe) => {
              const cliente = getCliente(informe);
              const fechaAct = getFechaActividad(informe);
              return (
                <tr key={informe._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedInforme(informe); setModalOpen(true); }}>
                  <td><div>{getTecnicoNombre(informe)}</div></td>
                  <td>{cliente.nombre || '-'}</td>
                  <td>{cliente.correo || '-'}</td>
                  <td>{cliente.rut || '-'}</td>
                  <td>{getEstado(informe)}</td>
                  <td>{getFacturado(informe) ? 'Sí' : 'No'}</td>
                  <td>{fechaAct ? fmtCL(fechaAct) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {renderModal()}
    </div>
  );
}

export default InformesComponent;
