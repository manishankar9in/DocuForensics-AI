@echo off
title DocuForensics AI - Backend Server
cd /d "%~dp0backend"
echo ===================================================
echo Starting DocuForensics AI Backend on port 8000...
echo ===================================================
call .\venv\Scripts\activate.bat
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause

