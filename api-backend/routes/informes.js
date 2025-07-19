const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/authMiddleware');
const Informe = require('../models/Informe');
const { esAdmin } = require('../middleware/rolesMiddleware');
// Crear un nuevo informe
// POST /informes
router.post('/', verificarToken, async (req, res) => {
  try {
    const { ubicacion, tipoAislador, materialesUtilizados, observaciones } = req.body;

    // Validación básica
    if (!ubicacion || !tipoAislador || !materialesUtilizados) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    const nuevoInforme = new Informe({
      tecnico: req.usuario.id,
      ubicacion,
      tipoAislador,
      materialesUtilizados,
      observaciones
    });

    await nuevoInforme.save();

    res.status(201).json({ mensaje: 'Informe creado correctamente', informe: nuevoInforme });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar el informe', error: error.message });
  }
});
// Obtener todos los informes
// GET /informes
router.get('/', verificarToken, esAdmin, async (req, res) => {
  try {
    const informes = await Informe.find()
      .populate('tecnico', 'nombre correo')
      .sort({ createdAt: -1 });

    res.json({ informes });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los informes', error: error.message });
  }
});
// Obtener informes de un técnico específico
// GET /informes/mios
router.get('/mios', verificarToken, async (req, res) => {
  try {
    const informes = await Informe.find({ tecnico: req.usuario.id }).sort({ createdAt: -1 });
    res.json({ informes });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los informes', error: error.message });
  }
});
// Editar informe (PATCH)
router.patch('/:id', verificarToken, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    const informeActualizado = await Informe.findByIdAndUpdate(id, update, { new: true });
    if (!informeActualizado) {
      return res.status(404).json({ mensaje: 'Informe no encontrado' });
    }
    res.json({ mensaje: 'Informe actualizado correctamente', informe: informeActualizado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar informe' });
  }
});
// Eliminar informe (DELETE)
router.delete('/:id', verificarToken, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const informeEliminado = await Informe.findByIdAndDelete(id);
    if (!informeEliminado) {
      return res.status(404).json({ mensaje: 'Informe no encontrado' });
    }
    res.json({ mensaje: 'Informe eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar informe' });
  }
});

module.exports = router;
