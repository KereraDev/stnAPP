const mongoose = require('mongoose');

const informeSchema = new mongoose.Schema({
  tecnico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  ubicacion: {
  direccion: { type: String, required: true },
  comuna: { type: String, required: true },
  latitude: { type: String }
},
  tipoAislador: {
    type: String,
    required: true
  },
  materialesUtilizados: {
    type: [String],
    required: true
  },
  observaciones: {
    type: String
  },
  estado: {
    type: String,
    enum: ['pendiente', 'validado', 'rechazado'],
    default: 'pendiente'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Informe', informeSchema);
