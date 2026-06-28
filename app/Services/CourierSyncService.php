<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;

class CourierSyncService
{
    // -----------------------------------------------------------------------
    // Configuration checks
    // -----------------------------------------------------------------------

    public static function isSteadfastConfigured(): bool
    {
        return (bool) Setting::get('steadfast_api_key') && (bool) Setting::get('steadfast_secret_key');
    }

    public static function isPathaoConfigured(): bool
    {
        return (bool) Setting::get('pathao_client_id')
            && (bool) Setting::get('pathao_client_secret')
            && (bool) Setting::get('pathao_username')
            && (bool) Setting::get('pathao_password');
    }

    public static function isRedxConfigured(): bool
    {
        return (bool) Setting::get('redx_access_token');
    }

    public static function isCarrybeeConfigured(): bool
    {
        return (bool) Setting::get('carrybee_client_id')
            && (bool) Setting::get('carrybee_client_secret')
            && (bool) Setting::get('carrybee_client_context');
    }

    // -----------------------------------------------------------------------
    // Sync statuses from each courier API
    // -----------------------------------------------------------------------

    /**
     * Sync all configured couriers and return summary.
     * @return array{updated: int, errors: int, couriers: array}
     */
    public function syncAll(): array
    {
        $summary = ['updated' => 0, 'errors' => 0, 'couriers' => []];

        if (self::isSteadfastConfigured()) {
            $result = $this->syncSteadfast();
            $summary['couriers']['steadfast'] = $result;
            $summary['updated'] += $result['updated'];
            $summary['errors']  += $result['errors'];
        }

        if (self::isPathaoConfigured()) {
            $result = $this->syncPathao();
            $summary['couriers']['pathao'] = $result;
            $summary['updated'] += $result['updated'];
            $summary['errors']  += $result['errors'];
        }

        if (self::isRedxConfigured()) {
            $result = $this->syncRedx();
            $summary['couriers']['redx'] = $result;
            $summary['updated'] += $result['updated'];
            $summary['errors']  += $result['errors'];
        }

        if (self::isCarrybeeConfigured()) {
            $result = $this->syncCarrybee();
            $summary['couriers']['carrybee'] = $result;
            $summary['updated'] += $result['updated'];
            $summary['errors']  += $result['errors'];
        }

        return $summary;
    }

    // -----------------------------------------------------------------------
    // Steadfast sync
    // -----------------------------------------------------------------------

    private function syncSteadfast(): array
    {
        $updated = 0;
        $errors  = 0;
        $service = app(SteadfastService::class);

        // Sync all orders that have a real consignment ID and are NOT in a terminal state.
        // IMPORTANT: MySQL's NOT IN skips NULLs, so we must handle NULL status explicitly
        // to catch newly-sent orders whose status has never been fetched yet.
        $orders = Order::whereNotNull('steadfast_consignment_id')
            ->where('steadfast_consignment_id', '!=', '')
            ->where(function ($q) {
                $q->whereNull('steadfast_status')
                  ->orWhereNotIn('steadfast_status', ['delivered', 'delivered_approval_pending', 'partial_delivered', 'cancelled', 'returned']);
            })
            ->get(['id', 'steadfast_consignment_id', 'steadfast_status', 'status']);

        // Steadfast statuses that confirm the parcel was delivered to the customer
        $sfDeliveredStatuses = ['delivered', 'delivered_approval_pending', 'partial_delivered'];

        foreach ($orders as $order) {
            try {
                $status = $service->getStatusByConsignmentId((int) $order->steadfast_consignment_id);
                if ($order->steadfast_status !== $status) {
                    $order->steadfast_status = $status;
                    // Auto-update order status to delivered when courier confirms delivery
                    if (in_array($status, $sfDeliveredStatuses, true) && $order->status !== 'delivered') {
                        $order->status = 'delivered';
                    }
                    $order->save();
                    $updated++;
                }
            } catch (\Throwable $e) {
                Log::warning('CourierSyncService: Steadfast status fetch failed', [
                    'order_id'         => $order->id,
                    'consignment_id'   => $order->steadfast_consignment_id,
                    'error'            => $e->getMessage(),
                ]);
                $errors++;
            }
        }

        // Reconciliation pass (no API calls): orders whose courier status is already a
        // delivery status but order.status was never flipped to delivered (e.g. added after fix).
        Order::whereNotNull('steadfast_consignment_id')
            ->where('steadfast_consignment_id', '!=', '')
            ->whereIn('steadfast_status', $sfDeliveredStatuses)
            ->where('status', '!=', 'delivered')
            ->each(function (Order $order) use (&$updated) {
                $order->status = 'delivered';
                $order->save();
                $updated++;
            });

        return ['updated' => $updated, 'errors' => $errors];
    }

