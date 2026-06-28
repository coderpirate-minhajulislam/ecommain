<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingPage;
use App\Models\Product;
use App\Services\ImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LandingPage::with('product:id,name');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100])
            ? (int) $request->input('perPage')
            : 10;

        $landingPages = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/landing-pages/index', [
            'landingPages' => $landingPages,
            'filters' => $request->only(['search', 'perPage']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/landing-pages/create', [
            'products' => Product::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'extra_product_ids' => ['nullable', 'array'],
            'extra_product_ids.*' => ['integer', 'exists:products,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:landing_pages', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'hero_text' => ['nullable', 'string', 'max:1000'],
            'badge_text' => ['nullable', 'string', 'max:255'],
            'icon_name' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'use_cases' => ['nullable', 'array'],
            'use_cases.*.label' => ['required_with:use_cases', 'string', 'max:255'],
            'use_cases.*.icon_name' => ['nullable', 'string', 'max:50'],
            'use_cases_title' => ['nullable', 'string', 'max:255'],
            'use_cases_subtitle' => ['nullable', 'string', 'max:500'],
            'features' => ['nullable', 'array'],
            'features.*.title' => ['required_with:features', 'string', 'max:255'],
            'features.*.desc' => ['required_with:features', 'string', 'max:500'],
            'features.*.icon_name' => ['nullable', 'string', 'max:50'],
            'features_title' => ['nullable', 'string', 'max:255'],
            'features_subtitle' => ['nullable', 'string', 'max:500'],
            'specifications' => ['nullable', 'array'],
            'specifications.*.title' => ['required_with:specifications', 'string', 'max:255'],
            'specifications.*.specs' => ['required_with:specifications', 'array'],
            'specifications.*.icon_name' => ['nullable', 'string', 'max:50'],
            'specifications_title' => ['nullable', 'string', 'max:255'],
            'specifications_subtitle' => ['nullable', 'string', 'max:500'],
            'authentic_badge_text' => ['nullable', 'string', 'max:255'],
            'authentic_badge_icon' => ['nullable', 'string', 'max:50'],
            'delivery_badge_text' => ['nullable', 'string', 'max:255'],
            'delivery_badge_icon' => ['nullable', 'string', 'max:50'],
            'why_buy' => ['nullable', 'array'],
            'why_buy.*.title' => ['required_with:why_buy', 'string', 'max:255'],
            'why_buy.*.desc' => ['required_with:why_buy', 'string', 'max:255'],
            'why_buy.*.icon_name' => ['nullable', 'string', 'max:50'],
            'why_buy_title' => ['nullable', 'string', 'max:255'],
            'why_buy_super_text' => ['nullable', 'string', 'max:255'],
            'why_buy_subtitle' => ['nullable', 'string', 'max:500'],
            'checkout_banner_text' => ['nullable', 'string', 'max:500'],
            'checkout_title' => ['nullable', 'string', 'max:255'],
            'review_images_title' => ['nullable', 'string', 'max:255'],
            'order_now_text' => ['nullable', 'string', 'max:100'],
            'footer_text' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'free_shipping_enabled' => ['nullable', 'boolean'],
            'free_shipping_amount' => ['nullable', 'integer', 'min:0'],
            'countdown_enabled' => ['boolean'],
            'countdown_end_time' => $request->input('countdown_enabled') ? ['required', 'date_format:Y-m-d\TH:i', 'after:now'] : ['nullable'],
            'hero_video' => ['nullable', 'string', 'max:255'],
            'template' => ['nullable', 'string', 'in:v1,v2,v3'],
            'hero_images' => ['nullable', 'array', 'max:10'],
            'hero_images.*' => ['image', 'max:10240'],
            'review_images' => ['nullable', 'array', 'max:10'],
            'review_images.*' => ['image', 'max:10240'],
        ]);

        $landingPage = LandingPage::create(collect($validated)->except(['hero_images', 'review_images'])->toArray());

        if ($request->hasFile('hero_images')) {
            $paths = $this->storeHeroImages($landingPage, $request->file('hero_images'));
            $landingPage->update(['hero_images' => $paths]);
        }

        if ($request->hasFile('review_images')) {
            $paths = $this->storeHeroImages($landingPage, $request->file('review_images'));
            $landingPage->update(['review_images' => $paths]);
        }

        return redirect()->route('admin.landing-pages.index')->with('success', 'Landing page created successfully.');
    }

    public function edit(LandingPage $landingPage): Response
    {
        return Inertia::render('admin/landing-pages/edit', [
            'landingPage' => $landingPage->load('product:id,name'),
            'products' => Product::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, LandingPage $landingPage): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'extra_product_ids' => ['nullable', 'array'],
            'extra_product_ids.*' => ['integer', 'exists:products,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('landing_pages')->ignore($landingPage->id), 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'hero_text' => ['nullable', 'string', 'max:1000'],
            'badge_text' => ['nullable', 'string', 'max:255'],
            'icon_name' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'use_cases' => ['nullable', 'array'],
            'use_cases.*.label' => ['required_with:use_cases', 'string', 'max:255'],
            'use_cases.*.icon_name' => ['nullable', 'string', 'max:50'],
            'use_cases_title' => ['nullable', 'string', 'max:255'],
            'use_cases_subtitle' => ['nullable', 'string', 'max:500'],
            'features' => ['nullable', 'array'],
            'features.*.title' => ['required_with:features', 'string', 'max:255'],
            'features.*.desc' => ['required_with:features', 'string', 'max:500'],
            'features.*.icon_name' => ['nullable', 'string', 'max:50'],
            'features_title' => ['nullable', 'string', 'max:255'],
            'features_subtitle' => ['nullable', 'string', 'max:500'],
            'specifications' => ['nullable', 'array'],
            'specifications.*.title' => ['required_with:specifications', 'string', 'max:255'],
            'specifications.*.specs' => ['required_with:specifications', 'array'],
            'specifications.*.icon_name' => ['nullable', 'string', 'max:50'],
            'specifications_title' => ['nullable', 'string', 'max:255'],
            'specifications_subtitle' => ['nullable', 'string', 'max:500'],
            'authentic_badge_text' => ['nullable', 'string', 'max:255'],
            'authentic_badge_icon' => ['nullable', 'string', 'max:50'],
            'delivery_badge_text' => ['nullable', 'string', 'max:255'],
            'delivery_badge_icon' => ['nullable', 'string', 'max:50'],
            'why_buy' => ['nullable', 'array'],
            'why_buy.*.title' => ['required_with:why_buy', 'string', 'max:255'],
            'why_buy.*.desc' => ['required_with:why_buy', 'string', 'max:255'],
            'why_buy.*.icon_name' => ['nullable', 'string', 'max:50'],
            'why_buy_title' => ['nullable', 'string', 'max:255'],
            'why_buy_super_text' => ['nullable', 'string', 'max:255'],
            'why_buy_subtitle' => ['nullable', 'string', 'max:500'],
            'checkout_banner_text' => ['nullable', 'string', 'max:500'],
            'checkout_title' => ['nullable', 'string', 'max:255'],
            'review_images_title' => ['nullable', 'string', 'max:255'],
            'order_now_text' => ['nullable', 'string', 'max:100'],
            'footer_text' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'free_shipping_enabled' => ['nullable', 'boolean'],
            'free_shipping_amount' => ['nullable', 'integer', 'min:0'],
            'countdown_enabled' => ['boolean'],
            'countdown_end_time' => $request->input('countdown_enabled') ? ['required', 'date_format:Y-m-d\TH:i', 'after:now'] : ['nullable'],
            'hero_video' => ['nullable', 'string', 'max:255'],
            'template' => ['nullable', 'string', 'in:v1,v2,v3'],
            'existing_hero_images.*' => ['string'],
            'hero_images' => ['nullable', 'array', 'max:10'],
            'hero_images.*' => ['image', 'max:10240'],
            'existing_review_images.*' => ['string'],
            'review_images' => ['nullable', 'array', 'max:10'],
            'review_images.*' => ['image', 'max:10240'],
        ]);

        // Get existing images that will be kept
        $existingPaths = $request->input('existing_hero_images', []) ?: [];

        // Delete images that are no longer selected
        if ($landingPage->hero_images) {
            foreach ($landingPage->hero_images as $imagePath) {
                if (!in_array($imagePath, $existingPaths)) {
                    $fullPath = public_path($imagePath);
                    if (File::exists($fullPath)) {
                        File::delete($fullPath);
                    }
                }
            }
        }

        // Store new images
        $newPaths = [];
        if ($request->hasFile('hero_images')) {
            $newPaths = $this->storeHeroImages($landingPage, $request->file('hero_images'));
        }

        // Merge existing kept images + newly uploaded images
        $allHeroImages = array_values(array_merge($existingPaths, $newPaths));

        // Handle review images
        $existingReviewPaths = $request->input('existing_review_images', []) ?: [];

        if ($landingPage->review_images) {
            foreach ($landingPage->review_images as $imagePath) {
                if (!in_array($imagePath, $existingReviewPaths)) {
                    $fullPath = public_path($imagePath);
                    if (File::exists($fullPath)) {
                        File::delete($fullPath);
                    }
                }
            }
        }

        $newReviewPaths = [];
        if ($request->hasFile('review_images')) {
            $newReviewPaths = $this->storeHeroImages($landingPage, $request->file('review_images'));
        }

        $allReviewImages = array_values(array_merge($existingReviewPaths, $newReviewPaths));

        $landingPage->update(array_merge(
            collect($validated)->except(['hero_images', 'existing_hero_images', 'review_images', 'existing_review_images'])->toArray(),
            ['hero_images' => $allHeroImages ?: null, 'review_images' => $allReviewImages ?: null]
        ));

        Cache::forget('landing.' . $landingPage->slug);

        return redirect()->route('admin.landing-pages.index')->with('success', 'Landing page updated successfully.');
    }

    public function destroy(LandingPage $landingPage): RedirectResponse
    {
        // Delete hero image files from public folder
        if ($landingPage->hero_images) {
            foreach ($landingPage->hero_images as $imagePath) {
                $fullPath = public_path($imagePath);
                if (File::exists($fullPath)) {
                    File::delete($fullPath);
                }
            }
        }

        // Delete review image files from public folder
        if ($landingPage->review_images) {
            foreach ($landingPage->review_images as $imagePath) {
                $fullPath = public_path($imagePath);
                if (File::exists($fullPath)) {
                    File::delete($fullPath);
                }
            }
        }

        Cache::forget('landing.' . $landingPage->slug);

        $landingPage->delete();

        return redirect()->route('admin.landing-pages.index')->with('success', 'Landing page deleted successfully.');
    }

    private function storeHeroImages(LandingPage $landingPage, array $files): array
    {
        $dir = 'uploads/landing/' . $landingPage->id;
        $publicDir = public_path($dir);
        $imageService = new ImageService();

        $paths = [];
        foreach ($files as $i => $file) {
            $basename = time() . '_' . $i;
            $imageService->saveAsWebP($file, $publicDir, $basename);
            $paths[] = $dir . '/' . $basename . '.webp';
        }

        return $paths;
    }
}
