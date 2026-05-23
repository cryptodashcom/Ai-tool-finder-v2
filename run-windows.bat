@echo off
title AgentsDash Automation — Running
color 0A

:: Check .env.local exists
if not exist .env.local (
    echo  [ERROR] .env.local not found.
    echo  Run setup-windows.bat first.
    pause
    exit /b 1
)

echo.
echo  =========================================================
echo   AgentsDash.ai Automation System
echo   Starting development server...
echo  =========================================================
echo.
echo  Dashboard: http://localhost:3000/dashboard
echo.
echo  Press Ctrl+C to stop the server.
echo.

call npm run dev
