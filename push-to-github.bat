@echo off
cd /d "%~dp0"

:: Ensure HTTPS URL
git remote set-url origin https://github.com/iffy4ever/high5-dashboard.git

:: Standard workflow
git add .
git commit -m "Update: %date% %time%"
git push origin master

pause