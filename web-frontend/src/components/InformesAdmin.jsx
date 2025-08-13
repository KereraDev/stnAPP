import { useEffect, useMemo, useState } from 'react';
import '../styles/InformesAdmin.css';
import { BookText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* base de la API desde .env */
const BASE = (import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:3000');

/* utilidades de fecha */
function fmtCL(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d)) return '-';
  return d.toLocaleString('es-CL');
}
function toInputDT(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function fromInputDT(val) {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d) ? '' : d.toISOString();
}
function toInputMonth(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function fromInputMonth(val) {
  if (!val) return '';
  const d = new Date(`${val}-01T00:00:00`);
  return isNaN(d) ? '' : d.toISOString();
}
const asString = (v) => (v == null ? '' : String(v).trim());
const toNum = (v, def = 0) => {
  if (v === '' || v === null || v === undefined) return def;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : def;
};
const clamp = (n, min, max) => {
  if (n == null || Number.isNaN(n)) return n;
  return Math.min(max, Math.max(min, n));
};

function InformesAdmin() {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' | 'create'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [query, setQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // ---- AUTOSAVE / BORRADORES ----
  const [initialFormJSON, setInitialFormJSON] = useState('');
  const [restoredDraft, setRestoredDraft] = useState(false);

  const draftKey = useMemo(
    () => (selected?._id ? `informe_draft_${selected._id}` : 'informe_draft_new'),
    [selected]
  );

  const isDirty = useMemo(
    () => !!form && JSON.stringify(form) !== initialFormJSON,
    [form, initialFormJSON]
  );

  const endpointLista = useMemo(() => `${BASE}/api/informes`, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload?.rol === 'admin');
    } catch {}
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('informes_list');
    if (cached) {
      try { setInformes(JSON.parse(cached) || []); } catch {}
    }
    const fetchData = async () => {
      setLoading(true); setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token de autenticación');
        const res = await fetch(endpointLista, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          if (res.status === 403) {
            setInformes([]);
            localStorage.setItem('informes_list', JSON.stringify([]));
            setError('No tienes permisos para listar informes.');
            return;
          }
          throw new Error('No se pudieron obtener los informes');
        }
        const data = await res.json();
        const list = data?.informes || [];
        setInformes(list);
        localStorage.setItem('informes_list', JSON.stringify(list));
      } catch (e) {
        setError(e.message || 'Error cargando informes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endpointLista]);

  // ----- AUTOSAVE: guarda cada 500ms -----
  useEffect(() => {
    if (!modalOpen || !form) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(form)); } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [form, modalOpen, draftKey]);

  // ----- Aviso al salir si hay cambios -----
  useEffect(() => {
    const handler = (e) => {
      if (modalOpen && isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [modalOpen, isDirty]);

  /* ---------- Modal: crear / editar ---------- */
  const emptyForm = () => ({
    // Cabecera
    jefeFaena: '',
    encargado: '',
    instalacion: '',
    fechaInicio: '',      // default en backend
    fechaTermino: '',
    tipoIntervencion: '',

    // Controles
    controles: {
      numeroSerieTermoAnemHigrometro: '',
      humedadAmbiente: '',
      velocidadViento: '',
      numeroSerieConductivimetro: '',
      conductividad: '',
      presionLavado: '',
    },

    // Programa
    programa: {
      mes: '',
      estructurasLavadas: 0,
      estructurasPendientes: 0,
      porcentajeAvance: 0,
      cantidadEst: 0,
      tramo: '',
      numeroCadenasLavadas: 0,
    },

    // Control de Agua
    controlAgua: {
      fecha: '',
      responsable: '',
      proveedorAgua: '',
      consumoDiario: '',
    },

    // Personal
    personal: {
      supervisor: 0,
      jefeBrigada: 0,
      prevencionista: 0,
      operador: 0,
      tecnico: 0,
      ayudante: 0,
    },

    // Totales
    totales: {
      hh: 0,
      aguaUtilizada: '',
    },

    // Equipos Lavados
    equiposLavados: [],

    // Imágenes
    imagenes: [],

    // Observación general
    observacionGeneral: '',

    // Firma
    firma: { jefeBrigada: '' },

    _id: '', createdAt: '', updatedAt: ''
  });

  const openCreate = () => {
    const saved = localStorage.getItem('informe_draft_new');
    const base = saved ? JSON.parse(saved) : emptyForm();
    setRestoredDraft(!!saved);
    setSelected(null);
    setForm(base);
    setInitialFormJSON(JSON.stringify(base));
    setModalMode('create');
    setModalOpen(true);
    setError('');
  };

  const openEdit = (inf) => {
    const saved = localStorage.getItem(`informe_draft_${inf._id}`);
    let baseForm;

    if (saved) {
      baseForm = JSON.parse(saved);
      setRestoredDraft(true);
    } else {
      baseForm = {
        jefeFaena: asString(inf?.jefeFaena),
        encargado: asString(inf?.encargado),
        instalacion: asString(inf?.instalacion),
        fechaInicio: toInputDT(inf?.fechaInicio),
        fechaTermino: toInputDT(inf?.fechaTermino),
        tipoIntervencion: asString(inf?.tipoIntervencion),

        controles: {
          numeroSerieTermoAnemHigrometro: asString(inf?.controles?.numeroSerieTermoAnemHigrometro),
          humedadAmbiente: asString(inf?.controles?.humedadAmbiente),
          velocidadViento: asString(inf?.controles?.velocidadViento),
          numeroSerieConductivimetro: asString(inf?.controles?.numeroSerieConductivimetro),
          conductividad: asString(inf?.controles?.conductividad),
          presionLavado: asString(inf?.controles?.presionLavado),
        },

        programa: {
          mes: toInputMonth(inf?.programa?.mes),
          estructurasLavadas: inf?.programa?.estructurasLavadas ?? 0,
          estructurasPendientes: inf?.programa?.estructurasPendientes ?? 0,
          porcentajeAvance: inf?.programa?.porcentajeAvance ?? 0,
          cantidadEst: inf?.programa?.cantidadEst ?? 0,
          tramo: asString(inf?.programa?.tramo),
          numeroCadenasLavadas: inf?.programa?.numeroCadenasLavadas ?? 0,
        },

        controlAgua: {
          fecha: toInputDT(inf?.controlAgua?.fecha),
          responsable: asString(inf?.controlAgua?.responsable),
          proveedorAgua: asString(inf?.controlAgua?.proveedorAgua),
          consumoDiario: asString(inf?.controlAgua?.consumoDiario),
        },

        personal: {
          supervisor: inf?.personal?.supervisor ?? 0,
          jefeBrigada: inf?.personal?.jefeBrigada ?? 0,
          prevencionista: inf?.personal?.prevencionista ?? 0,
          operador: inf?.personal?.operador ?? 0,
          tecnico: inf?.personal?.tecnico ?? 0,
          ayudante: inf?.personal?.ayudante ?? 0,
        },

        totales: {
          hh: inf?.totales?.hh ?? 0,
          aguaUtilizada: asString(inf?.totales?.aguaUtilizada),
        },

        equiposLavados: Array.isArray(inf?.equiposLavados) ? inf.equiposLavados.map(e => ({
          numero: e?.numero ?? '',
          tipo: asString(e?.tipo),
          equipos: e?.equipos ?? 0,
          lavados: e?.lavados ?? 0,
          fecha: toInputDT(e?.fecha),
          numeroPT: e?.numeroPT ?? '',
          jefeFaena: asString(e?.jefeFaena),
          numeroSerie: e?.numeroSerie ?? '',
          equipo: asString(e?.equipo),
          H: e?.H ?? '',
          C: asString(e?.C),
          vV: asString(e?.vV),
          P: asString(e?.P),
          camion: asString(e?.camion),
          metodo: asString(e?.metodo),
          lavada: !!e?.lavada,
          observaciones: asString(e?.observaciones),
        })) : [],

        imagenes: Array.isArray(inf?.imagenes) ? [...inf.imagenes] : [],
        observacionGeneral: asString(inf?.observacionGeneral),
        firma: { jefeBrigada: asString(inf?.firma?.jefeBrigada) },

        _id: inf?._id || '',
        createdAt: inf?.createdAt || '',
        updatedAt: inf?.updatedAt || ''
      };
      setRestoredDraft(false);
    }

    setSelected(inf);
    setForm(baseForm);
    setInitialFormJSON(JSON.stringify(baseForm));
    setModalMode('edit');
    setModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Cerrar de todas formas?')) return;
    setModalOpen(false);
    setRestoredDraft(false);
    // Intencionalmente NO limpiamos form/selected para no perder el borrador
  };

  /* helpers form */
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNested = (ns, k, v) => setForm(f => ({ ...f, [ns]: { ...(f[ns] || {}), [k]: v } }));

  const setControles = (k, v) => setNested('controles', k, v);
  const setPrograma = (k, v) => setNested('programa', k, v);
  const setControlAgua = (k, v) => setNested('controlAgua', k, v);
  const setPersonal = (k, v) => setNested('personal', k, v);
  const setTotales = (k, v) => setNested('totales', k, v);
  const setFirma = (k, v) => setNested('firma', k, v);

  // equipos lavados
  const addEquipo = () => setForm(f => ({
    ...f,
    equiposLavados: [
      ...(f.equiposLavados || []),
      {
        numero: '', tipo: '', equipos: 0, lavados: 0, fecha: '',
        numeroPT: '', jefeFaena: '', numeroSerie: '', equipo: '',
        H: '', C: '', vV: '', P: '', camion: '', metodo: '',
        lavada: false, observaciones: ''
      }
    ]
  }));
  const rmEquipo = (i) => setForm(f => ({
    ...f,
    equiposLavados: f.equiposLavados.filter((_, idx) => idx !== i)
  }));
  const setEquipo = (i, k, v) => setForm(f => {
    const arr = f.equiposLavados.map((e, idx) => (idx === i ? { ...e, [k]: v } : e));
    return { ...f, equiposLavados: arr };
  });

  // imágenes
  const addImg = () => setForm(f => ({ ...f, imagenes: [...(f.imagenes || []), ''] }));
  const rmImg = (i) => setForm(f => ({ ...f, imagenes: f.imagenes.filter((_, idx) => idx !== i) }));
  const setImg = (i, v) => setForm(f => {
    const arr = (f.imagenes || []).map((url, idx) => (idx === i ? v : url));
    return { ...f, imagenes: arr };
  });

  /* ===========================
     EXPORTAR (formato “Informe de lavado de aislación”)
  ============================ */

  /** util: fecha DD-MM-YYYY */
  function fmtFechaCorta(dt) {
    if (!dt) return '-';
    const d = new Date(dt);
    if (isNaN(d)) return '-';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  }

  /** util: mes “junio 2025” en es-CL */
  function fmtMesLargo(dt) {
    if (!dt) return '-';
    const d = new Date(dt);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }

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

  /** Construye filas para secciones “resumen” (2 columnas: etiqueta / valor) */
  function buildResumenSections(inf) {
    const cabecera = [
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

  /** Filas para la tabla “EQUIPOS LAVADOS” */
  function buildEquiposTable(inf) {
    const head = [
      'N°', 'Tipo', 'Equipos', 'Lavados', 'Fecha', 'N° PT', 'Jefe de Faena',
      'N° Serie', 'Equipo', 'H', 'C', 'V-V', 'P', 'Camión', 'Método', 'Lavada', 'Observaciones'
    ];
    const rows = (Array.isArray(inf?.equiposLavados) ? inf.equiposLavados : []).map((e) => ([
      e?.numero ?? '', e?.tipo || '', e?.equipos ?? 0, e?.lavados ?? 0,
      e?.fecha ? fmtFechaCorta(e.fecha) : '-',
      e?.numeroPT ?? '', e?.jefeFaena || '', e?.numeroSerie ?? '', e?.equipo || '',
      e?.H ?? '', e?.C || '', e?.vV || '', e?.P || '', e?.camion || '',
      e?.metodo || '', e?.lavada ? 'Sí' : 'No', e?.observaciones || ''
    ]));
    return { head, rows };
  }

  /** PDF con secciones + tabla de equipos + observaciones + firma + imágenes */
  async function exportPDF(inf) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 40;
    let y = 54;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INFORME DE LAVADO DE AISLACIÓN', marginX, y); y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text((inf?.instalacion ? String(inf.instalacion) : '—'), marginX, y); y += 14;

    const sections = buildResumenSections(inf);

    // Helper para renderizar una sección 2 columnas
    const put2col = (titulo, data) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      y += 16;
      doc.text(titulo, marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      autoTable(doc, {
        startY: y + 8,
        head: [['Campo', 'Valor']],
        body: data,
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
        headStyles: { fillColor: [24, 93, 200], textColor: 255 },
        theme: 'grid'
      });
      y = doc.lastAutoTable.finalY;
    };

    put2col('', sections.cabecera);
    put2col('CONTROLES', sections.controles);
    put2col('PROGRAMA', sections.programa);
    put2col('CONTROL DE AGUA', sections.controlAgua);
    put2col('PERSONAL INVOLUCRADO', sections.personal);
    put2col('TOTALES', sections.totales);

    // EQUIPOS LAVADOS
    const equipos = buildEquiposTable(inf);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    y += 16; doc.text('EQUIPOS LAVADOS', marginX, y);
    autoTable(doc, {
      startY: y + 8,
      head: [equipos.head],
      body: equipos.rows,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [24, 93, 200], textColor: 255 },
      columnStyles: { 0: { halign: 'center', cellWidth: 26 } },
      theme: 'grid'
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
      y += 20;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text('IMÁGENES', marginX, y);
      y += 10;

      for (let i = 0; i < inf.imagenes.length && i < 3; i++) {
        try {
          const imgData = await getImageBase64(inf.imagenes[i]);
          const fmt = String(imgData).startsWith('data:image/png') ? 'PNG' : 'JPEG';
          // salto de página si no cabe
          if (y + 130 > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage(); y = 54;
          }
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
          doc.text(`Imagen ${i + 1}`, marginX, y);
          doc.addImage(imgData, fmt, marginX, y + 6, 180, 120);
          y += 130;
        } catch {
          doc.text(`No se pudo cargar la imagen ${i + 1}`, marginX, y);
          y += 14;
        }
      }
    }

    doc.save(`informe-${inf._id || 'sin-id'}.pdf`);
  }

  /** Excel en un solo sheet con bloques por sección + tabla de equipos */
  function exportExcel(inf) {
    const { cabecera, controles, programa, controlAgua, personal, totales } = buildResumenSections(inf);
    const equipos = buildEquiposTable(inf);

    const aoa = [];
    const pushBlock = (titulo, pares) => {
      aoa.push([titulo]); // título
      pares.forEach(([k, v]) => aoa.push([k, String(v ?? '')]));
      aoa.push(['']); // separador
    };

    aoa.push(['INFORME DE LAVADO DE AISLACIÓN']);
    aoa.push([String(inf?.instalacion || '—')]);
    aoa.push(['']); // espacio

    pushBlock('CABECERA', cabecera);
    pushBlock('CONTROLES', controles);
    pushBlock('PROGRAMA', programa);
    pushBlock('CONTROL DE AGUA', controlAgua);
    pushBlock('PERSONAL INVOLUCRADO', personal);
    pushBlock('TOTALES', totales);

    // Observaciones y Firma
    aoa.push(['OBSERVACIONES GENERALES']);
    aoa.push([String(inf?.observacionGeneral || '-')]); aoa.push(['']);

    aoa.push(['FIRMA (Jefe de brigada)']);
    aoa.push([String(inf?.firma?.jefeBrigada || '-')]); aoa.push(['']);

    // Tabla equipos lavados
    aoa.push(['EQUIPOS LAVADOS']);
    aoa.push(equipos.head);
    equipos.rows.forEach(r => aoa.push(r));

    // Imágenes: URLs al final (referencia)
    if (Array.isArray(inf?.imagenes) && inf.imagenes.length) {
      aoa.push(['']); aoa.push(['IMÁGENES (URLs)']);
      inf.imagenes.forEach((url, i) => aoa.push([`Imagen ${i + 1}`, url]));
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // ancho de columnas amable
    const colWidths = [
      { wch: 8 },  { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 8  },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 24 }
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe');
    XLSX.writeFile(wb, `informe-${inf._id || 'sin-id'}.xlsx`);
  }

  const handleExport = async (informeId, type /* 'pdf' | 'excel' */) => {
    try {
      const inf = informes.find(i => i._id === informeId);
      if (!inf) throw new Error('Informe no encontrado');
      if (type === 'pdf') await exportPDF(inf);
      else exportExcel(inf);
    } catch (e) {
      setError(e.message || 'Error al exportar');
    }
  };

  /* guardar: POST / PATCH */
  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');

      if (modalMode === 'create' && !asString(form.instalacion)) {
        throw new Error('instalacion es obligatoria');
      }

      const body = {
        // Cabecera
        jefeFaena: asString(form.jefeFaena),
        encargado: asString(form.encargado),
        instalacion: asString(form.instalacion),
        ...(fromInputDT(form.fechaInicio) ? { fechaInicio: fromInputDT(form.fechaInicio) } : {}),
        ...(fromInputDT(form.fechaTermino) ? { fechaTermino: fromInputDT(form.fechaTermino) } : {}),
        tipoIntervencion: asString(form.tipoIntervencion),

        // Controles
        controles: {
          numeroSerieTermoAnemHigrometro: asString(form.controles.numeroSerieTermoAnemHigrometro),
          humedadAmbiente: asString(form.controles.humedadAmbiente),
          velocidadViento: asString(form.controles.velocidadViento),
          numeroSerieConductivimetro: asString(form.controles.numeroSerieConductivimetro),
          conductividad: asString(form.controles.conductividad),
          presionLavado: asString(form.controles.presionLavado),
        },

        // Programa
        programa: {
          mes: fromInputMonth(form.programa.mes) || undefined,
          estructurasLavadas: toNum(form.programa.estructurasLavadas, 0),
          estructurasPendientes: toNum(form.programa.estructurasPendientes, 0),
          porcentajeAvance: clamp(toNum(form.programa.porcentajeAvance, 0), 0, 100),
          cantidadEst: toNum(form.programa.cantidadEst, 0),
          tramo: asString(form.programa.tramo),
          numeroCadenasLavadas: toNum(form.programa.numeroCadenasLavadas, 0),
        },

        // Control de Agua
        controlAgua: {
          fecha: fromInputDT(form.controlAgua.fecha) || undefined,
          responsable: asString(form.controlAgua.responsable),
          proveedorAgua: asString(form.controlAgua.proveedorAgua),
          consumoDiario: asString(form.controlAgua.consumoDiario),
        },

        // Personal
        personal: {
          supervisor: toNum(form.personal.supervisor, 0),
          jefeBrigada: toNum(form.personal.jefeBrigada, 0),
          prevencionista: toNum(form.personal.prevencionista, 0),
          operador: toNum(form.personal.operador, 0),
          tecnico: toNum(form.personal.tecnico, 0),
          ayudante: toNum(form.personal.ayudante, 0),
        },

        // Totales
        totales: {
          hh: toNum(form.totales.hh, 0),
          aguaUtilizada: asString(form.totales.aguaUtilizada),
        },

        // Equipos Lavados
        equiposLavados: (form.equiposLavados || []).map(e => ({
          numero: e.numero === '' ? null : toNum(e.numero, null),
          tipo: asString(e.tipo),
          equipos: toNum(e.equipos, 0),
          lavados: toNum(e.lavados, 0),
          fecha: fromInputDT(e.fecha) || undefined,
          numeroPT: e.numeroPT === '' ? null : toNum(e.numeroPT, null),
          jefeFaena: asString(e.jefeFaena),
          numeroSerie: e.numeroSerie === '' ? null : toNum(e.numeroSerie, null),
          equipo: asString(e.equipo),
          H: e.H === '' ? null : toNum(e.H, null),
          C: asString(e.C),
          vV: asString(e.vV),
          P: asString(e.P),
          camion: asString(e.camion),
          metodo: asString(e.metodo),
          lavada: !!e.lavada,
          observaciones: asString(e.observaciones),
        })),

        // Imágenes
        imagenes: (form.imagenes || []).map((u) => (u || '').trim()).filter(Boolean),

        // Observación y firma
        observacionGeneral: asString(form.observacionGeneral),
        firma: { jefeBrigada: asString(form.firma.jefeBrigada) },
      };

      const url = modalMode === 'create'
        ? `${BASE}/api/informes`
        : `${BASE}/api/informes/${selected._id}`;
      const method = modalMode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      let json = null;
      try { json = await res.json(); } catch {}

      if (!res.ok) {
        const msg = json?.mensaje || json?.error || 'Error al guardar';
        throw new Error(msg);
      }

      const doc = json?.informe || json;

      // limpiar borrador actual
      try { localStorage.removeItem(draftKey); } catch {}

      if (modalMode === 'create') {
        setInformes(prev => {
          const out = [doc, ...prev];
          localStorage.setItem('informes_list', JSON.stringify(out));
          return out;
        });
        const ef = emptyForm();
        setForm(ef);
        setInitialFormJSON(JSON.stringify(ef));
        setModalMode('create');
      } else {
        setInformes(prev => {
          const out = prev.map(x => x._id === selected._id ? { ...x, ...doc } : x);
          localStorage.setItem('informes_list', JSON.stringify(out));
          return out;
        });
        setSelected(s => ({ ...s, ...doc }));
        setInitialFormJSON(JSON.stringify(form));
      }
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm('¿Eliminar este informe? Esta acción es irreversible.')) return;
    setDeleting(true); setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');
      const res = await fetch(`${BASE}/api/informes/${selected._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        let msg = 'Error al eliminar';
        try { const j = await res.json(); msg = j.mensaje || msg; } catch {}
        throw new Error(msg);
      }
      setInformes(prev => {
        const out = prev.filter(x => x._id !== selected._id);
        localStorage.setItem('informes_list', JSON.stringify(out));
        return out;
      });
      try { localStorage.removeItem(`informe_draft_${selected._id}`); } catch {}
      closeModal();
    } catch (e) {
      setError(e.message || 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return informes;
    return informes.filter(inf => {
      return [
        inf?.instalacion,
        inf?.jefeFaena,
        inf?.encargado,
        inf?.tipoIntervencion,
        inf?.programa?.tramo,
        inf?.observacionGeneral,
      ].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [informes, query]);

  const renderModal = () => {
    if (!modalOpen || !form) return null;
    const isEdit = modalMode === 'edit';
    return (
      <div className="modal-informe-bg" onClick={closeModal}>
        <div className="modal-informe" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>&times;</button>
          <h3>{isEdit ? 'Editar Informe' : 'Nuevo Informe'}</h3>
          {/* sin banner de borrador */}
          <div className="modal-informe-content">
            <div className="form-grid">
              <label>Instalación *
                <input value={form.instalacion} onChange={(e) => setField('instalacion', e.target.value)} />
              </label>
              <label>Jefe de faena
                <input value={form.jefeFaena} onChange={(e) => setField('jefeFaena', e.target.value)} />
              </label>
              <label>Encargado
                <input value={form.encargado} onChange={(e) => setField('encargado', e.target.value)} />
              </label>
              <label>Tipo de intervención
                <input value={form.tipoIntervencion} onChange={(e) => setField('tipoIntervencion', e.target.value)} />
              </label>

              <label>Fecha inicio
                <input type="datetime-local" value={form.fechaInicio} onChange={(e) => setField('fechaInicio', e.target.value)} />
              </label>
              <label>Fecha término
                <input type="datetime-local" value={form.fechaTermino} onChange={(e) => setField('fechaTermino', e.target.value)} />
              </label>
            </div>

            <fieldset className="fieldset">
              <legend>Controles</legend>
              <div className="form-grid">
                <label>N° de serie Termo-Anem-Higrómetro
                  <input value={form.controles.numeroSerieTermoAnemHigrometro} onChange={(e) => setControles('numeroSerieTermoAnemHigrometro', e.target.value)} />
                </label>
                <label>Humedad ambiente
                  <input value={form.controles.humedadAmbiente} onChange={(e) => setControles('humedadAmbiente', e.target.value)} />
                </label>
                <label>Velocidad Viento
                  <input value={form.controles.velocidadViento} onChange={(e) => setControles('velocidadViento', e.target.value)} />
                </label>
                <label>N° Serie Conductivímetro
                  <input value={form.controles.numeroSerieConductivimetro} onChange={(e) => setControles('numeroSerieConductivimetro', e.target.value)} />
                </label>
                <label>Conductividad
                  <input value={form.controles.conductividad} onChange={(e) => setControles('conductividad', e.target.value)} />
                </label>
                <label>Presión Lavado
                  <input value={form.controles.presionLavado} onChange={(e) => setControles('presionLavado', e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Programa</legend>
              <div className="form-grid">
                <label>Mes
                  <input type="month" value={form.programa.mes} onChange={(e) => setPrograma('mes', e.target.value)} />
                </label>
                <label>Estructuras Lavadas
                  <input type="number" value={form.programa.estructurasLavadas} onChange={(e) => setPrograma('estructurasLavadas', e.target.value)} />
                </label>
                <label>Estructuras Pendientes
                  <input type="number" value={form.programa.estructurasPendientes} onChange={(e) => setPrograma('estructurasPendientes', e.target.value)} />
                </label>
                <label>% de avance
                  <input type="number" min={0} max={100} value={form.programa.porcentajeAvance} onChange={(e) => setPrograma('porcentajeAvance', e.target.value)} />
                </label>
                <label>Cantidad Est.
                  <input type="number" value={form.programa.cantidadEst} onChange={(e) => setPrograma('cantidadEst', e.target.value)} />
                </label>
                <label>Tramo
                  <input value={form.programa.tramo} onChange={(e) => setPrograma('tramo', e.target.value)} />
                </label>
                <label>N° de cadenas lavadas
                  <input type="number" value={form.programa.numeroCadenasLavadas} onChange={(e) => setPrograma('numeroCadenasLavadas', e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Control de Agua</legend>
              <div className="form-grid">
                <label>Fecha
                  <input type="datetime-local" value={form.controlAgua.fecha} onChange={(e) => setControlAgua('fecha', e.target.value)} />
                </label>
                <label>Responsable
                  <input value={form.controlAgua.responsable} onChange={(e) => setControlAgua('responsable', e.target.value)} />
                </label>
                <label>Proveedor de agua
                  <input value={form.controlAgua.proveedorAgua} onChange={(e) => setControlAgua('proveedorAgua', e.target.value)} />
                </label>
                <label>Consumo diario
                  <input value={form.controlAgua.consumoDiario} onChange={(e) => setControlAgua('consumoDiario', e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Personal Involucrado</legend>
              <div className="form-grid">
                <label>Supervisor
                  <input type="number" value={form.personal.supervisor} onChange={(e) => setPersonal('supervisor', e.target.value)} />
                </label>
                <label>Jefe de brigada
                  <input type="number" value={form.personal.jefeBrigada} onChange={(e) => setPersonal('jefeBrigada', e.target.value)} />
                </label>
                <label>Prevencionista
                  <input type="number" value={form.personal.prevencionista} onChange={(e) => setPersonal('prevencionista', e.target.value)} />
                </label>
                <label>Operador
                  <input type="number" value={form.personal.operador} onChange={(e) => setPersonal('operador', e.target.value)} />
                </label>
                <label>Técnico
                  <input type="number" value={form.personal.tecnico} onChange={(e) => setPersonal('tecnico', e.target.value)} />
                </label>
                <label>Ayudante
                  <input type="number" value={form.personal.ayudante} onChange={(e) => setPersonal('ayudante', e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Totales</legend>
              <div className="form-grid">
                <label>HH
                  <input type="number" value={form.totales.hh} onChange={(e) => setTotales('hh', e.target.value)} />
                </label>
                <label>Agua utilizada
                  <input value={form.totales.aguaUtilizada} onChange={(e) => setTotales('aguaUtilizada', e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Equipos Lavados</legend>
              {form.equiposLavados.length === 0 && <div className="muted">Sin equipos. Agrega registros si corresponde.</div>}
              {form.equiposLavados.map((e, idx) => (
                <div key={idx} className="material-row">
                  <input placeholder="N°" value={e.numero} onChange={(ev) => setEquipo(idx, 'numero', ev.target.value)} style={{ width: 80 }} />
                  <input placeholder="Tipo" value={e.tipo} onChange={(ev) => setEquipo(idx, 'tipo', ev.target.value)} />
                  <input placeholder="Equipos" type="number" value={e.equipos} onChange={(ev) => setEquipo(idx, 'equipos', ev.target.value)} style={{ width: 110 }} />
                  <input placeholder="Lavados" type="number" value={e.lavados} onChange={(ev) => setEquipo(idx, 'lavados', ev.target.value)} style={{ width: 110 }} />
                  <input placeholder="Fecha" type="datetime-local" value={e.fecha} onChange={(ev) => setEquipo(idx, 'fecha', ev.target.value)} style={{ width: 200 }} />
                  <input placeholder="N° PT" value={e.numeroPT} onChange={(ev) => setEquipo(idx, 'numeroPT', ev.target.value)} style={{ width: 110 }} />
                  <input placeholder="Jefe de faena" value={e.jefeFaena} onChange={(ev) => setEquipo(idx, 'jefeFaena', ev.target.value)} />
                  <input placeholder="N° Serie" value={e.numeroSerie} onChange={(ev) => setEquipo(idx, 'numeroSerie', ev.target.value)} style={{ width: 110 }} />
                  <input placeholder="Equipo" value={e.equipo} onChange={(ev) => setEquipo(idx, 'equipo', ev.target.value)} />
                  <input placeholder="H" value={e.H} onChange={(ev) => setEquipo(idx, 'H', ev.target.value)} style={{ width: 80 }} />
                  <input placeholder="C" value={e.C} onChange={(ev) => setEquipo(idx, 'C', ev.target.value)} style={{ width: 80 }} />
                  <input placeholder="V-V" value={e.vV} onChange={(ev) => setEquipo(idx, 'vV', ev.target.value)} style={{ width: 80 }} />
                  <input placeholder="P" value={e.P} onChange={(ev) => setEquipo(idx, 'P', ev.target.value)} style={{ width: 80 }} />
                  <input placeholder="Camión" value={e.camion} onChange={(ev) => setEquipo(idx, 'camion', ev.target.value)} />
                  <input placeholder="Método" value={e.metodo} onChange={(ev) => setEquipo(idx, 'metodo', ev.target.value)} />
                  <label className="checkbox-row" style={{ marginLeft: 8 }}>
                    <input type="checkbox" checked={!!e.lavada} onChange={(ev) => setEquipo(idx, 'lavada', ev.target.checked)} />
                    <span>Lavada</span>
                  </label>
                  <input placeholder="Observaciones" value={e.observaciones} onChange={(ev) => setEquipo(idx, 'observaciones', ev.target.value)} />
                  <button className="btn btn-small btn-danger" onClick={() => rmEquipo(idx)}>Quitar</button>
                </div>
              ))}
              <button className="btn btn-small" onClick={addEquipo}>Agregar equipo</button>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Imágenes</legend>
              {form.imagenes.length === 0 && <div className="muted">Sin imágenes. Agrega URLs si corresponde.</div>}
              {form.imagenes.map((url, idx) => (
                <div key={idx} className="material-row">
                  <input placeholder={`URL imagen ${idx + 1}`} value={url} onChange={(e) => setImg(idx, e.target.value)} />
                  <button className="btn btn-small btn-danger" onClick={() => rmImg(idx)}>Quitar</button>
                </div>
              ))}
              <button className="btn btn-small" onClick={addImg}>Agregar imagen</button>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Observaciones / Firma</legend>
              <div className="form-grid">
                <label>Observación General
                  <textarea rows={3} value={form.observacionGeneral} onChange={(e) => setField('observacionGeneral', e.target.value)} />
                </label>
                <label>Firma - Jefe de brigada
                  <input value={form.firma.jefeBrigada} onChange={(e) => setFirma('jefeBrigada', e.target.value)} />
                </label>
              </div>
            </fieldset>

            {error && <p className="informes-error" style={{ marginTop: 8 }}>{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear informe'}
              </button>
              {isEdit && (
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Eliminando…' : 'Eliminar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* render principal */
  return (
    <div className="informes-containerComponent informes-full-height">
      <div className="informes-container">
        <div className="informes-header-icon">
          <BookText size={36} color="#185dc8" />
        </div>
        <div>
          <h1 className="informes-title">Administrar Informes</h1>
          <p className="informes-subtitle">Crear, consultar, editar y eliminar informes técnicos.</p>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar por instalación, jefe de faena, encargado, tipo de intervención, tramo u observación…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" onClick={openCreate} style={{ marginLeft: 12 }}>
          Nuevo informe
        </button>
      </div>

      {loading && <div className="no-informes">Cargando…</div>}
      {!loading && error && <p className="informes-error">{error}</p>}
      {!loading && !error && filtrados.length === 0 && (
        <div className="no-informes">Sin resultados.</div>
      )}

      {!loading && !error && filtrados.length > 0 && (
        <table className="informes-table informes-table--compact">
          <thead>
            <tr>
              <th className="col-ubicacion">Instalación</th>
              <th className="col-tecnico">Jefe de faena</th>
              <th className="col-tecnico">Encargado</th>
              <th className="col-aislador">Tipo intervención</th>
              <th className="col-mes hide-md">Mes prog.</th>
              <th className="col-exportar">Exportar</th>
              {/* columna “Creado” eliminada */}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((inf) => {
              return (
                <tr key={inf._id} title="Editar / Ver">
                  <td className="cell-ellipsis" onClick={() => openEdit(inf)}>{inf?.instalacion || '-'}</td>
                  <td className="cell-ellipsis" onClick={() => openEdit(inf)}>{inf?.jefeFaena || '-'}</td>
                  <td className="cell-ellipsis" onClick={() => openEdit(inf)}>{inf?.encargado || '-'}</td>
                  <td className="cell-ellipsis" onClick={() => openEdit(inf)}>{inf?.tipoIntervencion || '-'}</td>
                  <td className="col-mes hide-md" onClick={() => openEdit(inf)}>
                    {inf?.programa?.mes ? new Date(inf.programa.mes).toLocaleDateString('es-CL', { year: 'numeric', month: 'short' }) : '-'}
                  </td>
                  <td>
                    <div className="export-buttons">
                      <button className="btn btn-small" onClick={() => handleExport(inf._id, 'pdf')}>PDF</button>
                      <button className="btn btn-small" onClick={() => handleExport(inf._id, 'excel')}>Excel</button>
                    </div>
                  </td>
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
