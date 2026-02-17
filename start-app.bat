@echo off
echo ========================================
echo   Starting AI Calling Application
echo ========================================
echo.

REM Start Backend in a new window
echo Starting Backend Server...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && start-backend.bat"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend in a new window
echo Starting Frontend Server...
start "Frontend - Next.js" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to close this window...
pause >nul
