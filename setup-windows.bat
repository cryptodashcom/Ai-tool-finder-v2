@echo off
title AgentsDash Automation — Setup
color 0B

echo.
echo  =========================================================
echo   AgentsDash.ai Automation System — Windows Setup
echo  =========================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo.
    echo  Please download and install Node.js 18+ from:
    echo    https://nodejs.org/en/download
    echo.
    echo  After installing, re-run this setup script.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER% detected

:: Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm not found. Reinstall Node.js from nodejs.org
    pause
    exit /b 1
)
echo  [OK] npm detected

echo.
echo  Installing dependencies...
echo  (This may take 1-2 minutes on first run)
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] npm install failed. Check your internet connection.
    pause
    exit /b 1
)
echo.
echo  [OK] Dependencies installed

:: Create .env.local from example if it doesn't exist
if not exist .env.local (
    echo.
    echo  Creating .env.local from template...
    copy .env.example .env.local >nul
    echo  [OK] .env.local created
    echo.
    echo  =========================================================
    echo   IMPORTANT: Edit .env.local and fill in your API keys!
    echo  =========================================================
    echo.
    echo  Open .env.local in Notepad or VS Code and add:
    echo    - ANTHROPIC_API_KEY
    echo    - PRODUCTHUNT_API_KEY
    echo    - GITHUB_TOKEN
    echo    - REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
    echo    - HUGGINGFACE_API_KEY
    echo    - AGENTSDASH_API_URL + AGENTSDASH_API_KEY
    echo.
    echo  Then run: run-windows.bat
    echo.
    start notepad .env.local
) else (
    echo  [OK] .env.local already exists — skipping creation
    echo.
    echo  Setup complete! Run: run-windows.bat
)

echo.
pause
