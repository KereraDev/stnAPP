const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  apellido:{
    type: String,
    required: false
  },
  correo: {
    type: String,
    required: true,
    unique: true
  },
  contraseña_hash: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['tecnico', 'admin', 'supervisor'],
    required: true
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  telefono: String,
  rut: String
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
