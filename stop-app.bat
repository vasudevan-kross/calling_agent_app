@echo off
echo ========================================
echo   Stopping AI Calling Application
echo ========================================
echo.

REM Stop all Node processes (Frontend)
echo Stopping Frontend (Next.js)...
taskkill /F /IM node.exe /T >nul 2>&1

REM Stop all Python processes (Backend)
echo Stopping Backend (FastAPI)...
taskkill /F /IM python.exe /T >nul 2>&1

echo.
echo ========================================
echo   All servers stopped!
echo ========================================
echo.
pause
