<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateProductSlugs extends Command
{
    protected $signature = 'products:generate-slugs';

    protected $description = 'Generate slugs for all products without a slug';

    public function handle(): int
    {
        $products = Product::whereNull('slug')->orWhere('slug', '')->get();

        if ($products->isEmpty()) {
            $this->info('All products already have slugs.');
            return 0;
        }

        $this->info("Generating slugs for {$products->count()} products...");

        foreach ($products as $product) {
            $slug = Str::slug($product->name);
            $count = 1;

            while (Product::where('slug', $slug)
                ->where('id', '!=', $product->id)
                ->exists()) {
                $slug = Str::slug($product->name) . '-' . $count;
                $count++;
            }

            $product->slug = $slug;
            $product->save();
            $this->line("✓ {$product->name} → {$product->slug}");
        }

        $this->info('Slug generation completed!');
        return 0;
    }
}