    // -----------------------------------------------------------------------
    // Pathao sync
    // -----------------------------------------------------------------------

    private function syncPathao(): array
    {
        $updated = 0;
        $errors  = 0;
        $service = app(PathaoService::class);

        $orders = Order::whereNotNull('pathao_consignment_id')
            ->where('pathao_consignment_id', '!=', '')
            ->where(function ($q) {
                $q->whereNull('pathao_order_status')
                  ->orWhereNotIn('pathao_order_status', ['Delivered', 'Cancelled']);
            })
            ->get(['id', 'pathao_consignment_id', 'pathao_order_status', 'status']);

        foreach ($orders as $order) {
            try {
                $info   = $service->getOrderInfo((string) $order->pathao_consignment_id);
                $status = $info['order_status'] ?? null;
                if ($status && $order->pathao_order_status !== $status) {
                    $order->pathao_order_status = $status;
                    // Auto-update order status to delivered when courier confirms delivery
                    if ($status === 'Delivered' && $order->status !== 'delivered') {
                        $order->status = 'delivered';
                    }
                    $order->save();
                    $updated++;
                }
            } catch (\Throwable $e) {
                Log::warning('CourierSyncService: Pathao status fetch failed', [
                    'order_id'         => $order->id,
                    'consignment_id'   => $order->pathao_consignment_id,
                    'error'            => $e->getMessage(),
                ]);
                $errors++;
            }
        }

        // Reconciliation pass: already-delivered courier status but order not yet marked delivered
        Order::whereNotNull('pathao_consignment_id')
            ->where('pathao_consignment_id', '!=', '')
            ->where('pathao_order_status', 'Delivered')
            ->where('status', '!=', 'delivered')
            ->each(function (Order $order) use (&$updated) {
                $order->status = 'delivered';
                $order->save();
                $updated++;
            });

        return ['updated' => $updated, 'errors' => $errors];
    }

    // -----------------------------------------------------------------------
    // RedX sync
    // -----------------------------------------------------------------------

    private function syncRedx(): array
    {
        $updated = 0;
        $errors  = 0;
        $service = app(RedxService::class);

        $orders = Order::whereNotNull('redx_tracking_id')
            ->where('redx_tracking_id', '!=', '')
            ->where(function ($q) {
                $q->whereNull('redx_status')
                  ->orWhereNotIn('redx_status', ['Delivered', 'Cancelled', 'Delivery Failed', 'Returned', 'Return In Transit', 'Partially Returned']);
            })
            ->get(['id', 'redx_tracking_id', 'redx_status', 'status']);

        foreach ($orders as $order) {
            try {
                $tracking = $service->trackParcel((string) $order->redx_tracking_id);
                // RedX tracking returns an array of events; the latest is the current status
                $latestEvent = collect($tracking)->last();
                $status = $latestEvent['status'] ?? null;
                if ($status && $order->redx_status !== $status) {
                    $order->redx_status = $status;
                    // Auto-update order status to delivered when courier confirms delivery
                    if ($status === 'Delivered' && $order->status !== 'delivered') {
                        $order->status = 'delivered';
                    }
                    $order->save();
                    $updated++;
                }
            } catch (\Throwable $e) {
                Log::warning('CourierSyncService: RedX status fetch failed', [
                    'order_id'       => $order->id,
                    'tracking_id'    => $order->redx_tracking_id,
                    'error'          => $e->getMessage(),
                ]);
                $errors++;
            }
        }

        // Reconciliation pass: already-delivered courier status but order not yet marked delivered
        Order::whereNotNull('redx_tracking_id')
            ->where('redx_tracking_id', '!=', '')
            ->where('redx_status', 'Delivered')
            ->where('status', '!=', 'delivered')
            ->each(function (Order $order) use (&$updated) {
                $order->status = 'delivered';
                $order->save();
                $updated++;
            });

        return ['updated' => $updated, 'errors' => $errors];
    }

