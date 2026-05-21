<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine base path — works both locally and on Hostinger
$basePath = realpath(__DIR__ . '/..');

// Check if setup is needed (redirect to setup.php if .env missing or has placeholder)
$envPath = $basePath . '/.env';
if (!file_exists($envPath)) {
    $setupFile = $basePath . '/setup.php';
    if (file_exists($setupFile)) {
        header('Location: /setup.php');
        exit;
    }
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $basePath.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require $basePath.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $basePath.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
