<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\ShippingZone;
use App\Models\SubCategory;
use App\Services\ImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::with('category', 'subCategory', 'images', 'variants');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where(function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId)
                  ->orWhereJsonContains('extra_category_ids', (int) $categoryId);
            });
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100])
            ? (int) $request->input('perPage')
            : 10;

        $products = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'filters' => $request->only(['search', 'category_id', 'perPage']),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/products/create', [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'subCategories' => SubCategory::orderBy('name')->get(['id', 'category_id', 'name']),
            'shippingZones' => ShippingZone::orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
            'paymentMethods' => PaymentMethod::where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'sub_category_id' => ['nullable', 'exists:sub_categories,id'],
            'extra_category_ids' => ['nullable', 'array'],
            'extra_category_ids.*' => ['integer', 'exists:categories,id'],
            'extra_sub_category_ids' => ['nullable', 'array'],
            'extra_sub_category_ids.*' => ['integer', 'exists:sub_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'long_description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'original_price' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'offer_timer' => ['nullable', 'date_format:Y-m-d\TH:i'],
            'is_featured' => ['boolean'],
            'is_new_arrival' => ['boolean'],
            'in_stock' => ['boolean'],
            'free_shipping' => ['boolean'],
            'shipping_zones' => ['nullable', 'array'],
            'shipping_zones.*.zone' => ['required', 'string', 'max:100'],
            'shipping_zones.*.charge' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'allowed_payment_methods' => ['nullable', 'array'],
            'allowed_payment_methods.*' => ['string', 'max:50'],
            'size_label' => ['nullable', 'string', 'max:50'],
            'color_label' => ['nullable', 'string', 'max:50'],
            'youtube_video' => ['nullable', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'max:10240'],
            'variants' => ['nullable', 'array'],
            'variants.*.size' => ['nullable', 'string', 'max:50'],
            'variants.*.color' => ['nullable', 'string', 'max:50'],
            'variants.*.price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'variants.*.original_price' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'variants.*.in_stock' => ['boolean'],
            'variants.*.free_shipping' => ['nullable', 'boolean'],
            'variants.*.shipping_zones' => ['nullable', 'array'],
            'variants.*.shipping_zones.*.zone' => ['required', 'string', 'max:100'],
            'variants.*.shipping_zones.*.charge' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'variant_images' => ['nullable', 'array'],
            'variant_images.*' => ['nullable', 'image', 'max:10240'],
        ]);

        // Clear shipping zones when free shipping is enabled
        if (!empty($validated['free_shipping'])) {
            $validated['shipping_zones'] = null;
        }

        // Cast extra IDs to integers for proper JSON contains matching
        if (!empty($validated['extra_category_ids'])) {
            $validated['extra_category_ids'] = array_values(array_unique(array_map('intval', $validated['extra_category_ids'])));
        }
        if (!empty($validated['extra_sub_category_ids'])) {
            $validated['extra_sub_category_ids'] = array_values(array_unique(array_map('intval', $validated['extra_sub_category_ids'])));
        }

        $product = Product::create(collect($validated)->except(['images', 'variants', 'variant_images'])->toArray());

        if ($request->hasFile('images')) {
            $this->storeImages($product, $request->file('images'));
        }

        if (!empty($validated['variants'])) {
            $this->syncVariants($product, $validated['variants'], $request->file('variant_images', []));
        }

        $this->clearProductCaches($product->id);

        return redirect()->route('admin.products.index')->with('success', 'Product created successfully.');
    }

    private function clearProductCaches(?int $productId = null): void
    {
        Cache::forget('shop.products.featured');
        Cache::forget('shop.products.offers');
        Cache::forget('shop.products.deals');
        Cache::forget('shop.products.new_arrivals');
        Cache::forget('shop.products.all');
        if ($productId) {
            Cache::forget('shop.products.related.' . $productId);
            Cache::forget('shop.reviews.' . $productId);

            // Clear landing page caches that use this product (main or extra)
            $landingSlugs = \App\Models\LandingPage::where('product_id', $productId)
                ->orWhereJsonContains('extra_product_ids', $productId)
                ->pluck('slug');
            foreach ($landingSlugs as $slug) {
                Cache::forget('landing.' . $slug);
            }
        }
    }

    public function edit(Product $product): Response
    {
        $product->load('category', 'subCategory', 'images', 'variants');

        return Inertia::render('admin/products/edit', [
            'product' => $product,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'subCategories' => SubCategory::orderBy('name')->get(['id', 'category_id', 'name']),
            'shippingZones' => ShippingZone::orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
            'paymentMethods' => PaymentMethod::where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug']),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'sub_category_id' => ['nullable', 'exists:sub_categories,id'],
            'extra_category_ids' => ['nullable', 'array'],
            'extra_category_ids.*' => ['integer', 'exists:categories,id'],
            'extra_sub_category_ids' => ['nullable', 'array'],
            'extra_sub_category_ids.*' => ['integer', 'exists:sub_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'long_description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'original_price' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'offer_timer' => ['nullable', 'date_format:Y-m-d\TH:i'],
            'is_featured' => ['boolean'],
            'is_new_arrival' => ['boolean'],
            'in_stock' => ['boolean'],
            'free_shipping' => ['boolean'],
            'shipping_zones' => ['nullable', 'array'],
            'shipping_zones.*.zone' => ['required', 'string', 'max:100'],
            'shipping_zones.*.charge' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'allowed_payment_methods' => ['nullable', 'array'],
            'allowed_payment_methods.*' => ['string', 'max:50'],
            'size_label' => ['nullable', 'string', 'max:50'],
            'color_label' => ['nullable', 'string', 'max:50'],
            'youtube_video' => ['nullable', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'max:10240'],
            'remove_images' => ['nullable', 'array'],
            'remove_images.*' => ['integer', 'exists:product_images,id'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.size' => ['nullable', 'string', 'max:50'],
            'variants.*.color' => ['nullable', 'string', 'max:50'],
            'variants.*.price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'variants.*.original_price' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'variants.*.in_stock' => ['boolean'],
            'variants.*.free_shipping' => ['nullable', 'boolean'],
            'variants.*.shipping_zones' => ['nullable', 'array'],
            'variants.*.shipping_zones.*.zone' => ['required', 'string', 'max:100'],
            'variants.*.shipping_zones.*.charge' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'variant_images' => ['nullable', 'array'],
            'variant_images.*' => ['nullable', 'image', 'max:10240'],
        ]);

        // Clear shipping zones when free shipping is enabled
        if (!empty($validated['free_shipping'])) {
            $validated['shipping_zones'] = null;
        }

        // Cast extra IDs to integers for proper JSON contains matching
        if (!empty($validated['extra_category_ids'])) {
            $validated['extra_category_ids'] = array_values(array_unique(array_map('intval', $validated['extra_category_ids'])));
        }
        if (!empty($validated['extra_sub_category_ids'])) {
            $validated['extra_sub_category_ids'] = array_values(array_unique(array_map('intval', $validated['extra_sub_category_ids'])));
        }

        $product->update(collect($validated)->except(['images', 'remove_images', 'variants', 'variant_images'])->toArray());

        // Remove selected images
        if ($request->input('remove_images')) {
            $imagesToRemove = ProductImage::whereIn('id', $request->input('remove_images'))
                ->where('product_id', $product->id)
                ->get();

            foreach ($imagesToRemove as $img) {
                $fullPath = public_path($img->image_path);
                if (File::exists($fullPath)) {
                    File::delete($fullPath);
                }
                $img->delete();
            }
        }

        // Add new images
        if ($request->hasFile('images')) {
            $maxSort = $product->images()->max('sort_order') ?? -1;
            $this->storeImages($product, $request->file('images'), $maxSort + 1);
        }

        // Sync variants
        $this->syncVariants($product, $validated['variants'] ?? [], $request->file('variant_images', []));

        $this->clearProductCaches($product->id);

        return redirect()->route('admin.products.index')->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        // Delete product image files from public folder
        foreach ($product->images as $img) {
            $fullPath = public_path($img->image_path);
            if (File::exists($fullPath)) {
                File::delete($fullPath);
            }
        }

        // Delete variant image files
        foreach ($product->variants as $variant) {
            if ($variant->image_path && File::exists(public_path($variant->image_path))) {
                File::delete(public_path($variant->image_path));
            }
        }

        $product->delete();

        $this->clearProductCaches($product->id);

        return redirect()->route('admin.products.index')->with('success', 'Product deleted successfully.');
    }

    private function storeImages(Product $product, array $files, int $startSort = 0): void
    {
        $dir = 'uploads/products/' . $product->id;
        $publicDir = public_path($dir);
        $imageService = new ImageService();

        foreach ($files as $i => $file) {
            $basename = time() . '_' . $i;
            $imageService->saveAsWebP($file, $publicDir, $basename);

            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $dir . '/' . $basename . '.webp',
                'sort_order' => $startSort + $i,
            ]);
        }
    }

    private function syncVariants(Product $product, array $variants, array $variantImages = []): void
    {
        $keepIds = [];

        foreach ($variants as $index => $variant) {
            $imageFile = $variantImages[$index] ?? null;

            if (!empty($variant['id'])) {
                $existing = ProductVariant::where('id', $variant['id'])
                    ->where('product_id', $product->id)
                    ->first();

                if ($existing) {
                    $imagePath = $existing->image_path;

                    if ($imageFile) {
                        // Delete old image if exists
                        if ($imagePath && File::exists(public_path($imagePath))) {
                            File::delete(public_path($imagePath));
                        }
                        $imagePath = $this->storeVariantImage($product, $imageFile);
                    }

                    $existing->update([
                        'size' => $variant['size'] ?? null,
                        'color' => $variant['color'] ?? null,
                        'price' => $variant['price'],
                        'original_price' => $variant['original_price'] ?? null,
                        'in_stock' => $variant['in_stock'] ?? true,
                        'free_shipping' => isset($variant['free_shipping']) ? (bool) $variant['free_shipping'] : null,
                        'shipping_zones' => !empty($variant['free_shipping']) ? null : ($variant['shipping_zones'] ?? null),
                        'image_path' => $imagePath,
                    ]);
                    $keepIds[] = $existing->id;
                    continue;
                }
            }

            $imagePath = null;
            if ($imageFile) {
                $imagePath = $this->storeVariantImage($product, $imageFile);
            }

            $new = ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variant['size'] ?? null,
                'color' => $variant['color'] ?? null,
                'price' => $variant['price'],
                'original_price' => $variant['original_price'] ?? null,
                'in_stock' => $variant['in_stock'] ?? true,
                'free_shipping' => isset($variant['free_shipping']) ? (bool) $variant['free_shipping'] : null,
                'shipping_zones' => !empty($variant['free_shipping']) ? null : ($variant['shipping_zones'] ?? null),
                'image_path' => $imagePath,
            ]);
            $keepIds[] = $new->id;
        }

        // Delete removed variants (and their images)
        $toDelete = $product->variants()->whereNotIn('id', $keepIds)->get();
        foreach ($toDelete as $variant) {
            if ($variant->image_path && File::exists(public_path($variant->image_path))) {
                File::delete(public_path($variant->image_path));
            }
            $variant->delete();
        }
    }

    private function storeVariantImage(Product $product, $file): string
    {
        $dir = 'uploads/products/' . $product->id . '/variants';
        $publicDir = public_path($dir);
        $basename = time() . '_' . uniqid();

        (new ImageService())->saveAsWebP($file, $publicDir, $basename);

        return $dir . '/' . $basename . '.webp';
    }
}
