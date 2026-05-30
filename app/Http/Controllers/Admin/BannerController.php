<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Services\ImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class BannerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/banners/index', [
            'banners' => Banner::orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/banners/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'       => ['nullable', 'string', 'max:255'],
            'subtitle'    => ['nullable', 'string', 'max:500'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:500'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['boolean'],
            'position'    => ['nullable', 'string', 'in:hero,mid,popup'],
            'popup_timer' => ['nullable', 'integer', 'min:1', 'max:60'],
            'image'       => ['required', 'image', 'max:10240'],
        ]);

        $imagePath = $this->storeImage($request);

        Banner::create(array_merge(
            collect($validated)->except(['image'])->toArray(),
            [
                'image_path' => $imagePath,
                'sort_order' => $validated['sort_order'] ?? 0,
                'position'   => $validated['position'] ?? 'hero',
                'popup_timer' => $validated['popup_timer'] ?? 5,
            ],
        ));

        Cache::forget('shop.banners');
        Cache::forget('shop.mid_banners');
        Cache::forget('shop.popup_banners');

        return redirect()->route('admin.banners.index')->with('success', 'Banner created successfully.');
    }

    public function edit(Banner $banner): Response
    {
        return Inertia::render('admin/banners/edit', ['banner' => $banner]);
    }

    public function update(Request $request, Banner $banner): RedirectResponse
    {
        $validated = $request->validate([
            'title'       => ['nullable', 'string', 'max:255'],
            'subtitle'    => ['nullable', 'string', 'max:500'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:500'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['boolean'],
            'position'    => ['nullable', 'string', 'in:hero,mid,popup'],
            'popup_timer' => ['nullable', 'integer', 'min:1', 'max:60'],
            'image'       => ['nullable', 'image', 'max:10240'],
        ]);

        $data = collect($validated)->except(['image'])->toArray();
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['position'] = $data['position'] ?? $banner->position;
        $data['popup_timer'] = $data['popup_timer'] ?? $banner->popup_timer ?? 5;

        if ($request->hasFile('image')) {
            $old = public_path($banner->image_path);
            if (File::exists($old)) {
                File::delete($old);
            }
            $data['image_path'] = $this->storeImage($request);
        }

        $banner->update($data);
        Cache::forget('shop.banners');
        Cache::forget('shop.mid_banners');
        Cache::forget('shop.popup_banners');

        return redirect()->route('admin.banners.index')->with('success', 'Banner updated successfully.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        $imagePath = public_path($banner->image_path);
        if (File::exists($imagePath)) {
            File::delete($imagePath);
        }

        $banner->delete();
        Cache::forget('shop.banners');
        Cache::forget('shop.mid_banners');

        return redirect()->route('admin.banners.index')->with('success', 'Banner deleted successfully.');
    }

    private function storeImage(Request $request): string
    {
        $dir = public_path('uploads/banners');
        $basename = time() . '_' . uniqid();

        (new ImageService())->saveAsWebP($request->file('image'), $dir, $basename);

        return 'uploads/banners/' . $basename . '.webp';
    }
}
