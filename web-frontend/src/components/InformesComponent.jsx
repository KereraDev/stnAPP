import { useEffect, useState } from 'react';
import '../styles/InformesComponent.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BookText } from 'lucide-react';

const BASE = (import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:3000');

/* ---- helpers de formato ---- */
function fmtCL(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d)) return '-';
  const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${hora} ${fecha}`;
}
function fmtMonth(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return isNaN(d) ? '-' : d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short' });
}
const asString = (v) => (v == null ? '' : String(v));

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

/* Construye las filas para exportación desde el nuevo esquema */
function buildExportRows(inf) {
  const rows = [
    ['Instalación', asString(inf?.instalacion) || '-'],
    ['Jefe de faena', asString(inf?.jefeFaena) || '-'],
    ['Encargado', asString(inf?.encargado) || '-'],
    ['Tipo de intervención', asString(inf?.tipoIntervencion) || '-'],
    ['Fecha inicio', fmtCL(inf?.fechaInicio)],
    ['Fecha término', fmtCL(inf?.fechaTermino)],
    ['— Controles —', ''],
    ['N° serie Termo-Anem-Higrómetro', asString(inf?.controles?.numeroSerieTermoAnemHigrometro) || '-'],
    ['Humedad ambiente', asString(inf?.controles?.humedadAmbiente) || '-'],
    ['Velocidad Viento', asString(inf?.controles?.velocidadViento) || '-'],
    ['N° serie Conductivímetro', asString(inf?.controles?.numeroSerieConductivimetro) || '-'],
    ['Conductividad', asString(inf?.controles?.conductividad) || '-'],
    ['Presión Lavado', asString(inf?.controles?.presionLavado) || '-'],
    ['— Programa —', ''],
    ['Mes', fmtMonth(inf?.programa?.mes)],
    ['Estructuras Lavadas', inf?.programa?.estructurasLavadas ?? 0],
    ['Estructuras Pendientes', inf?.programa?.estructurasPendientes ?? 0],
    ['% de avance', (inf?.programa?.porcentajeAvance ?? 0) + '%'],
    ['Cantidad Est.', inf?.programa?.cantidadEst ?? 0],
    ['Tramo', asString(inf?.programa?.tramo) || '-'],
    ['N° cadenas lavadas', inf?.programa?.numeroCadenasLavadas ?? 0],
    ['— Control de Agua —', ''],
    ['Fecha', fmtCL(inf?.controlAgua?.fecha)],
    ['Responsable', asString(inf?.controlAgua?.responsable) || '-'],
    ['Proveedor de agua', asString(inf?.controlAgua?.proveedorAgua) || '-'],
    ['Consumo diario', asString(inf?.controlAgua?.consumoDiario) || '-'],
    ['— Personal —', ''],
    ['Supervisor', inf?.personal?.supervisor ?? 0],
    ['Jefe de brigada', inf?.personal?.jefeBrigada ?? 0],
    ['Prevencionista', inf?.personal?.prevencionista ?? 0],
    ['Operador', inf?.personal?.operador ?? 0],
    ['Técnico', inf?.personal?.tecnico ?? 0],
    ['Ayudante', inf?.personal?.ayudante ?? 0],
    ['— Totales —', ''],
    ['HH', inf?.totales?.hh ?? 0],
    ['Agua utilizada', asString(inf?.totales?.aguaUtilizada) || '-'],
    ['— Observaciones —', ''],
    ['Observación General', asString(inf?.observacionGeneral) || '-'],
    ['— Firma —', ''],
    ['Jefe de brigada', asString(inf?.firma?.jefeBrigada) || '-'],
  ];

  rows.push(['— Equipos Lavados —', '']);
  if (Array.isArray(inf?.equiposLavados) && inf.equiposLavados.length) {
    inf.equiposLavados.forEach((e, i) => {
      rows.push([`Equipo #${i + 1}`, '']);
      rows.push(['N°', e?.numero ?? '-']);
      rows.push(['Tipo', asString(e?.tipo) || '-']);
      rows.push(['Equipos', e?.equipos ?? 0]);
      rows.push(['Lavados', e?.lavados ?? 0]);
      rows.push(['Fecha', fmtCL(e?.fecha)]);
      rows.push(['N° PT', e?.numeroPT ?? '-']);
      rows.push(['Jefe de faena', asString(e?.jefeFaena) || '-']);
      rows.push(['N° Serie', e?.numeroSerie ?? '-']);
      rows.push(['Equipo', asString(e?.equipo) || '-']);
      rows.push(['H', e?.H ?? '-']);
      rows.push(['C', asString(e?.C) || '-']);
      rows.push(['V-V', asString(e?.vV) || '-']);
      rows.push(['P', asString(e?.P) || '-']);
      rows.push(['Camión', asString(e?.camion) || '-']);
      rows.push(['Método', asString(e?.metodo) || '-']);
      rows.push(['Lavada', e?.lavada ? 'Sí' : 'No']);
      rows.push(['Observaciones', asString(e?.observaciones) || '-']);
    });
  } else {
    rows.push(['Sin registros', '-']);
  }

  rows.push([
    '— Imágenes —',
    Array.isArray(inf?.imagenes) && inf.imagenes.length
      ? inf.imagenes.map((_, i) => `Imagen ${i + 1}`).join(', ')
      : '-'
  ]);

  return rows;
}

