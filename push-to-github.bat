@echo off
cd /d "%~dp0"

:: 1. Force-update remote URL (HTTPS)
git remote set-url origin https://github.com/iffy4ever/high5-dashboard.git

:: 2. Add ALL changes (including deleted files)
git add --all

:: 3. Create commit with timestamp
set timestamp=%date%-%time%
git commit -m "Auto-update: %timestamp%"

:: 4. Force-push to master (overwrite remote if needed)
git push --force origin master

:: 5. Verify
git log --oneline -3
git status

echo Update COMPLETE - Check GitHub now
pause