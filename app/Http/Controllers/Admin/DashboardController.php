<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\Setting;
use App\Services\MetaAdsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today      = now()->toDateString();
        $thisMonth  = now()->format('Y-m');

        $stats = Cache::remember('admin.dashboard.stats', 120, function () use ($today, $thisMonth) {
            // Single GROUP BY for order counts by status
            $statusCounts = Order::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status');
            $totalOrders = $statusCounts->sum();

            return [
                // Orders (from single GROUP BY)
                'totalOrders'      => $totalOrders,
                'pendingOrders'    => $statusCounts->get('pending', 0),
                'processingOrders' => $statusCounts->get('processing', 0),
                'shippedOrders'    => $statusCounts->get('shipped', 0),
                'deliveredOrders'  => $statusCounts->get('delivered', 0),
                'cancelledOrders'  => $statusCounts->get('cancelled', 0),

                // Revenue
                'totalRevenue'     => Order::whereNotIn('status', ['cancelled'])->sum('total'),
                'todayRevenue'     => Order::whereNotIn('status', ['cancelled'])->whereDate('created_at', $today)->sum('total'),
                'monthRevenue'     => Order::whereNotIn('status', ['cancelled'])->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$thisMonth])->sum('total'),

                // Products
                'totalProducts'    => Product::count(),
                'inStockProducts'  => Product::where('in_stock', true)->count(),
                'outOfStock'       => Product::where('in_stock', false)->count(),
                'featuredProducts' => Product::where('is_featured', true)->count(),

                // Reviews & Messages
                'totalReviews'     => Review::count(),
                'pendingReviews'   => Review::where('is_approved', false)->count(),
                'unreadMessages'   => ContactMessage::where('is_read', false)->count(),
            ];
        });

        $recentOrders = Cache::remember('admin.dashboard.recent_orders', 120, function () {
            return Order::with('items')->latest()->limit(8)->get()
                ->map(fn ($o) => [
                    'id'           => $o->id,
                    'order_number' => $o->order_number,
                    'status'       => $o->status,
                    'total'        => $o->total,
                    'first_name'   => $o->first_name,
                    'created_at'   => $o->created_at,
                    'items'        => $o->items->map(fn ($i) => [
                        'id'           => $i->id,
                        'product_name' => $i->product_name,
                        'quantity'     => $i->quantity,
                    ])->values()->all(),
                ])
                ->values()
                ->all();
        });

        $ordersByStatus = Cache::remember('admin.dashboard.orders_by_status', 120, function () {
            return Order::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();
        });

        $dailyRevenue = Cache::remember('admin.dashboard.daily_revenue', 120, function () {
            return Order::whereNotIn('status', ['cancelled'])
                ->where('created_at', '>=', now()->subDays(6)->startOfDay())
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders'))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(fn ($r) => [
                    'date' => \Carbon\Carbon::parse($r->date)->format('M d'),
                    'revenue' => round((float) $r->revenue, 2),
                    'orders' => (int) $r->orders,
                ])
                ->values()
                ->all();
        });

        $ordersByPayment = Cache::remember('admin.dashboard.orders_by_payment', 120, function () {
            return Order::select('payment_method', DB::raw('count(*) as count'))
                ->groupBy('payment_method')
                ->pluck('count', 'payment_method')
                ->toArray();
        });

        return Inertia::render('admin/dashboard', [
            'stats'           => $stats,
            'recentOrders'    => $recentOrders,
            'ordersByStatus'  => $ordersByStatus,
            'dailyRevenue'    => $dailyRevenue,
            'ordersByPayment' => $ordersByPayment,
        ]);
    }

    public function clearCache(): JsonResponse
    {
        // Keys that get auto-populated on every request (e.g. by middleware / shared data)
        // — exclude from the "has cache?" check so we can detect a truly empty cache.
        $autoKeys = ['all_settings'];

        $keys = [
            'shop.categories',
            'shop.banners',
            'shop.products.featured',
            'shop.products.offers',
            'shop.products.deals',
            'shop.products.new_arrivals',
            'shop.products.all',
            'shop.payment_methods',
            'admin.dashboard.stats',
            'admin.dashboard.recent_orders',
            'admin.dashboard.orders_by_status',
            'admin.dashboard.daily_revenue',
            'admin.dashboard.orders_by_payment',
            'manager.dashboard.stats',
            'manager.dashboard.recent_orders',
            'manager.dashboard.orders_by_status',
            'shop.shipping_zones',
            'shop.has_global_coupons',
            'shop.coupon_product_ids',
            'shop.mid_banners',
            'all_settings',
        ];

        // Collect dynamic keys
        $productIds = Product::pluck('id');
        foreach ($productIds as $id) {
            $keys[] = 'shop.products.related.' . $id;
            $keys[] = 'shop.reviews.' . $id;
        }

        $landingSlugs = \App\Models\LandingPage::pluck('slug');
        foreach ($landingSlugs as $slug) {
            $keys[] = 'landing.' . $slug;
        }

        // Check if any non-auto cache key exists
        $hasCache = false;
        foreach ($keys as $key) {
            if (in_array($key, $autoKeys, true)) {
                continue;
            }
            if (Cache::has($key)) {
                $hasCache = true;
                break;
            }
        }

        if (! $hasCache) {
            return response()->json(['status' => 'no_cache', 'message' => 'No cache to clear.']);
        }

        foreach ($keys as $key) {
            Cache::forget($key);
        }

        return response()->json(['status' => 'cleared', 'message' => 'Cache cleared successfully.']);
    }

    public function metaAdsInsights(Request $request): JsonResponse
    {
        $allowed = ['today', 'yesterday', 'last_7d', 'last_30d', 'this_month', 'last_month'];
        $period  = in_array($request->input('period'), $allowed, true)
            ? $request->input('period')
            : 'last_7d';

        $accessToken = Setting::get('meta_ads_access_token', '');
        $adAccountId = Setting::get('meta_ad_account_id', '');

        if (! $accessToken || ! $adAccountId) {
            return response()->json([
                'error' => 'Meta Ads not configured. Please add your Ad Account ID and a Marketing API token with ads_read permission in Tracking Settings.',
            ], 422);
        }

        try {
            $service   = new MetaAdsService($accessToken, $adAccountId);
            $insights  = $service->getAccountInsights($period);
            $campaigns = $service->getCampaigns($period);

            return response()->json(compact('insights', 'campaigns'));
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
