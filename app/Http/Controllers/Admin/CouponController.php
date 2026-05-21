<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Coupon::query();

        if ($search = $request->input('search')) {
            $query->where('code', 'like', "%{$search}%");
        }

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100])
            ? (int) $request->input('perPage')
            : 10;

        $coupons = $query->withCount('products')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/coupons/index', [
            'coupons' => $coupons,
            'filters' => $request->only(['search', 'perPage', 'status']),
        ]);
    }

    public function create(): Response
    {
        $products = Product::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/coupons/create', [
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons'],
            'type' => ['required', 'in:fixed,percentage'],
            'value' => ['required', 'numeric', 'min:0.01'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_global' => ['boolean'],
            'is_active' => ['boolean'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
        ]);

        $productIds = $validated['product_ids'] ?? [];
        unset($validated['product_ids']);

        $coupon = Coupon::create($validated);

        if (!$coupon->is_global && !empty($productIds)) {
            $coupon->products()->sync($productIds);
        }

        Cache::forget('shop.has_global_coupons');
        Cache::forget('shop.coupon_product_ids');

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon created successfully.');
    }

    public function edit(Coupon $coupon): Response
    {
        $coupon->load('products:id');
        $products = Product::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/coupons/edit', [
            'coupon' => $coupon,
            'products' => $products,
        ]);
    }

    public function update(Request $request, Coupon $coupon): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code,' . $coupon->id],
            'type' => ['required', 'in:fixed,percentage'],
            'value' => ['required', 'numeric', 'min:0.01'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_global' => ['boolean'],
            'is_active' => ['boolean'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
        ]);

        $productIds = $validated['product_ids'] ?? [];
        unset($validated['product_ids']);

        $coupon->update($validated);

        if ($coupon->is_global) {
            $coupon->products()->detach();
        } else {
            $coupon->products()->sync($productIds);
        }

        Cache::forget('shop.has_global_coupons');
        Cache::forget('shop.coupon_product_ids');

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon updated successfully.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $coupon->products()->detach();
        $coupon->delete();

        Cache::forget('shop.has_global_coupons');
        Cache::forget('shop.coupon_product_ids');

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon deleted successfully.');
    }
}
