// routes/informes.js
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/authMiddleware');
const { esAdmin } = require('../middleware/rolesMiddleware');
const Informe = require('../models/Informe');

/* ===================== helpers ===================== */

const NON_EDITABLE = new Set(['_id', 'createdAt', 'updatedAt', '__v']);
const ALLOWED_ROOT_KEYS = new Set([
  'cliente', 
  'jefeFaena',
  'encargado',
  'instalacion',
  'fechaInicio',
  'fechaTermino',
  'tipoIntervencion',
  'controles',
  'programa',
  'controlAgua',
  'personal',
  'totales',
  'equiposLavados',
  'observacionGeneral',
  'firma',
]);

const asString = (v) => (v == null ? '' : String(v).trim());
const toDateOrNull = (x) => {
  if (!x) return null;
  const d = new Date(x);
  return isNaN(d) ? null : d;
};
const toNumberOrNull = (x) => {
  if (x === '' || x === null || x === undefined) return null;
  const n = Number(String(x).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const clamp = (n, min, max) => {
  if (n == null) return n;
  return Math.min(max, Math.max(min, n));
};

/* ---------- normalizadores por bloque ---------- */

function normalizeControles(v = {}) {
  return {
    numeroSerieTermoAnemHigrometro: asString(v.numeroSerieTermoAnemHigrometro),
    humedadAmbiente: asString(v.humedadAmbiente),
    velocidadViento: asString(v.velocidadViento),
    numeroSerieConductivimetro: asString(v.numeroSerieConductivimetro),
    conductividad: asString(v.conductividad),
    presionLavado: asString(v.presionLavado),
  };
}

function normalizePrograma(v = {}) {
  const mes = toDateOrNull(v.mes);
  const estructurasLavadas = toNumberOrNull(v.estructurasLavadas) ?? 0;
  const estructurasPendientes = toNumberOrNull(v.estructurasPendientes) ?? 0;
  const porcentajeAvance = clamp(toNumberOrNull(v.porcentajeAvance) ?? 0, 0, 100);
  const cantidadEst = toNumberOrNull(v.cantidadEst) ?? 0;
  const numeroCadenasLavadas = toNumberOrNull(v.numeroCadenasLavadas) ?? 0;

  return {
    mes: mes || undefined,
    estructurasLavadas,
    estructurasPendientes,
    porcentajeAvance,
    cantidadEst,
    tramo: asString(v.tramo),
    numeroCadenasLavadas,
  };
}

function normalizeControlAgua(v = {}) {
  const fecha = toDateOrNull(v.fecha);
  return {
    fecha: fecha || undefined,
    responsable: asString(v.responsable),
    proveedorAgua: asString(v.proveedorAgua),
    consumoDiario: asString(v.consumoDiario),
  };
}

function normalizePersonal(v = {}) {
  const num = (x) => toNumberOrNull(x) ?? 0;
  return {
    supervisor: num(v.supervisor),
    jefeBrigada: num(v.jefeBrigada),
    prevencionista: num(v.prevencionista),
    operador: num(v.operador),
    tecnico: num(v.tecnico),
    ayudante: num(v.ayudante),
  };
}

function normalizeTotales(v = {}) {
  return {
    hh: toNumberOrNull(v.hh) ?? 0,
    aguaUtilizada: asString(v.aguaUtilizada),
  };
}

function normalizeEquipoLavado(item = {}) {
  const fecha = toDateOrNull(item.fecha);
  return {
    numero: toNumberOrNull(item.numero) ?? null,
    tipo: asString(item.tipo),
    equipos: toNumberOrNull(item.equipos) ?? 0,
    lavados: toNumberOrNull(item.lavados) ?? 0,
    fecha: fecha || undefined,
    numeroPT: toNumberOrNull(item.numeroPT) ?? null,
    jefeFaena: asString(item.jefeFaena),
    numeroSerie: toNumberOrNull(item.numeroSerie) ?? null,
    equipo: asString(item.equipo),
    H: toNumberOrNull(item.H) ?? null,
    C: asString(item.C),
    vV: asString(item.vV),
    P: asString(item.P),
    camion: asString(item.camion),
    metodo: asString(item.metodo),
    lavada: Boolean(item.lavada),
    observaciones: asString(item.observaciones),
    imagenes: normalizeImagenes(item.imagenes), // ¡Agregar las imágenes!
  };
}

function normalizeEquiposLavados(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (x && typeof x === 'object' ? normalizeEquipoLavado(x) : null))
    .filter(Boolean);
}

function normalizeImagenes(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => asString(x))
    .filter((s) => s.length > 0);
}

