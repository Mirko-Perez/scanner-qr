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
echo  Iniciando el servidor...
echo.

set PORT=3000
set DATABASE_URL=file:./dev.db
set NODE_ENV=production

timeout /t 2 /nobreak >nul

start "" http://localhost:3000

node.exe .next/standalone/server.js
