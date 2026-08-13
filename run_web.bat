@echo off
echo ========================================================
echo   TIEN DICH - KHOI DONG SERVER
echo ========================================================
echo.
echo Dang kiem tra Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python. Vui long cai dat Python 3.8+
    echo Tai Python tai: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo Dang khoi dong server tai http://localhost:8000 ...
python server.py
pause
