@echo off
title Campus Lost and Found Server
color 0B
echo =========================================================
echo   Starting Campus Lost and Found Backend Server...
echo =========================================================
cd /d "%~dp0"
"C:\Users\Lenovo\AppData\Local\Programs\Python\Python314\python.exe" server.py
pause
