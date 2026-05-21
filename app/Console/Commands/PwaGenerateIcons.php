<?php

namespace App\Console\Commands;

use App\Models\Setting;
use Illuminate\Console\Command;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class PwaGenerateIcons extends Command
{
    protected $signature   = 'pwa:generate-icons';
    protected $description = 'Generate static PWA icon files (icon-192.png, icon-512.png, apple-touch-icon.png) from the current site logo';

    public function handle(): int
    {
        $logo = Setting::get('site_logo', '');
        $src  = $logo ? public_path($logo) : null;

        if (!$src || !file_exists($src)) {
            // Try common fallback filenames (including the unusual *.png1 variants in this project)
            $candidates = [
                'apple-touch-icon.png',
                'apple-touch-icon.png1',
                'favicon.png',
                'favicon.ico',
                'favicon.ico1',
            ];
            foreach ($candidates as $fb) {
                $try = public_path($fb);
                if (file_exists($try)) {
                    $src = $try;
                    $this->line("  Using fallback: public/{$fb}");
                    break;
                }
            }
        }

        $manager = new ImageManager(new Driver());

        if (!$src || !file_exists($src)) {
            // No source found — generate a simple solid-colour placeholder icon
            $this->warn('No source image found — generating a placeholder icon.');
            $primaryHex = Setting::get('theme_primary_hex', '#16a34a');
            [$r, $g, $b] = sscanf($primaryHex, '#%02x%02x%02x');
            $src = sys_get_temp_dir() . '/pwa_placeholder.png';
            $img = $manager->create(512, 512)->fill("rgb({$r},{$g},{$b})");
            $img->toPng()->save($src);
        }

        $this->info("Source: {$src}");

        $sizes = [
            'icon-192.png'         => 192,
            'icon-512.png'         => 512,
            'apple-touch-icon.png' => 180,
        ];

        foreach ($sizes as $filename => $size) {
            $dest = public_path($filename);
            $img  = $manager->read($src);
            $img->cover($size, $size);
            $img->toPng()->save($dest);
            $this->info("  Written: public/{$filename} ({$size}×{$size})");
        }

        $this->info('PWA icons generated successfully. Run php artisan optimize to clear cache.');

        return self::SUCCESS;
    }
}
