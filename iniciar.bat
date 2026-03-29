@echo off
title Sistema QR - Fiesta
color 5F

echo.
echo  ==========================================
echo   SISTEMA QR PARA FIESTA
echo   No cierres esta ventana mientras dure
echo   la fiesta.
echo  ==========================================
echo.

:: Ruta absoluta de esta carpeta (donde esta el bat)
set ROOT=%~dp0
:: Quitar backslash final
if "%ROOT:~-1%"=="\" set ROOT=%ROOT:~0,-1%

set PORT=3000
set DATABASE_URL=file:%ROOT%\dev.db
set NODE_ENV=production
set HOSTNAME=0.0.0.0

:: Copiar archivos estaticos al standalone (solo los del proyecto, no videos)
xcopy /E /I /Y "%ROOT%\.next\static" "%ROOT%\.next\standalone\.next\static" >nul 2>&1
xcopy /I /Y "%ROOT%\public\*.svg" "%ROOT%\.next\standalone\public\" >nul 2>&1

:: Asegurar que la carpeta de videos existe dentro del standalone
if not exist "%ROOT%\.next\standalone\public\videos\" mkdir "%ROOT%\.next\standalone\public\videos\"

:: Obtener IP local real
for /f "usebackq tokens=*" %%i in (`powershell -nologo -command "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1).IPv4Address.IPAddress"`) do set LOCAL_IP=%%i
if "%LOCAL_IP%"=="" set LOCAL_IP=TU-IP-AQUI

echo  Iniciando servidor...
timeout /t 2 /nobreak >nul

echo.
echo  ==========================================
echo   SISTEMA LISTO
echo.
echo   Admin (esta PC):
echo   http://%LOCAL_IP%:3000
echo.
echo   Proyector:
echo   http://%LOCAL_IP%:3000/display
echo.
echo   Scanner (celular en misma red):
echo   Apuntar camara del celular al QR de la pulsera
echo  ==========================================
echo.

start "" "http://%LOCAL_IP%:3000"

:: Correr el servidor DESDE la carpeta standalone
:: asi process.cwd() = .next/standalone y los videos se guardan donde el servidor los sirve
cd /d "%ROOT%\.next\standalone"
node server.js

echo.
echo  El servidor se detuvo.
cd /d "%ROOT%"
pause
