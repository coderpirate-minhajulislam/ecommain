<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SubCategory::with('category');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100])
            ? (int) $request->input('perPage')
            : 10;

        $subCategories = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/sub-categories/index', [
            'subCategories' => $subCategories,
            'filters' => $request->only(['search', 'category_id', 'perPage']),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/sub-categories/create', [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255', Rule::unique('sub_categories')->where('category_id', $request->input('category_id'))],
        ]);

        SubCategory::create($validated);
        Cache::forget('shop.categories');

        return redirect()->route('admin.sub-categories.index')->with('success', 'Sub category created successfully.');
    }

    public function edit(SubCategory $subCategory): Response
    {
        $subCategory->load('category');

        return Inertia::render('admin/sub-categories/edit', [
            'subCategory' => $subCategory,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, SubCategory $subCategory): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255', Rule::unique('sub_categories')->where('category_id', $request->input('category_id'))->ignore($subCategory->id)],
        ]);

        $subCategory->update($validated);
        Cache::forget('shop.categories');

        return redirect()->route('admin.sub-categories.index')->with('success', 'Sub category updated successfully.');
    }

    public function destroy(SubCategory $subCategory): RedirectResponse
    {
        $subCategory->delete();
        Cache::forget('shop.categories');

        return redirect()->route('admin.sub-categories.index')->with('success', 'Sub category deleted successfully.');
    }
}
