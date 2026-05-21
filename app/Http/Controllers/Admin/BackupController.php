<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use PDO;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class BackupController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('super-admin/backup');
    }

    // ─── Download Database ───────────────────────────────────────────────────────

    public function downloadDatabase(): StreamedResponse
    {
        $config   = config('database.connections.' . config('database.default'));
        $host     = $config['host'];
        $port     = $config['port'] ?? 3306;
        $database = $config['database'];
        $username = $config['username'];
        $password = $config['password'];

        $filename = 'database_backup_' . date('Y-m-d_H-i-s') . '.sql';

        return response()->streamDownload(function () use ($host, $port, $database, $username, $password) {
            $pdo = new PDO(
                "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
                $username,
                $password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            echo "-- Special Organic Shop Database Backup\n";
            echo "-- Generated: " . date('Y-m-d H:i:s') . "\n";
            echo "-- Database: {$database}\n\n";
            echo "SET FOREIGN_KEY_CHECKS=0;\n";
            echo "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n";
            echo "SET NAMES utf8mb4;\n\n";

            $tables = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_COLUMN);

            foreach ($tables as $table) {
                // Table structure
                echo "-- --------------------------------------------------------\n";
                echo "-- Table structure for `{$table}`\n";
                echo "-- --------------------------------------------------------\n\n";
                echo "DROP TABLE IF EXISTS `{$table}`;\n";

                $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(PDO::FETCH_ASSOC);
                echo $createStmt['Create Table'] . ";\n\n";

                // Table data
                $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);

                if (count($rows) > 0) {
                    echo "-- Data for table `{$table}`\n\n";
                    $columns = array_keys($rows[0]);
                    $colList = implode('`, `', $columns);

                    $chunkSize = 100;
                    $chunks    = array_chunk($rows, $chunkSize);

                    foreach ($chunks as $chunk) {
                        echo "INSERT INTO `{$table}` (`{$colList}`) VALUES\n";
                        $valueRows = [];
                        foreach ($chunk as $row) {
                            $values = array_map(function ($val) use ($pdo) {
                                if ($val === null) {
                                    return 'NULL';
                                }

                                return $pdo->quote((string) $val);
                            }, array_values($row));
                            $valueRows[] = '(' . implode(', ', $values) . ')';
                        }
                        echo implode(",\n", $valueRows) . ";\n";
                    }
                    echo "\n";
                }
            }

            // Views
            $views = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'VIEW'")->fetchAll(PDO::FETCH_COLUMN);
            foreach ($views as $view) {
                echo "-- --------------------------------------------------------\n";
                echo "-- View: `{$view}`\n";
                echo "-- --------------------------------------------------------\n\n";
                echo "DROP VIEW IF EXISTS `{$view}`;\n";
                $createView = $pdo->query("SHOW CREATE VIEW `{$view}`")->fetch(PDO::FETCH_ASSOC);
                echo $createView['Create View'] . ";\n\n";
            }

            echo "SET FOREIGN_KEY_CHECKS=1;\n";
        }, $filename, [
            'Content-Type'        => 'application/sql',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    // ─── Download Media (uploads zip) ────────────────────────────────────────────

    public function downloadMedia(): StreamedResponse
    {
        $uploadsPath = public_path('uploads');
        $filename    = 'media_backup_' . date('Y-m-d_H-i-s') . '.zip';
        $tempZip     = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $filename;

        $zip = new ZipArchive();
        if ($zip->open($tempZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Could not create zip archive.');
        }

        if (File::isDirectory($uploadsPath)) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($uploadsPath, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $file) {
                if ($file->isFile()) {
                    $relativePath = substr($file->getRealPath(), strlen($uploadsPath) + 1);
                    $zip->addFile($file->getRealPath(), $relativePath);
                }
            }
        }

        $zip->close();

        return response()->streamDownload(function () use ($tempZip) {
            $handle = fopen($tempZip, 'rb');
            while (! feof($handle)) {
                echo fread($handle, 8192);
                ob_flush();
                flush();
            }
            fclose($handle);
            @unlink($tempZip);
        }, $filename, [
            'Content-Type'        => 'application/zip',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    // ─── Upload & Restore Database ───────────────────────────────────────────────

    public function uploadDatabase(Request $request): RedirectResponse
    {
        $request->validate([
            'sql_file' => ['required', 'file', 'mimes:sql,txt', 'max:102400'], // max 100 MB
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file    = $request->file('sql_file');
        $content = file_get_contents($file->getRealPath());

        if (empty(trim($content))) {
            return back()->withErrors(['sql_file' => 'The SQL file is empty.']);
        }

        // Allow long-running restores
        @set_time_limit(300);

        try {
            DB::unprepared($content);
        } catch (\Throwable $e) {
            return back()->withErrors(['sql_file' => 'Database restore failed: ' . $e->getMessage()]);
        }

        return back()->with('success', 'Database restored successfully.');
    }

    // ─── Upload & Restore Media ──────────────────────────────────────────────────

    public function uploadMedia(Request $request): RedirectResponse
    {
        $request->validate([
            'media_file' => ['required', 'file', 'mimes:zip', 'max:512000'], // max 500 MB
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file        = $request->file('media_file');
        $uploadsPath = public_path('uploads');

        $zip = new ZipArchive();
        if ($zip->open($file->getRealPath()) !== true) {
            return back()->withErrors(['media_file' => 'Could not open the zip file.']);
        }

        // Validate entries to prevent zip-slip attacks
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entry    = $zip->getNameIndex($i);
            $realPath = realpath($uploadsPath . DIRECTORY_SEPARATOR . $entry);

            // Prevent path traversal: resolved path must start with uploads path
            if ($realPath !== false && strpos($realPath, realpath($uploadsPath)) !== 0) {
                $zip->close();

                return back()->withErrors(['media_file' => 'Invalid zip file: path traversal detected.']);
            }
        }

        // Clear existing uploads before extracting
        if (File::isDirectory($uploadsPath)) {
            $subdirs = File::directories($uploadsPath);
            foreach ($subdirs as $dir) {
                File::deleteDirectory($dir);
            }
            $existingFiles = File::files($uploadsPath);
            foreach ($existingFiles as $f) {
                File::delete($f);
            }
        }

        $zip->extractTo($uploadsPath);
        $zip->close();

        return back()->with('success', 'Media files restored successfully.');
    }
}
