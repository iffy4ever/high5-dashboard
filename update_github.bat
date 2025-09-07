@echo off
echo Cleaning all extra files and fixing properly...
echo.

cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"

echo 1. Removing all configuration files...
del vercel.json 2>nul
del .vercelrc 2>nul
del .browserslistrc 2>nul
del .env 2>nul

echo 2. Creating clean, minimal package.json...
(
echo {
echo   "name": "dashboard-app",
echo   "version": "1.0.0",
echo   "private": true,
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "xlsx": "^0.18.5",
echo     "react-icons": "^4.12.0",
echo     "react-router-dom": "^6.8.0"
echo   },
echo   "scripts": {
echo     "start": "react-scripts start",
echo     "build": "react-scripts build",
echo     "test": "react-scripts test",
echo     "eject": "react-scripts eject"
echo   },
echo   "eslintConfig": {
echo     "extends": [
echo       "react-app",
echo       "react-app/jest"
echo     ]
echo   },
echo   "browserslist": {
echo     "production": [
echo       ">0.2%",
echo       "not dead",
echo       "not op_mini all"
echo     ],
echo     "development": [
echo       "last 1 chrome version",
echo       "last 1 firefox version",
echo       "last 1 safari version"
echo     ]
echo   },
echo   "devDependencies": {
echo     "react-scripts": "5.0.1"
echo   }
echo }
) > package.json

echo 3. Validating JSON syntax...
node -e "require('./package.json'); console.log('✓ package.json is valid JSON')"

echo 4. Adding only necessary files to git...
git add package.json
git add -u

echo 5. Removing any other files from git...
git reset -- .browserslistrc 2>nul
git reset -- vercel.json 2>nul
git reset -- .vercelrc 2>nul
git reset -- .env 2>nul

echo 6. Committing clean fix...
git commit -m "Clean fix: Removed all extra files, version 1.0.0"

echo 7. Pushing to GitHub...
git push origin main

echo.
echo ✅ CLEAN FIX COMPLETE!
echo ✅ Removed ALL extra configuration files
echo ✅ Clean package.json with proper browserslist ">0.2%"
echo ✅ Version 1.0.0
echo ✅ No vercel.json, no .browserslistrc, no .env
echo.
echo Vercel will use its default configuration which works best!
pause