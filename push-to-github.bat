@echo off
chcp 65001 >nul
echo.
echo ====================================
echo    GitHub Update for Main Branch
echo ====================================
echo.

:: Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    pause
    exit /b 1
)

:: Check if we're in a git repository
git status >nul 2>&1
if errorlevel 1 (
    echo Error: Not a git repository
    echo Please run this script from within your git repository
    pause
    exit /b 1
)

:: Check if we're on main branch
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "CURRENT_BRANCH=%%i"

if not "%CURRENT_BRANCH%"=="main" (
    echo Error: You are not on the main branch
    echo Current branch: %CURRENT_BRANCH%
    echo.
    echo Please switch to main branch first:
    echo   git checkout main
    pause
    exit /b 1
)

echo You are on the main branch
echo.

:: Add all changes
echo Adding changes to git...
git add --all

:: Commit changes
set /p "COMMIT_MSG=Enter commit message: "
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Update via batch script"

echo Committing changes...
git commit -m "%COMMIT_MSG%"

:: Push changes
echo Pushing to GitHub main branch...
git push origin main

if errorlevel 1 (
    echo.
    echo Push failed - remote has changes you don't have locally
    echo.
    echo Pulling changes from GitHub first...
    git pull origin main
    
    echo.
    echo Now pushing your changes...
    git push origin main
)

echo.
echo Update completed successfully!
echo Your main branch is now up to date on GitHub.
echo.
pause