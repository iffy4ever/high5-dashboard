@echo off
echo Updating GitHub repository...
echo.

cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"

echo 1. Pulling latest changes from GitHub...
git pull origin main

echo 2. Adding all changes...
git add .

echo 3. Committing with timestamp...
git commit -m "Update: %date% %time%"

echo 4. Pushing to main branch...
git push origin main

echo.
echo ✅ GitHub update completed successfully!
echo.
echo 📦 Vercel will automatically deploy the new version...
echo.
pause