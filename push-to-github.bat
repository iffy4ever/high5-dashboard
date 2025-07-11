@echo off
:: Batch file to push updates to GitHub
:: Save this as 'push-to-github.bat' in your project folder

echo Starting Git operations...

:: Navigate to your project directory (if running from elsewhere)
cd /d "%~dp0"

:: Git commands
git add .
git commit -m "Auto-update: %date% %time%"
git push origin main

echo.
echo Git push completed!
echo Repository: https://github.com/iffy4ever/high5-dashboard
pause