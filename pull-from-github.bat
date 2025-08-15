@echo off
REM ================================
REM Pull latest changes from GitHub
REM ================================

cd /d "%~dp0"      REM go to repo folder (where this .bat is saved)

git checkout main   REM make sure we are on main branch
git pull origin main

pause
