# STN Saesa Mobile App

Aplicación móvil para el sistema de gestión de informes de lavado de equipos.

## 📱 Características

- 🔐 Autenticación con credenciales web existentes
- 📊 Dashboard con estadísticas personales
- 📝 Gestión completa de informes de lavado
- 📸 Captura y gestión de imágenes desde cámara/galería
- 🔄 Sincronización con backend existente
- 📱 Diseño responsivo y nativo

## 🚀 Configuración Inicial

### Prerrequisitos

- Node.js >= 16
- React Native CLI instalado globalmente
- Android Studio (para desarrollo Android)
- Xcode (para desarrollo iOS - solo macOS)

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Para Android - instalar pods (si es necesario)
cd android
./gradlew clean
cd ..

# 3. Para iOS - instalar pods
cd ios
pod install
cd ..
```

### Configuración del Backend

1. **Actualizar la URL del API**:
   - Editar `src/utils/config.js`
   - Cambiar las URLs según tu configuración:

```javascript
const config = {
  development: {
    API_BASE_URL: 'http://10.0.2.2:3000', // Android emulator
    API_BASE_URL_IOS: 'http://localhost:3000', // iOS simulator
  },
  production: {
    API_BASE_URL: 'https://tu-servidor-produccion.com',
  },
};
```

2. **Configuración de red para Android**:
   - El archivo `android/app/src/main/res/xml/network_security_config.xml` ya está configurado
   - Permite tráfico HTTP en desarrollo

### Ejecutar la Aplicación

```bash
# Iniciar Metro Bundler
npm start

# Android
npm run android

# iOS (solo en macOS)
npm run ios
```

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── common/          # Componentes comunes
│   ├── forms/           # Componentes de formularios
│   └── ui/              # Componentes de UI
├── screens/             # Pantallas principales
│   ├── auth/            # Autenticación
│   ├── dashboard/       # Dashboard principal
│   ├── informes/        # Gestión de informes
│   └── profile/         # Perfil de usuario
├── services/            # Servicios y APIs
│   ├── api/             # Cliente de API
│   ├── auth/            # Servicios de autenticación
│   └── storage/         # Almacenamiento local
├── navigation/          # Configuración de navegación
├── hooks/               # Custom hooks
├── utils/               # Utilidades y configuración
└── styles/              # Estilos globales
```

## 🔧 Funcionalidades Implementadas

### ✅ Core Features
- [x] Autenticación con backend existente
- [x] Dashboard con estadísticas
- [x] Lista de informes personales
- [x] Creación básica de informes
- [x] Captura de imágenes (cámara/galería)
- [x] Subida de imágenes al servidor
- [x] Gestión de sesiones persistentes
- [x] Navegación por tabs
- [x] Pantallas de perfil de usuario

### 🚧 En Desarrollo
- [ ] Edición completa de informes
- [ ] Modo offline
- [ ] Notificaciones push
- [ ] Exportación de PDFs
- [ ] Búsqueda y filtros avanzados

## 🔌 Integración con Backend

La aplicación está diseñada para trabajar con el backend Node.js/Express existente:

### Endpoints Utilizados:
- `POST /api/auth/login` - Autenticación
- `GET /api/informes` - Listar informes
- `POST /api/informes` - Crear informe
- `POST /api/informes/:id/equipos/:index/imagenes` - Subir imágenes
- `DELETE /api/informes/:id/equipos/:index/imagenes/:imageIndex` - Eliminar imagen

### Modificaciones Necesarias en el Backend:

1. **Endpoint para informes de técnico específico**:
```javascript
// En routes/informes.js - Agregar después de la línea 248
router.get('/mios', verificarToken, async (req, res) => {
  try {
    const userId = req.usuario.id;
    const informes = await Informe.find()
      .sort({ fechaInicio: -1 })
      .lean();
    res.json({ informes });
  } catch (error) {
    res.status(500).json({ 
      mensaje: 'Error al obtener informes', 
      error: error.message 
    });
  }
});
```

2. **Actualizar CORS para permitir requests móviles**:
```javascript
// En index.js - Actualizar corsOptions
const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Permitir apps móviles
    if (allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('CORS: Origen no permitido'));
    }
  },
  credentials: true,
};
```

## 📱 Configuración para Dispositivos

### Android

1. **Permisos** (ya configurados en AndroidManifest.xml):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

2. **Network Security** (ya configurado):
```xml
<application android:networkSecurityConfig="@xml/network_security_config">
```

### iOS

1. **Permisos en Info.plist**:
```xml
<key>NSCameraUsageDescription</key>
<string>Esta aplicación necesita acceso a la cámara para tomar fotos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Esta aplicación necesita acceso a la galería para seleccionar fotos</string>
```

## 🔄 Estados de la Aplicación

### Flujo de Autenticación:
1. **No autenticado** → Pantalla de login
2. **Autenticando** → Pantalla de carga
3. **Autenticado** → Navegación principal (Dashboard, Informes, Perfil)

### Manejo de Sesiones:
- Token guardado en AsyncStorage
- Verificación automática al iniciar app
- Logout automático si el token expira
- Persistencia de datos de usuario

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm start                 # Iniciar Metro bundler
npm run android          # Ejecutar en Android
npm run ios              # Ejecutar en iOS

# Build
npm run build-android    # Build APK para Android
npm run build-ios        # Build para iOS

# Mantenimiento
npm run lint             # Verificar código
npm test                 # Ejecutar tests
```

## 🐛 Debugging

### Problemas Comunes:

1. **Error de conexión a API**:
   - Verificar que el backend esté corriendo
   - Comprobar la URL en `config.js`
   - Para Android emulator usar `10.0.2.2`
   - Para dispositivo físico usar IP de la red

2. **Permisos de cámara**:
   - Verificar permisos en configuración del dispositivo
   - Reinstalar app si es necesario

3. **Metro bundler issues**:
   ```bash
   npx react-native start --reset-cache
   ```

## 📚 Librerías Utilizadas

- **@react-navigation/native**: Navegación
- **@react-native-async-storage/async-storage**: Almacenamiento local
- **react-native-image-picker**: Captura de imágenes
- **react-native-vector-icons**: Iconos
- **axios**: Cliente HTTP

## 🔒 Seguridad

- Tokens JWT almacenados de forma segura
- Validación de sesiones automática
- HTTPS requerido en producción
- Permisos mínimos necesarios

## 📈 Roadmap

### Versión 1.1
- [ ] Modo offline completo
- [ ] Sincronización automática
- [ ] Notificaciones push

### Versión 1.2
- [ ] Exportación de PDFs locales
- [ ] Búsqueda avanzada
- [ ] Filtros por fecha/ubicación

### Versión 2.0
- [ ] Firma digital de informes
- [ ] Geolocalización automática
- [ ] Reportes estadísticos

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a STN Saesa.

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo.
