@echo off
chcp 65001 >nul
cd /d "%~dp0"
py -3 generar_catalogo.py
if errorlevel 1 python generar_catalogo.py
pause
