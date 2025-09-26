@echo off
echo.
echo ========================================
echo   🍤 CEVICHERIA - INICIO DE RED
echo ========================================
echo.
echo Tu IP local es: 10.135.72.183
echo.
echo Frontend estará disponible en:
echo   - Local:  http://localhost:5173
echo   - Red:    http://10.135.72.183:5173
echo.
echo Backend estará disponible en:
echo   - Local:  http://localhost:5000
echo   - Red:    http://10.135.72.183:5000
echo.
echo ========================================
echo.

REM Abrir dos terminales: una para backend, otra para frontend
start "🐍 Backend Flask" cmd /k "python app.py"
timeout /t 3 /nobreak >nul
start "⚛️ Frontend React" cmd /k "cd ceviche-frontend && npm run dev"

echo ✅ Servidores iniciándose...
echo.
echo Para conectar desde otros dispositivos:
echo 1. Asegúrate de estar en la misma red WiFi
echo 2. Ve a http://10.135.72.183:5173 en cualquier dispositivo
echo.
echo 📱 Desde tu celular:
echo   - Conéctate a la misma WiFi
echo   - Abre el navegador
echo   - Ve a: http://10.135.72.183:5173
echo.
pause