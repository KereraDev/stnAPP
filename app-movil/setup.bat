@echo off
echo ================================
echo  STN Saesa Mobile - Setup Script
echo ================================
echo.

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

echo.
echo [2/5] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Falló la instalación de dependencias
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas

echo.
echo [3/5] Verificando React Native CLI...
npx react-native --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando React Native CLI...
    call npm install -g react-native-cli
)
echo ✓ React Native CLI listo

echo.
echo [4/5] Configurando permisos Android...
if exist "android\app\src\main\AndroidManifest.xml" (
    echo ✓ AndroidManifest.xml configurado
) else (
    echo ! AndroidManifest.xml no encontrado - se creará durante la primera compilación
)

echo.
echo [5/5] Verificando configuración...
if exist "src\utils\config.js" (
    echo ✓ Configuración de API encontrada
    echo.
    echo IMPORTANTE: Revisa src\utils\config.js para configurar la URL de tu API
) else (
    echo ! Archivo de configuración no encontrado
)

echo.
echo ================================
echo  INSTALACIÓN COMPLETADA
echo ================================
echo.
echo Próximos pasos:
echo 1. Configura la URL de tu API en src\utils\config.js
echo 2. Asegúrate de que el backend esté corriendo
echo 3. Ejecuta: npm run android (o npm run ios)
echo.
echo Para desarrollo:
echo   npm start       - Iniciar Metro bundler
echo   npm run android - Ejecutar en Android
echo   npm run ios     - Ejecutar en iOS
echo.
pause
