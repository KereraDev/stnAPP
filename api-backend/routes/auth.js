const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

router.post('/login', async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Validar que estén presentes
    if (!correo || !contraseña) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
    }

    // Buscar al usuario
    const usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ mensaje: 'Usuario inactivo, contacte a un administrador' });
    }

    // Comparar la contraseña
    const coincide = await bcrypt.compare(contraseña, usuario.contraseña_hash);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;
