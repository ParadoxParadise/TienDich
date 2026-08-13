@echo off
echo ========================================================
echo   KHOI DONG TRANG WEB DICH TRUYEN (BYPASS CORS)
echo ========================================================
echo.
echo Dang khoi tao may chu cuc bo tai cong 8000...
start http://localhost:8000
python -m http.server 8000
pause
