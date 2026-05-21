<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = now()->toDateString();
        $thisMonth = now()->format('Y-m');

        $stats = Cache::remember('manager.dashboard.stats', 120, function () use ($today, $thisMonth) {
            // Single GROUP BY for order counts by status
            $statusCounts = Order::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status');
            $totalOrders = $statusCounts->sum();

            return [
                'totalOrders' => $totalOrders,
                'pendingOrders' => $statusCounts->get('pending', 0),
                'processingOrders' => $statusCounts->get('processing', 0),
                'shippedOrders' => $statusCounts->get('shipped', 0),
                'deliveredOrders' => $statusCounts->get('delivered', 0),
                'cancelledOrders' => $statusCounts->get('cancelled', 0),
                'totalRevenue' => Order::whereNotIn('status', ['cancelled'])->sum('total'),
                'todayRevenue' => Order::whereNotIn('status', ['cancelled'])->whereDate('created_at', $today)->sum('total'),
                'monthRevenue' => Order::whereNotIn('status', ['cancelled'])->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$thisMonth])->sum('total'),
                'totalProducts' => Product::count(),
                'pendingReviews' => Review::where('is_approved', false)->count(),
                'unreadMessages' => ContactMessage::where('is_read', false)->count(),
            ];
        });

        $recentOrders = Cache::remember('manager.dashboard.recent_orders', 120, function () {
            return Order::with('items')->latest()->limit(8)->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'order_number' => $o->order_number,
                    'status' => $o->status,
                    'total' => $o->total,
                    'first_name' => $o->first_name,
                    'created_at' => $o->created_at,
                    'items' => $o->items->map(fn ($i) => [
                        'id' => $i->id,
                        'product_name' => $i->product_name,
                        'quantity' => $i->quantity,
                    ])->values()->all(),
                ])
                ->values()
                ->all();
        });

        $ordersByStatus = Cache::remember('manager.dashboard.orders_by_status', 120, function () {
            return Order::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status');
        });

        return Inertia::render('manager/dashboard', [
            'stats' => $stats,
            'recentOrders' => $recentOrders,
            'ordersByStatus' => $ordersByStatus,
        ]);
    }
}
