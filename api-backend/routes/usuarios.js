const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const verificarToken = require('../middleware/authMiddleware');
const { esAdmin } = require('../middleware/rolesMiddleware');

// Proteger todas las rutas de usuarios
router.use(verificarToken, esAdmin);
// Crear usuario (registro)
router.post('/', async (req, res) => {
  try {
    const { nombre, apellido, correo, contraseña, rol, telefono, rut, activo } = req.body;

    // Validaciones básicas
    if (!nombre || !correo || !contraseña || !rol) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    // Verificar si el correo ya está registrado
    const existente = await Usuario.findOne({ correo });
    if (existente) {
      return res.status(400).json({ mensaje: 'Este correo ya está registrado' });
    }

    // Encriptar la contraseña
    const contraseña_hash = await bcrypt.hash(contraseña, 10);

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      correo,
      contraseña_hash,
      rol,
      telefono,
      rut,
      estado: activo ? 'activo' : 'inactivo'
    });

    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario creado correctamente', _id: nuevoUsuario._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json({ usuarios });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
});
// Editar usuario (PATCH)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };

    // Si se envía una nueva contraseña, encriptarla
    if (update.contraseña) {
      update.contraseña_hash = await bcrypt.hash(update.contraseña, 10);
      delete update.contraseña;
    }

    // Convertir campo activo a estado si se envía
    if (typeof update.activo === 'boolean') {
      update.estado = update.activo ? 'activo' : 'inactivo';
      delete update.activo; // evitar conflictos si no se usa ese campo en el schema
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(id, update, { new: true });
    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario actualizado correctamente', usuario: usuarioActualizado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
});
// Eliminar usuario (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioEliminado = await Usuario.findByIdAndDelete(id);
    if (!usuarioEliminado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
});
module.exports = router;
