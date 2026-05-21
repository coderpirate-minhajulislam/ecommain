<?php
/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Laravel Installer — Like WordPress Setup
 *  For: riyazrentacar.com (Hostinger)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Upload entire project to public_html/
 *  Visit: https://riyazrentacar.com/setup.php
 *  DELETE THIS FILE after setup is complete!
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(600);
@ini_set('max_execution_time', 600);
@ini_set('memory_limit', '256M');

$basePath = __DIR__;
$envFile  = $basePath . '/.env';
$step     = isset($_GET['step']) ? (int) $_GET['step'] : 0;
$error    = '';
$success  = '';

// ── If .env exists and has real DB credentials, check if already installed ──
if ($step === 0 && file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    if (
        strpos($envContent, 'DB_DATABASE=u') !== false &&
        strpos($envContent, 'YOUR_DB_PASSWORD_HERE') === false
    ) {
        // Already configured, skip to step 2
        $step = 2;
    }
}

// ══════════════════════════════════════════
//  STEP 1: Handle form submission (DB config)
// ══════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'save_database') {
        $dbHost = trim($_POST['db_host'] ?? 'localhost');
        $dbPort = trim($_POST['db_port'] ?? '3306');
        $dbName = trim($_POST['db_name'] ?? '');
        $dbUser = trim($_POST['db_user'] ?? '');
        $dbPass = $_POST['db_pass'] ?? '';
        $appUrl = rtrim(trim($_POST['app_url'] ?? ''), '/');
        $appName = trim($_POST['app_name'] ?? 'Shop');

        // Validate
        if (empty($dbName) || empty($dbUser)) {
            $error = 'Database name and username are required.';
            $step = 1;
        } else {
            // Test DB connection
            try {
                $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName}";
                $pdo = new PDO($dsn, $dbUser, $dbPass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 5,
                ]);
                $pdo = null; // close

                // Connection works — write .env
                $envTemplate = <<<ENV
APP_NAME={$appName}
APP_ENV=production
APP_KEY=base64:eWJPFV2bzt4pOipGEOO9Qw7u2uNCe3+9M9CoqX0lCcw=
APP_DEBUG=false
APP_URL={$appUrl}

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST={$dbHost}
DB_PORT={$dbPort}
DB_DATABASE={$dbName}
DB_USERNAME={$dbUser}
DB_PASSWORD={$dbPass}

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="noreply@{$_SERVER['HTTP_HOST']}"
MAIL_FROM_NAME="\${APP_NAME}"

VITE_APP_NAME="\${APP_NAME}"
ENV;

                if (file_put_contents($envFile, $envTemplate) === false) {
                    $error = 'Cannot write .env file. Please set public_html folder permission to 755.';
                    $step = 1;
                } else {
                    // Delete old cached config so Laravel reads the new .env
                    $cachedConfig = $basePath . '/bootstrap/cache/config.php';
                    if (file_exists($cachedConfig)) @unlink($cachedConfig);

                    $step = 2;
                    header('Location: setup.php?step=2');
                    exit;
                }
            } catch (PDOException $e) {
                $error = 'Database connection failed: ' . $e->getMessage();
                $step = 1;
            }
        }
    }

    if ($_POST['action'] === 'run_install') {
        $step = 3;
    }
}

