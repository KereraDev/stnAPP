const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema(
  {
    nombre: { type: String, trim: true, required: true },
    cantidad: { type: mongoose.Schema.Types.Mixed, default: '' }, // número o string
    valor: { type: mongoose.Schema.Types.Mixed, default: '' },     // número o string (unidad/moneda)
  },
  { _id: false }
);

const UbicacionSchema = new mongoose.Schema(
  {
    direccion: { type: String, required: true, trim: true },
    comuna: { type: String, required: true, trim: true },
    latitude: { type: String, default: '' }, // opcional
  },
  { _id: false }
);

const ClienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, default: '', trim: true },
    correo: { type: String, default: '', trim: true },
    rut: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const FirmaTecnicoSchema = new mongoose.Schema(
  {
    nombre: { type: String, default: '', trim: true },
    rut: { type: String, default: '', trim: true },
    fecha: { type: Date }, // fecha/hora de firma
  },
  { _id: false }
);

const informeSchema = new mongoose.Schema(
  {
    // QUIÉN realizó el informe
    tecnico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

    // CLIENTE (embebido para simplicidad; si luego quieres ref, lo cambiamos)
    cliente: { type: ClienteSchema, default: {} },

    // ESTADO y FACTURACIÓN
    estado: {
      type: String,
      enum: ['pendiente', 'rechazado', 'aprobado', 'enviado'],
      default: 'pendiente',
    },
    facturado: { type: Boolean, default: false },

    // FECHAS DE PROCESO
    fechaActividad: { type: Date },    // Fecha Actividad
    fechaAprobacion: { type: Date },   // Fecha Aprobación
    fechaEnvio: { type: Date },        // Fecha Envío
    fechaFacturacion: { type: Date },  // Fecha Facturación

    // FIRMA TÉCNICO
    firmaTecnico: { type: FirmaTecnicoSchema, default: {} },

    // CONTENIDO
    tipoAislador: { type: String, required: true, trim: true },
    observaciones: { type: String, default: '', trim: true },
    ubicacion: { type: UbicacionSchema, required: true },
    materialesUtilizados: {
      type: [MaterialSchema],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Debe incluir al menos un material',
      },
    },

    // IMÁGENES (URLs)
    imagenes: { type: [String], default: [] },

    // ARCHIVOS exportados (URLs a PDF/Excel si los generas)
    pdfUrl: { type: String, default: '' },
    excelUrl: { type: String, default: '' },

    // Conserva si quieres esta fecha original además de timestamps
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Informe', informeSchema);
