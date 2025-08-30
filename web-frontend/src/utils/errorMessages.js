// Utilidad para convertir errores técnicos en mensajes amigables
export const getErrorMessage = (error) => {
  // Si el error ya es un mensaje amigable, lo devolvemos tal cual
  const friendlyMessages = [
    'No se pudo conectar',
    'Intenta nuevamente',
    'No tienes permisos',
    'Datos incorrectos',
    'Usuario no encontrado',
    'No se pudo guardar',
    'No se pudo eliminar',
    'No se pudo cargar',
    'Sesión expirada',
    'Campo obligatorio'
  ];

  const errorMessage = error?.message || error || '';
  
  // Si ya es un mensaje amigable, lo devolvemos
  if (friendlyMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
    return errorMessage;
  }

  // Convertir errores técnicos a mensajes amigables
  const errorString = errorMessage.toLowerCase();

  // Errores de conexión
  if (errorString.includes('fetch') || errorString.includes('network') || 
      errorString.includes('connection') || errorString.includes('cors') ||
      errorString.includes('timeout')) {
    return 'No se pudo conectar al servidor. Verifica tu conexión e intenta nuevamente.';
  }

  // Errores de autenticación
  if (errorString.includes('token') || errorString.includes('unauthorized') || 
      errorString.includes('401') || errorString.includes('forbidden') || 
      errorString.includes('403')) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  }

  // Errores de validación
  if (errorString.includes('validation') || errorString.includes('invalid') || 
      errorString.includes('required') || errorString.includes('obligatorio')) {
    return 'Por favor, verifica que todos los campos estén completos y correctos.';
  }

  // Errores de servidor
  if (errorString.includes('500') || errorString.includes('server') || 
      errorString.includes('internal')) {
    return 'Ocurrió un problema en el servidor. Intenta nuevamente en unos momentos.';
  }

  // Errores de datos no encontrados
  if (errorString.includes('404') || errorString.includes('not found') || 
      errorString.includes('no encontrado')) {
    return 'La información solicitada no se encontró.';
  }

  // Errores de permisos
  if (errorString.includes('permission') || errorString.includes('permiso') ||
      errorString.includes('access denied')) {
    return 'No tienes permisos para realizar esta acción.';
  }

  // Errores de subida de archivos
  if (errorString.includes('upload') || errorString.includes('file') || 
      errorString.includes('imagen')) {
    return 'No se pudieron subir las imágenes. Intenta nuevamente.';
  }

  // Error genérico para cualquier otro caso
  return 'Algo salió mal. Por favor, intenta nuevamente.';
};

// Mensajes específicos para diferentes contextos
export const ERROR_MESSAGES = {
  // Autenticación
  LOGIN_FAILED: 'Usuario o contraseña incorrectos.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  NO_PERMISSIONS: 'No tienes permisos para acceder a esta sección.',
  
  // Conexión
  CONNECTION_ERROR: 'No se pudo conectar al servidor. Verifica tu conexión e intenta nuevamente.',
  SERVER_ERROR: 'Ocurrió un problema en el servidor. Intenta nuevamente en unos momentos.',
  
  // Datos
  DATA_NOT_FOUND: 'La información solicitada no se encontró.',
  SAVE_ERROR: 'No se pudieron guardar los cambios. Intenta nuevamente.',
  DELETE_ERROR: 'No se pudo eliminar el elemento. Intenta nuevamente.',
  LOAD_ERROR: 'No se pudo cargar la información. Intenta nuevamente.',
  
  // Validación
  VALIDATION_ERROR: 'Por favor, verifica que todos los campos estén completos y correctos.',
  REQUIRED_FIELD: 'Este campo es obligatorio.',
  
  // Archivos
  UPLOAD_ERROR: 'No se pudieron subir las imágenes. Intenta nuevamente.',
  FILE_TOO_LARGE: 'El archivo es muy grande. Selecciona una imagen más pequeña.',
  INVALID_FILE_TYPE: 'Formato de archivo no válido. Solo se permiten imágenes.',
  
  // General
  GENERIC_ERROR: 'Algo salió mal. Por favor, intenta nuevamente.'
};
