/*
import { useEffect, useState } from 'react';
import '../styles/InformesComponent.css';
import { BookText } from 'lucide-react';

function InformesAdmin() {
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
            <h1 className="informes-title">Administrar Informes</h1>
            <p className="informes-subtitle">Consulta, visualiza y edita los informes técnicos registrados en el sistema.</p>
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

export default InformesAdmin;
*/
// IGNORE: This file is a placeholder for future development and should not be used in production