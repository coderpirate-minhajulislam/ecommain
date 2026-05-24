<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockedIp;
use App\Models\Category;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\ShippingZone;
use App\Services\CarrybeeService;
use App\Services\CourierSyncService;
use App\Services\PathaoService;
use App\Services\RedxService;
use App\Services\SteadfastService;
use App\Services\TrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Order::with('items');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhereHas('items', fn ($iq) => $iq->where('product_name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($source = $request->input('source')) {
            $query->where('order_source', $source);
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100])
            ? (int) $request->input('perPage')
            : 10;

        $orders = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'source', 'perPage']),
            'statuses' => ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'hold', 'pre-order'],
            'sources' => ['direct', 'fb', 'tiktok', 'google_ads', 'admin'],
        ]);
    }

    public function show(int $id): Response
    {
        $order = Order::with('items.product.images', 'user')->findOrFail($id);

        $isBlocked = BlockedIp::isBlocked($order->ip_address, $order->phone);

        return Inertia::render('admin/orders/show', [
            'order'            => $order,
            'isBlocked'        => $isBlocked,
            'statuses'         => ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'hold', 'pre-order'],
            'paymentMethods'   => PaymentMethod::orderBy('sort_order')->pluck('name', 'slug'),
            'pathaoConnected'      => (bool) Setting::get('pathao_access_token', ''),
            'bdcourierConnected'   => (bool) Setting::get('bdcourier_api_key', ''),
            'orderratiocheckConnected' => (bool) Setting::get('orderratiocheck_api_key', ''),
            'steadfastConnected'   => (bool) Setting::get('steadfast_api_key', '') && (bool) Setting::get('steadfast_secret_key', ''),
            'redxConnected'        => (bool) Setting::get('redx_access_token', ''),
            'carrybeeConnected'    => (bool) Setting::get('carrybee_client_id', ''),
        ]);
    }

    public function edit(int $id): Response
    {
        $order = Order::with('items')->findOrFail($id);

        return Inertia::render('admin/orders/edit', [
            'order' => $order,
            'products' => Product::with('variants', 'images')->orderBy('name')->get(),
            'statuses' => ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'hold', 'pre-order'],
            'emailEnabled' => (bool) Setting::get('checkout_email_enabled', false),
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $order = Order::findOrFail($id);
        $previousStatus = $order->status;

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'required|string|max:500',
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled,hold,pre-order',
            'order_source' => 'nullable|in:direct,fb,tiktok,google_ads,admin',
            'shipping' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.custom_price' => 'nullable|numeric|min:0',
        ]);

        // Rebuild order items
        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $variant = $item['variant_id'] ? ProductVariant::findOrFail($item['variant_id']) : null;

            // Use custom price if provided, else fall back to product/variant price
            if (isset($item['custom_price']) && $item['custom_price'] !== null && $item['custom_price'] !== '') {
                $price = (float) $item['custom_price'];
            } else {
                $price = $variant ? (float) $variant->price : (float) $product->price;
            }

            $quantity = $item['quantity'];
            $lineTotal = $price * $quantity;
            $subtotal += $lineTotal;

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

        $shipping = (float) $validated['shipping'];
        $total = $subtotal + $shipping;

        $order->update([
            'status' => $validated['status'],
            'order_source' => $validated['order_source'] ?? null,
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'total' => $total,
            'first_name' => $validated['first_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'],
        ]);

        // Replace items
        $order->items()->delete();
        foreach ($orderItems as $item) {
            $order->items()->create($item);
        }

        $this->clearDashboardCache();

        // Fire purchase tracking events when order is marked as delivered via full edit
        // (only when the trigger setting is set to "on_delivered" and status actually changed to delivered)
        if (
            $validated['status'] === 'delivered'
            && $previousStatus !== 'delivered'
            && Setting::get('purchase_event_trigger', 'on_place_order') === 'on_delivered'
        ) {
            try {
                $order->load('items');
                (new TrackingService())->trackPurchaseFromOrder($order);
            } catch (\Throwable) {
                // Do not let tracking failure affect order update
            }
        }

        return redirect()->route('admin.orders.show', $order->id)->with('success', 'Order updated successfully.');
    }

    private function clearDashboardCache(): void
    {
        Cache::forget('admin.dashboard.stats');
        Cache::forget('admin.dashboard.recent_orders');
        Cache::forget('admin.dashboard.orders_by_status');
        Cache::forget('manager.dashboard.stats');
        Cache::forget('manager.dashboard.recent_orders');
        Cache::forget('manager.dashboard.orders_by_status');
    }

    public function create(): Response
    {
        return Inertia::render('admin/orders/create', [
            'products' => Product::with('variants', 'images')->where('in_stock', true)->orderBy('name')->get(),
            'emailEnabled' => (bool) Setting::get('checkout_email_enabled', false),
            'shippingZones' => Cache::remember('shop.shipping_zones', 3600, fn () => ShippingZone::orderBy('sort_order')->orderBy('name')->pluck('name')->toArray()),
            'freeShippingAmount' => (float) Setting::get('free_shipping_amount', 0),
            'freeShippingEnabled' => (bool) Setting::get('free_shipping_enabled', true),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'required|string|max:500',
            'delivery_zone' => 'nullable|string|max:100',
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled,hold,pre-order',
            'order_source' => 'nullable|in:direct,fb,tiktok,google_ads,admin',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $subtotal = 0;
        $deliveryZone = $validated['delivery_zone'] ?? null;
        $maxShipping = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $variant = $item['variant_id'] ? ProductVariant::findOrFail($item['variant_id']) : null;

            $price = $variant ? (float) $variant->price : (float) $product->price;
            $quantity = $item['quantity'];
            $lineTotal = $price * $quantity;
            $subtotal += $lineTotal;

            $effectiveFreeShipping = ($variant && $variant->free_shipping !== null)
                ? (bool) $variant->free_shipping
                : (bool) $product->free_shipping;

            $effectiveZones = ($variant && $variant->free_shipping === false)
                ? ($variant->shipping_zones ?? [])
                : (($variant && $variant->free_shipping === true) ? [] : ($product->shipping_zones ?? []));

            if (!$effectiveFreeShipping && $deliveryZone) {
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

        $freeShippingEnabled = (bool) Setting::get('free_shipping_enabled', true);
        $freeShippingAmount = (float) Setting::get('free_shipping_amount', 0);
        $shipping = ($freeShippingEnabled && $freeShippingAmount > 0 && $subtotal >= $freeShippingAmount)
            ? 0
            : $maxShipping;
        $total = $subtotal + $shipping;

        $order = Order::create([
            'user_id' => null,
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'status' => $validated['status'],
            'order_source' => $validated['order_source'] ?? null,
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'total' => $total,
            'first_name' => $validated['first_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'],
            'delivery_zone' => $deliveryZone,
        ]);

        foreach ($orderItems as $item) {
            $order->items()->create($item);
        }

        $this->clearDashboardCache();

        return redirect()->route('admin.orders.index')->with('success', 'Order created successfully.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $order = Order::findOrFail($id);
        $order->delete();

        $this->clearDashboardCache();

        return redirect()->route('admin.orders.index')->with('success', 'Order deleted.');
    }

    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled,hold,pre-order',
        ]);

        $previousStatus = $order->status;
        $order->update(['status' => $validated['status']]);

        $this->clearDashboardCache();

        // Fire purchase tracking events when order is marked as delivered
        // (only when the trigger setting is set to "on_delivered" and status actually changed to delivered)
        if (
            $validated['status'] === 'delivered'
            && $previousStatus !== 'delivered'
            && Setting::get('purchase_event_trigger', 'on_place_order') === 'on_delivered'
        ) {
            try {
                $order->load('items');
                (new TrackingService())->trackPurchaseFromOrder($order);
            } catch (\Throwable) {
                // Do not let tracking failure affect status update
            }
        }

        return back()->with('success', 'Status updated.');
    }

    public function updateNote(Request $request, int $id): RedirectResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        $order->update(['note' => $validated['note']]);

        return back()->with('success', 'Note updated.');
    }

    /**
     * Manually sync this order's courier status and auto-update to delivered if confirmed.
     * Only updates order.status when the courier reports "delivered".
     */
    public function syncCourierStatus(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        // Check that at least one courier is configured and this order was sent to one
        $hasCourier = ($order->steadfast_consignment_id && CourierSyncService::isSteadfastConfigured())
            || ($order->pathao_consignment_id     && CourierSyncService::isPathaoConfigured())
            || ($order->redx_tracking_id          && CourierSyncService::isRedxConfigured())
            || ($order->carrybee_consignment_id   && CourierSyncService::isCarrybeeConfigured());

        if (!$hasCourier) {
            return response()->json(['error' => 'No configured courier found for this order.'], 422);
        }

        $result = app(CourierSyncService::class)->syncForOrder($order);

        if ($result['status_updated_to_delivered']) {
            $this->clearDashboardCache();
        }

        return response()->json($result);
    }


    public function invoice(int $id)
    {
        $order     = Order::with(['items'])->findOrFail($id);
        $siteTitle = Setting::get('site_title', config('app.name'));
        $siteLogo  = Setting::get('site_logo', '');

        return view('exports.invoice', compact('order', 'siteTitle', 'siteLogo'));
    }

    public function courierCheck(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        // Use custom phone from query string, or fall back to order phone
        $phone = trim($request->query('phone', '') ?: (string) $order->phone);
        if (!$phone) {
            return response()->json(['error' => 'No phone number provided.'], 422);
        }

        $results = [];

        // --- BD Courier ---
        $bdApiKey = Setting::get('bdcourier_api_key', '');
        if ($bdApiKey) {
            $ch = curl_init('https://api.bdcourier.com/courier-check');
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['phone' => $phone]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $bdApiKey,
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if (!$curlError && $httpCode === 200) {
                $json = json_decode($response, true);
                if (($json['status'] ?? '') === 'success') {
                    $results['bdcourier'] = $json;
                }
            }
        }

        // --- Order Ratio Check ---
        $orcApiKey = Setting::get('orderratiocheck_api_key', '');
        $orcDomain = Setting::get('orderratiocheck_domain', '');
        if ($orcApiKey) {
            $ch = curl_init('https://app.growever.bd/api/courier-check');
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['phone' => $phone]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $orcApiKey,
                'X-Domain: ' . $orcDomain,
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if (!$curlError && $httpCode === 200) {
                $json = json_decode($response, true);
                if (($json['status'] ?? '') === 'success') {
                    $results['orderratiocheck'] = $json;
                }
            }
        }

        if (empty($results)) {
            return response()->json(['error' => 'No courier ratio API is configured or both failed.'], 422);
        }

        // Merge data: combine courier entries and summaries from both sources
        $mergedData = [];
        $mergedReports = [];

        foreach ($results as $source => $json) {
            if (isset($json['data'])) {
                foreach ($json['data'] as $key => $value) {
                    if ($key === 'summary') continue;
                    if (!isset($mergedData[$key]) || ($value['total_parcel'] ?? 0) > ($mergedData[$key]['total_parcel'] ?? 0)) {
                        $mergedData[$key] = $value;
                    }
                }
            }
            if (isset($json['reports'])) {
                $mergedReports = array_merge($mergedReports, $json['reports']);
            }
        }

        // Build combined summary
        $totalParcel = 0;
        $successParcel = 0;
        $cancelledParcel = 0;
        foreach ($mergedData as $entry) {
            $totalParcel += (int) ($entry['total_parcel'] ?? 0);
            $successParcel += (int) ($entry['success_parcel'] ?? 0);
            $cancelledParcel += (int) ($entry['cancelled_parcel'] ?? 0);
        }
        $mergedData['summary'] = [
            'total_parcel' => $totalParcel,
            'success_parcel' => $successParcel,
            'cancelled_parcel' => $cancelledParcel,
            'success_ratio' => $totalParcel > 0 ? round(($successParcel / $totalParcel) * 100, 2) : 0,
        ];

        return response()->json([
            'status' => 'success',
            'data' => $mergedData,
            'reports' => $mergedReports,
            'sources' => array_keys($results),
        ]);
    }

    public function pathaoStores(int $id): JsonResponse
    {
        Order::findOrFail($id); // ensure order exists

        try {
            $service = new PathaoService();
            $stores  = $service->getStores();
            return response()->json(['stores' => $stores]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function pathaoLocations(Request $request, int $id): JsonResponse
    {
        Order::findOrFail($id);

        $type   = $request->query('type', 'cities');
        $cityId = (int) $request->query('city_id', 0);
        $zoneId = (int) $request->query('zone_id', 0);

        try {
            $service = new PathaoService();

            if ($type === 'zones' && $cityId > 0) {
                return response()->json(['zones' => $service->getZones($cityId)]);
            }

            if ($type === 'areas' && $zoneId > 0) {
                return response()->json(['areas' => $service->getAreas($zoneId)]);
            }

            return response()->json(['cities' => $service->getCities()]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function pathaoSend(Request $request, int $id): JsonResponse
    {
        $order = Order::with('items')->findOrFail($id);

        $validated = $request->validate([
            'store_id'            => 'required|integer',
            'item_weight'         => 'required|numeric|min:0.5|max:10',
            'delivery_type'       => 'required|in:48,12',
            'item_type'           => 'required|in:1,2',
            'special_instruction' => 'nullable|string|max:255',
        ]);

        try {
            $service = new PathaoService();

            // Sanitize phone: strip non-numeric chars, remove leading +880/880, ensure 11 digits
            $phone = preg_replace('/\D/', '', (string) $order->phone);
            if (str_starts_with($phone, '880') && strlen($phone) > 11) {
                $phone = substr($phone, 3);
            }

            // Sanitize address: Pathao requires 10–220 characters
            $address = trim((string) $order->address);
            if (strlen($address) < 10) {
                $address = str_pad($address, 10, ' ');
            }
            $address = substr($address, 0, 220);

            // Sanitize recipient name: Pathao requires 3–100 characters
            $name = trim((string) $order->first_name);
            if (strlen($name) < 3) {
                $name = str_pad($name, 3, ' ');
            }
            $name = substr($name, 0, 100);

            $payload = [
                'store_id'          => (int) $validated['store_id'],
                'merchant_order_id' => $order->order_number,
                'recipient_name'    => $name,
                'recipient_phone'   => $phone,
                'recipient_address' => $address,
                'delivery_type'     => (int) $validated['delivery_type'],
                'item_type'         => (int) $validated['item_type'],
                'item_quantity'     => max(1, (int) $order->items->sum('quantity')),
                'item_weight'       => (float) $validated['item_weight'],
                'amount_to_collect' => (int) round((float) $order->total),
            ];

            if (!empty($validated['special_instruction'])) {
                $payload['special_instruction'] = $validated['special_instruction'];
            }

            $itemDesc = $order->items->map(fn($i) => $i->product_name)->implode(', ');
            if ($itemDesc) {
                $payload['item_description'] = substr($itemDesc, 0, 200);
            }

            $result = $service->createOrder($payload);

            $order->update([
                'pathao_consignment_id' => $result['consignment_id'] ?? null,
                'pathao_order_status'   => $result['order_status'] ?? 'Pending',
            ]);

            return response()->json([
                'consignment_id' => $result['consignment_id'] ?? null,
                'order_status'   => $result['order_status'] ?? 'Pending',
                'delivery_fee'   => $result['delivery_fee'] ?? null,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function steadfastSend(Request $request, int $id): JsonResponse
    {
        $order = Order::with('items')->findOrFail($id);

        $validated = $request->validate([
            'note'          => 'nullable|string|max:255',
            'cod_amount'    => 'nullable|numeric|min:0',
            'delivery_type' => 'nullable|in:0,1',
            'weight'        => 'nullable|numeric|min:0',
        ]);

        try {
            $service = new SteadfastService();

            // Sanitize phone: ensure 11 digits
            $phone = preg_replace('/\D/', '', (string) $order->phone);
            if (str_starts_with($phone, '880') && strlen($phone) > 11) {
                $phone = substr($phone, 3);
            }

            $address = trim((string) $order->address);
            $address = substr($address, 0, 250);

            $name = trim((string) $order->first_name);
            $name = substr($name, 0, 100);

            $itemDesc = $order->items->map(fn($i) => $i->product_name)->implode(', ');

            $payload = [
                'invoice'            => $order->order_number,
                'recipient_name'     => $name,
                'recipient_phone'    => $phone,
                'recipient_address'  => $address,
                'cod_amount'         => isset($validated['cod_amount'])
                    ? (float) $validated['cod_amount']
                    : (float) $order->total,
                'note'               => $validated['note'] ?? null,
                'item_description'   => $itemDesc ? substr($itemDesc, 0, 255) : null,
                'total_lot'          => max(1, (int) $order->items->sum('quantity')),
            ];

            if (isset($validated['weight']) && $validated['weight'] !== null && $validated['weight'] !== '') {
                $payload['weight'] = (float) $validated['weight'];
            }

            if (isset($validated['delivery_type'])) {
                $payload['delivery_type'] = (int) $validated['delivery_type'];
            }

            $result = $service->createOrder($payload);

            $order->update([
                'steadfast_consignment_id' => $result['consignment_id'] ?? null,
                'steadfast_tracking_code'  => $result['tracking_code'] ?? null,
                'steadfast_status'         => $result['status'] ?? 'in_review',
            ]);

            return response()->json([
                'consignment_id' => $result['consignment_id'] ?? null,
                'tracking_code'  => $result['tracking_code'] ?? null,
                'status'         => $result['status'] ?? 'in_review',
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function redxAreas(Request $request): JsonResponse
    {
        $params = array_filter([
            'post_code'     => $request->query('post_code'),
            'district_name' => $request->query('district_name'),
        ]);

        try {
            $service = new RedxService();
            $areas   = $service->getAreas($params);
            return response()->json(['areas' => $areas]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function redxPickupStores(): JsonResponse
    {
        try {
            $service = new RedxService();
            return response()->json(['pickup_stores' => $service->getPickupStores()]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function redxSend(Request $request, int $id): JsonResponse
    {
        $order = Order::with('items')->findOrFail($id);

        $validated = $request->validate([
            'pickup_store_id'    => 'required|integer',
            'delivery_area_id'   => 'required|integer',
            'delivery_area'      => 'required|string|max:255',
            'parcel_weight'      => 'required|numeric|min:1',
            'cash_collection'    => 'nullable|numeric|min:0',
            'instruction'        => 'nullable|string|max:500',
        ]);

        try {
            $service = new RedxService();

            // Sanitize phone: ensure 11 digits
            $phone = preg_replace('/\D/', '', (string) $order->phone);
            if (str_starts_with($phone, '880') && strlen($phone) > 11) {
                $phone = substr($phone, 3);
            }

            $address = trim((string) $order->address);
            $name    = trim((string) $order->first_name);
            $total   = (float) $order->total;

            $payload = [
                'customer_name'         => $name,
                'customer_phone'        => $phone,
                'delivery_area'         => $validated['delivery_area'],
                'delivery_area_id'      => (int) $validated['delivery_area_id'],
                'customer_address'      => $address,
                'merchant_invoice_id'   => $order->order_number,
                'cash_collection_amount'=> (string) (isset($validated['cash_collection']) ? $validated['cash_collection'] : $total),
                'parcel_weight'         => (int) $validated['parcel_weight'],
                'value'                 => (string) (int) $total,
                'pickup_store_id'       => (int) $validated['pickup_store_id'],
                'instruction'           => $validated['instruction'] ?? '',
            ];

            $itemDesc = $order->items->map(fn($i) => $i->product_name)->implode(', ');
            if ($itemDesc) {
                $payload['parcel_details_json'] = $order->items->map(fn($i) => [
                    'name'     => $i->product_name,
                    'category' => 'General',
                    'value'    => (int) $i->price,
                ])->toArray();
            }

            $result = $service->createParcel($payload);

            $trackingId = $result['tracking_id'] ?? null;

            $order->update([
                'redx_tracking_id' => $trackingId,
                'redx_status'      => 'pickup-pending',
            ]);

            return response()->json([
                'tracking_id' => $trackingId,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    // ── Carrybee ──────────────────────────────────────────────────────────

    public function carrybeeAreaSuggestions(Request $request): JsonResponse
    {
        $search = $request->query('search', '');
        if (strlen($search) < 3) {
            return response()->json(['error' => 'Search must be at least 3 characters.'], 422);
        }
        try {
            $service = new CarrybeeService();
            $items   = $service->getAreaSuggestions($search);
            return response()->json(['items' => $items]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function carrybeeStores(): JsonResponse
    {
        try {
            $service = new CarrybeeService();
            $stores  = $service->getStores();
            return response()->json(['stores' => $stores]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function carrybeeSend(Request $request, int $id): JsonResponse
    {
        $order = Order::with('items')->findOrFail($id);

        $validated = $request->validate([
            'store_id'            => 'required',
            'delivery_type'       => 'required|integer|in:1,2',
            'product_type'        => 'required|integer|in:1,2,3',
            'item_weight'         => 'required|integer|min:1|max:25000',
            'item_quantity'       => 'nullable|integer|min:1|max:200',
            'collectable_amount'  => 'nullable|integer|min:0|max:100000',
            'special_instruction' => 'nullable|string|max:255',
        ]);

        try {
            $service = new CarrybeeService();

            $phone = preg_replace('/\D/', '', (string) $order->phone);
            if (str_starts_with($phone, '880') && strlen($phone) > 11) {
                $phone = substr($phone, 3);
            }
            if (!str_starts_with($phone, '0')) {
                $phone = '0' . $phone;
            }

            $address = trim((string) $order->address);
            if (strlen($address) < 10) {
                $address = $address . ', Bangladesh';
            }

            $payload = [
                'store_id'           => (string) $validated['store_id'],
                'merchant_order_id'  => $order->order_number,
                'delivery_type'      => (int) $validated['delivery_type'],
                'product_type'       => (int) $validated['product_type'],
                'recipient_phone'    => $phone,
                'recipient_name'     => trim((string) $order->first_name),
                'recipient_address'  => $address,
                'item_weight'        => (int) $validated['item_weight'],
                'collectable_amount' => (int) ($validated['collectable_amount'] ?? (int) $order->total),
            ];

            if (!empty($validated['item_quantity'])) {
                $payload['item_quantity'] = (int) $validated['item_quantity'];
            }
            if (!empty($validated['special_instruction'])) {
                $payload['special_instruction'] = $validated['special_instruction'];
            }

            $result = $service->createOrder($payload);

            $consignmentId = $result['consignment_id'] ?? null;

            $order->update([
                'carrybee_consignment_id' => $consignmentId,
                'carrybee_status'         => 'pending',
            ]);

            return response()->json(['consignment_id' => $consignmentId]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
