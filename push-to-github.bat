@echo off
title Dashboard-App to GitHub Updater
color 0A

:: Configuration section
set LOCAL_FOLDER="C:\Users\IrfanMaster\dashboard-app"
set GITHUB_REPO="C:\Users\IrfanMaster\high5-dashboard"
set GITHUB_URL=https://github.com/iffy4ever/high5-dashboard.git
set BRANCH=main
set COMMIT_MESSAGE="Automated update from local dashboard-app"

:: Check requirements
where git >nul 2>nul || (
    echo Error: Git is not installed or not in PATH.
    echo Download Git from https://git-scm.com/
    pause
    exit /b
)

:: Main script
echo Starting update process...
echo Local source: %LOCAL_FOLDER%
echo GitHub repo: %GITHUB_REPO%
echo.

:: Initialize if repo doesn't exist
if not exist %GITHUB_REPO% (
    echo Cloning repository for the first time...
    git clone %GITHUB_URL% %GITHUB_REPO%
    if %errorlevel% neq 0 (
        echo Failed to clone repository.
        pause
        exit /b
    )
)

:: Navigate to repo
cd /d %GITHUB_REPO%

:: Update local repo
echo Updating local repository...
git fetch origin
git checkout %BRANCH%
git pull origin %BRANCH%
if %errorlevel% neq 0 (
    echo Failed to update local repository.
    pause
    exit /b
)

:: Copy files (excluding .git directory)
echo Copying files...
robocopy %LOCAL_FOLDER% %GITHUB_REPO% /MIR /XD .git /XF .gitignore /NP /NJH /NJS
if %errorlevel% gtr 1 (
    echo Error during file copy.
    pause
    exit /b
)

:: Git operations
echo Performing Git operations...
git add --all
git diff-index --quiet HEAD || (
    git commit -m %COMMIT_MESSAGE%
    git push origin %BRANCH%
    if %errorlevel% neq 0 (
        echo Failed to push changes.
        pause
        exit /b
    )
    echo Changes pushed successfully!
    goto success
)

echo No changes detected.
:success
echo.
echo Update process completed.
timeout /t 5