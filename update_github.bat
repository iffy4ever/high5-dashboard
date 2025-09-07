@echo off
echo GitHub Update Script
echo.

REM Change this to your actual repository path
cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"

echo Step 1: Checking git...
git --version
if errorlevel 1 goto error

echo.
echo Step 2: Checking repository...
git status
if errorlevel 1 goto not_git_repo

echo.
echo Step 3: Adding files...
git add .

echo.
echo Step 4: Committing...
git commit -m "Update: %date% %time%"

echo.
echo Step 5: Pushing...
git push

echo.
echo SUCCESS: All operations completed!
pause
exit /b 0

:not_git_repo
echo ERROR: Not a git repository
echo Make sure you've cloned the repository properly
pause
exit /b 1

:error
echo ERROR: Git not found or other error occurred
pause
exit /b 1