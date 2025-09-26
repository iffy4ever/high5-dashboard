@echo off
echo Quick update to GitHub...
echo.

cd /d "C:\Users\irfan\dashboard-app"

git pull origin main --rebase
git add .
git commit -m "Update: %date% %time%"
git push origin main

echo Update completed!
pause