function InformesComponent() {
  const [informes, setInformes] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

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
        const endpoint = rol === 'admin' ? `${BASE}/api/informes` : `${BASE}/api/informes/mios`;

        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('No se pudieron obtener los informes');

        const data = await res.json();
        const list = data.informes || [];
        setInformes(list);
        localStorage.setItem('informes_list', JSON.stringify(list));
      } catch (err) {
        setError(err.message || 'Error al cargar informes');
      }
    };
    obtenerInformes();
  }, []);

  /* ---------- Exportar (nuevo esquema) ---------- */
  const exportarPDF = async () => {
    if (!selected) return;
    const doc = new jsPDF();
    doc.text('Detalle del Informe', 14, 16);

    const rows = buildExportRows(selected);
    autoTable(doc, { body: rows, startY: 22, styles: { cellWidth: 'wrap' } });

    if (Array.isArray(selected.imagenes) && selected.imagenes.length) {
      let y = (doc.lastAutoTable?.finalY || 22) + 10;
      for (let i = 0; i < selected.imagenes.length && i < 3; i++) {
        try {
          const imgData = await getImageBase64(selected.imagenes[i]);
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

    doc.save(`informe-${selected._id || 'sin-id'}.pdf`);
  };

  const exportarExcel = () => {
    if (!selected) return;
    const rows = buildExportRows(selected);
    if (Array.isArray(selected.imagenes) && selected.imagenes.length) {
      selected.imagenes.forEach((url, idx) => rows.push([`Imagen ${idx + 1}`, url]));
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe');
    XLSX.writeFile(wb, `informe-${selected._id || 'sin-id'}.xlsx`);
  };

  /* ---------- Modal ---------- */
  const renderModal = () => {
    if (!modalOpen || !selected) return null;
    const inf = selected;

    return (
      <div className="ic-modal-bg" onClick={() => setModalOpen(false)}>
        <div className="ic-modal" onClick={(e) => e.stopPropagation()}>
          <button className="ic-modal-close" onClick={() => setModalOpen(false)}>&times;</button>
          <h3>Detalle del Informe</h3>

          <div className="ic-section">
            <h4>Cabecera</h4>
            <div className="ic-grid2">
              <div><b>Instalación:</b> {inf.instalacion || '-'}</div>
              <div><b>Jefe de faena:</b> {inf.jefeFaena || '-'}</div>
              <div><b>Encargado:</b> {inf.encargado || '-'}</div>
              <div><b>Tipo intervención:</b> {inf.tipoIntervencion || '-'}</div>
              <div><b>Fecha inicio:</b> {fmtCL(inf.fechaInicio)}</div>
              <div><b>Fecha término:</b> {fmtCL(inf.fechaTermino)}</div>
            </div>
          </div>

          <div className="ic-section">
            <h4>Controles</h4>
            <div className="ic-grid2">
              <div><b>N° serie T-A-H:</b> {inf?.controles?.numeroSerieTermoAnemHigrometro || '-'}</div>
              <div><b>Humedad ambiente:</b> {inf?.controles?.humedadAmbiente || '-'}</div>
              <div><b>Velocidad viento:</b> {inf?.controles?.velocidadViento || '-'}</div>
              <div><b>N° serie Conductivímetro:</b> {inf?.controles?.numeroSerieConductivimetro || '-'}</div>
              <div><b>Conductividad:</b> {inf?.controles?.conductividad || '-'}</div>
              <div><b>Presión lavado:</b> {inf?.controles?.presionLavado || '-'}</div>
            </div>
          </div>

          <div className="ic-section">
            <h4>Programa</h4>
            <div className="ic-grid2">
              <div><b>Mes:</b> {fmtMonth(inf?.programa?.mes)}</div>
              <div><b>Estructuras Lavadas:</b> {inf?.programa?.estructurasLavadas ?? 0}</div>
              <div><b>Estructuras Pendientes:</b> {inf?.programa?.estructurasPendientes ?? 0}</div>
              <div><b>% Avance:</b> {(inf?.programa?.porcentajeAvance ?? 0) + '%'}</div>
              <div><b>Cantidad Est.:</b> {inf?.programa?.cantidadEst ?? 0}</div>
              <div><b>Tramo:</b> {inf?.programa?.tramo || '-'}</div>
              <div><b>N° Cadenas Lavadas:</b> {inf?.programa?.numeroCadenasLavadas ?? 0}</div>
            </div>
          </div>

          <div className="ic-section">
            <h4>Control de Agua</h4>
            <div className="ic-grid2">
              <div><b>Fecha:</b> {fmtCL(inf?.controlAgua?.fecha)}</div>
              <div><b>Responsable:</b> {inf?.controlAgua?.responsable || '-'}</div>
              <div><b>Proveedor:</b> {inf?.controlAgua?.proveedorAgua || '-'}</div>
              <div><b>Consumo diario:</b> {inf?.controlAgua?.consumoDiario || '-'}</div>
            </div>
          </div>

          <div className="ic-section">
            <h4>Personal</h4>
            <div className="ic-grid2">
              <div><b>Supervisor:</b> {inf?.personal?.supervisor ?? 0}</div>
              <div><b>Jefe de brigada:</b> {inf?.personal?.jefeBrigada ?? 0}</div>
              <div><b>Prevencionista:</b> {inf?.personal?.prevencionista ?? 0}</div>
              <div><b>Operador:</b> {inf?.personal?.operador ?? 0}</div>
              <div><b>Técnico:</b> {inf?.personal?.tecnico ?? 0}</div>
              <div><b>Ayudante:</b> {inf?.personal?.ayudante ?? 0}</div>
            </div>
          </div>

          <div className="ic-section">
            <h4>Totales</h4>
            <div className="ic-grid2">
              <div><b>HH:</b> {inf?.totales?.hh ?? 0}</div>
              <div><b>Agua utilizada:</b> {inf?.totales?.aguaUtilizada || '-'}</div>
            </div>
          </div>

          <div className="ic-section">
            <h4>Equipos Lavados</h4>
            {Array.isArray(inf?.equiposLavados) && inf.equiposLavados.length ? (
              <div className="ic-equipos">
                {inf.equiposLavados.map((e, i) => (
                  <div className="ic-equipo" key={i}>
                    <div className="ic-equipo-head">Equipo #{i + 1}</div>
                    <div className="ic-grid2">
                      <div><b>N°:</b> {e?.numero ?? '-'}</div>
                      <div><b>Tipo:</b> {e?.tipo || '-'}</div>
                      <div><b>Equipos:</b> {e?.equipos ?? 0}</div>
                      <div><b>Lavados:</b> {e?.lavados ?? 0}</div>
                      <div><b>Fecha:</b> {fmtCL(e?.fecha)}</div>
                      <div><b>N° PT:</b> {e?.numeroPT ?? '-'}</div>
                      <div><b>Jefe de faena:</b> {e?.jefeFaena || '-'}</div>
                      <div><b>N° Serie:</b> {e?.numeroSerie ?? '-'}</div>
                      <div><b>Equipo:</b> {e?.equipo || '-'}</div>
                      <div><b>H:</b> {e?.H ?? '-'}</div>
                      <div><b>C:</b> {e?.C || '-'}</div>
                      <div><b>V-V:</b> {e?.vV || '-'}</div>
                      <div><b>P:</b> {e?.P || '-'}</div>
                      <div><b>Camión:</b> {e?.camion || '-'}</div>
                      <div><b>Método:</b> {e?.metodo || '-'}</div>
                      <div><b>Lavada:</b> {e?.lavada ? 'Sí' : 'No'}</div>
                    </div>
                    <div className="ic-observ"><b>Observaciones:</b> {e?.observaciones || '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ic-muted">Sin registros.</div>
            )}
          </div>

          <div className="ic-section">
            <h4>Observaciones / Firma</h4>
            <div className="ic-grid2">
              <div className="ic-full"><b>Observación general:</b> {inf?.observacionGeneral || '-'}</div>
              <div><b>Firma — Jefe de brigada:</b> {inf?.firma?.jefeBrigada || '-'}</div>
            </div>
          </div>

          <div className="ic-section">
            <h4>Imágenes</h4>
            {Array.isArray(inf?.imagenes) && inf.imagenes.length ? (
              <div className="ic-images">
                {inf.imagenes.map((u, i) => (
                  <a className="ic-img-link" href={u} key={i} target="_blank" rel="noreferrer">
                    Imagen {i + 1}
                  </a>
                ))}
              </div>
            ) : (
              <div className="ic-muted">Sin imágenes.</div>
            )}
          </div>

          <div className="ic-modal-actions">
            <button className="ic-btn ic-btn-danger" onClick={exportarPDF}>PDF</button>
            <button className="ic-btn ic-btn-success" onClick={exportarExcel}>Excel</button>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- render listado ---------- */
  return (
    <div className="ic-wrap">
      <div className="ic-header">
        <div className="ic-header-icon"><BookText size={36} color="#185dc8" /></div>
        <div>
          <h1 className="ic-title">Informes</h1>
          <p className="ic-subtitle">Listado de informes con el nuevo esquema.</p>
        </div>
      </div>

      {error && <p className="ic-error">{error}</p>}

      {informes.length === 0 ? (
        <div className="ic-empty">No hay informes disponibles.</div>
      ) : (
        <table className="ic-table ic-table-fixed">
          <thead>
            <tr>
              <th className="ic-col-inst">Instalación</th>
              <th className="ic-col-person">Jefe de faena</th>
              <th className="ic-col-person">Encargado</th>
              <th className="ic-col-tipo">Tipo intervención</th>
              <th className="ic-col-mes">Mes prog.</th>
            </tr>
          </thead>
          <tbody>
            {informes.map((inf) => (
              <tr
                key={inf._id}
                className="ic-row"
                onClick={() => { setSelected(inf); setModalOpen(true); }}
                title="Ver detalle"
              >
                <td className="ic-cell-ellipsis">{inf?.instalacion || '-'}</td>
                <td className="ic-cell-ellipsis">{inf?.jefeFaena || '-'}</td>
                <td className="ic-cell-ellipsis">{inf?.encargado || '-'}</td>
                <td className="ic-cell-ellipsis">{inf?.tipoIntervencion || '-'}</td>
                <td>{fmtMonth(inf?.programa?.mes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {renderModal()}
    </div>
  );
}

export default InformesComponent;
