<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\ImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Category::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100])
            ? (int) $request->input('perPage')
            : 10;

        $categories = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'perPage']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/categories/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories'],
            'icon' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $this->storeImage($request->file('image'));
        }
        unset($validated['image']);

        Category::create($validated);
        Cache::forget('shop.categories');

        return redirect()->route('admin.categories.index')->with('success', 'Category created successfully.');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('admin/categories/edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name,' . $category->id],
            'icon' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('remove_image') && $category->image_path) {
            File::delete(public_path($category->image_path));
            $validated['image_path'] = null;
        }

        if ($request->hasFile('image')) {
            if ($category->image_path) {
                File::delete(public_path($category->image_path));
            }
            $validated['image_path'] = $this->storeImage($request->file('image'));
        }
        unset($validated['image'], $validated['remove_image']);

        $category->update($validated);
        Cache::forget('shop.categories');

        return redirect()->route('admin.categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->image_path) {
            File::delete(public_path($category->image_path));
        }
        $category->delete();
        Cache::forget('shop.categories');

        return redirect()->route('admin.categories.index')->with('success', 'Category deleted successfully.');
    }

    private function storeImage($file): string
    {
        $dir = 'uploads/categories';
        $publicDir = public_path($dir);
        $basename = time() . '_' . uniqid();

        (new ImageService())->saveAsWebP($file, $publicDir, $basename);

        return $dir . '/' . $basename . '.webp';
    }
}
