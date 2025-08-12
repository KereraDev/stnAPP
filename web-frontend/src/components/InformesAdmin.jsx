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

const ESTADOS = ['pendiente', 'rechazado', 'aprobado', 'enviado'];

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
  const [tecnicos, setTecnicos] = useState([]);

  const endpointLista = useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const rol = payload?.rol;
      return rol === 'admin'
        ? `${BASE}/api/informes`
        : `${BASE}/api/informes/mios`;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload?.rol === 'admin');
    } catch {}
  }, []);

  useEffect(() => {
    const loadTecnicos = async () => {
      if (!isAdmin) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE}/api/usuarios?rol=tecnico`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTecnicos(data.usuarios || []);
        }
      } catch {}
    };
    loadTecnicos();
  }, [isAdmin]);

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
        if (!endpointLista) throw new Error('Token inválido o rol no definido');
        const res = await fetch(endpointLista, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('No se pudieron obtener los informes');
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

  /* ---------- Modal: crear / editar ---------- */
  const emptyForm = () => ({
    tecnicoId: '',
    tipoAislador: '',
    observaciones: '',
    ubicacion: { direccion: '', comuna: '', latitude: '' },
    materialesUtilizados: [],

    cliente: { nombre: '', correo: '', rut: '' },

    estado: 'pendiente',
    facturado: false,

    fechaActividad: '',
    fechaAprobacion: '',
    fechaEnvio: '',
    fechaFacturacion: '',

    firmaTecnico: { nombre: '', rut: '', fecha: '' },

    imagenes: [],

    _id: '', createdAt: '', updatedAt: ''
  });

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm());
    setModalMode('create');
    setModalOpen(true);
    setError('');
  };

  const openEdit = (inf) => {
    setSelected(inf);
    setForm({
      tecnicoId: inf?.tecnico?._id || inf?.tecnico || '',
      tipoAislador: inf?.tipoAislador || '',
      observaciones: inf?.observaciones || '',
      ubicacion: {
        direccion: inf?.ubicacion?.direccion || '',
        comuna: inf?.ubicacion?.comuna || '',
        latitude: inf?.ubicacion?.latitude || '',
      },
      materialesUtilizados: Array.isArray(inf?.materialesUtilizados)
        ? inf.materialesUtilizados.map(m => ({
            nombre: m?.nombre ?? '',
            cantidad: m?.cantidad ?? '',
            valor: m?.valor ?? ''
          }))
        : [],
      cliente: {
        nombre: inf?.cliente?.nombre || '',
        correo: inf?.cliente?.correo || '',
        rut: inf?.cliente?.rut || '',
      },
      estado: inf?.estado || 'pendiente',
      facturado: !!inf?.facturado,

      fechaActividad: toInputDT(inf?.fechaActividad || inf?.fecha_actividad),
      fechaAprobacion: toInputDT(inf?.fechaAprobacion || inf?.fecha_aprobacion),
      fechaEnvio: toInputDT(inf?.fechaEnvio || inf?.fecha_envio),
      fechaFacturacion: toInputDT(inf?.fechaFacturacion || inf?.fecha_facturacion),

      firmaTecnico: {
        nombre: inf?.firmaTecnico?.nombre || (Array.isArray(inf?.firma_tecnico) ? inf.firma_tecnico[0] : '') || '',
        rut: inf?.firmaTecnico?.rut || (Array.isArray(inf?.firma_tecnico) ? inf.firma_tecnico[1] : '') || '',
        fecha: toInputDT(inf?.firmaTecnico?.fecha || (Array.isArray(inf?.firma_tecnico) ? inf.firma_tecnico[2] : '')),
      },

      imagenes: Array.isArray(inf?.imagenes) ? [...inf.imagenes] : [],

      _id: inf?._id || '',
      createdAt: inf?.createdAt || '',
      updatedAt: inf?.updatedAt || ''
    });
    setModalMode('edit');
    setModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
    setForm(null);
    setError('');
  };

  /* helpers form */
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNested = (ns, k, v) => setForm(f => ({ ...f, [ns]: { ...(f[ns] || {}), [k]: v } }));
  const setUbic = (k, v) => setNested('ubicacion', k, v);
  const setCliente = (k, v) => setNested('cliente', k, v);
  const setFirma = (k, v) => setNested('firmaTecnico', k, v);

  const addMat = () => setForm(f => ({ ...f, materialesUtilizados: [...f.materialesUtilizados, { nombre: '', cantidad: '', valor: '' }] }));
  const rmMat = (i) => setForm(f => ({ ...f, materialesUtilizados: f.materialesUtilizados.filter((_, idx) => idx !== i) }));
  const setMat = (i, k, v) => setForm(f => {
    const arr = f.materialesUtilizados.map((m, idx) => (idx === i ? { ...m, [k]: v } : m));
    return { ...f, materialesUtilizados: arr };
  });

  // imágenes
  const addImg = () => setForm(f => ({ ...f, imagenes: [...(f.imagenes || []), ''] }));
  const rmImg = (i) => setForm(f => ({ ...f, imagenes: f.imagenes.filter((_, idx) => idx !== i) }));
  const setImg = (i, v) => setForm(f => {
    const arr = (f.imagenes || []).map((url, idx) => (idx === i ? v : url));
    return { ...f, imagenes: arr };
  });

  /* ===========================
     EXPORTAR (cliente)
  ============================ */

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

  function buildExportRows(inf) {
    const cliente = inf?.cliente || {};
    const ubic = inf?.ubicacion || {};
    const firma = inf?.firmaTecnico || {};
    const mats = Array.isArray(inf?.materialesUtilizados) ? inf.materialesUtilizados : [];

    const matStr = mats.length
      ? mats.map(m => `${m?.nombre || '-'} — cant: ${m?.cantidad || '-'} — valor: ${m?.valor || '-'}`).join('\n')
      : '-';

    return [
      ['Cliente', cliente.nombre || '-'],
      ['Correo', cliente.correo || '-'],
      ['RUT', cliente.rut || '-'],
      ['Estado', inf?.estado || 'pendiente'],
      ['Facturado', inf?.facturado ? 'Sí' : 'No'],
      ['Fecha Actividad', fmtCL(inf?.fechaActividad || inf?.fecha_actividad) || '-'],
      ['Fecha Aprobación', fmtCL(inf?.fechaAprobacion || inf?.fecha_aprobacion) || '-'],
      ['Fecha Envío', fmtCL(inf?.fechaEnvio || inf?.fecha_envio) || '-'],
      ['Fecha Facturación', fmtCL(inf?.fechaFacturacion || inf?.fecha_facturacion) || '-'],
      [
        'Firma Técnico',
        `Nombre: ${firma.nombre || '-'}\nRUT: ${firma.rut || '-'}\nFecha: ${fmtCL(firma.fecha) || '-'}`
      ],
      [
        'Imágenes',
        Array.isArray(inf?.imagenes) && inf.imagenes.length
          ? inf.imagenes.map((_, idx) => `Imagen ${idx + 1}`).join(', ')
          : '-'
      ],
      ['Materiales Utilizados', matStr],
      ['Observaciones', inf?.observaciones || '-'],
      ['Tipo Aislador', inf?.tipoAislador || inf?.tipo_aislador || '-'],
      ['Ubicación', [ubic?.direccion, ubic?.comuna].filter(Boolean).join(', ') || '-'],
    ];
  }

  async function exportPDF(inf) {
    const doc = new jsPDF();
    doc.text('Detalle del Informe', 14, 16);

    const rows = buildExportRows(inf);

    autoTable(doc, {
      body: rows,
      startY: 22,
      styles: { cellWidth: 'wrap' },
      headStyles: { fillColor: [24, 93, 200] }
    });

    if (Array.isArray(inf.imagenes) && inf.imagenes.length) {
      let y = (doc.lastAutoTable?.finalY || 22) + 10;
      for (let i = 0; i < inf.imagenes.length && i < 3; i++) {
        const url = inf.imagenes[i];
        try {
          const imgData = await getImageBase64(url);
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

    doc.save(`informe-${inf._id || 'sin-id'}.pdf`);
  }

  function exportExcel(inf) {
    const rows = buildExportRows(inf);
    if (Array.isArray(inf.imagenes) && inf.imagenes.length) {
      inf.imagenes.forEach((url, idx) => rows.push([`Imagen ${idx + 1}`, url]));
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
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

      const mats = (form.materialesUtilizados || [])
        .map(m => ({
          nombre: (m.nombre || '').trim(),
          cantidad: (m.cantidad ?? '').toString().trim(),
          valor: (m.valor ?? '').toString().trim()
        }))
        .filter(m => m.nombre || m.cantidad || m.valor);

      if (modalMode === 'create') {
        if (!form.tipoAislador?.trim()) throw new Error('tipoAislador es obligatorio');
        if (!form.ubicacion?.direccion?.trim() || !form.ubicacion?.comuna?.trim()) {
          throw new Error('ubicacion.direccion y ubicacion.comuna son obligatorias');
        }
        if (mats.length === 0) throw new Error('Debe agregar al menos un material');
      }

      const body = {
        tipoAislador: (form.tipoAislador || '').trim(),
        observaciones: (form.observaciones || '').trim(),
        ubicacion: {
          direccion: (form.ubicacion?.direccion || '').trim(),
          comuna: (form.ubicacion?.comuna || '').trim(),
          latitude: (form.ubicacion?.latitude || '').trim(),
        },
        materialesUtilizados: mats,

        cliente: {
          nombre: (form.cliente?.nombre || '').trim(),
          correo: (form.cliente?.correo || '').trim(),
          rut: (form.cliente?.rut || '').trim(),
        },

        estado: form.estado || 'pendiente',
        facturado: !!form.facturado,

        fechaActividad: fromInputDT(form.fechaActividad) || undefined,
        fechaAprobacion: fromInputDT(form.fechaAprobacion) || undefined,
        fechaEnvio: fromInputDT(form.fechaEnvio) || undefined,
        fechaFacturacion: fromInputDT(form.fechaFacturacion) || undefined,

        firmaTecnico: {
          nombre: (form.firmaTecnico?.nombre || '').trim(),
          rut: (form.firmaTecnico?.rut || '').trim(),
          fecha: fromInputDT(form.firmaTecnico?.fecha) || undefined,
        },

        imagenes: (form.imagenes || []).map((u) => (u || '').trim()).filter(Boolean),
      };
      if (isAdmin && form.tecnicoId) body.tecnico = form.tecnicoId;

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

      if (modalMode === 'create') {
        const tecnicoObj = isAdmin && body.tecnico
          ? (tecnicos.find(t => t._id === body.tecnico) || doc.tecnico)
          : doc.tecnico;

        const nuevo = { ...doc, tecnico: tecnicoObj };
        setInformes(prev => {
          const out = [nuevo, ...prev];
          localStorage.setItem('informes_list', JSON.stringify(out));
          return out;
        });

        setForm(emptyForm());
        setModalMode('create');
      } else {
        const tecnicoObj = isAdmin && form.tecnicoId
          ? (tecnicos.find(t => t._id === form.tecnicoId) || doc.tecnico || selected.tecnico)
          : (doc.tecnico || selected.tecnico);

        setInformes(prev => {
          const out = prev.map(x => x._id === selected._id ? { ...x, ...doc, tecnico: tecnicoObj } : x);
          localStorage.setItem('informes_list', JSON.stringify(out));
          return out;
        });
        setSelected(s => ({ ...s, ...doc, tecnico: tecnicoObj }));
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
      const t = inf?.tecnico || {};
      const u = inf?.ubicacion || {};
      const c = inf?.cliente || {};
      return [
        t?.nombre, t?.correo,
        c?.nombre, c?.correo, c?.rut,
        inf?.tipoAislador,
        u?.comuna, u?.direccion,
        inf?.observaciones,
        inf?.estado
      ].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [informes, query]);

  const renderModal = () => {
    if (!modalOpen || !form) return null;
    const isEdit = modalMode === 'edit';
    const t = selected?.tecnico || {};
    return (
      <div className="modal-informe-bg" onClick={closeModal}>
        <div className="modal-informe" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>&times;</button>
          <h3>{isEdit ? 'Editar Informe' : 'Nuevo Informe'}</h3>
          <div className="modal-informe-content">
            <div className="form-grid">
              {isAdmin ? (
                <label>Técnico
                  <select value={form.tecnicoId} onChange={(e) => setField('tecnicoId', e.target.value)}>
                    <option value="">— seleccionar —</option>
                    {tecnicos.map(u => (
                      <option key={u._id} value={u._id}>{u.nombre} — {u.correo}</option>
                    ))}
                  </select>
                </label>
              ) : isEdit ? (
                <label>Técnico (solo lectura)
                  <input value={t?.nombre || '-'} readOnly />
                </label>
              ) : null}

              <label>Cliente - Nombre
                <input value={form.cliente.nombre} onChange={(e) => setCliente('nombre', e.target.value)} />
              </label>
              <label>Cliente - Correo
                <input value={form.cliente.correo} onChange={(e) => setCliente('correo', e.target.value)} />
              </label>
              <label>Cliente - RUT
                <input value={form.cliente.rut} onChange={(e) => setCliente('rut', e.target.value)} />
              </label>

              <label>Estado
                <select value={form.estado} onChange={(e) => setField('estado', e.target.value)}>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={!!form.facturado}
                  onChange={(e) => setField('facturado', e.target.checked)}
                />
                <span>Facturado</span>
              </label>

              <label>Tipo Aislador *
                <input value={form.tipoAislador} onChange={(e) => setField('tipoAislador', e.target.value)} />
              </label>

              <label>Dirección *
                <input value={form.ubicacion.direccion} onChange={(e) => setUbic('direccion', e.target.value)} />
              </label>

              <label>Comuna *
                <input value={form.ubicacion.comuna} onChange={(e) => setUbic('comuna', e.target.value)} />
              </label>

              <label>Latitude
                <input value={form.ubicacion.latitude} onChange={(e) => setUbic('latitude', e.target.value)} />
              </label>

              <label>Observaciones
                <textarea rows={3} value={form.observaciones} onChange={(e) => setField('observaciones', e.target.value)} />
              </label>

              {isEdit && (
                <>
                  <label>ID (solo lectura)
                    <input value={form._id} readOnly />
                  </label>
                  <label>Creado (solo lectura)
                    <input value={fmtCL(form.createdAt)} readOnly />
                  </label>
                  <label>Actualizado (solo lectura)
                    <input value={fmtCL(form.updatedAt)} readOnly />
                  </label>
                </>
              )}
            </div>

            <fieldset className="fieldset">
              <legend>Fechas</legend>
              <div className="form-grid">
                <label>Fecha Actividad
                  <input type="datetime-local" value={form.fechaActividad} onChange={(e) => setField('fechaActividad', e.target.value)} />
                </label>
                <label>Fecha Aprobación
                  <input type="datetime-local" value={form.fechaAprobacion} onChange={(e) => setField('fechaAprobacion', e.target.value)} />
                </label>
                <label>Fecha Envío
                  <input type="datetime-local" value={form.fechaEnvio} onChange={(e) => setField('fechaEnvio', e.target.value)} />
                </label>
                <label>Fecha Facturación
                  <input type="datetime-local" value={form.fechaFacturacion} onChange={(e) => setField('fechaFacturacion', e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Firma del Técnico</legend>
              <div className="form-grid">
                <label>Nombre
                  <input value={form.firmaTecnico.nombre} onChange={(e) => setFirma('nombre', e.target.value)} />
                </label>
                <label>RUT
                  <input value={form.firmaTecnico.rut} onChange={(e) => setFirma('rut', e.target.value)} />
                </label>
                <label>Fecha
                  <input type="datetime-local" value={form.firmaTecnico.fecha} onChange={(e) => setFirma('fecha', e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Materiales Utilizados *</legend>
              {form.materialesUtilizados.length === 0 && <div className="muted">Sin materiales. Agrega al menos uno.</div>}
              {form.materialesUtilizados.map((m, idx) => (
                <div key={idx} className="material-row">
                  <input placeholder="Nombre" value={m.nombre} onChange={(e) => setMat(idx, 'nombre', e.target.value)} />
                  <input placeholder="Cantidad" value={m.cantidad} onChange={(e) => setMat(idx, 'cantidad', e.target.value)} />
                  <input placeholder="Valor" value={m.valor} onChange={(e) => setMat(idx, 'valor', e.target.value)} />
                  <button className="btn btn-small btn-danger" onClick={() => rmMat(idx)}>Quitar</button>
                </div>
              ))}
              <button className="btn btn-small" onClick={addMat}>Agregar material</button>
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
              {isEdit && (
                <>
                  <button className="btn" onClick={() => handleExport(selected._id, 'pdf')} disabled={saving}>
                    Exportar PDF
                  </button>
                  <button className="btn" onClick={() => handleExport(selected._id, 'excel')} disabled={saving}>
                    Exportar Excel
                  </button>
                </>
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
          placeholder="Buscar por técnico, cliente, RUT, estado, aislador, comuna, dirección u observaciones…"
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
              <th className="col-tecnico">Técnico</th>
              <th className="col-cliente">Cliente</th>
              <th className="col-estado">Estado</th>
              <th className="col-aislador">Tipo Aislador</th>
              <th className="col-ubicacion">Ubicación</th>
              <th className="col-exportar">Exportar</th>
              <th className="col-creado hide-md">Creado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((inf) => {
              const t = inf?.tecnico || {};
              const u = inf?.ubicacion || {};
              const c = inf?.cliente || {};
              const ubic = [u?.direccion, u?.comuna].filter(Boolean).join(', ');
              return (
                <tr key={inf._id} title="Editar / Ver">
                  <td className="cell-ellipsis" onClick={() => openEdit(inf)}>{t?.nombre || '-'}</td>
                  <td className="cell-ellipsis" onClick={() => openEdit(inf)}>{c?.nombre || '-'}</td>
                  <td className="cell-badge" onClick={() => openEdit(inf)}>
                    <span className={`badge badge--${inf?.estado || 'pendiente'}`}>
                      {inf?.estado || 'pendiente'}
                    </span>
                  </td>
                  <td className="cell-ellipsis" onClick={() => openEdit(inf)}>{inf?.tipoAislador || '-'}</td>
                  <td className="cell-ellipsis" onClick={() => openEdit(inf)}>{ubic || '-'}</td>
                  <td>
                    <div className="export-buttons">
                      <button className="btn btn-small" onClick={() => handleExport(inf._id, 'pdf')}>PDF</button>
                      <button className="btn btn-small" onClick={() => handleExport(inf._id, 'excel')}>Excel</button>
                    </div>
                  </td>
                  <td className="hide-md" onClick={() => openEdit(inf)}>{inf?.createdAt ? fmtCL(inf.createdAt) : '-'}</td>
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
