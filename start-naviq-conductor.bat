@echo off
echo 🚀 Starting NaviQ with Orkes Conductor Integration
echo ================================================

echo.
echo 📋 Checking prerequisites...

:: Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)
echo ✅ Docker is available

:: Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js and try again
    pause
    exit /b 1
)
echo ✅ Node.js is available

echo.
echo 🐳 Starting Conductor services...
cd conductor-integration
start "Conductor Services" cmd /k "docker-compose up && echo Conductor services started && pause"

echo.
echo ⏳ Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo 🔧 Initializing Conductor integration...
call npm run setup 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Setup encountered issues, but continuing...
)

echo.
echo 🚀 Starting NaviQ Backend...
cd ..\Backend
start "NaviQ Backend" cmd /k "npm start"

echo.
echo 🎉 NaviQ with Conductor Integration is starting!
echo.
echo 📍 Available URLs:
echo    ├─ Backend API: http://localhost:3000
echo    ├─ Conductor API: http://localhost:8080
echo    ├─ Conductor UI: http://localhost:5000
echo    └─ Frontend: (start separately)
echo.
echo 🔧 Conductor API Endpoints:
echo    ├─ POST /api/conductor/navigation/sync
echo    ├─ POST /api/conductor/building/create
echo    ├─ GET  /api/conductor/health
echo    └─ GET  /api/conductor/workflow/:id/status
echo.
echo 💡 Next Steps:
echo    1. Wait for all services to be ready
echo    2. Start your frontend applications
echo    3. Test navigation with Conductor workflows
echo    4. Visit Conductor UI for workflow monitoring
echo.

pause
