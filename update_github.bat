@echo off
cd /d "C:\Users\%USERNAME%\Desktop\high5-dashboard"
git add .
git commit -m "Update: %date% %time%"
git push origin main
echo Update completed!
pause