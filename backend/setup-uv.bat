@echo off
echo Installing dependencies with uv...

REM Install uv if not already installed
where uv >nul 2>&1
if %errorlevel% neq 0 (
    echo uv not found. Installing uv...
    pip install uv
)

REM Sync dependencies
cd /d "%~dp0"
uv sync

echo.
echo Setup complete! Dependencies installed.
echo.
echo To activate the virtual environment:
echo     .venv\Scripts\activate
echo.
echo To run the app:
echo     uv run python -m app.main