    // -----------------------------------------------------------------------
    // Carrybee sync
    // -----------------------------------------------------------------------

    private function syncCarrybee(): array
    {
        $updated = 0;
        $errors  = 0;
        $service = app(CarrybeeService::class);

        $orders = Order::whereNotNull('carrybee_consignment_id')
            ->where('carrybee_consignment_id', '!=', '')
            ->where(function ($q) {
                $q->whereNull('carrybee_status')
                  ->orWhereNotIn('carrybee_status', ['Delivered', 'Cancelled', 'Pickup Cancel', 'Delivery Failed', 'Returned', 'Return In Transit', 'Partially Returned']);
            })
            ->get(['id', 'carrybee_consignment_id', 'carrybee_status', 'status']);

        foreach ($orders as $order) {
            try {
                $details = $service->getOrderDetails((string) $order->carrybee_consignment_id);
                $status  = $details['status'] ?? null;
                if ($status && $order->carrybee_status !== $status) {
                    $order->carrybee_status = $status;
                    // Auto-update order status to delivered when courier confirms delivery
                    if ($status === 'Delivered' && $order->status !== 'delivered') {
                        $order->status = 'delivered';
                    }
                    $order->save();
                    $updated++;
                }
            } catch (\Throwable $e) {
                Log::warning('CourierSyncService: Carrybee status fetch failed', [
                    'order_id'         => $order->id,
                    'consignment_id'   => $order->carrybee_consignment_id,
                    'error'            => $e->getMessage(),
                ]);
                $errors++;
            }
        }

        // Reconciliation pass: already-delivered courier status but order not yet marked delivered
        Order::whereNotNull('carrybee_consignment_id')
            ->where('carrybee_consignment_id', '!=', '')
            ->where('carrybee_status', 'Delivered')
            ->where('status', '!=', 'delivered')
            ->each(function (Order $order) use (&$updated) {
                $order->status = 'delivered';
                $order->save();
                $updated++;
            });

        return ['updated' => $updated, 'errors' => $errors];
    }

    // -----------------------------------------------------------------------
    // Sync a single order across all its configured couriers
    // -----------------------------------------------------------------------

