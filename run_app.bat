@echo off
TITLE Weather Data Analytics System - Big Data Platform
COLOR 0B
echo ===============================================================================
echo                WEATHER DATA ANALYTICS SYSTEM - BIG DATA PLATFORM
echo ===============================================================================
echo.
echo [*] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python is not installed or not added to PATH.
    echo     Please install Python 3.10+ from python.org and ensure "Add to PATH" is checked.
    pause
    exit /b
)

echo [*] Starting Flask Big Data Server...
echo [*] URL: http://127.0.0.1:5000/
echo.
python app.py
pause
