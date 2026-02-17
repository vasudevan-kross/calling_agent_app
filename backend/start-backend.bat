@echo off
echo ========================================
echo   Starting Backend Server
echo ========================================
echo.

REM Check if uv is installed
where uv >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] uv is not installed!
    echo.
    echo Please install uv first:
    echo     pip install uv
    echo.
    echo Then run: uv sync
    echo.
    pause
    exit /b 1
)

echo [1/2] Syncing dependencies with uv...
uv sync

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to sync dependencies!
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Starting FastAPI server...
echo.
echo ========================================
echo   Backend running at:
echo   http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ========================================
echo.

uv run python -m app.main
