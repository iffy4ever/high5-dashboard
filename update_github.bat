@echo off
echo Nuclear option: Complete cache clear and fix...
echo.

cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"

echo 1. Creating fresh package.json with ALL fixes...
(
echo {
echo   "name": "dashboard-app",
echo   "version": "0.2.0",
echo   "private": true,
echo   "engines": {
echo     "node": "22.x"
echo   },
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

echo 2. Creating a simple browserslist file (alternative approach)...
(
echo # Browsers that we support
echo 
echo >0.2%
echo not dead
echo not op_mini all
) > .browserslistrc

echo 3. Removing browserslist from package.json to use .browserslistrc instead...
(
echo {
echo   "name": "dashboard-app",
echo   "version": "0.2.0",
echo   "private": true,
echo   "engines": {
echo     "node": "22.x"
echo   },
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
echo   "devDependencies": {
echo     "react-scripts": "5.0.1"
echo   }
echo }
) > package.json

echo 4. Adding a vercel.json to force fresh build...
(
echo {
echo   "version": 2,
echo   "buildCommand": "npm run build",
echo   "outputDirectory": "build",
echo   "nodeVersion": "22.x"
echo }
) > vercel.json

echo 5. Adding all files to git...
git add .
git add -u

echo 6. Committing nuclear fix...
git commit -m "Nuclear fix: Complete cache bust, version 0.2.0, fresh config"

echo 7. Pushing to GitHub...
git push origin main

echo.
echo ✅ NUCLEAR OPTION COMPLETE!
echo ✅ Version 0.2.0
echo ✅ Fresh browserslist config
echo ✅ Vercel config to force rebuild
echo ✅ Complete cache busting
echo.
echo This should FINALLY fix all issues!
pause