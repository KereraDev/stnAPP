import { useEffect, useState } from 'react';
import '../styles/InformesComponent.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BookText } from 'lucide-react';

function InformesComponent() {
  const [informes, setInformes] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInforme, setSelectedInforme] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem('informes_list');
    if (cached) {
      try {
        setInformes(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem('informes_list');
      }
    }
    const obtenerInformes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No hay token de autenticación');
          return;
        }
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rol = payload.rol;
        const endpoint = rol === 'admin'
          ? 'http://localhost:3000/api/informes'
          : 'http://localhost:3000/api/informes/mios';

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('No se pudieron obtener los informes');
        }

        const data = await response.json();
        setInformes(data.informes || []);
        localStorage.setItem('informes_list', JSON.stringify(data.informes || []));
      } catch (err) {
        setError(err.message);
      }
    };

    obtenerInformes();
  }, []);

const exportarPDF = async () => {
  if (!selectedInforme) return;
  const doc = new jsPDF();
  doc.text('Detalle del Informe', 14, 16);
  const cliente = selectedInforme.cliente_id || {};
  const ubicacion = selectedInforme.ubicacion || {};
  const rows = [
    ['Cliente', cliente.nombre || '-'],
    ['Correo', cliente.correo || '-'],
    ['RUT', cliente.rut || '-'],
    ['Estado', selectedInforme.estado],
    ['Facturado', selectedInforme.facturado ? 'Sí' : 'No'],
    ['Fecha Actividad', selectedInforme.fecha_actividad || '-'],
    ['Fecha Aprobación', selectedInforme.fecha_aprobacion || '-'],
    ['Fecha Envío', selectedInforme.fecha_envio || '-'],
    ['Fecha Facturación', selectedInforme.fecha_facturacion || '-'],
    [
      'Firma Técnico',
      `Nombre: ${Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[0] || '-'}\n` +
      `RUT: ${Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[1] || '-'}\n` +
      `Fecha: ${Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[2] || '-'}`
    ],
    // Aquí solo mostramos los nombres, las imágenes van después
    [
      'Imágenes',
      Array.isArray(selectedInforme.imagenes)
        ? selectedInforme.imagenes.map((_, idx) => `Imagen ${idx + 1}`).join(', ')
        : '-'
    ],
    [
      'Materiales Utilizados',
      Array.isArray(selectedInforme.materiales_utilizados) && selectedInforme.materiales_utilizados.length > 2
        ? `Nombre: ${selectedInforme.materiales_utilizados[0] || '-'}\n` +
          `Cantidad: ${selectedInforme.materiales_utilizados[1] || '-'}\n` +
          `Valor: ${selectedInforme.materiales_utilizados[2] || '-'}`
        : '-'
    ],
    ['Observaciones', selectedInforme.observaciones || '-'],
    ['Tipo Aislador', selectedInforme.tipo_aislador || '-'],
    ['Ubicación', `${ubicacion.direccion || ''}${ubicacion.direccion && ubicacion.comuna ? ', ' : ''}${ubicacion.comuna || ''}`],
  ];
  autoTable(doc, {
    body: rows,
    startY: 22,
    styles: { cellWidth: 'wrap' },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Agregar imágenes debajo de la tabla
  if (Array.isArray(selectedInforme.imagenes)) {
    let y = doc.lastAutoTable.finalY + 10;
    for (let i = 0; i < selectedInforme.imagenes.length && i < 3; i++) {
      const url = selectedInforme.imagenes[i];
      try {
        // Convertir la imagen a base64
        const imgData = await getImageBase64(url);
        doc.text(`Imagen ${i + 1}:`, 14, y);
        doc.addImage(imgData, 'JPEG', 14, y + 2, 40, 30); // Ajusta tamaño y posición
        y += 35;
      } catch (e) {
        doc.text(`No se pudo cargar la imagen ${i + 1}`, 14, y);
        y += 10;
      }
    }
  }

  doc.save('informe.pdf');
};

// Función auxiliar para convertir una imagen a base64
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

const exportarExcel = () => {
  if (!selectedInforme) return;
  const cliente = selectedInforme.cliente_id || {};
  const ubicacion = selectedInforme.ubicacion || {};
  const data = [
    ['Cliente', cliente.nombre || '-'],
    ['Correo', cliente.correo || '-'],
    ['RUT', cliente.rut || '-'],
    ['Estado', selectedInforme.estado],
    ['Facturado', selectedInforme.facturado ? 'Sí' : 'No'],
    ['Fecha Actividad', selectedInforme.fecha_actividad || '-'],
    ['Fecha Aprobación', selectedInforme.fecha_aprobacion || '-'],
    ['Fecha Envío', selectedInforme.fecha_envio || '-'],
    ['Fecha Facturación', selectedInforme.fecha_facturacion || '-'],
    [
      'Firma Técnico',
      `Nombre: ${Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[0] || '-'}\n` +
      `RUT: ${Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[1] || '-'}\n` +
      `Fecha: ${Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[2] || '-'}`
    ],
    [
      'Materiales Utilizados',
      Array.isArray(selectedInforme.materiales_utilizados) && selectedInforme.materiales_utilizados.length > 2
        ? `Nombre: ${selectedInforme.materiales_utilizados[0] || '-'}\n` +
          `Cantidad: ${selectedInforme.materiales_utilizados[1] || '-'}\n` +
          `Valor: ${selectedInforme.materiales_utilizados[2] || '-'}`
        : '-'
    ],
    ['Observaciones', selectedInforme.observaciones || '-'],
    ['Tipo Aislador', selectedInforme.tipo_aislador || '-'],
    ['Ubicación', `${ubicacion.direccion || ''}${ubicacion.direccion && ubicacion.comuna ? ', ' : ''}${ubicacion.comuna || ''}`],
  ];

  // Agregar cada imagen como fila aparte
  if (Array.isArray(selectedInforme.imagenes) && selectedInforme.imagenes.length > 0) {
    selectedInforme.imagenes.forEach((url, idx) => {
      data.push([`Imagen ${idx + 1}`, url]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Informe');
  XLSX.writeFile(wb, 'informe.xlsx');
};

const renderModal = () => {
    if (!modalOpen || !selectedInforme) return null;
    const cliente = selectedInforme.cliente_id || {};
    const ubicacion = selectedInforme.ubicacion || {};
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
                <tr><th>Estado</th><td>{selectedInforme.estado}</td></tr>
                <tr><th>Facturado</th><td>{selectedInforme.facturado ? 'Sí' : 'No'}</td></tr>
                <tr><th>Fecha Actividad</th><td>{selectedInforme.fecha_actividad ? (() => {
                  const d = new Date(selectedInforme.fecha_actividad);
                  const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  return `${hora} ${fecha}`;
                })() : '-'}</td></tr>
                <tr><th>Fecha Aprobación</th><td>{selectedInforme.fecha_aprobacion ? (() => {
                  const d = new Date(selectedInforme.fecha_aprobacion);
                  const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  return `${hora} ${fecha}`;
                })() : '-'}</td></tr>
                <tr><th>Fecha Envío</th><td>{selectedInforme.fecha_envio ? (() => {
                  const d = new Date(selectedInforme.fecha_envio);
                  const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  return `${hora} ${fecha}`;
                })() : '-'}</td></tr>
                <tr><th>Fecha Facturación</th><td>{selectedInforme.fecha_facturacion ? (() => {
                  const d = new Date(selectedInforme.fecha_facturacion);
                  const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  return `${hora} ${fecha}`;
                })() : '-'}</td></tr>
                <tr>
                  <th>Firma Técnico</th>
                  <td>
                    <div><b>Nombre:</b> {Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[0] ? selectedInforme.firma_tecnico[0] : '-'}</div>
                    <div><b>RUT:</b> {Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[1] ? selectedInforme.firma_tecnico[1] : '-'}</div>
                    <div><b>Fecha:</b> {Array.isArray(selectedInforme.firma_tecnico) && selectedInforme.firma_tecnico[2] ? (() => {
                      const d = new Date(selectedInforme.firma_tecnico[2]);
                      if (isNaN(d)) return selectedInforme.firma_tecnico[2];
                      const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                      const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                      return `${hora} ${fecha}`;
                    })() : '-'}</div>
                  </td>
                </tr>
                <tr>
                  <th>Imágenes</th>
                  <td className='rubius'>{Array.isArray(selectedInforme.imagenes) ? selectedInforme.imagenes.map((img, idx) => (<a key={idx} href={img} target="_blank" rel="noopener noreferrer">Ver</a>)) : '-'}</td>
                </tr>
                <tr>
                  <th>Materiales Utilizados</th>
                  <td>
                    {Array.isArray(selectedInforme.materiales_utilizados) && selectedInforme.materiales_utilizados.length > 2 ? (
                      <div>
                        <b>Nombre:</b> {selectedInforme.materiales_utilizados[0] || '-'}<br />
                        <b>Cantidad:</b> {selectedInforme.materiales_utilizados[1] || '-'}<br />
                        <b>Valor:</b> {selectedInforme.materiales_utilizados[2] || '-'}
                      </div>
                    ) : '-'}
                  </td>
                </tr>
                <tr><th>Observaciones</th><td>{selectedInforme.observaciones}</td></tr>
                <tr><th>Tipo Aislador</th><td>{selectedInforme.tipo_aislador}</td></tr>
                <tr><th>Ubicación</th><td>{ubicacion.direccion || ''}{ubicacion.direccion && ubicacion.comuna ? ', ' : ''}{ubicacion.comuna || ''}</td></tr>
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
              const cliente = informe.cliente_id || {};
              const fechaActividad = informe.fecha_actividad ? (() => {
                const d = new Date(informe.fecha_actividad);
                const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return `${hora} ${fecha}`;
              })() : '';
              const firma = Array.isArray(informe.firma_tecnico) ? informe.firma_tecnico : [];
              return (
                <tr key={informe._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedInforme(informe); setModalOpen(true); }}>
                  <td>
                    <div>{firma[0] || '-'}</div>
                  </td>
                  <td>{cliente.nombre || ''}</td>
                  <td>{cliente.correo || ''}</td>
                  <td>{cliente.rut || ''}</td>
                  <td>{informe.estado}</td>
                  <td>{informe.facturado ? 'Sí' : 'No'}</td>
                  <td>{fechaActividad}</td>
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
