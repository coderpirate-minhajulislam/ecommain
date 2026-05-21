#!/bin/bash
echo "============================================"
echo "  Production Build - Deploy Ready"
echo "============================================"
echo ""

cd "$(dirname "$0")"

echo "[1/6] Installing npm dependencies..."
npm install || { echo "ERROR: npm install failed!"; exit 1; }
echo "OK"
echo ""

echo "[2/6] Building frontend assets..."
npm run build || { echo "ERROR: npm run build failed!"; exit 1; }
echo "OK"
echo ""

echo "[3/6] Installing composer (production)..."
composer install --optimize-autoloader --no-dev || { echo "ERROR: composer install failed!"; exit 1; }
echo "OK"
echo ""

echo "[4/6] Clearing old caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear
echo "OK"
echo ""

echo "[5/6] Optimizing for production..."
php artisan optimize
php artisan view:cache
php artisan event:cache
echo "OK"
echo ""

echo "[6/6] Clearing cached config (so server reads .env fresh)..."
php artisan config:clear
php artisan route:clear
echo "OK"
echo ""

echo "============================================"
echo "  BUILD COMPLETE - Ready to deploy!"
echo "============================================"
echo ""
echo "Upload these to public_html/:"
echo "  - All folders (app, bootstrap, config, etc.)"
echo "  - .htaccess, index.php, setup.php"
echo "  - public/build/ (compiled assets)"
echo ""
echo "Do NOT upload:"
echo "  - node_modules/"
echo "  - .git/"
echo "  - .env (configure on server)"
echo "============================================"
