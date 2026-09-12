@echo off
chcp 65001 >nul
echo ========================================================
echo   ติดตั้งทางลัดโปรแกรม FMS MCU บนเดสก์ท็อป (Windows PC)
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1" %*

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [สำเร็จ] สร้างไอคอนโปรแกรมบน Desktop และเมนู Start เรียบร้อยแล้ว!
    echo คุณสามารถดับเบิลคลิกที่ไอคอน "FMS-MCU" บนหน้าจอเพื่อเริ่มใช้งานได้ทันที
) else (
    echo.
    echo [ผิดพลาด] เกิดข้อผิดพลาดในการสร้างทางลัด
)

echo.
pause
