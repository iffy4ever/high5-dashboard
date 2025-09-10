@echo off
echo Quick update to GitHub...
echo.

cd /d "C:\Users\IrfanMaster\dashboard-app"

git add .
git commit -m "Update: %date% %time%"
git push origin main

echo Update completed!
pause