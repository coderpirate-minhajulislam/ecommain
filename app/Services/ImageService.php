<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageService
{
    /**
     * Convert any uploaded image to WebP at quality 90 (near-lossless)
     * and save it to the given directory. Returns the relative public path.
     */
    public function saveAsWebP(UploadedFile $file, string $publicDir, string $basename): string
    {
        if (!File::isDirectory($publicDir)) {
            File::makeDirectory($publicDir, 0755, true);
        }

        $manager  = new ImageManager(new Driver());
        $image    = $manager->read($file->getRealPath());
        $filename = $basename . '.webp';
        $fullPath = $publicDir . '/' . $filename;

        // quality 90 = visually lossless for WebP
        $image->toWebp(90)->save($fullPath);

        return $fullPath;
    }
}
