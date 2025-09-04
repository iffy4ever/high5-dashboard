@echo off
echo Updating React App on GitHub...
cd /d C:\Users\irfan\dashboard-app

git add .
git commit -m "Auto update - %date% %time%"

for /f "delims=" %%i in ('git branch --show-current') do set BRANCH=%%i
git push origin %BRANCH%

echo Update complete!
pause