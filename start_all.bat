@echo off
title DocuForensics AI Launcher
echo ===================================================
echo Launching DocuForensics AI System...
echo ===================================================
start "DocuForensics Backend" "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "DocuForensics Frontend" "%~dp0start_frontend.bat"
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo Both servers started! Opening browser at http://localhost:5173...

