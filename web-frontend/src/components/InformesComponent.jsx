import { useEffect, useState } from 'react';
import { getErrorMessage, ERROR_MESSAGES } from '../utils/errorMessages';
import '../styles/InformesAdmin.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BookText } from 'lucide-react';
import logoStnSaesa from '../assets/stn saesaz.jpeg';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  HeadingLevel,
  AlignmentType,
  ImageRun
} from 'docx';

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

/** util: fecha DD-MM-YYYY */
function fmtFechaCorta(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d)) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** util: mes "junio 2025" en es-CL */
function fmtMesLargo(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

const asString = (v) => (v == null ? '' : String(v));

/** IMÁGENES */
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
async function getImageArrayBuffer(url) {
  const res = await fetch(url);
  return await res.arrayBuffer();
}

/** Construye filas para secciones "resumen" (2 columnas: etiqueta / valor) */
function buildResumenSections(inf) {
  const cabecera = [
    ['Cliente', inf?.cliente || '-'],
    ['Instalación', inf?.instalacion || '-'],
    ['Jefe de faena', inf?.jefeFaena || '-'],
    ['Encargado', inf?.encargado || '-'],
    ['Tipo de intervención', inf?.tipoIntervencion || '-'],
    ['Fecha de inicio', fmtFechaCorta(inf?.fechaInicio)],
    ['Fecha de término', fmtFechaCorta(inf?.fechaTermino)],
  ];

  const controles = [
    ['N° Serie Termo-Anem-Higrómetro', inf?.controles?.numeroSerieTermoAnemHigrometro || '-'],
    ['Humedad Ambiente (H)', inf?.controles?.humedadAmbiente || '-'],
    ['Velocidad Viento (V-V)', inf?.controles?.velocidadViento || '-'],
    ['N° Serie Conductivímetro', inf?.controles?.numeroSerieConductivimetro || '-'],
    ['Conductividad (C)', inf?.controles?.conductividad || '-'],
    ['Presión de lavado (P)', inf?.controles?.presionLavado || '-'],
  ];

  const programa = [
    ['Mes', inf?.programa?.mes ? fmtMesLargo(inf?.programa?.mes) : '-'],
    ['Estructuras lavadas', inf?.programa?.estructurasLavadas ?? 0],
    ['Estructuras pendientes', inf?.programa?.estructurasPendientes ?? 0],
    ['% de avance', `${inf?.programa?.porcentajeAvance ?? 0}%`],
    ['Cantidad Est.', inf?.programa?.cantidadEst ?? 0],
    ['Tramo', inf?.programa?.tramo || '-'],
    ['N° de cadenas lavadas', inf?.programa?.numeroCadenasLavadas ?? 0],
  ];

  const controlAgua = [
    ['Fecha', fmtFechaCorta(inf?.controlAgua?.fecha)],
    ['Responsable', inf?.controlAgua?.responsable || '-'],
    ['Proveedor de agua', inf?.controlAgua?.proveedorAgua || '-'],
    ['Consumo diario', inf?.controlAgua?.consumoDiario || '-'],
  ];

  const personal = [
    ['Supervisor', inf?.personal?.supervisor ?? 0],
    ['Jefe de brigada', inf?.personal?.jefeBrigada ?? 0],
    ['Prevencionista', inf?.personal?.prevencionista ?? 0],
    ['Operador', inf?.personal?.operador ?? 0],
    ['Técnico', inf?.personal?.tecnico ?? 0],
    ['Ayudante', inf?.personal?.ayudante ?? 0],
  ];

  const totales = [
    ['HH', inf?.totales?.hh ?? 0],
    ['Agua utilizada', inf?.totales?.aguaUtilizada || '-'],
  ];

  return { cabecera, controles, programa, controlAgua, personal, totales };
}

/** Filas para la tabla "EQUIPOS LAVADOS" */
function buildEquiposTable(inf) {
  const head = [
    'N°',
    'Tipo',
    'Equipos',
    'Lavados',
    'Fecha',
    'N° PT',
    'Jefe de Faena',
    'N° Serie',
    'Equipo',
    'H',
    'C',
    'V-V',
    'P',
    'Camión',
    'Método',
    'Lavada',
    'Observaciones',
  ];
  const rows = (Array.isArray(inf?.equiposLavados) ? inf.equiposLavados : []).map((e) => [
    e?.numero ?? '',
    e?.tipo || '',
    e?.equipos ?? 0,
    e?.lavados ?? 0,
    e?.fecha ? fmtFechaCorta(e.fecha) : '-',
    e?.numeroPT ?? '',
    e?.jefeFaena || '',
    e?.numeroSerie ?? '',
    e?.equipo || '',
    e?.H ?? '',
    e?.C || '',
    e?.vV || '',
    e?.P || '',
    e?.camion || '',
    e?.metodo || '',
    e?.lavada ? 'Sí' : 'No',
    e?.observaciones || '',
  ]);
  return { head, rows };
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
        if (!token) { setError(ERROR_MESSAGES.SESSION_EXPIRED); return; }
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rol = payload.rol;
        const endpoint = rol === 'admin' ? `${BASE}/api/informes` : `${BASE}/api/informes/mios`;

        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('load_error');

        const data = await res.json();
        const list = data.informes || [];
        setInformes(list);
        localStorage.setItem('informes_list', JSON.stringify(list));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    obtenerInformes();
  }, []);

  /* ---------- Exportar (nuevo esquema mejorado) ---------- */
  // Helper para convertir imagen a base64
  function getImageAsBase64(imageSrc) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      };
      img.onerror = () => resolve(null);
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
    });
  }

  // Helper para convertir imagen a Uint8Array para docx
  async function getImageAsUint8Array(imageSrc) {
    try {
      const dataURL = await getImageAsBase64(imageSrc);
      if (!dataURL) return null;
      
      const response = await fetch(dataURL);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      console.warn('Error al convertir imagen para Word:', error);
      return null;
    }
  }

  /** PDF con secciones + tabla de equipos + observaciones + firma + imágenes */
  async function exportarPDF(inf) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 40;
    let y = 54;

    // Agregar logo en la esquina superior derecha
    try {
      const logoBase64 = await getImageAsBase64(logoStnSaesa);
      if (logoBase64) {
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.addImage(logoBase64, 'JPEG', pageWidth - 120, 20, 80, 40);
      }
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error);
    }

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INFORME DE LAVADO DE AISLACIÓN', marginX, y); y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    // Cliente e Instalación al principio
    doc.text(`Cliente: ${inf?.cliente ? String(inf.cliente) : '—'}`, marginX, y); y += 14;
    doc.text(`Instalación: ${inf?.instalacion ? String(inf.instalacion) : '—'}`, marginX, y); y += 14;

    const sections = buildResumenSections(inf);

    // Helper para renderizar una sección con autoTable
    const putSection = (titulo, data) => {
      if (titulo) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        y += 10;
        doc.text(titulo, marginX, y);
        y += 6;
      }
      
      // Usar autoTable para cada sección
      autoTable(doc, {
        startY: y,
        head: [['Campo', 'Valor']],
        body: data,
        margin: { left: marginX, right: marginX },
        styles: { 
          fontSize: 9, 
          cellPadding: 3,
          lineColor: [179, 209, 255],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [24, 93, 200], 
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 150 },
          1: { cellWidth: 'auto' }
        },
        theme: 'grid',
        tableLineColor: [179, 209, 255],
        tableLineWidth: 0.1
      });
      
      y = doc.lastAutoTable?.finalY || y;
      y += 8;
    };

    putSection('', sections.cabecera);
    putSection('CONTROLES', sections.controles);
    putSection('PROGRAMA', sections.programa);
    putSection('CONTROL DE AGUA', sections.controlAgua);
    putSection('PERSONAL INVOLUCRADO', sections.personal);
    putSection('TOTALES', sections.totales);

    // EQUIPOS LAVADOS
    const equipos = buildEquiposTable(inf);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    y += 16; doc.text('EQUIPOS LAVADOS', marginX, y);
    
    if (y > 600) {
      doc.addPage();
      y = 40;
    }
    
    autoTable(doc, {
      startY: y + 8,
      head: [equipos.head],
      body: equipos.rows,
      margin: { left: marginX, right: marginX },
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        overflow: 'linebreak',
        lineColor: [179, 209, 255],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [24, 93, 200], 
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 26 }
      },
      theme: 'grid',
      tableLineColor: [179, 209, 255],
      tableLineWidth: 0.1
    });
    y = doc.lastAutoTable?.finalY || y;

    // Observaciones + Firma
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    y += 16; doc.text('OBSERVACIONES GENERALES', marginX, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const obs = inf?.observacionGeneral?.trim() || '-';
    const obsLines = doc.splitTextToSize(obs, doc.internal.pageSize.getWidth() - marginX * 2);
    y += 10; doc.text(obsLines, marginX, y);
    y += obsLines.length * 12;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    y += 16; doc.text('FIRMA (Jefe de brigada)', marginX, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    y += 12; doc.text(inf?.firma?.jefeBrigada || '-', marginX, y);

    // IMÁGENES (máx 3)
    if (Array.isArray(inf?.imagenes) && inf.imagenes.length) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      y += 16; doc.text('IMÁGENES', marginX, y);
      y += 10;

      for (let i = 0; i < Math.min(inf.imagenes.length, 3); i++) {
        try {
          if (y > 650) {
            doc.addPage();
            y = 40;
          }
          const imgData = await getImageBase64(inf.imagenes[i]);
          const fmt = String(imgData).startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.text(`Imagen ${i + 1}:`, marginX, y);
          doc.addImage(imgData, fmt, marginX, y + 5, 120, 90);
          y += 100;
        } catch (e) {
          doc.text(`Imagen ${i + 1}: No se pudo cargar`, marginX, y);
          y += 15;
        }
      }
    }

    doc.save(`informe-${inf._id || 'sin-id'}.pdf`);
  }

  /* ======== WORD (.docx) con el mismo layout que PDF ======== */
  function tableHeaderCell(text) {
    return new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })] })],
      shading: { type: 'clear', color: 'auto', fill: '185DC8' },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      width: { size: 50, type: WidthType.PERCENTAGE },
    });
  }
  function tableCell(text, pct = 50) {
    return new TableCell({
      children: [new Paragraph({ text: String(text ?? ''), spacing: { after: 80 } })],
      width: { size: pct, type: WidthType.PERCENTAGE },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
    });
  }
  function simpleHeading(text) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 120 },
    });
  }

  async function exportarWord(inf) {
    const { cabecera, controles, programa, controlAgua, personal, totales } = buildResumenSections(inf);
    const equipos = buildEquiposTable(inf);

    const children = [];

    // Agregar logo en la cabecera
    try {
      const logoBytes = await getImageAsUint8Array(logoStnSaesa);
      if (logoBytes) {
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBytes,
                transformation: {
                  width: 120,
                  height: 60,
                },
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          })
        );
      }
    } catch (error) {
      console.warn('No se pudo agregar el logo al documento Word:', error);
    }

    // Título
    children.push(
      new Paragraph({
        text: 'INFORME DE LAVADO DE AISLACIÓN',
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      })
    );

    // Cliente + Instalación al principio
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Cliente: ', bold: true }), new TextRun({ text: inf?.cliente || '—' })],
        spacing: { after: 80 },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Instalación: ', bold: true }), new TextRun({ text: inf?.instalacion || '—' })],
        spacing: { after: 120 },
      })
    );

    // Tabla cabecera (Campo / Valor)
    const mkTwoCol = (title, pairs) => {
      const result = [];
      if (title) {
        result.push(simpleHeading(title));
      }
      
      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Cabecera de la tabla
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Campo', bold: true, color: 'FFFFFF' })] })],
                  shading: { type: 'clear', color: 'auto', fill: '185DC8' },
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Valor', bold: true, color: 'FFFFFF' })] })],
                  shading: { type: 'clear', color: 'auto', fill: '185DC8' },
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            // Datos de la tabla
            ...pairs.map(([key, val]) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: String(key), spacing: { after: 80 } })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: String(val ?? ''), spacing: { after: 80 } })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  }),
                ],
              })
            )
          ],
          borders: {
            top: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
            bottom: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
            left: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
            right: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
            insideH: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
            insideV: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
          },
        })
      );
      
      return result;
    };

    children.push(...mkTwoCol('', cabecera));
    children.push(...mkTwoCol('CONTROLES', controles));
    children.push(...mkTwoCol('PROGRAMA', programa));
    children.push(...mkTwoCol('CONTROL DE AGUA', controlAgua));
    children.push(...mkTwoCol('PERSONAL INVOLUCRADO', personal));
    children.push(...mkTwoCol('TOTALES', totales));

    // EQUIPOS LAVADOS
    children.push(simpleHeading('EQUIPOS LAVADOS'));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: equipos.head.map((h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })],
                  }),
                ],
                shading: { type: 'clear', color: 'auto', fill: '185DC8' },
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
              })
            ),
          }),
          ...equipos.rows.map(
            (r) =>
              new TableRow({
                children: r.map((cell) =>
                  new TableCell({
                    children: [new Paragraph({ text: String(cell ?? ''), spacing: { after: 60 } })],
                    margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  })
                ),
              })
          ),
        ],
        borders: {
          top: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
          bottom: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
          left: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
          right: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
          insideH: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
          insideV: { color: 'B3D1FF', size: 2, style: BorderStyle.SINGLE },
        },
      })
    );

    // Observaciones
    children.push(simpleHeading('OBSERVACIONES GENERALES'));
    const obs = (inf?.observacionGeneral || '-').split(/\n/);
    obs.forEach((line) => children.push(new Paragraph({ text: line })));

    // Firma
    children.push(simpleHeading('FIRMA (Jefe de brigada)'));
    children.push(new Paragraph({ text: inf?.firma?.jefeBrigada || '-' }));

    // Imágenes (máx 3)
    if (Array.isArray(inf?.imagenes) && inf.imagenes.length) {
      children.push(simpleHeading('IMÁGENES'));
      for (let i = 0; i < inf.imagenes.length && i < 3; i++) {
        try {
          const data = await getImageArrayBuffer(inf.imagenes[i]);
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `Imagen ${i + 1}`, italics: true }),
              ],
              spacing: { after: 80 },
            })
          );
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data,
                  transformation: { width: 260, height: 175 },
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { after: 120 },
            })
          );
        } catch {
          children.push(new Paragraph({ text: `No se pudo cargar la imagen ${i + 1}` }));
        }
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-${inf._id || 'sin-id'}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------- Modal ---------- */
  const renderModal = () => {
    if (!modalOpen || !selected) return null;
    const inf = selected;

    return (
      <div className="modal-informe-bg" onClick={() => setModalOpen(false)}>
        <div className="modal-informe" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setModalOpen(false)}>
            &times;
          </button>
          <h3>Detalle del Informe</h3>

          <div className="modal-informe-content">
            <div className="form-grid">
              <label>
                Cliente
                <input value={inf?.cliente || '-'} readOnly />
              </label>
              <label>
                Instalación
                <input value={inf?.instalacion || '-'} readOnly />
              </label>
              <label>
                Jefe de faena
                <input value={inf?.jefeFaena || '-'} readOnly />
              </label>
              <label>
                Encargado
                <input value={inf?.encargado || '-'} readOnly />
              </label>
              <label>
                Tipo de intervención
                <input value={inf?.tipoIntervencion || '-'} readOnly />
              </label>
              <label>
                Fecha inicio
                <input value={fmtCL(inf?.fechaInicio)} readOnly />
              </label>
              <label>
                Fecha término
                <input value={fmtCL(inf?.fechaTermino)} readOnly />
              </label>
            </div>

            <fieldset className="fieldset">
              <legend>Controles</legend>
              <div className="form-grid">
                <label>
                  N° serie T-A-H
                  <input value={inf?.controles?.numeroSerieTermoAnemHigrometro || '-'} readOnly />
                </label>
                <label>
                  Humedad ambiente
                  <input value={inf?.controles?.humedadAmbiente || '-'} readOnly />
                </label>
                <label>
                  Velocidad viento
                  <input value={inf?.controles?.velocidadViento || '-'} readOnly />
                </label>
                <label>
                  N° serie Conductivímetro
                  <input value={inf?.controles?.numeroSerieConductivimetro || '-'} readOnly />
                </label>
                <label>
                  Conductividad
                  <input value={inf?.controles?.conductividad || '-'} readOnly />
                </label>
                <label>
                  Presión lavado
                  <input value={inf?.controles?.presionLavado || '-'} readOnly />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Programa</legend>
              <div className="form-grid">
                <label>
                  Mes
                  <input value={fmtMonth(inf?.programa?.mes)} readOnly />
                </label>
                <label>
                  Estructuras Lavadas
                  <input value={inf?.programa?.estructurasLavadas ?? 0} readOnly />
                </label>
                <label>
                  Estructuras Pendientes
                  <input value={inf?.programa?.estructurasPendientes ?? 0} readOnly />
                </label>
                <label>
                  % Avance
                  <input value={`${inf?.programa?.porcentajeAvance ?? 0}%`} readOnly />
                </label>
                <label>
                  Cantidad Est.
                  <input value={inf?.programa?.cantidadEst ?? 0} readOnly />
                </label>
                <label>
                  Tramo
                  <input value={inf?.programa?.tramo || '-'} readOnly />
                </label>
                <label>
                  N° Cadenas Lavadas
                  <input value={inf?.programa?.numeroCadenasLavadas ?? 0} readOnly />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Control de Agua</legend>
              <div className="form-grid">
                <label>
                  Fecha
                  <input value={fmtCL(inf?.controlAgua?.fecha)} readOnly />
                </label>
                <label>
                  Responsable
                  <input value={inf?.controlAgua?.responsable || '-'} readOnly />
                </label>
                <label>
                  Proveedor
                  <input value={inf?.controlAgua?.proveedorAgua || '-'} readOnly />
                </label>
                <label>
                  Consumo diario
                  <input value={inf?.controlAgua?.consumoDiario || '-'} readOnly />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Personal</legend>
              <div className="form-grid">
                <label>
                  Supervisor
                  <input value={inf?.personal?.supervisor ?? 0} readOnly />
                </label>
                <label>
                  Jefe de brigada
                  <input value={inf?.personal?.jefeBrigada ?? 0} readOnly />
                </label>
                <label>
                  Prevencionista
                  <input value={inf?.personal?.prevencionista ?? 0} readOnly />
                </label>
                <label>
                  Operador
                  <input value={inf?.personal?.operador ?? 0} readOnly />
                </label>
                <label>
                  Técnico
                  <input value={inf?.personal?.tecnico ?? 0} readOnly />
                </label>
                <label>
                  Ayudante
                  <input value={inf?.personal?.ayudante ?? 0} readOnly />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Totales</legend>
              <div className="form-grid">
                <label>
                  HH
                  <input value={inf?.totales?.hh ?? 0} readOnly />
                </label>
                <label>
                  Agua utilizada
                  <input value={inf?.totales?.aguaUtilizada || '-'} readOnly />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Equipos Lavados</legend>
              {Array.isArray(inf?.equiposLavados) && inf.equiposLavados.length ? (
                inf.equiposLavados.map((e, i) => (
                  <div key={i} className="material-item">
                    <div className="material-header">Equipo #{i + 1}</div>
                    <div className="form-grid">
                      <label>N°<input value={e?.numero ?? '-'} readOnly /></label>
                      <label>Tipo<input value={e?.tipo || '-'} readOnly /></label>
                      <label>Equipos<input value={e?.equipos ?? 0} readOnly /></label>
                      <label>Lavados<input value={e?.lavados ?? 0} readOnly /></label>
                      <label>Fecha<input value={fmtCL(e?.fecha)} readOnly /></label>
                      <label>N° PT<input value={e?.numeroPT ?? '-'} readOnly /></label>
                      <label>Jefe de faena<input value={e?.jefeFaena || '-'} readOnly /></label>
                      <label>N° Serie<input value={e?.numeroSerie ?? '-'} readOnly /></label>
                      <label>Equipo<input value={e?.equipo || '-'} readOnly /></label>
                      <label>H<input value={e?.H ?? '-'} readOnly /></label>
                      <label>C<input value={e?.C || '-'} readOnly /></label>
                      <label>V-V<input value={e?.vV || '-'} readOnly /></label>
                      <label>P<input value={e?.P || '-'} readOnly /></label>
                      <label>Camión<input value={e?.camion || '-'} readOnly /></label>
                      <label>Método<input value={e?.metodo || '-'} readOnly /></label>
                      <label>Lavada<input value={e?.lavada ? 'Sí' : 'No'} readOnly /></label>
                    </div>
                    <label>
                      Observaciones
                      <textarea value={e?.observaciones || '-'} readOnly rows={2} />
                    </label>
                  </div>
                ))
              ) : (
                <div className="muted">Sin registros.</div>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <legend>Imágenes</legend>
              {Array.isArray(inf?.imagenes) && inf.imagenes.length ? (
                inf.imagenes.map((u, i) => (
                  <div key={i} className="material-row">
                    <input value={u} readOnly />
                    <a href={u} target="_blank" rel="noreferrer" className="btn btn-small">
                      Ver
                    </a>
                  </div>
                ))
              ) : (
                <div className="muted">Sin imágenes.</div>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <legend>Observaciones / Firma</legend>
              <div className="form-grid">
                <label>
                  Observación General
                  <textarea value={inf?.observacionGeneral || '-'} readOnly rows={3} />
                </label>
                <label>
                  Firma - Jefe de brigada
                  <input value={inf?.firma?.jefeBrigada || '-'} readOnly />
                </label>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- render listado ---------- */
  return (
    <div className="informes-containerComponent informes-full-height">
      <div className="informes-container">
        <div className="informes-header-icon">
          <BookText size={36} color="#185dc8" />
        </div>
        <div>
          <h1 className="informes-title">Informes</h1>
          <p className="informes-subtitle">Listado de informes con el nuevo esquema.</p>
        </div>
      </div>

      {error && <p className="informes-error">{error}</p>}

      {informes.length === 0 ? (
        <div className="no-informes">No hay informes disponibles.</div>
      ) : (
        <table className="informes-table informes-table--compact">
          <thead>
            <tr>
              <th className="col-cliente">Cliente</th>
              <th className="col-ubicacion">Instalación</th>
              <th className="col-tecnico">Jefe de faena</th>
              <th className="col-tecnico">Encargado</th>
              <th className="col-aislador">Tipo intervención</th>
              <th className="col-mes hide-md">Mes prog.</th>
              <th className="col-exportar">Exportar</th>
            </tr>
          </thead>
          <tbody>
            {informes.map((inf) => (
              <tr key={inf._id} title="Ver detalle">
                <td onClick={() => { setSelected(inf); setModalOpen(true); }}>
                  {inf?.cliente || '-'}
                </td>
                <td onClick={() => { setSelected(inf); setModalOpen(true); }}>
                  {inf?.instalacion || '-'}
                </td>
                <td onClick={() => { setSelected(inf); setModalOpen(true); }}>
                  {inf?.jefeFaena || '-'}
                </td>
                <td onClick={() => { setSelected(inf); setModalOpen(true); }}>
                  {inf?.encargado || '-'}
                </td>
                <td onClick={() => { setSelected(inf); setModalOpen(true); }}>
                  {inf?.tipoIntervencion || '-'}
                </td>
                <td className="col-mes hide-md" onClick={() => { setSelected(inf); setModalOpen(true); }}>
                  {inf?.programa?.mes
                    ? new Date(inf.programa.mes).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'short',
                      })
                    : '-'}
                </td>
                <td>
                  <div className="export-buttons">
                    <button className="btn btn-small" onClick={() => exportarPDF(inf)}>
                      PDF
                    </button>
                    <button className="btn btn-small" onClick={() => exportarWord(inf)}>
                      Word
                    </button>
                  </div>
                </td>
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
