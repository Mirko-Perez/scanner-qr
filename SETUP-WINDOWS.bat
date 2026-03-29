@echo off
title Configuracion inicial - Sistema QR
color 5F

echo.
echo  ==========================================
echo   CONFIGURACION INICIAL - SISTEMA QR
echo   Esto solo se ejecuta UNA VEZ.
echo  ==========================================
echo.

:: Verificar que Node.js este instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js no esta instalado.
    echo.
    echo  Descargalo desde: https://nodejs.org
    echo  Elegir version: 20 LTS
    echo  Instalar y volver a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

echo  Node.js encontrado:
node --version
echo.

:: Instalar dependencias
echo  [1/4] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo  ERROR en npm install
    pause
    exit /b 1
)
echo.

:: Generar cliente Prisma
echo  [2/4] Generando cliente de base de datos...
call npx prisma generate
if %errorlevel% neq 0 (
    echo  ERROR en prisma generate
    pause
    exit /b 1
)
echo.

:: Aplicar migraciones a la base de datos
echo  [3/4] Inicializando base de datos...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo  Intentando con migrate dev...
    call npx prisma migrate dev --name init
)
echo.

:: Build de Next.js
echo  [4/4] Compilando la aplicacion (puede tardar 1-2 minutos)...
call npm run build
if %errorlevel% neq 0 (
    echo  ERROR en el build de Next.js
    pause
    exit /b 1
)
echo.

:: Copiar archivos estaticos al lugar correcto (requerido por Next.js standalone)
echo  [5/6] Copiando archivos de estilos y recursos...
xcopy /E /I /Y .next\static .next\standalone\.next\static >nul
xcopy /E /I /Y public .next\standalone\public >nul
if not exist .next\standalone\public\videos\ mkdir .next\standalone\public\videos\
echo  OK.
echo.

:: Instalar proxy HTTPS para que la camara funcione en celulares
echo  [6/6] Instalando proxy HTTPS (camara en celular)...
call npm install -g local-ssl-proxy >nul 2>&1
echo  OK.
echo.

echo  ==========================================
echo   Configuracion completada correctamente.
echo   Ahora usa INICIAR.bat para arrancar.
echo  ==========================================
echo.
pause
