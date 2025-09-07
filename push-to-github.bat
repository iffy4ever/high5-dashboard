@echo off
cd /d C:\Users\irfan\dashboard-app
git add .
git commit -m "Update: %date% %time%"
git push origin main
echo ✅ Successfully updated GitHub repository!
echo.
echo View your repo: https://github.com/iffy4ever/high5-dashboard
pause