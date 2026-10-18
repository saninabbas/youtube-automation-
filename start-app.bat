@echo off
title AI Video Automation SaaS
cd /d "%~dp0"
set PORT=%1
if "%PORT%"=="" set PORT=3001
echo ===================================================
echo Starting AI Video Automation SaaS Server...
echo ===================================================
echo Server starting at http://localhost:%PORT%
echo.
start http://localhost:%PORT%
npx next dev -p %PORT%
pause