    /**
     * Refresh courier status for one order and auto-set order.status = 'delivered'
     * when any attached courier confirms delivery.
     *
     * @return array{order_status: string, status_updated_to_delivered: bool, ...courier statuses/errors}
     */
    public function syncForOrder(Order $order): array
    {
        $result = ['status_updated_to_delivered' => false];

        // Steadfast
        if ($order->steadfast_consignment_id && self::isSteadfastConfigured()) {
            try {
                $service = app(SteadfastService::class);
                $status  = $service->getStatusByConsignmentId((int) $order->steadfast_consignment_id);
                $result['steadfast_status'] = $status;
                // Always update the courier status as-is (show real courier status)
                $order->steadfast_status = $status;
                // Statuses that confirm the parcel was delivered to the customer
                $sfDeliveredStatuses = ['delivered', 'delivered_approval_pending', 'partial_delivered'];
                if (in_array($status, $sfDeliveredStatuses, true) && $order->status !== 'delivered') {
                    $order->status = 'delivered';
                    $result['status_updated_to_delivered'] = true;
                }
            } catch (\Throwable $e) {
                $result['steadfast_error'] = $e->getMessage();
                Log::warning('CourierSyncService: syncForOrder Steadfast failed', [
                    'order_id' => $order->id, 'error' => $e->getMessage(),
                ]);
            }
        }

        // Pathao
        if ($order->pathao_consignment_id && self::isPathaoConfigured()) {
            try {
                $service = app(PathaoService::class);
                $info    = $service->getOrderInfo((string) $order->pathao_consignment_id);
                $status  = $info['order_status'] ?? null;
                if ($status) {
                    $result['pathao_order_status'] = $status;
                    // Always update the courier status as-is (show real courier status)
                    $order->pathao_order_status = $status;
                    if ($status === 'Delivered' && $order->status !== 'delivered') {
                        $order->status = 'delivered';
                        $result['status_updated_to_delivered'] = true;
                    }
                }
            } catch (\Throwable $e) {
                $result['pathao_error'] = $e->getMessage();
                Log::warning('CourierSyncService: syncForOrder Pathao failed', [
                    'order_id' => $order->id, 'error' => $e->getMessage(),
                ]);
            }
        }

        // RedX
        if ($order->redx_tracking_id && self::isRedxConfigured()) {
            try {
                $service     = app(RedxService::class);
                $tracking    = $service->trackParcel((string) $order->redx_tracking_id);
                $latestEvent = collect($tracking)->last();
                $status      = $latestEvent['status'] ?? null;
                if ($status) {
                    $result['redx_status'] = $status;
                    // Always update the courier status as-is (show real courier status)
                    $order->redx_status = $status;
                    if ($status === 'Delivered' && $order->status !== 'delivered') {
                        $order->status = 'delivered';
                        $result['status_updated_to_delivered'] = true;
                    }
                }
            } catch (\Throwable $e) {
                $result['redx_error'] = $e->getMessage();
                Log::warning('CourierSyncService: syncForOrder RedX failed', [
                    'order_id' => $order->id, 'error' => $e->getMessage(),
                ]);
            }
        }

        // Carrybee
        if ($order->carrybee_consignment_id && self::isCarrybeeConfigured()) {
            try {
                $service = app(CarrybeeService::class);
                $details = $service->getOrderDetails((string) $order->carrybee_consignment_id);
                $status  = $details['status'] ?? null;
                if ($status) {
                    $result['carrybee_status'] = $status;
                    // Always update the courier status as-is (show real courier status)
                    $order->carrybee_status = $status;
                    if ($status === 'Delivered' && $order->status !== 'delivered') {
                        $order->status = 'delivered';
                        $result['status_updated_to_delivered'] = true;
                    }
                }
            } catch (\Throwable $e) {
                $result['carrybee_error'] = $e->getMessage();
                Log::warning('CourierSyncService: syncForOrder Carrybee failed', [
                    'order_id' => $order->id, 'error' => $e->getMessage(),
                ]);
            }
        }

        $order->save();
        $result['order_status'] = $order->status;

        return $result;
    }

    // -----------------------------------------------------------------------
    // Dashboard stats — reads from local DB (no API calls)
    // -----------------------------------------------------------------------

    public function getDashboardStats(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo   = $dateTo;

        $couriers = [];

        if (self::isSteadfastConfigured()) {
            $couriers['steadfast'] = $this->steadfastStats();
        }

        if (self::isPathaoConfigured()) {
            $couriers['pathao'] = $this->pathaoStats();
        }

        if (self::isRedxConfigured()) {
            $couriers['redx'] = $this->redxStats();
        }

        if (self::isCarrybeeConfigured()) {
            $couriers['carrybee'] = $this->carrybeeStats();
        }

        return $couriers;
    }

    // Temporary per-call date range (set before each getDashboardStats call)
    private ?string $dateFrom = null;
    private ?string $dateTo   = null;

