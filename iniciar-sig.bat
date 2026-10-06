@echo off
title SIG Naturisa
cd /d "%~dp0"

rem Si la aplicacion ya esta en ejecucion, solo abre el navegador
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  start "" http://localhost:5173
  exit /b
)

if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
)

rem Abre el navegador cuando los servidores hayan arrancado
start "" /min cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:5173"

echo Iniciando SIG... (cierra esta ventana para detener la aplicacion)
call npm run dev
