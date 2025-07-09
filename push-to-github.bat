@echo off
cd /d "%~dp0"

:: ===== CONFIGURATION =====
:: Set these values once
if not defined GIT_USER (
    set GIT_USER=iffy4ever
    set GIT_EMAIL=sales@high5clothing.co.uk  <- CHANGE THIS
)

:: ===== INITIAL SETUP =====
:: Configure Git identity if missing
git config user.email >nul 2>&1 || git config --global user.email "%GIT_EMAIL%"
git config user.name >nul 2>&1 || git config --global user.name "%GIT_USER%"

:: ===== GIT OPERATIONS =====
:: Check if initial commit needed
git rev-parse --verify HEAD >nul 2>&1
if errorlevel 1 (
    echo Creating initial commit...
    git add .
    git commit -m "Initial commit" --allow-empty
)

:: Main workflow
git pull --rebase origin HEAD
git add .
set /p msg="Enter commit message: "
git commit -m "%msg%"
git push -u origin HEAD

pause