    private function applyDateFilter($query)
    {
        return $query
            ->when($this->dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $this->dateFrom))
            ->when($this->dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $this->dateTo));
    }

    /** Base query: orders that were actually sent to Steadfast (non-null, non-empty consignment ID) */
    private function steadfastBase()
    {
        return $this->applyDateFilter(
            Order::whereNotNull('steadfast_consignment_id')->where('steadfast_consignment_id', '!=', '')
        );
    }

    private function steadfastStats(): array
    {
        // Use COUNT(*) directly so NULL-status rows are never dropped
        $total = $this->steadfastBase()->count();

        $rows = $this->steadfastBase()
            ->selectRaw('COALESCE(steadfast_status, \'\') as status, COUNT(*) as cnt')
            ->groupBy('steadfast_status')
            ->pluck('cnt', 'status');

        $notSynced = (int) $this->steadfastBase()->whereNull('steadfast_status')->count();

        // 'delivered_approval_pending' = Steadfast delivered the parcel, awaiting merchant approval for payment
        $sfDeliveredStatuses = ['delivered', 'delivered_approval_pending'];
        $sfReturnedStatuses  = ['partial_delivered', 'returned'];

        $deliveredAmount = (float) $this->steadfastBase()->whereIn('steadfast_status', $sfDeliveredStatuses)->sum('total');
        $cancelledAmount = (float) $this->steadfastBase()->where('steadfast_status', 'cancelled')->sum('total');
        $returnedAmount  = (float) $this->steadfastBase()->whereIn('steadfast_status', $sfReturnedStatuses)->sum('total');

        return [
            'name'             => 'Steadfast',
            'total'            => $total,
            'delivered'        => (int) ($rows->get('delivered', 0) + $rows->get('delivered_approval_pending', 0)),
            'cancelled'        => (int) ($rows->get('cancelled', 0)),
            'pending'          => (int) ($rows->get('pending', 0) + $rows->get('in_review', 0) + $rows->get('unknown', 0)),
            'in_transit'       => (int) ($rows->get('in_transit', 0)),
            'returned'         => (int) ($rows->get('partial_delivered', 0) + $rows->get('returned', 0)),
            'not_synced'       => $notSynced,
            'statuses'         => $rows->toArray(),
            'delivered_amount' => $deliveredAmount,
            'cancelled_amount' => $cancelledAmount,
            'returned_amount'  => $returnedAmount,
            'net_amount'       => $deliveredAmount - $cancelledAmount - $returnedAmount,
        ];
    }

    private function pathaoBase()
    {
        return $this->applyDateFilter(
            Order::whereNotNull('pathao_consignment_id')->where('pathao_consignment_id', '!=', '')
        );
    }

    private function pathaoStats(): array
    {
        $total = $this->pathaoBase()->count();

        $rows = $this->pathaoBase()
            ->selectRaw('COALESCE(pathao_order_status, \'\') as status, COUNT(*) as cnt')
            ->groupBy('pathao_order_status')
            ->pluck('cnt', 'status');

        $notSynced = (int) $this->pathaoBase()->whereNull('pathao_order_status')->count();

        // Pathao uses human-readable status strings (spaces, mixed case) from their API
        $pathaoCancelledStatuses = ['Cancelled', 'Pickup Cancel', 'Pickup_cancel', 'Pickup Failed', 'Pickup_failed'];
        $pathaoReturnedStatuses  = ['Returned', 'Return_in_transit', 'Paid Return', 'Paid_return', 'Return'];
        $pathaoInTransitStatuses = ['Pickup_requested', 'Picked', 'In_transit', 'Out_for_delivery', 'Partial Delivery', 'Partial_delivery'];

        $deliveredAmount = (float) $this->pathaoBase()->where('pathao_order_status', 'Delivered')->sum('total');
        $cancelledAmount = (float) $this->pathaoBase()->whereIn('pathao_order_status', $pathaoCancelledStatuses)->sum('total');
        $returnedAmount  = (float) $this->pathaoBase()->whereIn('pathao_order_status', $pathaoReturnedStatuses)->sum('total');

        $cancelled = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $pathaoCancelledStatuses));
        $returned  = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $pathaoReturnedStatuses));
        $inTransit = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $pathaoInTransitStatuses));

        return [
            'name'             => 'Pathao',
            'total'            => $total,
            'delivered'        => (int) ($rows->get('Delivered', 0)),
            'cancelled'        => $cancelled,
            'pending'          => (int) ($rows->get('Pending', 0)),
            'in_transit'       => $inTransit,
            'returned'         => $returned,
            'not_synced'       => $notSynced,
            'statuses'         => $rows->toArray(),
            'delivered_amount' => $deliveredAmount,
            'cancelled_amount' => $cancelledAmount,
            'returned_amount'  => $returnedAmount,
            'net_amount'       => $deliveredAmount - $cancelledAmount - $returnedAmount,
        ];
    }

    private function redxBase()
    {
        return $this->applyDateFilter(
            Order::whereNotNull('redx_tracking_id')->where('redx_tracking_id', '!=', '')
        );
    }

    private function redxStats(): array
    {
        $total = $this->redxBase()->count();

        $rows = $this->redxBase()
            ->selectRaw('COALESCE(redx_status, \'\') as status, COUNT(*) as cnt')
            ->groupBy('redx_status')
            ->pluck('cnt', 'status');

        $notSynced = (int) $this->redxBase()->whereNull('redx_status')->count();

        // RedX API status variants (with/without spaces, different casings)
        $redxCancelledStatuses = ['Cancelled', 'Delivery Failed', 'Delivery_Failed', 'Out for Return', 'Out_for_Return'];
        $redxReturnedStatuses  = ['Returned', 'Return In Transit', 'Return_In_Transit', 'Partially Returned', 'Partially_Returned'];
        $redxInTransitStatuses = ['Picked up', 'Picked_up', 'In Transit', 'In_Transit', 'Out for Delivery', 'Out_for_Delivery', 'Partially Delivered', 'Partially_Delivered', 'Hold', 'On Hold'];

        $deliveredAmount = (float) $this->redxBase()->where('redx_status', 'Delivered')->sum('total');
        $cancelledAmount = (float) $this->redxBase()->whereIn('redx_status', $redxCancelledStatuses)->sum('total');
        $returnedAmount  = (float) $this->redxBase()->whereIn('redx_status', $redxReturnedStatuses)->sum('total');

        $cancelled = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $redxCancelledStatuses));
        $returned  = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $redxReturnedStatuses));
        $inTransit = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $redxInTransitStatuses));

        return [
            'name'             => 'RedX',
            'total'            => $total,
            'delivered'        => (int) ($rows->get('Delivered', 0)),
            'cancelled'        => $cancelled,
            'pending'          => (int) ($rows->get('Pending', 0)),
            'in_transit'       => $inTransit,
            'returned'         => $returned,
            'not_synced'       => $notSynced,
            'statuses'         => $rows->toArray(),
            'delivered_amount' => $deliveredAmount,
            'cancelled_amount' => $cancelledAmount,
            'returned_amount'  => $returnedAmount,
            'net_amount'       => $deliveredAmount - $cancelledAmount - $returnedAmount,
        ];
    }

    private function carrybeeBase()
    {
        return $this->applyDateFilter(
            Order::whereNotNull('carrybee_consignment_id')->where('carrybee_consignment_id', '!=', '')
        );
    }

    private function carrybeeStats(): array
    {
        $total = $this->carrybeeBase()->count();

        $rows = $this->carrybeeBase()
            ->selectRaw('COALESCE(carrybee_status, \'\') as status, COUNT(*) as cnt')
            ->groupBy('carrybee_status')
            ->pluck('cnt', 'status');

        $notSynced = (int) $this->carrybeeBase()->whereNull('carrybee_status')->count();

        // Carrybee API status variants (with/without spaces, different casings)
        $carrybeeCancelledStatuses = ['Cancelled', 'Pickup Cancel', 'Pickup Failed', 'Pickup_Failed', 'Delivery Failed', 'Delivery_Failed'];
        $carrybeeReturnedStatuses  = ['Returned', 'Return In Transit', 'Return_In_Transit', 'Partially Returned', 'Partially_Returned'];
        $carrybeeInTransitStatuses = ['Picked', 'Picked up', 'In Transit', 'In_Transit', 'Out for Delivery', 'Out_for_Delivery', 'Partially Delivered', 'Partially_Delivered', 'Hold', 'On Hold'];

        $deliveredAmount = (float) $this->carrybeeBase()->where('carrybee_status', 'Delivered')->sum('total');
        $cancelledAmount = (float) $this->carrybeeBase()->whereIn('carrybee_status', $carrybeeCancelledStatuses)->sum('total');
        $returnedAmount  = (float) $this->carrybeeBase()->whereIn('carrybee_status', $carrybeeReturnedStatuses)->sum('total');

        $cancelled = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $carrybeeCancelledStatuses));
        $returned  = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $carrybeeReturnedStatuses));
        $inTransit = array_sum(array_map(fn ($s) => (int) $rows->get($s, 0), $carrybeeInTransitStatuses));

        return [
            'name'             => 'Carrybee',
            'total'            => $total,
            'delivered'        => (int) ($rows->get('Delivered', 0)),
            'cancelled'        => $cancelled,
            'pending'          => (int) ($rows->get('Pending', 0)),
            'in_transit'       => $inTransit,
            'returned'         => $returned,
            'not_synced'       => $notSynced,
            'statuses'         => $rows->toArray(),
            'delivered_amount' => $deliveredAmount,
            'cancelled_amount' => $cancelledAmount,
            'returned_amount'  => $returnedAmount,
            'net_amount'       => $deliveredAmount - $cancelledAmount - $returnedAmount,
        ];
    }
}
