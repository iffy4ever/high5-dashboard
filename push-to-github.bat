@echo off
echo ============================================
echo    GITHUB UPDATE FOR REACT APP
echo ============================================
echo.

cd /d C:\Users\irfan\dashboard-app

echo Checking status before update...
git status
echo.

echo Adding all changes to staging...
git add .
echo.

echo Committing changes...
git commit -m "Auto update - %date% %time%"
echo.

for /f "delims=" %%i in ('git branch --show-current') do set BRANCH=%%i
echo Detected branch: %BRANCH%
echo.

echo Pushing to GitHub...
git push origin %BRANCH%
echo.

if %errorlevel% equ 0 (
    echo ✅ Push successful!
    echo.
    echo 📋 NEXT STEPS:
    echo 1. Visit: https://github.com/iffy4ever/high5-dashboard
    echo 2. Click 'Compare & pull request'
    echo 3. Create and merge pull request
    echo.
    echo You can also check:
    echo - Commit history: https://github.com/iffy4ever/high5-dashboard/commits/%BRANCH%
    echo - Actions: https://github.com/iffy4ever/high5-dashboard/actions
) else (
    echo ❌ Push failed!
    echo.
    echo Try: git pull origin %BRANCH% first
)

echo.
pause