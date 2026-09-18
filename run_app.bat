@echo off
title Campus Lost and Found Launcher
color 0A
echo =========================================================
echo   CAMPUS FINDIT - 1-CLICK SERVER AND WEBSITE LAUNCHER
echo =========================================================
echo.

:: 1. Navigate to project folder
cd /d "%~dp0"

:: 2. Stop any old background process occupying Port 8080 or 5000
echo [1/3] Clearing port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: 3. Start Python REST Server on Port 8080
echo [2/3] Starting SQLite REST API Server on Port 8080...
start "CampusFindIt Backend Server" "C:\Users\Lenovo\AppData\Local\Programs\Python\Python314\python.exe" server.py

:: 4. Brief delay for server socket binding
ping -n 3 127.0.0.1 >nul

:: 5. Open Web App in Chrome / Default Browser at Port 8080
echo [3/3] Opening http://127.0.0.1:8080 in your browser...
start http://127.0.0.1:8080?v=3.0

echo.
echo =========================================================
echo   SUCCESS! Server is running at http://127.0.0.1:8080
echo   Keep the server window open while using the website.
echo =========================================================
