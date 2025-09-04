@echo off
title GitHub File Upload Troubleshooter
color 0A
echo ============================================
echo    GITHUB FILE UPLOAD TROUBLESHOOTER
echo ============================================
echo.

:: Configuration
set LOCAL_SOURCE=C:\Users\irfan\dashboard-app
set GITHUB_CLONE=C:\Users\irfan\high5-dashboard
set GITHUB_URL=https://github.com/iffy4ever/high5-dashboard.git
set BRANCH=main

:menu
cls
echo ============================================
echo    GITHUB FILE UPLOAD TROUBLESHOOTER
echo ============================================
echo.
echo 1. Diagnose File Copy Issues
echo 2. Check File Permissions
echo 3. Test Robocopy Functionality
echo 4. Fix Common Problems
echo 5. Run Safe File Copy
echo 6. Exit
echo.
choice /c 123456 /m "Select an option:"
echo.

if %errorlevel% equ 1 goto diagnose_copy
if %errorlevel% equ 2 goto check_permissions
if %errorlevel% equ 3 goto test_robocopy
if %errorlevel% equ 4 goto fix_problems
if %errorlevel% equ 5 goto safe_copy
if %errorlevel% equ 6 exit /b 0

:diagnose_copy
echo Diagnosing file copy issues...
echo ==============================
echo.

echo Checking if source directory exists...
if not exist "%LOCAL_SOURCE%" (
    echo ERROR: Source directory does not exist: %LOCAL_SOURCE%
    pause
    goto menu
)
echo ✓ Source directory exists

echo Checking if destination directory exists...
if not exist "%GITHUB_CLONE%" (
    echo ERROR: Destination directory does not exist: %GITHUB_CLONE%
    pause
    goto menu
)
echo ✓ Destination directory exists

echo Checking if source directory is accessible...
dir "%LOCAL_SOURCE%" >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot access source directory
    pause
    goto menu
)
echo ✓ Source directory is accessible

echo Checking if destination directory is accessible...
dir "%GITHUB_CLONE%" >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot access destination directory
    pause
    goto menu
)
echo ✓ Destination directory is accessible

echo Checking if source directory has files...
dir "%LOCAL_SOURCE%" | find "File(s)" >nul
if %errorlevel% neq 0 (
    echo WARNING: Source directory appears to be empty
) else (
    echo ✓ Source directory contains files
)

echo Testing file copy with a small test file...
echo This is a test file > "%LOCAL_SOURCE%\test_file.txt"
if not exist "%LOCAL_SOURCE%\test_file.txt" (
    echo ERROR: Cannot create test file in source directory
    pause
    goto menu
)
echo ✓ Test file created successfully

xcopy "%LOCAL_SOURCE%\test_file.txt" "%GITHUB_CLONE%\test_file.txt" >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Basic file copy failed
    del "%LOCAL_SOURCE%\test_file.txt" 2>nul
    pause
    goto menu
)
echo ✓ Basic file copy works

if exist "%GITHUB_CLONE%\test_file.txt" (
    del "%GITHUB_CLONE%\test_file.txt" 2>nul
    echo ✓ Test file cleanup successful
)

del "%LOCAL_SOURCE%\test_file.txt" 2>nul

echo.
echo Running robocopy test...
robocopy "%LOCAL_SOURCE%" "%GITHUB_CLONE%" /L /S /NP /NJH /NJS > robocopy_test.txt
if %errorlevel% gtr 3 (
    echo ERROR: Robocopy test failed with error level %errorlevel%
    type robocopy_test.txt
    del robocopy_test.txt 2>nul
    pause
    goto menu
)

echo Robocopy test completed successfully.
echo Would you like to see the robocopy plan? (Y/N)
choice /c YN /n
if %errorlevel% equ 1 (
    type robocopy_test.txt
)

del robocopy_test.txt 2>nul
pause
goto menu

:check_permissions
echo Checking file permissions...
echo ============================
echo.

echo Checking source directory permissions...
icacils "%LOCAL_SOURCE%" >nul 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Cannot read source directory permissions
) else (
    echo ✓ Can read source directory permissions
)

echo Checking destination directory permissions...
icacils "%GITHUB_CLONE%" >nul 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Cannot read destination directory permissions
) else (
    echo ✓ Can read destination directory permissions
)

echo Testing file creation in source directory...
echo Permission test > "%LOCAL_SOURCE%\permission_test.txt" 2>nul
if exist "%LOCAL_SOURCE%\permission_test.txt" (
    del "%LOCAL_SOURCE%\permission_test.txt" 2>nul
    echo ✓ Can create files in source directory
) else (
    echo ERROR: Cannot create files in source directory
)

echo Testing file creation in destination directory...
echo Permission test > "%GITHUB_CLONE%\permission_test.txt" 2>nul
if exist "%GITHUB_CLONE%\permission_test.txt" (
    del "%GITHUB_CLONE%\permission_test.txt" 2>nul
    echo ✓ Can create files in destination directory
) else (
    echo ERROR: Cannot create files in destination directory
)

echo.
echo Checking if any files are read-only in source...
for /f "delims=" %%i in ('dir "%LOCAL_SOURCE%" /a-r /s /b 2^>nul') do (
    set has_readonly=1
)
if defined has_readonly (
    echo Found read-only files in source directory
) else (
    echo No read-only files found in source directory
)

pause
goto menu

:test_robocopy
echo Testing Robocopy functionality...
echo ================================
echo.

where robocopy >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Robocopy is not available on this system
    echo This tool requires Robocopy (available in Windows Vista and later)
    pause
    goto menu
)

echo Robocopy is available: 
robocopy /? | find "Version"
echo.

