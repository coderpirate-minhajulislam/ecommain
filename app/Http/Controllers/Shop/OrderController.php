<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\BlockedIp;
use App\Models\Setting;
use App\Services\TrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function checkPhoneRatio(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^01\d{9}$/'],
        ]);

        $phone = $request->input('phone');
        $restricted = false;
        $bestRatio = 100.0;
        $totalParcel = 0;
        $successParcel = 0;
        $cancelledParcel = 0;
        $source = null;
        $externalDataFound = false;

        // --- BD Courier check ---
        $bdApiKey = Setting::get('bdcourier_api_key', '');
        $bdThreshold = (int) Setting::get('bdcourier_min_success_ratio', 0);
        $bdBlockZero = (bool) Setting::get('bdcourier_block_zero_ratio', false);

        if ($bdApiKey && ($bdThreshold > 0 || $bdBlockZero)) {
            try {
                $ch = curl_init('https://api.bdcourier.com/courier-check');
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['phone' => $phone]));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $bdApiKey,
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode === 200) {
                    $json = json_decode($response, true);
                    $summary = ($json['status'] ?? '') === 'success' ? ($json['data']['summary'] ?? null) : null;
                    if ($summary !== null) {
                        $parcels = (int) ($summary['total_parcel'] ?? 0);
                        $ratio = (float) ($summary['success_ratio'] ?? ($parcels > 0 ? 100 : 100));
                        if ($parcels > 0) {
                            $externalDataFound = true;
                            if (($bdThreshold > 0 && $ratio < $bdThreshold) || ($bdBlockZero && $ratio == 0.0)) {
                                $restricted = true;
                            }
                            $bestRatio = $ratio;
                            $totalParcel = $parcels;
                            $successParcel = (int) ($summary['success_parcel'] ?? 0);
                            $cancelledParcel = (int) ($summary['cancelled_parcel'] ?? 0);
                            $source = 'bdcourier';
                        } elseif ($bdBlockZero && array_key_exists('success_ratio', $summary ?? []) && $ratio == 0.0) {
                            // API explicitly returns 0% with 0 total parcels — block if setting is on
                            $restricted = true;
                            $source = 'bdcourier';
                        }
                    }
                }
            } catch (\Throwable $e) {
                \Log::warning('BD Courier API error for phone ' . $phone . ': ' . $e->getMessage());
            }
        }

        // --- Order Ratio Check API ---
        $orcApiKey = Setting::get('orderratiocheck_api_key', '');
        $orcDomain = Setting::get('orderratiocheck_domain', '');
        $orcThreshold = (int) Setting::get('orderratiocheck_min_success_ratio', 0);
        $orcBlockZero = (bool) Setting::get('orderratiocheck_block_zero_ratio', false);

        if ($orcApiKey && ($orcThreshold > 0 || $orcBlockZero)) {
            try {
                $ch = curl_init('https://app.growever.bd/api/courier-check');
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['phone' => $phone]));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $orcApiKey,
                    'Referer: https://' . $orcDomain . '/',
                    'X-Domain: ' . $orcDomain,
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode === 200) {
                    $json = json_decode($response, true);
                    $summary = ($json['status'] ?? '') === 'success' ? ($json['data']['summary'] ?? null) : null;
                    if ($summary !== null) {
                        $parcels = (int) ($summary['total_parcel'] ?? 0);
                        $ratio = (float) ($summary['success_ratio'] ?? ($parcels > 0 ? 100 : 100));
                        if ($parcels > 0) {
                            $externalDataFound = true;
                            if (($orcThreshold > 0 && $ratio < $orcThreshold) || ($orcBlockZero && $ratio == 0.0)) {
                                $restricted = true;
                            }
                            // Use the lower ratio as the reported ratio
                            if ($ratio < $bestRatio) {
                                $bestRatio = $ratio;
                                $totalParcel = $parcels;
                                $successParcel = (int) ($summary['success_parcel'] ?? 0);
                                $cancelledParcel = (int) ($summary['cancelled_parcel'] ?? 0);
                                $source = 'orderratiocheck';
                            }
                        } elseif ($orcBlockZero && array_key_exists('success_ratio', $summary ?? []) && $ratio == 0.0) {
                            // API explicitly returns 0% with 0 total parcels — block if setting is on
                            $restricted = true;
                            $source = 'orderratiocheck';
                        }
                    }
                }
            } catch (\Throwable $e) {
                \Log::warning('Order Ratio Check API error for phone ' . $phone . ': ' . $e->getMessage());
            }
        }

        // If neither API is configured, allow all
        $bdActive = $bdApiKey && ($bdThreshold > 0 || $bdBlockZero);
        $orcActive = $orcApiKey && ($orcThreshold > 0 || $orcBlockZero);
        if (!$bdActive && !$orcActive) {
            return response()->json(['restricted' => false]);
        }

        // --- Local store order fallback ---
        // When external APIs have no data for this phone, fall back to the
        // store's own order history. Applied against both the threshold and
        // the block-zero-ratio setting.
        if (!$restricted && !$externalDataFound) {
            $localDelivered = Order::where('phone', $phone)->where('status', 'delivered')->count();
            $localCancelled = Order::where('phone', $phone)->where('status', 'cancelled')->count();
            $localTotal = $localDelivered + $localCancelled;
            if ($localTotal > 0) {
                $localRatio = round(($localDelivered / $localTotal) * 100, 2);
                $effectiveThreshold = max($bdActive ? $bdThreshold : 0, $orcActive ? $orcThreshold : 0);
                $blockByZero = ($bdBlockZero || $orcBlockZero) && $localRatio == 0.0;
                $blockByThreshold = $effectiveThreshold > 0 && $localRatio < $effectiveThreshold;
                if ($blockByZero || $blockByThreshold) {
                    $restricted = true;
                    $totalParcel = $localTotal;
                    $successParcel = $localDelivered;
                    $cancelledParcel = $localCancelled;
                    $bestRatio = $localRatio;
                    $source = 'local';
                }
            }
        }

        return response()->json([
            'restricted' => $restricted,
            'success_ratio' => $bestRatio,
            'total_parcel' => $totalParcel,
            'success_parcel' => $successParcel,
            'cancelled_parcel' => $cancelledParcel,
            'source' => $source,
        ]);
    }

    public function initCheckout(Request $request): JsonResponse
    {
        $items = $request->input('items', []);
        $value = (float) $request->input('value', 0);

        $eventId = null;
        try {
            $tracking = new TrackingService();
            $eventId = $tracking->trackBeginCheckout($request, $items, $value);
        } catch (\Throwable) {
            $eventId = TrackingService::eventId('checkout');
        }

        return response()->json(['event_id' => $eventId]);
    }

    public function store(Request $request)
    {
        if (BlockedIp::isBlocked($request->ip(), $request->input('phone') ?: null)) {
            return back()->withErrors(['blocked' => 'Your access has been restricted. You cannot place orders.']);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'phone' => ['required', 'string', 'regex:/^01\d{9}$/'],

            'email' => 'nullable|email|max:255',
            'district' => ['nullable', 'string', 'max:100'],
            'address' => 'required|string|max:500',
            'delivery_zone' => 'required|string|max:100',
            'payment_method' => ['required', 'string', 'exists:payment_methods,slug', function ($attribute, $value, $fail) {
                if (!PaymentMethod::where('slug', $value)->where('is_active', true)->exists()) {
                    $fail('The selected payment method is not available.');
                }
            }],
            'payment_phone' => ['nullable', 'string', 'max:20'],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_screenshot' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'coupon_code' => 'nullable|string|max:50',
            'note' => 'nullable|string|max:1000',
            'utm_source'   => 'nullable|string|max:100',
            'utm_medium'   => 'nullable|string|max:100',
            'utm_campaign' => 'nullable|string|max:255',
            'utm_content'  => 'nullable|string|max:255',
            'utm_term'     => 'nullable|string|max:255',
        ]);

        // Check if selected payment method requires payment details
        $paymentMethod = PaymentMethod::where('slug', $validated['payment_method'])->first();
        if ($paymentMethod && $paymentMethod->requires_payment_details) {
            $request->validate([
                'payment_phone' => 'required|string|max:20',
                'payment_amount' => 'required|numeric|min:0',
                'payment_screenshot' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            ]);
        }

        $deliveryZone = $validated['delivery_zone'];

        // Build order items and calculate totals
        $subtotal = 0;
        $maxShipping = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $variant = $item['variant_id'] ? ProductVariant::findOrFail($item['variant_id']) : null;
            $quantity = $item['quantity'];

            // Check stock availability for variant or product
            if ($variant) {
                // If variant is out of stock
                if (!$variant->in_stock || $variant->stock_quantity === 0) {
                    return back()->withErrors([
                        'stock' => "The product variant '{$product->name}' is currently out of stock."
                    ]);
                }
                // If variant has limited stock and requested quantity exceeds available stock
                if ($variant->stock_quantity !== null && $quantity > $variant->stock_quantity) {
                    return back()->withErrors([
                        'stock' => "Only {$variant->stock_quantity} unit(s) of '{$product->name}' available in stock."
                    ]);
                }
            } else {
                // If product is out of stock
                if (!$product->in_stock || $product->stock_quantity === 0) {
                    return back()->withErrors([
                        'stock' => "The product '{$product->name}' is currently out of stock."
                    ]);
                }
                // If product has limited stock and requested quantity exceeds available stock
                if ($product->stock_quantity !== null && $quantity > $product->stock_quantity) {
                    return back()->withErrors([
                        'stock' => "Only {$product->stock_quantity} unit(s) of '{$product->name}' available in stock."
                    ]);
                }
            }

            $price = $variant ? (float) $variant->price : (float) $product->price;
            $lineTotal = $price * $quantity;
            $subtotal += $lineTotal;

            // Resolve shipping: variant overrides product when free_shipping !== null
            $effectiveFreeShipping = ($variant && $variant->free_shipping !== null)
                ? (bool) $variant->free_shipping
                : (bool) $product->free_shipping;
            $effectiveZones = ($variant && $variant->free_shipping === false)
                ? ($variant->shipping_zones ?? [])
                : (($variant && $variant->free_shipping === true) ? [] : ($product->shipping_zones ?? []));

            if (!$effectiveFreeShipping) {
                $matched = collect($effectiveZones)->firstWhere('zone', $deliveryZone);
                $charge = $matched ? (float) $matched['charge'] : 0;
                if ($charge > $maxShipping) {
                    $maxShipping = $charge;
                }
            }

            $variantLabel = null;
            if ($variant) {
                $parts = [];
                if ($variant->size) $parts[] = $variant->size;
                if ($variant->color) $parts[] = $variant->color;
                $variantLabel = implode(' / ', $parts);
            }

            $orderItems[] = [
                'product_id' => $product->id,
                'product_variant_id' => $variant?->id,
                'product_name' => $product->name,
                'variant_label' => $variantLabel,
                'price' => $price,
                'quantity' => $quantity,
                'total' => $lineTotal,
            ];
        }

        $shipping = $maxShipping;

        // Coupon processing
        $discount = 0;
        $couponCode = null;
        if (!empty($validated['coupon_code'])) {
            $coupon = Coupon::where('code', strtoupper($validated['coupon_code']))->first();
            if ($coupon && $coupon->isValid($subtotal)) {
                $productIds = array_column($validated['items'], 'product_id');
                $applicable = $coupon->is_global || !empty(array_intersect($productIds, $coupon->products()->pluck('products.id')->toArray()));
                if ($applicable) {
                    $discount = $coupon->calculateDiscount($subtotal);
                    $couponCode = $coupon->code;
                    $coupon->increment('used_count');
                }
            }
        }

        $total = $subtotal + $shipping - $discount;

        // Auto-detect order source from ad-click signals only.
        // _fbp / _ttp are session-persistent cookies set for ALL pixel visitors - not ad-click indicators.
        // Only fbc (contains fbclid), ttclid, and gclid prove an actual ad click.
        $orderSource = null;
        if (\App\Services\TrackingService::resolveFbc($request)) {
            $orderSource = 'fb';
        } elseif (\App\Services\TrackingService::resolveTtclid($request)) {
            $orderSource = 'tiktok';
        } elseif (\App\Services\TrackingService::resolveGclid($request)) {
            $orderSource = 'google_ads';
        } else {
            $orderSource = 'direct';
        }

        $order = Order::create([
            'user_id' => Auth::id(),
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'status' => 'pending',
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'discount' => $discount,
            'coupon_code' => $couponCode,
            'total' => $total,
            'first_name' => $validated['first_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'district' => $validated['district'] ?? null,
            'address' => $validated['address'],
            'delivery_zone' => $deliveryZone,
            'payment_method' => $validated['payment_method'],
            'payment_phone' => $validated['payment_phone'] ?? null,
            'payment_amount' => $validated['payment_amount'] ?? null,
            'note' => $validated['note'] ?? null,
            'order_source' => $orderSource,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            // Persist tracking cookies for delayed server-side events + EMQ improvement
            // resolveFbc() validates the _fbc cookie timestamp; expired values (>90 days) are
            // discarded to prevent the Meta CAPI "expired fbclid value" diagnostic error.
            'fbc'          => \App\Services\TrackingService::resolveFbc($request),
            'fbp'          => \App\Services\TrackingService::resolveFbp($request),
            // resolveTtclid() prefers fresh URL param; resolveGclid() validates the _gcl_aw
            // cookie timestamp and discards stale values (>90 days) to prevent attribution errors.
            'ttclid'       => \App\Services\TrackingService::resolveTtclid($request),
            'ttp'          => $request->cookie('_ttp') ?: null,
            'ga4_client_id' => (function () use ($request) {
                $ga = $request->cookie('_ga');
                if ($ga && preg_match('/GA\d+\.\d+\.(\d+\.\d+)/', $ga, $m)) {
                    return $m[1];
                }
                return null;
            })(),
'gclid'        => \App\Services\TrackingService::resolveGclid($request),
            'utm_source'   => $validated['utm_source'] ?? $request->cookie('utm_source') ?? ($request->cookie('_fbc') ? 'facebook' : null),
            'utm_medium'   => $validated['utm_medium'] ?? $request->cookie('utm_medium') ?? ($request->cookie('_fbc') ? 'paid' : null),
            'utm_campaign' => $validated['utm_campaign'] ?? $request->cookie('utm_campaign') ?? null,
            'utm_content'  => $validated['utm_content'] ?? $request->cookie('utm_content') ?? null,
            'utm_term'     => $validated['utm_term'] ?? $request->cookie('utm_term') ?? null,
        ]);

        // Handle payment screenshot upload
        if ($request->hasFile('payment_screenshot')) {
            $file = $request->file('payment_screenshot');
            $filename = $order->order_number . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/payment-screenshots'), $filename);
            $order->update(['payment_screenshot' => '/uploads/payment-screenshots/' . $filename]);
        }

        foreach ($orderItems as $item) {
            $order->items()->create($item);
        }

        // Reduce stock quantity for products/variants
        foreach ($order->items as $item) {
            if ($item->product_variant_id) {
                // Reduce stock from variant
                ProductVariant::where('id', $item->product_variant_id)->decrement('stock_quantity', $item->quantity);
            } else {
                // Reduce stock from product
                Product::where('id', $item->product_id)->decrement('stock_quantity', $item->quantity);
            }
        }

        Cache::forget('admin.dashboard.stats');
        Cache::forget('admin.dashboard.recent_orders');
        Cache::forget('admin.dashboard.orders_by_status');
        Cache::forget('manager.dashboard.stats');
        Cache::forget('manager.dashboard.recent_orders');
        Cache::forget('manager.dashboard.orders_by_status');

        // Send push notification to admins
        try {
            (new \App\Services\WebPushService())->sendToAll([
                'title' => 'New Order: ' . $order->order_number,
                'body' => $order->first_name . ' â€” à§³' . number_format($order->total, 2),
                'tag' => 'order-' . $order->id,
                'url' => '/admin/orders/' . $order->id,
            ]);
        } catch (\Throwable) {
            // Don't let push failure affect order creation
        }

        // Server-side tracking: Purchase event (Meta CAPI + GTM SS + TikTok)
        // Only fire at order placement when trigger is NOT set to "on_delivered"
        $eventId = null;
        if (Setting::get('purchase_event_trigger', 'on_place_order') !== 'on_delivered') {
            try {
                $tracking = new TrackingService();
                $eventId = $tracking->trackPurchase($request, [
                    'order_number' => $order->order_number,
                    'total'        => $order->total,
                    'shipping'     => $order->shipping,
                    'discount'     => $order->discount,
                    'coupon_code'  => $order->coupon_code,
                    'items'        => $orderItems,
                ], [
                    'first_name' => $order->first_name,
                    'phone'      => $order->phone,
                    'email'      => $order->email,
                    'address'    => $order->address,
                    'city'       => $order->delivery_zone,
                    'country'    => 'bd',
                    'user_id'    => $order->user_id ? (string) $order->user_id : null,
                ]);
            } catch (\Throwable) {
                $eventId = null;
            }
        }

        if ($eventId) {
            Cache::put('purchase_event_id:' . $order->order_number, $eventId, now()->addDays(7));
        }

        return redirect()->route('shop.order.success', $order->order_number)
            ->with('success', 'Order placed successfully!')
            ->with('purchaseEventId', $eventId);
    }

    public function storeLanding(Request $request, string $slug)
    {
        if (BlockedIp::isBlocked($request->ip(), $request->input('phone') ?: null)) {
            return back()->withErrors(['blocked' => 'Your access has been restricted. You cannot place orders.']);
        }

        $landingPage = \App\Models\LandingPage::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'phone' => ['required', 'string', 'regex:/^01\d{9}$/'],

            'email' => 'nullable|email|max:255',
            'district' => ['nullable', 'string', 'max:100'],
            'address' => 'required|string|max:500',
            'delivery_zone' => 'required|string|max:100',
            'payment_method' => ['required', 'string', 'exists:payment_methods,slug', function ($attribute, $value, $fail) {
                if (!PaymentMethod::where('slug', $value)->where('is_active', true)->exists()) {
                    $fail('The selected payment method is not available.');
                }
            }],
            'payment_phone' => ['nullable', 'string', 'max:20'],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_screenshot' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            // Multi-product: items array
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['required_with:items', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            // Single-product (legacy)
            'variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity' => 'nullable|integer|min:1',
            'coupon_code' => 'nullable|string|max:50',
            'note' => 'nullable|string|max:1000',
            'utm_source'   => 'nullable|string|max:100',
            'utm_medium'   => 'nullable|string|max:100',
            'utm_campaign' => 'nullable|string|max:255',
            'utm_content'  => 'nullable|string|max:255',
            'utm_term'     => 'nullable|string|max:255',
        ]);

        // Check if selected payment method requires payment details
        $paymentMethod = PaymentMethod::where('slug', $validated['payment_method'])->first();
        if ($paymentMethod && $paymentMethod->requires_payment_details) {
            $request->validate([
                'payment_phone' => 'required|string|max:20',
                'payment_amount' => 'required|numeric|min:0',
                'payment_screenshot' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            ]);
        }

        $deliveryZone = $validated['delivery_zone'];

        // Determine order items
        if (!empty($validated['items'])) {
            // Multi-product mode
            $orderItemsData = [];
            $subtotal = 0;
            $maxShippingLanding = 0;

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $variant = !empty($item['variant_id']) ? ProductVariant::findOrFail($item['variant_id']) : null;
                $qty = (int) $item['quantity'];
                $price = $variant ? (float) $variant->price : (float) $product->price;
                $lineTotal = $price * $qty;
                $subtotal += $lineTotal;

                // Resolve shipping: variant overrides product when free_shipping !== null
                $effectiveFreeShipping = ($variant && $variant->free_shipping !== null)
                    ? (bool) $variant->free_shipping
                    : (bool) $product->free_shipping;
                $effectiveZones = ($variant && $variant->free_shipping === false)
                    ? ($variant->shipping_zones ?? [])
                    : (($variant && $variant->free_shipping === true) ? [] : ($product->shipping_zones ?? []));

                if (!$effectiveFreeShipping) {
                    $matched = collect($effectiveZones)->firstWhere('zone', $deliveryZone);
                    $charge = $matched ? (float) $matched['charge'] : 0;
                    if ($charge > $maxShippingLanding) {
                        $maxShippingLanding = $charge;
                    }
                }

                $variantLabel = null;
                if ($variant) {
                    $parts = [];
                    if ($variant->size) $parts[] = $variant->size;
                    if ($variant->color) $parts[] = $variant->color;
                    $variantLabel = implode(' / ', $parts);
                }

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'product_name' => $product->name,
                    'variant_label' => $variantLabel,
                    'price' => $price,
                    'quantity' => $qty,
                    'total' => $lineTotal,
                ];
            }

            $shipping = $maxShippingLanding;
        } else {
            // Single-product (legacy) mode
            $product = Product::findOrFail($landingPage->product_id);
            $variant = $validated['variant_id'] ? ProductVariant::findOrFail($validated['variant_id']) : null;
            $price = $variant ? (float) $variant->price : (float) $product->price;
            $quantity = (int) ($validated['quantity'] ?? 1);
            $lineTotal = $price * $quantity;
            $subtotal = $lineTotal;

            // Resolve shipping: variant overrides product when free_shipping !== null
            $effectiveFreeShipping = ($variant && $variant->free_shipping !== null)
                ? (bool) $variant->free_shipping
                : (bool) $product->free_shipping;
            $effectiveZones = ($variant && $variant->free_shipping === false)
                ? ($variant->shipping_zones ?? [])
                : (($variant && $variant->free_shipping === true) ? [] : ($product->shipping_zones ?? []));

            if ($effectiveFreeShipping) {
                $shipping = 0;
            } else {
                $matched = collect($effectiveZones)->firstWhere('zone', $deliveryZone);
                $shipping = $matched ? (float) $matched['charge'] : 0;
            }

            $variantLabel = null;
            if ($variant) {
                $parts = [];
                if ($variant->size) $parts[] = $variant->size;
                if ($variant->color) $parts[] = $variant->color;
                $variantLabel = implode(' / ', $parts);
            }

            $orderItemsData = [[
                'product_id' => $product->id,
                'product_variant_id' => $variant?->id,
                'product_name' => $product->name,
                'variant_label' => $variantLabel,
                'price' => $price,
                'quantity' => $quantity,
                'total' => $lineTotal,
            ]];
        }

        // Coupon processing
        $discount = 0;
        $couponCode = null;
        if (!empty($validated['coupon_code'])) {
            $coupon = Coupon::where('code', strtoupper($validated['coupon_code']))->first();
            if ($coupon && $coupon->isValid($subtotal)) {
                $productIds = array_column($orderItemsData, 'product_id');
                $applicable = $coupon->is_global || !empty(array_intersect($productIds, $coupon->products()->pluck('products.id')->toArray()));
                if ($applicable) {
                    $discount = $coupon->calculateDiscount($subtotal);
                    $couponCode = $coupon->code;
                    $coupon->increment('used_count');
                }
            }
        }

        $total = $subtotal + $shipping - $discount;

        // Auto-detect order source from ad-click signals only.
        // _fbp / _ttp are session-persistent cookies set for ALL pixel visitors - not ad-click indicators.
        // Only fbc (contains fbclid), ttclid, and gclid prove an actual ad click.
        $orderSource = null;
        if (\App\Services\TrackingService::resolveFbc($request)) {
            $orderSource = 'fb';
        } elseif (\App\Services\TrackingService::resolveTtclid($request)) {
            $orderSource = 'tiktok';
        } elseif (\App\Services\TrackingService::resolveGclid($request)) {
            $orderSource = 'google_ads';
        } else {
            $orderSource = 'direct';
        }

        $order = Order::create([
            'user_id' => Auth::id(),
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'status' => 'pending',
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'discount' => $discount,
            'coupon_code' => $couponCode,
            'total' => $total,
            'first_name' => $validated['first_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'district' => $validated['district'] ?? null,
            'address' => $validated['address'],
            'delivery_zone' => $deliveryZone,
            'payment_method' => $validated['payment_method'],
            'payment_phone' => $validated['payment_phone'] ?? null,
            'payment_amount' => $validated['payment_amount'] ?? null,
            'note' => $validated['note'] ?? null,
            'order_source' => $orderSource,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            // Persist tracking cookies for delayed server-side events + EMQ improvement
            // resolveFbc() validates the _fbc cookie timestamp; expired values (>90 days) are
            // discarded to prevent the Meta CAPI "expired fbclid value" diagnostic error.
            'fbc'          => \App\Services\TrackingService::resolveFbc($request),
            'fbp'          => \App\Services\TrackingService::resolveFbp($request),
            // resolveTtclid() prefers fresh URL param; resolveGclid() validates the _gcl_aw
            // cookie timestamp and discards stale values (>90 days) to prevent attribution errors.
            'ttclid'       => \App\Services\TrackingService::resolveTtclid($request),
            'ttp'          => $request->cookie('_ttp') ?: null,
            'ga4_client_id' => (function () use ($request) {
                $ga = $request->cookie('_ga');
                if ($ga && preg_match('/GA\d+\.\d+\.(\d+\.\d+)/', $ga, $m)) {
                    return $m[1];
                }
                return null;
            })(),
            'gclid'        => \App\Services\TrackingService::resolveGclid($request),
            'utm_source'   => $validated['utm_source'] ?? $request->cookie('utm_source') ?? ($request->cookie('_fbc') ? 'facebook' : null),
            'utm_medium'   => $validated['utm_medium'] ?? $request->cookie('utm_medium') ?? ($request->cookie('_fbc') ? 'paid' : null),
            'utm_campaign' => $validated['utm_campaign'] ?? $request->cookie('utm_campaign') ?? null,
            'utm_content'  => $validated['utm_content'] ?? $request->cookie('utm_content') ?? null,
            'utm_term'     => $validated['utm_term'] ?? $request->cookie('utm_term') ?? null,
        ]);

        // Handle payment screenshot upload
        if ($request->hasFile('payment_screenshot')) {
            $file = $request->file('payment_screenshot');
            $filename = $order->order_number . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/payment-screenshots'), $filename);
            $order->update(['payment_screenshot' => '/uploads/payment-screenshots/' . $filename]);
        }

        foreach ($orderItemsData as $itemData) {
            $order->items()->create($itemData);
        }

        // Reduce stock quantity for products/variants
        foreach ($order->items as $item) {
            if ($item->product_variant_id) {
                // Reduce stock from variant
                ProductVariant::where('id', $item->product_variant_id)->decrement('stock_quantity', $item->quantity);
            } else {
                // Reduce stock from product
                Product::where('id', $item->product_id)->decrement('stock_quantity', $item->quantity);
            }
        }

        Cache::forget('admin.dashboard.stats');
        Cache::forget('admin.dashboard.recent_orders');
        Cache::forget('admin.dashboard.orders_by_status');
        Cache::forget('manager.dashboard.stats');
        Cache::forget('manager.dashboard.recent_orders');
        Cache::forget('manager.dashboard.orders_by_status');

        // Send push notification to admins
        try {
            (new \App\Services\WebPushService())->sendToAll([
                'title' => 'New Order: ' . $order->order_number,
                'body' => $order->first_name . ' â€” à§³' . number_format($order->total, 2),
                'tag' => 'order-' . $order->id,
                'url' => '/admin/orders/' . $order->id,
            ]);
        } catch (\Throwable) {
            // Don't let push failure affect order creation
        }

        // Server-side tracking: Purchase event (Meta CAPI + GTM SS + TikTok)
        // Only fire at order placement when trigger is NOT set to "on_delivered"
        $eventId = null;
        if (Setting::get('purchase_event_trigger', 'on_place_order') !== 'on_delivered') {
            try {
                $tracking = new TrackingService();
                $eventId = $tracking->trackPurchase($request, [
                    'order_number' => $order->order_number,
                    'total'        => $order->total,
                    'shipping'     => $order->shipping,
                    'discount'     => $order->discount,
                    'coupon_code'  => $order->coupon_code,
                    'items'        => $orderItemsData,
                ], [
                    'first_name' => $order->first_name,
                    'phone'      => $order->phone,
                    'email'      => $order->email,
                    'address'    => $order->address,
                    'city'       => $order->delivery_zone,
                    'country'    => 'bd',
                    'user_id'    => $order->user_id ? (string) $order->user_id : null,
                ]);
            } catch (\Throwable) {
                $eventId = null;
            }
        }

        if ($eventId) {
            Cache::put('purchase_event_id:' . $order->order_number, $eventId, now()->addDays(7));
        }

        return redirect()->route('shop.order.success', $order->order_number)
            ->with('success', 'Order placed successfully!')
            ->with('purchaseEventId', $eventId);
    }

    public function success(string $orderNumber)
    {
        $order = Order::where('order_number', $orderNumber)
            ->with('items')
            ->firstOrFail();

        $categories = \App\Models\Category::with('subCategories:id,category_id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'icon'])
            ->toArray();

        // Fetch related products from the same categories as ordered items (if enabled by admin)
        $relatedProducts = [];
        if ((bool) Setting::get('order_success_related_enabled', true)) {
            $orderedProductIds = $order->items->pluck('product_id')->toArray();
            $orderedCategoryIds = \App\Models\Product::whereIn('id', $orderedProductIds)
                ->pluck('category_id')
                ->unique()
                ->toArray();

            if (!empty($orderedCategoryIds)) {
                $relatedProducts = \App\Models\Product::with('images', 'variants')
                    ->whereIn('category_id', $orderedCategoryIds)
                    ->whereNotIn('id', $orderedProductIds)
                    ->where('in_stock', true)
                    ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'free_shipping', 'offer_timer')
                    ->limit(8)
                    ->get()
                    ->toArray();
            }
        }

        // Compute the raw external_id to pass to the browser pixel for advanced matching.
        // TrackingService::normalizePhone converts the phone to E.164; Meta/TikTok pixel
        // SDKs will SHA-256 hash this value, producing the same hash as the server CAPI.
        $pixelExternalId = null;
        if ($order->user_id) {
            $pixelExternalId = (string) $order->user_id;
        } elseif ($order->phone) {
            $pixelExternalId = TrackingService::normalizePhone($order->phone);
        }

        $purchaseEventId = session('purchaseEventId');
        if (! $purchaseEventId) {
            $purchaseEventId = Cache::get('purchase_event_id:' . $order->order_number);
        }

        return \Inertia\Inertia::render('shop/order-success', [
            'order'            => $order,
            'categories'       => $categories,
            'paymentMethods'   => PaymentMethod::orderBy('sort_order')->pluck('name', 'slug'),
            'purchaseEventId'  => $purchaseEventId,
            'pixelExternalId'  => $pixelExternalId,
            'relatedProducts'  => $relatedProducts,
            'labels'           => [
                'continueShopping'  => Setting::get('label_continue_shopping',   'Continue Shopping'),
                'orderConfirmed'    => Setting::get('label_order_confirmed',     'Order Confirmed!'),
                'orderConfirmedSub' => Setting::get('label_order_confirmed_sub', 'Thank you, {name}! Your order has been placed.'),
                'youMayAlsoLike'    => Setting::get('label_you_may_also_like',   'You May Also Like'),
            ],
        ]);
    }
}
