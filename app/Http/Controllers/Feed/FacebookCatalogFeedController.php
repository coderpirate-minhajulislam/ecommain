<?php

namespace App\Http\Controllers\Feed;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class FacebookCatalogFeedController extends Controller
{
    public function __invoke(): Response
    {
        if (!Setting::get('fb_catalog_enabled', false)) {
            abort(404);
        }

        $xml = Cache::remember('fb_catalog_feed', 900, function () {
            return $this->generateFeed();
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
        ]);
    }

    private function generateFeed(): string
    {
        $currency = Setting::get('fb_catalog_currency', 'BDT');
        $brand = Setting::get('fb_catalog_brand', Setting::get('site_title', ''));
        $siteUrl = $this->getSiteUrl();

        $products = Product::with(['images', 'category', 'variants'])
            ->where('in_stock', true)
            ->whereHas('images') // Only include products that have at least one image
            ->orderBy('id')
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">' . "\n";
        $xml .= "<channel>\n";
        $xml .= '<title>' . $this->escape($brand . ' Product Catalog') . "</title>\n";
        $xml .= '<link>' . $this->escape($siteUrl) . "</link>\n";
        $xml .= '<description>' . $this->escape('Facebook Product Catalog Feed for ' . $brand) . "</description>\n";

        foreach ($products as $product) {
            if ($product->variants->isNotEmpty()) {
                foreach ($product->variants as $variant) {
                    if (!$variant->in_stock) {
                        continue;
                    }
                    $xml .= $this->buildVariantItem($product, $variant, $currency, $brand, $siteUrl);
                }
            } else {
                $xml .= $this->buildItem($product, $currency, $brand, $siteUrl);
            }
        }

        $xml .= "</channel>\n";
        $xml .= '</rss>';

        return $xml;
    }

    private function buildItem(Product $product, string $currency, string $brand, string $siteUrl): string
    {
        $imageUrl = $product->images->first()?->image_path;
        $fullImageUrl = $imageUrl ? $this->buildImageUrl($siteUrl, $imageUrl) : '';

        // Facebook requires image_link — skip items without it
        if (!$fullImageUrl) {
            return '';
        }

        $description = $this->cleanDescription($product->description ?? $product->short_description ?? $product->name);
        if (!$description) {
            $description = $product->name;
        }

        $xml = "<item>\n";
        $xml .= '  <g:id>' . $this->escape((string) $product->id) . "</g:id>\n";
        $xml .= '  <g:title>' . $this->escape($product->name) . "</g:title>\n";
        $xml .= '  <g:description>' . $this->escape($description) . "</g:description>\n";
        $xml .= '  <g:availability>' . ($product->in_stock ? 'in stock' : 'out of stock') . "</g:availability>\n";
        $xml .= '  <g:condition>new</g:condition>' . "\n";

        if ($product->original_price && $product->original_price > $product->price) {
            $xml .= '  <g:price>' . number_format((float) $product->original_price, 2, '.', '') . ' ' . $currency . "</g:price>\n";
            $xml .= '  <g:sale_price>' . number_format((float) $product->price, 2, '.', '') . ' ' . $currency . "</g:sale_price>\n";
        } else {
            $xml .= '  <g:price>' . number_format((float) $product->price, 2, '.', '') . ' ' . $currency . "</g:price>\n";
        }

        $xml .= '  <g:link>' . $this->escape($siteUrl . '/product/' . $product->slug) . "</g:link>\n";
        $xml .= '  <g:image_link>' . $this->escape($fullImageUrl) . "</g:image_link>\n";

        // Additional images
        foreach ($product->images->skip(1)->take(9) as $image) {
            $xml .= '  <g:additional_image_link>' . $this->escape($this->buildImageUrl($siteUrl, $image->image_path)) . "</g:additional_image_link>\n";
        }

        $xml .= '  <g:brand>' . $this->escape($brand) . "</g:brand>\n";

        if ($product->category) {
            $xml .= '  <g:product_type>' . $this->escape($product->category->name) . "</g:product_type>\n";
        }

        $xml .= "</item>\n";

        return $xml;
    }

