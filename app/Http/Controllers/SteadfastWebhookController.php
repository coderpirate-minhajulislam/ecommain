<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SteadfastWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        // Verify Bearer token
        $expectedToken = Setting::get('steadfast_webhook_token', '');

        if (empty($expectedToken)) {
            Log::warning('Steadfast webhook received but no webhook token is configured.');
            return response()->json(['message' => 'Webhook not configured.'], 403);
        }

        $authHeader = $request->header('Authorization', '');
        $incoming = '';
        if (str_starts_with($authHeader, 'Bearer ')) {
            $incoming = substr($authHeader, 7);
        }

        if (!hash_equals($expectedToken, $incoming)) {
            Log::warning('Steadfast webhook: invalid Bearer token.', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $payload = $request->all();

        Log::info('Steadfast webhook received', $payload);

        // Find order by steadfast_consignment_id or by order_number (invoice)
        $order = null;

        if (!empty($payload['consignment_id'])) {
            $order = Order::where('steadfast_consignment_id', $payload['consignment_id'])->first();
        }

        if (!$order && !empty($payload['invoice'])) {
            $order = Order::where('order_number', $payload['invoice'])->first();
        }

        if (!$order) {
            Log::warning('Steadfast webhook: order not found.', $payload);
            return response()->json(['message' => 'Order not found.'], 404);
        }

        // Determine delivery status
        $deliveryStatus = $payload['delivery_status']
            ?? $payload['status']
            ?? $payload['event']
            ?? null;

        if ($deliveryStatus) {
            $order->steadfast_status = strtolower($deliveryStatus);
        }

        if (!empty($payload['tracking_code'])) {
            $order->steadfast_tracking_code = $payload['tracking_code'];
        }

        // Map Steadfast delivery status → order status
        $statusMap = [
            'delivered'        => 'delivered',
            'cancelled'        => 'cancelled',
            'partial_delivered'=> 'delivered',
            'returned'         => 'cancelled',
            'hold'             => 'processing',
            'in_review'        => 'processing',
            'processing'       => 'processing',
        ];

        $normalized = strtolower($deliveryStatus ?? '');
        if (isset($statusMap[$normalized])) {
            $order->status = $statusMap[$normalized];
        }

        $order->save();

        return response()->json(['message' => 'Webhook processed successfully.'], 200);
    }
}
