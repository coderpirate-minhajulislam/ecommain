<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PaymentMethod::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100])
            ? (int) $request->input('perPage')
            : 10;

        $paymentMethods = $query->orderBy('sort_order')->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/payment-methods/index', [
            'paymentMethods' => $paymentMethods,
            'filters' => $request->only(['search', 'perPage']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/payment-methods/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:payment_methods'],
            'description' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp,svg', 'max:2048'],
            'icon' => ['nullable', 'string', 'max:100'],
            'account_label' => ['nullable', 'string', 'max:255'],
            'instructions_text' => ['nullable', 'string', 'max:255'],
            'payment_number_label' => ['nullable', 'string', 'max:255'],
            'payment_amount_label' => ['nullable', 'string', 'max:255'],
            'requires_payment_details' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/payment-methods'), $filename);
            $validated['logo'] = '/uploads/payment-methods/' . $filename;
        }

        PaymentMethod::create($validated);
        Cache::forget('shop.payment_methods');

        return redirect()->route('admin.payment-methods.index')->with('success', 'Payment method created successfully.');
    }

    public function edit(PaymentMethod $paymentMethod): Response
    {
        return Inertia::render('admin/payment-methods/edit', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:payment_methods,slug,' . $paymentMethod->id],
            'description' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp,svg', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
            'icon' => ['nullable', 'string', 'max:100'],
            'account_label' => ['nullable', 'string', 'max:255'],
            'instructions_text' => ['nullable', 'string', 'max:255'],
            'payment_number_label' => ['nullable', 'string', 'max:255'],
            'payment_amount_label' => ['nullable', 'string', 'max:255'],
            'requires_payment_details' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        // Handle logo removal
        if ($request->boolean('remove_logo') && $paymentMethod->logo) {
            $oldPath = public_path($paymentMethod->logo);
            if (File::exists($oldPath)) {
                File::delete($oldPath);
            }
            $validated['logo'] = null;
        }

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($paymentMethod->logo) {
                $oldPath = public_path($paymentMethod->logo);
                if (File::exists($oldPath)) {
                    File::delete($oldPath);
                }
            }
            $file = $request->file('logo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/payment-methods'), $filename);
            $validated['logo'] = '/uploads/payment-methods/' . $filename;
        }

        unset($validated['remove_logo']);
        $paymentMethod->update($validated);
        Cache::forget('shop.payment_methods');

        return redirect()->route('admin.payment-methods.index')->with('success', 'Payment method updated successfully.');
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        // Delete logo file if exists
        if ($paymentMethod->logo) {
            $oldPath = public_path($paymentMethod->logo);
            if (File::exists($oldPath)) {
                File::delete($oldPath);
            }
        }

        $paymentMethod->delete();
        Cache::forget('shop.payment_methods');

        return redirect()->route('admin.payment-methods.index')->with('success', 'Payment method deleted successfully.');
    }
}
