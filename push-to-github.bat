@echo off
REM ==============================
REM Git Auto Commit & Push Script
REM ==============================

REM Change to your repo folder (adjust the path below)
cd /d "%~dp0"

REM Ensure you're on the correct branch (replace 'main' if needed)
git checkout main

REM Pull latest changes in case others pushed since last run
git pull origin main

REM Stage all changes
git add .

REM Commit with timestamp (or change to prompt for a message)
git commit -m "Auto update - %date% %time%"

REM Push to GitHub
git push origin main

pause
