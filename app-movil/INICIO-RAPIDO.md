# 🚀 STN Saesa Mobile - Inicio Rápido

## ⚡ Configuración Inmediata

### 1. Backend (Obligatorio)
```bash
# Ir al backend y asegurarse que esté corriendo
cd ../api-backend
npm run dev
```

### 2. Aplicación Móvil
```bash
# Instalar dependencias
npm install

# Iniciar Metro Bundler
npm start

# En otra terminal - Ejecutar en Android
npm run android
```

### 3. Configuración de Red

**Para emulador Android:** La configuración ya está lista (10.0.2.2:3000)

**Para dispositivo físico:**
1. Conectar el dispositivo a la misma red WiFi que tu PC
2. Obtener la IP de tu PC (cmd: `ipconfig`)
3. Editar `src/utils/config.js`:
```javascript
API_BASE_URL: 'http://TU_IP_LOCAL:3000', // Ej: http://192.168.1.100:3000
```

## 🔑 Credenciales de Prueba

Usar las mismas credenciales que en la aplicación web.

## 📱 Funcionalidades Disponibles

✅ Login con credenciales existentes
✅ Dashboard con estadísticas
✅ Lista de informes
✅ Crear nuevos informes
✅ Capturar imágenes (cámara/galería)
✅ Subir imágenes a informes
✅ Perfil de usuario
✅ Logout seguro

## 🛠️ Solución de Problemas

### Error de conexión:
1. Verificar que el backend esté corriendo en puerto 3000
2. Comprobar la IP en config.js
3. Para Android emulator siempre usar `10.0.2.2:3000`

### Problemas de permisos:
1. Aceptar permisos de cámara en el dispositivo
2. Verificar permisos en Configuración > Apps > STNSaesa

### Metro Bundler issues:
```bash
npx react-native start --reset-cache
```

## 📞 Ayuda Rápida

**¿App no conecta?** → Revisar config.js y que backend esté corriendo
**¿Cámara no funciona?** → Verificar permisos del dispositivo
**¿Build falla?** → Ejecutar `npm install` y `npx react-native start --reset-cache`

¡La aplicación está lista para usar! 🎉