function normalizeFirma(v = {}) {
  return {
    jefeBrigada: asString(v.jefeBrigada),
  };
}

/* ---------- whitelisting + dispatch ---------- */

function buildUpdate(body) {
  const out = {};
  const src = body || {};

  for (const [k, v] of Object.entries(src)) {
    if (!ALLOWED_ROOT_KEYS.has(k) || NON_EDITABLE.has(k)) continue;

    switch (k) {
      case 'cliente': 
      case 'jefeFaena':
      case 'encargado':
      case 'instalacion':
      case 'tipoIntervencion':
      case 'observacionGeneral':
        out[k] = asString(v);
        break;

      case 'fechaInicio': {
        const d = toDateOrNull(v);
        if (d) out.fechaInicio = d; // normalmente no se envía; el modelo pone default
        break;
      }
      case 'fechaTermino': {
        const d = toDateOrNull(v);
        if (d) out.fechaTermino = d;
        break;
      }

      case 'controles':
        if (v && typeof v === 'object') out.controles = normalizeControles(v);
        break;

      case 'programa':
        if (v && typeof v === 'object') out.programa = normalizePrograma(v);
        break;

      case 'controlAgua':
        if (v && typeof v === 'object') out.controlAgua = normalizeControlAgua(v);
        break;

      case 'personal':
        if (v && typeof v === 'object') out.personal = normalizePersonal(v);
        break;

      case 'totales':
        if (v && typeof v === 'object') out.totales = normalizeTotales(v);
        break;

      case 'equiposLavados':
        out.equiposLavados = normalizeEquiposLavados(v);
        break;

      case 'firma':
        if (v && typeof v === 'object') out.firma = normalizeFirma(v);
        break;

      default:
        // ignorar claves no reconocidas
        break;
    }
  }
  return out;
}

/* ===================== RUTAS ===================== */

// Crear
router.post('/', verificarToken, async (req, res) => {
  try {
    const payload = buildUpdate(req.body);

    // ahora solo validamos instalacion, cliente puede ser vacío
    if (!payload.instalacion || !payload.instalacion.length) {
      return res.status(400).json({ mensaje: 'Instalación es obligatoria' });
    }

    const docNuevo = await Informe.create(payload);
    const doc = await Informe.findById(docNuevo._id).lean();

    res.status(201).json({ mensaje: 'Informe creado correctamente', informe: doc });
  } catch (error) {
    console.error('POST /informes ERROR:', error);
    res.status(500).json({ mensaje: 'Error al guardar el informe', error: error.message });
  }
});

// Listar (admin)
router.get('/', verificarToken, esAdmin, async (_req, res) => {
  try {
    const informes = await Informe.find().sort({ fechaInicio: -1 }).lean(); 
    res.json({ informes });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los informes', error: error.message });
  }
});

// Mis informes - Endpoint para aplicación móvil
router.get('/mios', verificarToken, async (req, res) => {
  try {
    // Por ahora devolver todos los informes hasta implementar filtrado por usuario
    const informes = await Informe.find().sort({ fechaInicio: -1 }).lean();
    res.json({ informes });
  } catch (error) {
    res.status(500).json({ 
      mensaje: 'Error al obtener informes', 
      error: error.message 
    });
  }
});

// Obtener por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const inf = await Informe.findById(req.params.id).lean();
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
    if (!Object.keys(update).length) {
      return res.status(400).json({ mensaje: 'No hay cambios válidos para aplicar' });
    }

    const informeActualizado = await Informe.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

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
