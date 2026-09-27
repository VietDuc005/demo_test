@echo off
setlocal
title AutoAdvisor AI - Showroom MVP
cd /d "%~dp0"
if not exist "node_modules" call npm install
call npm run build
if errorlevel 1 exit /b 1
start "" http://localhost:8080
call npm start
endlocal
