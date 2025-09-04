@echo off
echo Updating React App on GitHub...
cd /d C:\Users\irfan\dashboard-app

git add .
git commit -m "Auto update - %date% %time%"

for /f "delims=" %%i in ('git branch --show-current') do set BRANCH=%%i
git push origin %BRANCH%

if %errorlevel% equ 0 (
    echo.
    echo Update successful!
    echo.
    echo NEXT STEPS:
    echo 1. Go to your GitHub repository:
    echo    https://github.com/iffy4ever/high5-dashboard
    echo 2. Click 'Compare & pull request' button
    echo 3. Review changes and create pull request
    echo 4. Merge the pull request to complete update
) else (
    echo Error during push!
)

pause