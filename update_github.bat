@echo off
echo Updating GitHub repository...
echo.

REM Navigate to your repository
cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"

REM Pull latest changes first to avoid conflicts
git pull origin main

REM Add all changes
git add .

REM Commit with timestamp
git commit -m "Auto-update: %date% %time%"

REM Push to main branch
git push origin main

echo.
echo Update completed successfully!
echo.
pause