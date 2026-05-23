<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ShippingZoneController extends Controller
{
    public function index(): Response
    {
        $zones = ShippingZone::orderBy('sort_order')->orderBy('name')->get();

        return Inertia::render('admin/shipping-zones/index', [
            'zones' => $zones,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/shipping-zones/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:100'],
            'districts'  => ['nullable', 'array'],
            'districts.*' => ['required', 'string', 'max:100'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $validated['districts'] = array_values(array_unique(array_map(
            fn (string $district) => trim($district),
            array_filter($validated['districts'] ?? [], fn ($district) => is_string($district) && trim($district) !== '')
        )));

        ShippingZone::create($validated);
        Cache::forget('shop.shipping_zones');
        Cache::forget('shop.shipping_zone_classes');

        return redirect()->route('admin.shipping-zones.index')->with('success', 'Shipping zone created successfully.');
    }

    public function edit(ShippingZone $shippingZone): Response
    {
        return Inertia::render('admin/shipping-zones/edit', [
            'zone' => $shippingZone,
        ]);
    }

    public function update(Request $request, ShippingZone $shippingZone): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:100'],
            'districts'  => ['nullable', 'array'],
            'districts.*' => ['required', 'string', 'max:100'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $validated['districts'] = array_values(array_unique(array_map(
            fn (string $district) => trim($district),
            array_filter($validated['districts'] ?? [], fn ($district) => is_string($district) && trim($district) !== '')
        )));

        $shippingZone->update($validated);
        Cache::forget('shop.shipping_zones');
        Cache::forget('shop.shipping_zone_classes');

        return redirect()->route('admin.shipping-zones.index')->with('success', 'Shipping zone updated successfully.');
    }

    public function destroy(ShippingZone $shippingZone): RedirectResponse
    {
        $shippingZone->delete();
        Cache::forget('shop.shipping_zones');
        Cache::forget('shop.shipping_zone_classes');

        return redirect()->route('admin.shipping-zones.index')->with('success', 'Shipping zone deleted.');
    }
}
