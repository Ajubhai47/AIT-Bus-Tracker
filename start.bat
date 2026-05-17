@echo off
color 0A
title AIT Bus Tracking System

echo ==========================================
echo     AIT Bus Tracking System v1.0
echo ==========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Then restart this script.
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found: 
node --version

echo.
echo [2/4] Installing dependencies...
npm install --silent

if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Failed to install dependencies
    echo Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo ✓ Dependencies installed successfully

echo.
echo [3/4] Checking system health...
node check-setup.cjs

echo.
echo [4/4] Starting server...
echo ==========================================
echo   🚌 AIT Bus Tracking System Starting
echo ==========================================
echo.
echo 🌐 Server URL: http://localhost:5000
echo 📱 Open this URL in your browser
echo ⏹️  Press Ctrl+C to stop the server
echo.
echo ⚡ Starting in 3 seconds...
timeout /t 3 /nobreak >nul

color 0B
npm run dev

color 0E
echo.
echo ==========================================
echo Server stopped. Thanks for using AIT Bus Tracking!
echo ==========================================
pause