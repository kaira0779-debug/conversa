@echo off
title Conversa ✦ Chat IA
cd /d "%~dp0"

echo.
echo   ╔══════════════════════════════════════╗
echo   ║       CONVERSA ✦ Chat IA             ║
echo   ║   Historias que siempre estan        ║
echo   ║         contigo                      ║
echo   ╚══════════════════════════════════════╝
echo.
echo   Iniciando servidor...
echo.

REM Abre el navegador tras 3 segundos (dando tiempo al servidor)
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

REM Arranca el servidor
call npm run dev

pause