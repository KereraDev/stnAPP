const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

// Configurar almacenamiento en memoria
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB máximo por archivo (antes de procesar)
    files: 20, // Límite generoso, pero controlamos por tamaño total
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
    }
  },
});

// Función para procesar imagen y convertir a Base64
const procesarImagenBase64 = async (buffer, originalName) => {
  try {
    // 1. Redimensionar y comprimir la imagen
    const imagenOptimizada = await sharp(buffer)
      .resize(1000, 750, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 70 }) // Calidad balanceada
      .toBuffer();
    
    // 2. Verificar tamaño después de compresión (2MB máximo)
    const tamaño = imagenOptimizada.length;
    if (tamaño > 2 * 1024 * 1024) { // 2MB
      throw new Error(`La imagen ${originalName} es muy grande después del procesamiento.`);
    }
    
    // 3. Convertir a Base64
    const base64 = imagenOptimizada.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;
    
    // 4. Verificar tamaño final del string Base64 (~1.33x el tamaño original)
    const tamañoBase64 = Buffer.byteLength(dataUri, 'utf8');
    if (tamañoBase64 > 2.7 * 1024 * 1024) { // ~2.7MB para dar margen
      throw new Error(`La imagen ${originalName} es muy grande después de la conversión.`);
    }
    
    return {
      dataUri,
      tamaño: tamañoBase64,
      nombre: originalName
    };
    
  } catch (error) {
    throw new Error(`No se pudo procesar la imagen ${originalName}.`);
  }
};

// Función para validar límite total del documento
const validarLimiteTotal = (imagenes) => {
  const tamañoTotal = imagenes.reduce((total, img) => total + img.tamaño, 0);
  const limiteTotal = 10 * 1024 * 1024; // 10MB límite total por informe
  
  if (tamañoTotal > limiteTotal) {
    throw new Error(`El tamaño total de imágenes es muy grande. Elimina algunas imágenes.`);
  }
  
  return true;
};

module.exports = { upload, procesarImagenBase64, validarLimiteTotal };
