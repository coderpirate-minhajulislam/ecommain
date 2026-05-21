@echo off
echo ============================================
echo   Production Build - Deploy Ready
echo ============================================
echo.

cd /d "%~dp0"

echo [1/6] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo OK
echo.

echo [2/6] Building frontend assets...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: npm run build failed!
    pause
    exit /b 1
)
echo OK
echo.

echo [3/6] Installing composer (production)...
call composer install --optimize-autoloader --no-dev
if %errorlevel% neq 0 (
    echo ERROR: composer install failed!
    pause
    exit /b 1
)
echo OK
echo.

echo [4/6] Clearing old caches...
call php artisan cache:clear
call php artisan config:clear
call php artisan route:clear
call php artisan view:clear
call php artisan event:clear
echo OK
echo.

echo [5/6] Optimizing for production...
call php artisan optimize
call php artisan view:cache
call php artisan event:cache
echo OK
echo.

echo [6/6] Clearing cached config (so server reads .env fresh)...
call php artisan config:clear
call php artisan route:clear
echo OK
echo.

echo ============================================
echo   BUILD COMPLETE - Ready to deploy!
echo ============================================
echo.
echo Upload these to public_html/:
echo   - All folders (app, bootstrap, config, etc.)
echo   - .htaccess, index.php, setup.php
echo   - public/build/ (compiled assets)
echo.
echo Do NOT upload:
echo   - node_modules/
echo   - .git/
echo   - .env (configure on server)
echo ============================================
pause
