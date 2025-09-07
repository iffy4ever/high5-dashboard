@echo off
echo GitHub Update Script with Branch Detection
echo.

cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"

echo Step 1: Checking git...
git --version
if errorlevel 1 goto error

echo.
echo Step 2: Getting current branch...
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i

if "%CURRENT_BRANCH%"=="" (
    echo ERROR: Could not determine current branch
    pause
    exit /b 1
)

echo Current branch: %CURRENT_BRANCH%

echo.
echo Step 3: Adding files...
git add .

echo.
echo Step 4: Committing...
git commit -m "Auto-update: %date% %time%"

echo.
echo Step 5: Pushing to %CURRENT_BRANCH% branch...
git push origin %CURRENT_BRANCH%

echo.
echo SUCCESS: Pushed to %CURRENT_BRANCH% branch!
pause
exit /b 0

:error
echo ERROR: Git not found
pause
exit /b 1