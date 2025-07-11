@echo off
cd /d "%~dp0"
echo --------------------------------------------------
echo Starting Git Push for dashboard-app
echo --------------------------------------------------
git pull --rebase origin main
git add .
set /p msg="Enter commit message: "
git commit -m "%msg%"
git push
pause
