@echo off
echo ============================================
echo    GITHUB UPDATE FOR REACT APP (MAIN BRANCH)
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

echo Pushing to MAIN branch on GitHub...
git push origin main
echo.

if %errorlevel% equ 0 (
    echo ✅ Push to MAIN branch successful!
    echo.
    echo 📋 Your React app is now updated on GitHub!
    echo.
    echo You can view your repository at:
    echo https://github.com/iffy4ever/high5-dashboard
    echo.
    echo To view your live site (if deployed):
    echo https://iffy4ever.github.io/high5-dashboard/
) else (
    echo ❌ Push failed!
    echo.
    echo Possible solutions:
    echo 1. Run: git pull origin main (to sync first)
    echo 2. Check internet connection
    echo 3. Verify GitHub credentials
)

echo.
pause