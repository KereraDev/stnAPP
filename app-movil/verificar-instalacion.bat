@echo off
echo ========================================
echo  VERIFICACION DE INSTALACION REACT NATIVE
echo ========================================
echo.

echo [1/6] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js no encontrado
    goto :error
) else (
    echo ✅ Node.js instalado correctamente
)

echo.
echo [2/6] Verificando NPM...
npm --version
if %errorlevel% neq 0 (
    echo ❌ NPM no encontrado
    goto :error
) else (
    echo ✅ NPM instalado correctamente
)

echo.
echo [3/6] Verificando Java...
java -version
if %errorlevel% neq 0 (
    echo ❌ Java JDK no encontrado
    echo Instala JDK 11 desde: https://adoptium.net/
    goto :error
) else (
    echo ✅ Java JDK instalado correctamente
)

echo.
echo [4/6] Verificando variable ANDROID_HOME...
if "%ANDROID_HOME%"=="" (
    echo ❌ Variable ANDROID_HOME no configurada
    echo Configura ANDROID_HOME apuntando a tu Android SDK
    goto :error
) else (
    echo ✅ ANDROID_HOME configurado: %ANDROID_HOME%
)

echo.
echo [5/6] Verificando Android SDK...
if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ✅ Android SDK encontrado
    "%ANDROID_HOME%\platform-tools\adb.exe" version
) else (
    echo ❌ Android SDK no encontrado en %ANDROID_HOME%
    goto :error
)

echo.
echo [6/6] Verificando React Native CLI...
npx react-native --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  React Native CLI no encontrado - instalando...
    npm install -g react-native-cli
    if %errorlevel% neq 0 (
        echo ❌ Error instalando React Native CLI
        goto :error
    )
)
echo ✅ React Native CLI listo

echo.
echo ========================================
echo  ✅ TODAS LAS VERIFICACIONES PASARON
echo ========================================
echo.
echo Tu sistema está listo para React Native!
echo.
echo Próximos pasos:
echo 1. Abre Android Studio y crea un emulador
echo 2. Ejecuta: npm run android
echo.
goto :end

:error
echo.
echo ========================================
echo  ❌ INSTALACION INCOMPLETA
echo ========================================
echo.
echo Por favor instala los componentes faltantes y ejecuta este script nuevamente.
echo.

:end
pause
