@echo off
echo.
echo 🏆 NaviQ + Orkes Conductor - Hackathon Demo Launcher
echo ===================================================
echo.

echo 🚀 Starting NaviQ with Enterprise Workflow Orchestration...
echo.

echo 📋 Pre-demo checklist:
echo    ✅ Orkes Cloud credentials configured
echo    ✅ Demo scripts prepared
echo    ✅ Browser tabs ready for judges
echo.

echo 🌐 Important URLs for Demo:
echo    📊 Orkes Dashboard: https://developer.orkescloud.com/
echo    🚀 Backend API: http://localhost:3000
echo    📱 Frontend: http://localhost:5173
echo.

echo 🎯 Demo Options:
echo    1. Full automated demo (recommended for judges)
echo    2. Manual command demo (for technical deep-dive)
echo    3. Setup demo environment only
echo.

set /p choice="Choose option (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🎬 Starting automated judge demo...
    echo 👀 Make sure Orkes Cloud dashboard is open in browser!
    echo.
    cd conductor-integration
    node scripts/live-demo.js
    goto end
)

if "%choice%"=="2" (
    echo.
    echo 🔧 Manual demo mode - showing commands...
    echo.
    cd conductor-integration
    node scripts/demo-setup.js
    echo.
    echo 💡 Now run the commands shown above while judges watch!
    goto end
)

if "%choice%"=="3" (
    echo.
    echo ⚙️ Setting up demo environment...
    echo.
    cd conductor-integration
    node scripts/demo-setup.js
    echo.
    echo ✅ Demo environment ready!
    echo 💡 You can now run manual commands or start the automated demo
    goto end
)

echo ❌ Invalid choice. Please run again and select 1, 2, or 3.

:end
echo.
echo 🎉 Demo session complete!
echo.
echo 🏆 Key talking points for judges:
echo    • Netflix-grade workflow orchestration
echo    • Real-time monitoring and observability  
echo    • Enterprise scalability (1000s of users)
echo    • Perfect sponsor technology integration
echo    • Production-ready architecture
echo.
pause