    private function buildVariantItem(Product $product, $variant, string $currency, string $brand, string $siteUrl): string
    {
        $imageUrl = $variant->image_path ?: $product->images->first()?->image_path;
        $fullImageUrl = $imageUrl ? $this->buildImageUrl($siteUrl, $imageUrl) : '';

        // Facebook requires image_link — skip items without it
        if (!$fullImageUrl) {
            return '';
        }

        $variantLabel = trim(($variant->size ?? '') . ' ' . ($variant->color ?? ''));
        $variantId = $product->id . '_' . $variant->id;

        $description = $this->cleanDescription($product->description ?? $product->short_description ?? $product->name);
        if (!$description) {
            $description = $product->name;
        }

        $xml = "<item>\n";
        $xml .= '  <g:id>' . $this->escape($variantId) . "</g:id>\n";
        $xml .= '  <g:item_group_id>' . $this->escape((string) $product->id) . "</g:item_group_id>\n";
        $xml .= '  <g:title>' . $this->escape($product->name . ($variantLabel ? ' - ' . $variantLabel : '')) . "</g:title>\n";
        $xml .= '  <g:description>' . $this->escape($description) . "</g:description>\n";
        $xml .= '  <g:availability>' . ($variant->in_stock ? 'in stock' : 'out of stock') . "</g:availability>\n";
        $xml .= '  <g:condition>new</g:condition>' . "\n";

        if ($variant->original_price && $variant->original_price > $variant->price) {
            $xml .= '  <g:price>' . number_format((float) $variant->original_price, 2, '.', '') . ' ' . $currency . "</g:price>\n";
            $xml .= '  <g:sale_price>' . number_format((float) $variant->price, 2, '.', '') . ' ' . $currency . "</g:sale_price>\n";
        } else {
            $xml .= '  <g:price>' . number_format((float) $variant->price, 2, '.', '') . ' ' . $currency . "</g:price>\n";
        }

        $xml .= '  <g:link>' . $this->escape($siteUrl . '/product/' . $product->slug) . "</g:link>\n";
        $xml .= '  <g:image_link>' . $this->escape($fullImageUrl) . "</g:image_link>\n";

        // Additional images from product
        foreach ($product->images->skip(1)->take(9) as $image) {
            $xml .= '  <g:additional_image_link>' . $this->escape($this->buildImageUrl($siteUrl, $image->image_path)) . "</g:additional_image_link>\n";
        }

        $xml .= '  <g:brand>' . $this->escape($brand) . "</g:brand>\n";

        if ($variant->size) {
            $xml .= '  <g:size>' . $this->escape($variant->size) . "</g:size>\n";
        }
        if ($variant->color) {
            $xml .= '  <g:color>' . $this->escape($variant->color) . "</g:color>\n";
        }

        if ($product->category) {
            $xml .= '  <g:product_type>' . $this->escape($product->category->name) . "</g:product_type>\n";
        }

        $xml .= "</item>\n";

        return $xml;
    }

    /**
     * Resolve the public HTTPS base URL for the feed.
     * Facebook requires all URLs (especially image_link) to use HTTPS.
     */
    private function getSiteUrl(): string
    {
        // Prefer APP_URL from config; fall back to request URL
        $url = config('app.url');

        // If APP_URL is still localhost, try to use the request host instead
        if (str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
            $url = request()->getSchemeAndHttpHost();
        }

        // Facebook requires HTTPS — force it
        $url = preg_replace('/^http:\/\//', 'https://', $url);

        return rtrim($url, '/');
    }

    /**
     * Build a fully-qualified, properly-encoded image URL that Facebook can fetch.
     */
    private function buildImageUrl(string $siteUrl, string $imagePath): string
    {
        $path = ltrim($imagePath, '/');

        // If the image_path is already an absolute URL, force HTTPS and return
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return preg_replace('/^http:\/\//', 'https://', $path);
        }

        // Encode each path segment so spaces and special chars are handled
        $segments = explode('/', $path);
        $encodedSegments = array_map(function ($segment) {
            return rawurlencode($segment);
        }, $segments);

        return $siteUrl . '/' . implode('/', $encodedSegments);
    }

    private function cleanDescription(?string $text): string
    {
        if (!$text) {
            return '';
        }

        // Strip HTML tags and decode entities
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        // Remove excessive whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        // Facebook allows max 5000 chars for description
        return mb_substr(trim($text), 0, 5000);
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
