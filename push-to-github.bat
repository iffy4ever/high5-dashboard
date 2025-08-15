@echo off
REM =====================================
REM  Git Auto Commit & Push Full Project
REM =====================================

REM Change to the folder where this script lives (your repo root)
cd /d "%~dp0"

REM Make sure we are on main branch (change if your repo uses 'master' or another branch)
git checkout main

REM Get the latest updates from GitHub first
git pull origin main

REM Stage ALL changes (new, modified, deleted)
git add --all

REM Optional: ask user for a custom commit message
set /p COMMIT_MSG=Enter commit message (or leave blank for auto): 
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Auto update - %date% %time%
)

REM Create commit
git commit -m "%COMMIT_MSG%"

REM Push changes to GitHub
git push origin main

REM Keep window open so you can see any errors
pause