// ══════════════════════════════════════════
//  HTML HEAD
// ══════════════════════════════════════════
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup — <?php echo htmlspecialchars($_SERVER['HTTP_HOST']); ?></title>
    <meta name="robots" content="noindex, nofollow">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: #1e293b;
            border-radius: 16px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 25px 50px rgba(0,0,0,0.4);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            font-size: 28px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 5px;
        }
        .logo p { color: #94a3b8; font-size: 14px; }

        /* Steps indicator */
        .steps {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 30px;
        }
        .step-dot {
            width: 36px; height: 36px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 600;
            background: #334155; color: #64748b;
            transition: all 0.3s;
        }
        .step-dot.active { background: #3b82f6; color: #fff; }
        .step-dot.done { background: #22c55e; color: #fff; }
        .step-line {
            width: 40px; height: 2px; background: #334155;
            align-self: center;
        }
        .step-line.done { background: #22c55e; }

        h2 { font-size: 22px; margin-bottom: 8px; }
        .subtitle { color: #94a3b8; margin-bottom: 24px; font-size: 14px; }

        /* Form */
        .form-group { margin-bottom: 18px; }
        label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        input[type="text"], input[type="password"], input[type="number"] {
            width: 100%;
            padding: 12px 16px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 15px;
            outline: none;
            transition: border 0.2s;
        }
        input:focus { border-color: #3b82f6; }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        /* Button */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 14px 24px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.1s, box-shadow 0.2s;
            margin-top: 10px;
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(59,130,246,0.3); }
        .btn:active { transform: translateY(0); }
        .btn-success { background: linear-gradient(135deg, #22c55e, #16a34a); }
        .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); }

        /* Alert */
        .alert {
            padding: 14px 18px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.5;
        }
        .alert-error { background: #451a1a; border: 1px solid #7f1d1d; color: #fca5a5; }
        .alert-success { background: #14532d; border: 1px solid #166534; color: #86efac; }
        .alert-warning { background: #422006; border: 1px solid #713f12; color: #fcd34d; }
        .alert-info { background: #1e3a5f; border: 1px solid #1e40af; color: #93c5fd; }

        /* Log output */
        .log-area {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 10px;
            padding: 16px;
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 13px;
            line-height: 1.8;
        }
        .log-ok { color: #4ade80; }
        .log-err { color: #f87171; }
        .log-warn { color: #fbbf24; }
        .log-info { color: #60a5fa; }

        /* Check list */
        .checklist { list-style: none; }
        .checklist li {
            padding: 10px 0;
            border-bottom: 1px solid #1e293b;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }
        .checklist li:last-child { border-bottom: none; }
        .check-icon {
            width: 24px; height: 24px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: bold;
            flex-shrink: 0;
        }
        .check-ok { background: #166534; color: #4ade80; }
        .check-fail { background: #7f1d1d; color: #f87171; }
        .check-warn { background: #713f12; color: #fbbf24; }

        .final-box {
            text-align: center;
            padding: 20px;
        }
        .final-box .big-icon { font-size: 64px; margin-bottom: 16px; }
        a { color: #60a5fa; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .hint { font-size: 12px; color: #64748b; margin-top: 4px; }
    </style>
</head>
<body>
<div class="container">
    <div class="logo">
        <h1>🚀 Site Installation</h1>
        <p><?php echo htmlspecialchars($_SERVER['HTTP_HOST']); ?></p>
    </div>

    <!-- Step Indicators -->
    <div class="steps">
        <div class="step-dot <?php echo $step >= 1 ? ($step > 1 ? 'done' : 'active') : ''; ?>">1</div>
        <div class="step-line <?php echo $step > 1 ? 'done' : ''; ?>"></div>
        <div class="step-dot <?php echo $step >= 2 ? ($step > 2 ? 'done' : 'active') : ''; ?>">2</div>
        <div class="step-line <?php echo $step > 2 ? 'done' : ''; ?>"></div>
        <div class="step-dot <?php echo $step >= 3 ? ($step > 3 ? 'done' : 'active') : ''; ?>">3</div>
        <div class="step-line <?php echo $step > 3 ? 'done' : ''; ?>"></div>
        <div class="step-dot <?php echo $step >= 4 ? 'done' : ''; ?>">4</div>
    </div>

<?php
// ══════════════════════════════════════════
//  STEP 0: Welcome / Pre-checks
// ══════════════════════════════════════════
if ($step === 0): ?>
    <h2>Welcome</h2>
    <p class="subtitle">Let's get your site up and running. First, a quick check of your server.</p>

    <?php
    $checks = [];

    // PHP version
    $phpOk = version_compare(PHP_VERSION, '8.2.0', '>=');
    $checks[] = ['PHP Version: ' . PHP_VERSION . ' (need 8.2+)', $phpOk];

    // Required extensions
    $requiredExts = ['pdo_mysql', 'mbstring', 'openssl', 'tokenizer', 'xml', 'ctype', 'json', 'fileinfo', 'curl'];
    foreach ($requiredExts as $ext) {
        $checks[] = ['Extension: ' . $ext, extension_loaded($ext)];
    }

    // Writable directories
    $writableDirs = ['storage', 'storage/logs', 'storage/framework', 'storage/framework/cache', 'storage/framework/sessions', 'storage/framework/views', 'bootstrap/cache'];
    foreach ($writableDirs as $dir) {
        $fullPath = $basePath . '/' . $dir;
        if (!is_dir($fullPath)) {
            @mkdir($fullPath, 0755, true);
        }
        $checks[] = [$dir . '/ writable', is_writable($fullPath)];
    }

    // vendor exists
    $checks[] = ['vendor/ exists (Composer installed)', is_dir($basePath . '/vendor')];

    // public/build exists
    $checks[] = ['public/build/ exists (Frontend built)', is_dir($basePath . '/public/build')];

    $allOk = true;
    $hasWarning = false;
    ?>

    <div style="background:#0f172a;border-radius:10px;padding:16px;margin-bottom:20px">
        <ul class="checklist">
        <?php foreach ($checks as $c):
            $ok = $c[1];
            if (!$ok) $allOk = false;
        ?>
            <li>
                <span class="check-icon <?php echo $ok ? 'check-ok' : 'check-fail'; ?>">
                    <?php echo $ok ? '✓' : '✗'; ?>
                </span>
                <?php echo htmlspecialchars($c[0]); ?>
            </li>
        <?php endforeach; ?>
        </ul>
    </div>

    <?php if (!$allOk): ?>
        <div class="alert alert-error">
            Some checks failed. Fix the issues above before continuing.<br>
            For permission issues: In Hostinger File Manager, right-click the folder → Permissions → set to <strong>755</strong>.
        </div>
    <?php endif; ?>

    <a href="setup.php?step=1">
        <button class="btn" <?php echo !$allOk ? '' : ''; ?>>
            Continue → Database Setup
        </button>
    </a>

<?php
// ══════════════════════════════════════════
//  STEP 1: Database Configuration
// ══════════════════════════════════════════
elseif ($step === 1): ?>
    <h2>Database Configuration</h2>
    <p class="subtitle">Enter your Hostinger MySQL database details. You can find these in hPanel → Databases.</p>

    <?php if ($error): ?>
        <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>

    <form method="POST" action="setup.php">
        <input type="hidden" name="action" value="save_database">

        <div class="form-group">
            <label>Site URL</label>
            <input type="text" name="app_url" value="https://<?php echo htmlspecialchars($_SERVER['HTTP_HOST']); ?>" placeholder="https://riyazrentacar.com">
            <p class="hint">Your domain with https://</p>
        </div>

        <div class="form-group">
            <label>Site Name</label>
            <input type="text" name="app_name" value="Shop" placeholder="My Store">
        </div>

        <hr style="border-color:#334155;margin:20px 0">

        <div class="form-row">
            <div class="form-group">
                <label>Database Host</label>
                <input type="text" name="db_host" value="localhost">
                <p class="hint">Usually "localhost" on Hostinger</p>
            </div>
            <div class="form-group">
                <label>Database Port</label>
                <input type="number" name="db_port" value="3306">
            </div>
        </div>

        <div class="form-group">
            <label>Database Name</label>
            <input type="text" name="db_name" value="" placeholder="u123456789_shop" required>
            <p class="hint">From Hostinger hPanel → Databases</p>
        </div>

        <div class="form-group">
            <label>Database Username</label>
            <input type="text" name="db_user" value="" placeholder="u123456789_shop" required>
        </div>

        <div class="form-group">
            <label>Database Password</label>
            <input type="password" name="db_pass" value="" placeholder="••••••••">
        </div>

        <button type="submit" class="btn">Test Connection & Save →</button>
    </form>

<?php
// ══════════════════════════════════════════
//  STEP 2: Confirm & Run Installation
// ══════════════════════════════════════════
elseif ($step === 2): ?>
    <h2>Ready to Install</h2>
    <p class="subtitle">Database connection verified! Click the button to run migrations and configure your site.</p>

    <div class="alert alert-info">
        <strong>This will:</strong><br>
        ✅ Create all database tables (migrations)<br>
        ✅ Create storage symlink<br>
        ✅ Cache configuration, routes & views<br>
        ✅ Set correct permissions
    </div>

    <form method="POST" action="setup.php?step=3">
        <input type="hidden" name="action" value="run_install">
        <button type="submit" class="btn btn-success">⚡ Run Installation</button>
    </form>

    <br>
    <p style="text-align:center">
        <a href="setup.php?step=1">← Back to database settings</a>
    </p>

<?php
// ══════════════════════════════════════════
//  STEP 3: Run Installation
// ══════════════════════════════════════════
elseif ($step === 3):
    // Bootstrap Laravel
    $hasError = false;

    // ── CRITICAL: Delete old cached config that has local DB credentials ──
    $cachedConfig = $basePath . '/bootstrap/cache/config.php';
    if (file_exists($cachedConfig)) {
        @unlink($cachedConfig);
    }
    // Also clear route/event/services cache to avoid path issues
    foreach (['routes-v7.php', 'events.php', 'services.php', 'packages.php'] as $cacheFile) {
        $f = $basePath . '/bootstrap/cache/' . $cacheFile;
        if (file_exists($f)) @unlink($f);
    }

    if (!file_exists($basePath . '/vendor/autoload.php')) {
        echo '<div class="alert alert-error">vendor/autoload.php not found!</div>';
        $hasError = true;
    }

    if (!$hasError):
        require $basePath . '/vendor/autoload.php';
        $app = require_once $basePath . '/bootstrap/app.php';
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();
?>
    <h2>Installing...</h2>
    <p class="subtitle">Please wait, do not close this page.</p>

    <div class="log-area" id="logArea">
<?php
        // Flush all output buffers for real-time display
        while (ob_get_level() > 0) ob_end_flush();
        ob_implicit_flush(true);
        @header('Content-Type: text/html; charset=utf-8');
        @header('X-Accel-Buffering: no'); // Disable nginx buffering
        echo str_repeat(' ', 4096); // Force initial flush
        flush();

        function logOk($msg) { echo '<div class="log-ok">✅ ' . htmlspecialchars($msg) . '</div>' . str_repeat(' ', 256); flush(); }
        function logErr($msg) { echo '<div class="log-err">❌ ' . htmlspecialchars($msg) . '</div>' . str_repeat(' ', 256); flush(); }
        function logWarn($msg) { echo '<div class="log-warn">⚠️ ' . htmlspecialchars($msg) . '</div>' . str_repeat(' ', 256); flush(); }
        function logInfo($msg) { echo '<div class="log-info">ℹ️ ' . htmlspecialchars($msg) . '</div>' . str_repeat(' ', 256); flush(); }

        // ── 1. Storage directories ──
        logInfo('Checking storage directories...');
        $dirs = [
            'storage/app/public',
            'storage/framework/cache/data',
            'storage/framework/sessions',
            'storage/framework/views',
            'storage/logs',
            'bootstrap/cache',
        ];
        foreach ($dirs as $dir) {
            $full = $basePath . '/' . $dir;
            if (!is_dir($full)) {
                @mkdir($full, 0755, true);
                logOk("Created {$dir}/");
            }
        }
        logOk('Storage directories OK');

        // ── 2. Storage symlink ──
        logInfo('Creating storage symlink...');
        $storageTarget = $basePath . '/storage/app/public';
        $storageLink   = $basePath . '/public/storage';

        if (is_link($storageLink) || is_dir($storageLink)) {
            logOk('Storage link already exists');
        } else {
            if (@symlink($storageTarget, $storageLink)) {
                logOk('Storage symlink created');
            } else {
                logWarn('symlink() failed — you may need to manually copy storage/app/public/ to public/storage/ via File Manager');
            }
        }

        // ── 3. Test Database Connection ──
        logInfo('Testing database connection...');
        try {
            Illuminate\Support\Facades\DB::connection()->getPdo();
            $dbName = Illuminate\Support\Facades\DB::connection()->getDatabaseName();
            logOk('Database connected: ' . $dbName);
        } catch (Exception $e) {
            logErr('Database connection failed: ' . $e->getMessage());
            $hasError = true;
        }

        // ── 4. Cache config/routes/views ──
        if (!$hasError) {
            logInfo('Caching configuration...');
            try {
                Illuminate\Support\Facades\Artisan::call('config:cache');
                logOk('Configuration cached');

                Illuminate\Support\Facades\Artisan::call('route:cache');
                logOk('Routes cached');

                Illuminate\Support\Facades\Artisan::call('view:cache');
                logOk('Views cached');

                Illuminate\Support\Facades\Artisan::call('event:cache');
                logOk('Events cached');
            } catch (Exception $e) {
                logWarn('Cache error (non-fatal): ' . $e->getMessage());
            }
        }

        // ── 5. Permissions check ──
        logInfo('Checking permissions...');
        $checkDirs = ['storage', 'storage/logs', 'storage/framework', 'bootstrap/cache'];
        foreach ($checkDirs as $dir) {
            $full = $basePath . '/' . $dir;
            if (is_writable($full)) {
                logOk($dir . '/ is writable');
            } else {
                logWarn($dir . '/ is NOT writable — set to 755 in File Manager');
            }
        }

        // ── 6. Uploads directory ──
        $uploadsDir = $basePath . '/public/uploads';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0755, true);
            logOk('Created public/uploads/');
        } else {
            logOk('public/uploads/ exists');
        }

        // ── Done ──
        echo '</div>'; // close log-area

        if (!$hasError) {
            echo '<div class="alert alert-success" style="margin-top:20px;text-align:center">';
            echo '<strong>🎉 Installation Complete!</strong>';
            echo '</div>';
            echo '<a href="setup.php?step=4"><button class="btn btn-success">Finish →</button></a>';
        } else {
            echo '<div class="alert alert-error" style="margin-top:20px">';
            echo 'Some steps failed. Fix the issues and <a href="setup.php?step=3">try again</a>.';
            echo '</div>';
        }
    endif;
?>

<?php
// ══════════════════════════════════════════
//  STEP 4: Complete!
// ══════════════════════════════════════════
elseif ($step === 4): ?>
    <div class="final-box">
        <div class="big-icon">🎉</div>
        <h2>Your Site is Live!</h2>
        <p class="subtitle">Everything is set up and ready to go.</p>

        <div class="alert alert-error" style="text-align:left">
            <strong>⚠ SECURITY WARNING:</strong><br>
            Delete <code>setup.php</code> from your public_html folder <strong>RIGHT NOW</strong>.<br>
            Anyone can reconfigure your site if this file remains!
        </div>

        <div style="display:grid;gap:12px;margin-top:20px">
            <a href="/">
                <button class="btn btn-success" style="width:100%">🌐 Visit Your Site</button>
            </a>
            <a href="/admin">
                <button class="btn" style="width:100%">🔧 Go to Admin Panel</button>
            </a>
        </div>

        <div class="alert alert-warning" style="margin-top:20px;text-align:left">
            <strong>Next steps:</strong><br>
            1. Delete <code>setup.php</code> immediately<br>
            2. Log in to admin and configure your store<br>
            3. Add products, banners, and pages<br>
            4. Test checkout and order flow
        </div>
    </div>

<?php endif; ?>

</div>

<script>
// Auto-scroll log area
const logArea = document.getElementById('logArea');
if (logArea) {
    const observer = new MutationObserver(() => {
        logArea.scrollTop = logArea.scrollHeight;
    });
    observer.observe(logArea, { childList: true });
}
</script>
</body>
</html>
