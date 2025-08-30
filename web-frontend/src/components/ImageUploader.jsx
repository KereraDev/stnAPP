import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { getErrorMessage, ERROR_MESSAGES } from '../utils/errorMessages';
import '../styles/ImageUploader.css';

const BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/$/, '');

function ImageUploader({ 
  imagenes, 
  onChange, 
  informeId = null, 
  equipoIndex = null, 
  isEquipoMode = false,
  maxImages = 20 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);
  const [tamañoActual, setTamañoActual] = useState(0);
  const fileInputRef = useRef(null);

  // Límites del sistema MongoDB
  const LIMITES = {
    maxTamañoArchivo: 8 * 1024 * 1024, // 8MB por archivo
    maxTamañoTotal: 10 * 1024 * 1024, // 10MB total
    tiposPermitidos: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  };

  // Calcular tamaño estimado de las imágenes Base64 actuales
  const calcularTamañoActual = () => {
    const tamaño = imagenes.reduce((total, imagen) => {
      // Estimar tamaño de Base64 (aproximadamente 75% del string por el encoding)
      return total + (imagen.length * 0.75);
    }, 0);
    setTamañoActual(tamaño);
    return tamaño;
  };

  // Recalcular cuando cambien las imágenes
  useEffect(() => {
    calcularTamañoActual();
  }, [imagenes]);

  const validarArchivos = (files) => {
    const errores = [];
    const tamañoActualCalculado = calcularTamañoActual();
    
    // Validar cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar tipo
      if (!LIMITES.tiposPermitidos.includes(file.type)) {
        errores.push(`${file.name}: Formato no soportado. Solo se permiten imágenes.`);
      }
      
      // Validar tamaño individual (mensaje simple)
      if (file.size > LIMITES.maxTamañoArchivo) {
        errores.push(`${file.name}: Archivo muy grande. Elige una imagen más pequeña.`);
      }
    }

    // Validar espacio disponible (mensaje simple)
    const tamañoNuevosEstimado = Array.from(files).reduce((total, file) => total + (file.size * 0.4), 0);
    const tamañoTotalEstimado = tamañoActualCalculado + tamañoNuevosEstimado;
    
    if (tamañoTotalEstimado > LIMITES.maxTamañoTotal) {
      errores.push(`No hay espacio suficiente. Elimina algunas imágenes primero.`);
    }

    return errores;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      subirImagenes(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      subirImagenes(files);
    }
    
    // Limpiar input
    e.target.value = '';
  };

  const subirImagenes = async (files) => {
    setError('');
    setEstadisticas(null);
    
    // Validar archivos
    const errores = validarArchivos(files);
    if (errores.length > 0) {
      setError(errores.join('\n'));
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('imagenes', file);
      });

      const token = localStorage.getItem('token');
      
      // Siempre usar endpoint general para procesar imágenes a Base64
      // Solo guardar en BD si estamos en modo equipo con informe existente
      const endpoint = `${BASE_URL}/api/imagenes`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.mensaje || 'upload_error');
      }

      // En todos los casos, agregamos las imágenes al estado local
      // El guardado en BD específica del equipo se hace cuando se guarda el informe completo
      const nuevasImagenes = [...imagenes, ...data.imagenes];
      onChange(nuevasImagenes);
      
      setEstadisticas(data.estadisticas);

    } catch (error) {
      console.error('Error:', error);
      setError(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const removerImagen = (index) => {
    // Solo manejar estado local - el guardado en BD se hace al guardar el informe
    const nuevasImagenes = imagenes.filter((_, i) => i !== index);
    onChange(nuevasImagenes);
    setEstadisticas(null);
    setError('');
  };

  const abrirSelector = () => {
    // Verificar si hay espacio disponible
    const tamañoActualCalculado = calcularTamañoActual();
    const espacioRestante = LIMITES.maxTamañoTotal - tamañoActualCalculado;
    
    if (!uploading && espacioRestante > (1 * 1024 * 1024)) { // Al menos 1MB de espacio
      fileInputRef.current?.click();
    }
  };

  // Calcular espacio disponible para mostrar en UI
  const calcularEspacioRestante = () => {
    const espacio = LIMITES.maxTamañoTotal - tamañoActual;
    return Math.max(0, espacio);
  };

  const espacioRestante = calcularEspacioRestante();
  const espacioRestanteMB = (espacioRestante / 1024 / 1024).toFixed(2);
  const tamañoActualMB = (tamañoActual / 1024 / 1024).toFixed(2);
  const sinEspacio = espacioRestante < (1 * 1024 * 1024); // Menos de 1MB

  const titulo = isEquipoMode ? 'Imágenes del Equipo' : 'Imágenes del Informe';

  return (
    <div className="image-uploader">
      {/* Información básica */}
      <div className="uploader-header">
        <h4>{titulo}</h4>
        <div className="limites-info">
          <small>
            Formatos soportados: JPEG, PNG, GIF, WebP
          </small>
        </div>
      </div>

      {/* Zona de drag & drop */}
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''} ${sinEspacio ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={abrirSelector}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading || sinEspacio}
        />
        
        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Subiendo imágenes...</p>
          </div>
        ) : sinEspacio ? (
          <div className="upload-status disabled">
            <AlertCircle size={48} />
            <p>Sin espacio suficiente</p>
            <small>Elimina algunas imágenes para agregar nuevas</small>
          </div>
        ) : (
          <div className="drop-content">
            <Upload size={48} />
            <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
            <small>Puedes seleccionar múltiples archivos</small>
          </div>
        )}
      </div>

      {/* Mostrar errores de forma simple */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <div>
            <strong>No se pudieron subir las imágenes:</strong>
            <pre>{error}</pre>
          </div>
        </div>
      )}

      {/* Mensaje de éxito simple */}
      {estadisticas && (
        <div className="upload-stats success">
          <CheckCircle size={20} />
          <div>
            <strong>¡Imágenes subidas correctamente!</strong>
          </div>
        </div>
      )}

      {/* Vista previa de imágenes mejorada */}
      {imagenes.length > 0 && (
        <div className="images-section">
          <h5>Vista previa ({imagenes.length})</h5>
          <div className="images-grid">
            {imagenes.map((url, index) => (
              <div key={index} className="image-item">
                <img 
                  src={url} 
                  alt={`Imagen ${index + 1}`}
                  onClick={() => {
                    // Abrir imagen en modal o nueva ventana para ver mejor
                    const newWindow = window.open();
                    newWindow.document.write(`
                      <html>
                        <head><title>Imagen ${index + 1}</title></head>
                        <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                          <img src="${url}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
                        </body>
                      </html>
                    `);
                  }}
                  style={{ cursor: 'pointer' }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNNDAgNDBINjBWNjBINDBWNDBaIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+';
                  }}
                />
                <button 
                  type="button"
                  className="remove-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removerImagen(index);
                  }}
                  title="Eliminar imagen"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información mínima */}
      <div className="upload-info">
        <ImageIcon size={16} />
        <span>{imagenes.length} imagen{imagenes.length !== 1 ? 'es' : ''}</span>
      </div>
    </div>
  );
}

export default ImageUploader;