echo Testing simple robocopy operation...
robocopy . . /L /S /NP /NJH /NJS >nul 2>nul
if %errorlevel% gtr 3 (
    echo ERROR: Robocopy test failed
) else (
    echo ✓ Robocopy basic functionality test passed
)

echo Testing robocopy with source and destination...
robocopy "%LOCAL_SOURCE%" "%GITHUB_CLONE%" /L /S /NP /NJH /NJS >nul 2>nul
if %errorlevel% gtr 3 (
    echo ERROR: Robocopy cannot copy between these directories
) else (
    echo ✓ Robocopy can copy between source and destination
)

echo.
echo Robocopy return code meanings:
echo 0 - No files copied
echo 1 - Files copied successfully
echo 2 - Extra files or directories detected
echo 3 - Files copied + extra files/directories
echo 4-7 - Errors occurred
echo 8 - Serious error occurred

pause
goto menu

:fix_problems
echo Fixing common file copy problems...
echo ==================================
echo.

echo 1. Checking for long file paths...
echo Windows has a 260 character path limit. Checking for long paths...
for /f "delims=" %%i in ('dir /s /b "%LOCAL_SOURCE%\*" 2^>nul') do (
    set "fullpath=%%i"
    if !fullpath:~259! neq "" (
        echo WARNING: Long path detected: %%i
        set long_paths=1
    )
)

if defined long_paths (
    echo.
    echo Long paths detected which may cause copy issues.
    echo Solution: Enable long path support in Windows or shorten path names.
) else (
    echo ✓ No excessively long paths detected
)

echo.
echo 2. Checking for invalid file names...
for /f "delims=" %%i in ('dir /s /b "%LOCAL_SOURCE%\*" 2^>nul') do (
    echo %%~nxi | find /i ">" >nul && set invalid_name=1
    echo %%~nxi | find /i "<" >nul && set invalid_name=1
    echo %%~nxi | find /i ":" >nul && set invalid_name=1
    echo %%~nxi | find /i "\"" >nul && set invalid_name=1
    echo %%~nxi | find /i "/" >nul && set invalid_name=1
    echo %%~nxi | find /i "|" >nul && set invalid_name=1
    echo %%~nxi | find /i "?" >nul && set invalid_name=1
    echo %%~nxi | find /i "*" >nul && set invalid_name=1
)

if defined invalid_name (
    echo WARNING: Files with invalid characters detected
    echo Solution: Rename files to remove special characters
) else (
    echo ✓ No invalid file names detected
)

echo.
echo 3. Checking for locked files...
echo Run this command in an Administrator command prompt if files are locked:
echo echo Handle.exe -u "%LOCAL_SOURCE%"
echo.
echo 4. Checking disk space...
for /f "tokens=3" %%a in ('dir /-c "%GITHUB_CLONE%" 2^>nul ^| find "bytes free"') do (
    set free_space=%%a
)
echo Free space in destination: %free_space% bytes

pause
goto menu

:safe_copy
echo Running safe file copy procedure...
echo ==================================
echo.

if not exist "%LOCAL_SOURCE%" (
    echo ERROR: Source directory does not exist
    pause
    goto menu
)

if not exist "%GITHUB_CLONE%" (
    echo ERROR: Destination directory does not exist
    pause
    goto menu
)

echo Step 1: Creating backup of destination...
set BACKUP_DIR=%GITHUB_CLONE%-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%
if not exist "%BACKUP_DIR%" (
    xcopy "%GITHUB_CLONE%" "%BACKUP_DIR%" /E /H /I /K >nul 2>nul
    if %errorlevel% neq 0 (
        echo WARNING: Could not create backup
    ) else (
        echo ✓ Backup created: %BACKUP_DIR%
    )
)

echo Step 2: Copying files in stages...
echo Substep 2a: Copying non-Git files first...
for /f "delims=" %%i in ('dir "%LOCAL_SOURCE%" /a-d /b 2^>nul') do (
    if /i not "%%i"==".git" if /i not "%%i"==".gitignore" (
        copy "%LOCAL_SOURCE%\%%i" "%GITHUB_CLONE%\%%i" >nul 2>nul
        if %errorlevel% neq 0 (
            echo FAILED to copy: %%i
        ) else (
            echo Copied: %%i
        )
    )
)

echo Substep 2b: Copying directories (except .git)...
for /f "delims=" %%i in ('dir "%LOCAL_SOURCE%" /ad /b 2^>nul') do (
    if /i not "%%i"==".git" (
        xcopy "%LOCAL_SOURCE%\%%i" "%GITHUB_CLONE%\%%i" /E /H /I /K >nul 2>nul
        if %errorlevel% neq 0 (
            echo FAILED to copy directory: %%i
        ) else (
            echo Copied directory: %%i
        )
    )
)

echo.
echo Step 3: Verifying copy operation...
set MISSING_FILES=0
for /f "delims=" %%i in ('dir "%LOCAL_SOURCE%" /a-d /b 2^>nul') do (
    if /i not "%%i"==".git" if /i not "%%i"==".gitignore" (
        if not exist "%GITHUB_CLONE%\%%i" (
            echo MISSING: %%i
            set /a MISSING_FILES+=1
        )
    )
)

if %MISSING_FILES% gtr 0 (
    echo ERROR: %MISSING_FILES% files could not be copied
) else (
    echo ✓ All files copied successfully
)

echo.
echo Step 4: Checking Git status...
cd /d "%GITHUB_CLONE%"
git status --porcelain
if %errorlevel% neq 0 (
    echo ERROR: Git command failed
    pause
    goto menu
)

echo.
echo Copy operation completed. Check if files are ready for commit.
pause
goto menu