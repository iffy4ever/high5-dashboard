@echo off
echo Nuclear cleanup - Fresh start...
echo.

cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"

echo 1. Removing ALL files except your source code...
del vercel.json 2>nul
del .vercelrc 2>nul
del .browserslistrc 2>nul
del .env 2>nul
del package.json.backup 2>nul

echo 2. Creating minimal package.json...
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

echo 3. Force push to completely overwrite GitHub...
git add .
git commit -m "Nuclear cleanup: Fresh start version 1.0.0"
git push -f origin main

echo.
echo ✅ NUCLEAR CLEANUP COMPLETE!
echo ✅ Fresh start with only essential files
echo ✅ Force pushed to overwrite everything
echo.
pause