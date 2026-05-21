<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\CourierSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class CourierDashboardController extends Controller
{
    public function __invoke(Request $request, CourierSyncService $service): Response
    {
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        // Only cache the unfiltered (all-time) view; date-filtered views are computed fresh
        if ($dateFrom || $dateTo) {
            $stats = $service->getDashboardStats($dateFrom, $dateTo);
        } else {
            $stats = Cache::remember('admin.courier.dashboard.stats', 300, fn () => $service->getDashboardStats());
        }

        $lastSyncedAt = Cache::get('admin.courier.last_synced_at');

        return Inertia::render('admin/courier-dashboard', [
            'couriers'     => $stats,
            'lastSyncedAt' => $lastSyncedAt,
            'filters'      => [
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
            ],
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $courier  = $request->input('courier');   // steadfast|pathao|redx|carrybee
        $search   = trim((string) $request->input('search', ''));
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');
        $status   = $request->input('status');    // optional status filter from breakdown click
        $perPage  = 20;

        $courierMap = [
            'steadfast' => ['id_col' => 'steadfast_consignment_id', 'status_col' => 'steadfast_status'],
            'pathao'    => ['id_col' => 'pathao_consignment_id',    'status_col' => 'pathao_order_status'],
            'redx'      => ['id_col' => 'redx_tracking_id',         'status_col' => 'redx_status'],
            'carrybee'  => ['id_col' => 'carrybee_consignment_id',  'status_col' => 'carrybee_status'],
        ];

        if (! isset($courierMap[$courier])) {
            return response()->json(['error' => 'Invalid courier'], 422);
        }

        $idCol     = $courierMap[$courier]['id_col'];
        $statusCol = $courierMap[$courier]['status_col'];

        $query = Order::whereNotNull($idCol)
            ->where($idCol, '!=', '')
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->when($status,   fn ($q) => $q->where($statusCol, $status))
            ->when($search,   fn ($q) => $q->where(function ($sq) use ($search, $idCol) {
                $sq->where('first_name', 'like', "%{$search}%")
                   ->orWhere('phone', 'like', "%{$search}%")
                   ->orWhere('order_number', 'like', "%{$search}%")
                   ->orWhere($idCol, 'like', "%{$search}%");
            }))
            ->orderByDesc('id')
            ->paginate($perPage, ['id', 'order_number', 'first_name', 'phone', 'total', $idCol, $statusCol, 'created_at']);

        return response()->json([
            'data' => $query->items(),
            'meta' => [
                'current_page' => $query->currentPage(),
                'last_page'    => $query->lastPage(),
                'total'        => $query->total(),
                'per_page'     => $query->perPage(),
            ],
            'id_col'     => $idCol,
            'status_col' => $statusCol,
        ]);
    }

    public function sync(CourierSyncService $service): JsonResponse
    {
        try {
            $summary = $service->syncAll();

            // Bust the stats cache so the next page load reflects fresh data
            Cache::forget('admin.courier.dashboard.stats');
            Cache::put('admin.courier.last_synced_at', now()->toDateTimeString(), 86400);

            return response()->json([
                'success' => true,
                'message' => "Sync complete — updated {$summary['updated']} order(s), {$summary['errors']} error(s).",
                'summary' => $summary,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
