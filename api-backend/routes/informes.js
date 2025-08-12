const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/authMiddleware');
const { esAdmin } = require('../middleware/rolesMiddleware');
const Informe = require('../models/Informe');

/* --------- helpers --------- */

const NON_EDITABLE = new Set(['_id', 'createdAt', 'updatedAt', '__v']);

function getEditablePaths(model) {
  return Object.keys(model.schema.paths).filter((k) => !NON_EDITABLE.has(k));
}
function isEditableKey(key, editablePaths) {
  return editablePaths.includes(key) || editablePaths.some((p) => p.startsWith(key + '.'));
}

function toNumberOrString(x) {
  if (x === null || x === undefined) return '';
  const s = String(x).trim();
  if (s === '') return '';
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : s;
}

function toDateOrNull(x) {
  if (!x) return null;
  const d = new Date(x);
  return isNaN(d) ? null : d;
}

function normalizeMateriales(materiales) {
  if (!Array.isArray(materiales)) return [];
  return materiales
    .map((m) => {
      if (!m) return null;
      if (typeof m === 'object') {
        const nombre = (m.nombre ?? '').toString().trim();
        const cantidad = toNumberOrString(m.cantidad);
        const valor = toNumberOrString(m.valor);
        if (!nombre && cantidad === '' && valor === '') return null;
        return { nombre, cantidad, valor };
      }
      // string suelta -> al menos nombre
      const nombre = String(m).trim();
      if (!nombre) return null;
      return { nombre, cantidad: '', valor: '' };
    })
    .filter(Boolean);
}

function normalizeUbicacion(v = {}) {
  return {
    direccion: (v.direccion ?? '').toString().trim(),
    comuna: (v.comuna ?? '').toString().trim(),
    latitude: (v.latitude ?? '').toString().trim(),
  };
}

function normalizeCliente(v = {}) {
  return {
    nombre: (v.nombre ?? '').toString().trim(),
    correo: (v.correo ?? '').toString().trim(),
    rut: (v.rut ?? '').toString().trim(),
  };
}

function normalizeFirma(v = {}) {
  const fecha = toDateOrNull(v.fecha);
  return {
    nombre: (v.nombre ?? '').toString().trim(),
    rut: (v.rut ?? '').toString().trim(),
    fecha: fecha || undefined,
  };
}

function buildUpdate(body) {
  const editablePaths = getEditablePaths(Informe);
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!isEditableKey(k, editablePaths)) continue;

    if (k === 'materialesUtilizados') {
      out[k] = normalizeMateriales(v);
      continue;
    }
    if (k === 'ubicacion' && v && typeof v === 'object') {
      out[k] = normalizeUbicacion(v);
      continue;
    }
    if (k === 'cliente' && v && typeof v === 'object') {
      out[k] = normalizeCliente(v);
      continue;
    }
    if (k === 'firmaTecnico' && v && typeof v === 'object') {
      out[k] = normalizeFirma(v);
      continue;
    }
    if (
      ['fechaActividad', 'fechaAprobacion', 'fechaEnvio', 'fechaFacturacion', 'fecha'].includes(k)
    ) {
      const d = toDateOrNull(v);
      if (d) out[k] = d;
      continue;
    }
    out[k] = v;
  }
  return out;
}

/* --------- RUTAS --------- */

// Crear
router.post('/', verificarToken, async (req, res) => {
  try {
    const body = req.body || {};
    const payload = buildUpdate(body);

    // seguridad rol: si no eres admin, ignoramos técnico entrante
    if (req.usuario?.rol !== 'admin') delete payload.tecnico;
    if (!payload.tecnico) payload.tecnico = req.usuario.id;

    // Validación de negocio
    const ubic = payload.ubicacion || {};
    const mats = normalizeMateriales(payload.materialesUtilizados);
    payload.materialesUtilizados = mats;

    if (
      !payload.tipoAislador ||
      !ubic.direccion || !ubic.comuna ||
      !Array.isArray(mats) || mats.length === 0
    ) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    const docNuevo = await Informe.create(payload);

    const doc = await Informe.findById(docNuevo._id)
      .populate('tecnico', 'nombre correo')
      .lean();

    res.status(201).json({ mensaje: 'Informe creado correctamente', informe: doc });
  } catch (error) {
    console.error('POST /informes ERROR:', error);
    res.status(500).json({ mensaje: 'Error al guardar el informe', error: error.message });
  }
});

// Listar (admin)
router.get('/', verificarToken, esAdmin, async (req, res) => {
  try {
    const informes = await Informe.find()
      .populate('tecnico', 'nombre correo')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ informes });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los informes', error: error.message });
  }
});

// Mis informes
router.get('/mios', verificarToken, async (req, res) => {
  try {
    const informes = await Informe.find({ tecnico: req.usuario.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ informes });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los informes', error: error.message });
  }
});

// Obtener por ID (útil para el modal si lo necesitas)
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const inf = await Informe.findById(req.params.id)
      .populate('tecnico', 'nombre correo')
      .lean();
    if (!inf) return res.status(404).json({ mensaje: 'Informe no encontrado' });
    res.json({ informe: inf });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener informe', error: error.message });
  }
});

// Editar (admin)
router.patch('/:id', verificarToken, esAdmin, async (req, res) => {
  try {
    const update = buildUpdate(req.body);

    if ('materialesUtilizados' in update) {
      update.materialesUtilizados = normalizeMateriales(update.materialesUtilizados);
    }
    if (!Object.keys(update).length) {
      return res.status(400).json({ mensaje: 'No hay cambios válidos para aplicar' });
    }

    const informeActualizado = await Informe.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate('tecnico', 'nombre correo');

    if (!informeActualizado) {
      return res.status(404).json({ mensaje: 'Informe no encontrado' });
    }

    res.json({ mensaje: 'Informe actualizado correctamente', informe: informeActualizado });
  } catch (error) {
    console.error('PATCH /informes/:id ERROR:', error);
    res.status(500).json({ mensaje: 'Error al actualizar informe', error: error.message });
  }
});

// Eliminar (admin)
router.delete('/:id', verificarToken, esAdmin, async (req, res) => {
  try {
    const informeEliminado = await Informe.findByIdAndDelete(req.params.id);
    if (!informeEliminado) {
      return res.status(404).json({ mensaje: 'Informe no encontrado' });
    }
    res.json({ mensaje: 'Informe eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar informe', error: error.message });
  }
});

module.exports = router;
