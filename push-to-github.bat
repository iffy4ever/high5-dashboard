@echo off
REM Change to your project directory
cd /d "C:\path\to\your\high5-dashboard"

REM Make sure git is available
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git is not installed or not in PATH.
    pause
    exit /b
)

REM Fetch and pull the latest changes from main
echo Updating repository...
git fetch origin
git checkout main
git pull origin main

echo.
echo Update complete!
pause
