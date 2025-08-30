const express = require('express');
const { upload, procesarImagenBase64, validarLimiteTotal } = require('../middleware/uploadMiddleware');
const verificarToken = require('../middleware/authMiddleware');
const Informe = require('../models/Informe');
const router = express.Router();

// Subir múltiples imágenes y convertir a Base64 (para uso general/local)
router.post('/', verificarToken, upload.array('imagenes', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ mensaje: 'No se enviaron imágenes' });
    }

    const imagenesBase64 = [];
    let tamañoAcumulado = 0;
    const limiteTotal = 10 * 1024 * 1024; // 10MB

    // Procesar cada imagen y controlar tamaño acumulado
    for (const file of req.files) {
      try {
        const imagenProcesada = await procesarImagenBase64(file.buffer, file.originalname);
        
        // Verificar si agregar esta imagen excedería el límite
        if (tamañoAcumulado + imagenProcesada.tamaño > limiteTotal) {
          return res.status(400).json({ 
            mensaje: 'Sin espacio suficiente',
            error: `No hay espacio suficiente para todas las imágenes. Se procesaron ${imagenesBase64.length} de ${req.files.length} imágenes.`
          });
        }

        imagenesBase64.push(imagenProcesada);
        tamañoAcumulado += imagenProcesada.tamaño;

      } catch (error) {
        return res.status(400).json({ 
          mensaje: 'Error al procesar imagen',
          error: 'No se pudo procesar una de las imágenes. Intenta con otra imagen.'
        });
      }
    }

    // Calcular estadísticas finales
    const tamañoPromedio = tamañoAcumulado / imagenesBase64.length;
    const espacioRestante = limiteTotal - tamañoAcumulado;

    res.json({ 
      mensaje: 'Imágenes procesadas correctamente',
      imagenes: imagenesBase64.map(img => img.dataUri),
      estadisticas: {
        cantidad: imagenesBase64.length,
        tamañoTotal: `${(tamañoAcumulado / 1024 / 1024).toFixed(2)}MB`,
        tamañoPromedio: `${(tamañoPromedio / 1024 / 1024).toFixed(2)}MB`,
        espacioRestante: `${(espacioRestante / 1024 / 1024).toFixed(2)}MB`,
        limite: '10MB'
      }
    });

  } catch (error) {
    console.error('Error al procesar imágenes:', error);
    
    // Manejar errores específicos de multer
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        mensaje: 'Archivo muy grande',
        error: 'Una o más imágenes son muy grandes. Selecciona imágenes más pequeñas.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        mensaje: 'Demasiados archivos',
        error: 'Selecciona menos imágenes en cada subida.'
      });
    }

    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: 'Ocurrió un problema al procesar las imágenes. Intenta nuevamente.'
    });
  }
});

