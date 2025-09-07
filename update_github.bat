@echo off
echo Removing Vercel config to use defaults...
echo.

cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"

echo 1. Removing vercel.json and .vercelrc...
del vercel.json 2>nul
del .vercelrc 2>nul

echo 2. Keeping only the essential .env file...
(
echo NODE_OPTIONS=--openssl-legacy-provider
echo GENERATE_SOURCEMAP=false
) > .env

echo 3. Updating git...
git add .
git commit -m "Fix: Use Vercel default configuration"
git push origin main

echo.
echo ✅ Removed custom Vercel config. Using defaults now.
echo.
pause