// Subir múltiples imágenes a un equipo específico
router.post('/equipo/:informeId/:equipoIndex', verificarToken, upload.array('imagenes', 20), async (req, res) => {
  try {
    const { informeId, equipoIndex } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ mensaje: 'No se enviaron imágenes' });
    }

    // Buscar el informe
    const informe = await Informe.findById(informeId);
    if (!informe) {
      return res.status(404).json({ mensaje: 'Informe no encontrado' });
    }

    // Validar que el índice del equipo existe
    const equipoIdx = parseInt(equipoIndex);
    if (equipoIdx < 0 || equipoIdx >= informe.equiposLavados.length) {
      return res.status(400).json({ mensaje: 'Equipo no encontrado' });
    }

    const imagenesBase64 = [];
    let tamañoAcumulado = 0;
    const limiteTotal = 10 * 1024 * 1024; // 10MB

    // Calcular tamaño actual de las imágenes existentes del equipo
    const imagenesExistentes = informe.equiposLavados[equipoIdx].imagenes || [];
    for (const imagenExistente of imagenesExistentes) {
      // Estimar tamaño de Base64 existente (aprox. 4/3 del tamaño real)
      tamañoAcumulado += (imagenExistente.length * 3) / 4;
    }

    // Procesar cada imagen nueva y controlar tamaño acumulado
    for (const file of req.files) {
      try {
        const imagenProcesada = await procesarImagenBase64(file.buffer, file.originalname);
        
        // Verificar si agregar esta imagen excedería el límite
        if (tamañoAcumulado + imagenProcesada.tamaño > limiteTotal) {
          return res.status(400).json({ 
            mensaje: 'Sin espacio suficiente',
            error: `No hay espacio suficiente para todas las imágenes. Se procesaron ${imagenesBase64.length} de ${req.files.length} imágenes.`
          });
        }

        imagenesBase64.push(imagenProcesada);
        tamañoAcumulado += imagenProcesada.tamaño;

      } catch (error) {
        return res.status(400).json({ 
          mensaje: 'Error al procesar imagen',
          error: 'No se pudo procesar una de las imágenes. Intenta con otra imagen.'
        });
      }
    }

    // Agregar las nuevas imágenes al equipo
    const nuevasImagenes = imagenesBase64.map(img => img.dataUri);
    informe.equiposLavados[equipoIdx].imagenes.push(...nuevasImagenes);

    // Guardar el informe actualizado
    await informe.save();

    // Calcular estadísticas finales
    const tamañoTotalEquipo = tamañoAcumulado;
    const espacioRestante = limiteTotal - tamañoTotalEquipo;
    const totalImagenesEquipo = informe.equiposLavados[equipoIdx].imagenes.length;

    res.json({ 
      mensaje: 'Imágenes subidas exitosamente',
      imagenes: nuevasImagenes,
      estadisticas: {
        cantidad: imagenesBase64.length,
        totalEnEquipo: totalImagenesEquipo,
        tamañoTotal: `${(tamañoTotalEquipo / 1024 / 1024).toFixed(2)}MB`,
        espacioRestante: `${(espacioRestante / 1024 / 1024).toFixed(2)}MB`,
        limite: '10MB'
      }
    });

  } catch (error) {
    console.error('Error al procesar imágenes:', error);
    
    // Manejar errores específicos de multer
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        mensaje: 'Archivo muy grande',
        error: 'Una o más imágenes son muy grandes. Selecciona imágenes más pequeñas.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        mensaje: 'Demasiados archivos',
        error: 'Selecciona menos imágenes en cada subida.'
      });
    }

    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: 'Ocurrió un problema al procesar las imágenes. Intenta nuevamente.'
    });
  }
});

// Obtener imágenes de un equipo específico
router.get('/equipo/:informeId/:equipoIndex', verificarToken, async (req, res) => {
  try {
    const { informeId, equipoIndex } = req.params;

    const informe = await Informe.findById(informeId);
    if (!informe) {
      return res.status(404).json({ mensaje: 'Informe no encontrado' });
    }

    const equipoIdx = parseInt(equipoIndex);
    if (equipoIdx < 0 || equipoIdx >= informe.equiposLavados.length) {
      return res.status(400).json({ mensaje: 'Equipo no encontrado' });
    }

    const imagenes = informe.equiposLavados[equipoIdx].imagenes || [];
    
    res.json({ 
      imagenes,
      cantidad: imagenes.length 
    });

  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: 'No se pudieron cargar las imágenes. Intenta nuevamente.'
    });
  }
});

// Eliminar una imagen específica de un equipo
router.delete('/equipo/:informeId/:equipoIndex/:imagenIndex', verificarToken, async (req, res) => {
  try {
    const { informeId, equipoIndex, imagenIndex } = req.params;

    const informe = await Informe.findById(informeId);
    if (!informe) {
      return res.status(404).json({ mensaje: 'Informe no encontrado' });
    }

    const equipoIdx = parseInt(equipoIndex);
    if (equipoIdx < 0 || equipoIdx >= informe.equiposLavados.length) {
      return res.status(400).json({ mensaje: 'Equipo no encontrado' });
    }

    const imagenIdx = parseInt(imagenIndex);
    const imagenes = informe.equiposLavados[equipoIdx].imagenes || [];
    
    if (imagenIdx < 0 || imagenIdx >= imagenes.length) {
      return res.status(400).json({ mensaje: 'Imagen no encontrada' });
    }

    // Eliminar la imagen del array
    informe.equiposLavados[equipoIdx].imagenes.splice(imagenIdx, 1);
    await informe.save();

    res.json({ 
      mensaje: 'Imagen eliminada exitosamente',
      imagenes: informe.equiposLavados[equipoIdx].imagenes,
      cantidad: informe.equiposLavados[equipoIdx].imagenes.length
    });

  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: 'No se pudo eliminar la imagen. Intenta nuevamente.'
    });
  }
});

module.exports = router;
