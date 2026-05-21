<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Services\TrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    /**
     * Server-side AddToCart event (Meta CAPI + TikTok + GTM SS + GA4).
     * Returns event_id so the browser pixel can deduplicate.
     */
    public function addToCart(Request $request): JsonResponse
    {
        $request->validate([
            'product_id'   => 'required|integer',
            'product_name' => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'quantity'     => 'required|integer|min:1',
        ]);

        $eventId = null;
        try {
            $tracking = new TrackingService();
            $eventId  = $tracking->trackAddToCart($request, [
                'id'    => $request->input('product_id'),
                'name'  => $request->input('product_name'),
                'price' => (float) $request->input('price'),
            ], (int) $request->input('quantity'));
        } catch (\Throwable) {
            $eventId = TrackingService::eventId('atc');
        }

        return response()->json(['event_id' => $eventId]);
    }

    /**
     * Server-side ViewContent event (Meta CAPI + TikTok + GTM SS + GA4).
     * Called from the browser after mount so the request carries the fully-settled
     * _fbc cookie (set by the Meta Pixel SDK after page load).
     * Accepts the event_id generated at render time for deduplication with the browser pixel.
     */
    public function viewContent(Request $request): JsonResponse
    {
        $request->validate([
            'product_id'   => 'required|integer',
            'product_name' => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'event_id'     => 'nullable|string|max:100',
        ]);

        $eventId = null;
        try {
            $tracking = new TrackingService();
            $eventId  = $tracking->trackViewContent($request, [
                'id'    => $request->input('product_id'),
                'name'  => $request->input('product_name'),
                'price' => (float) $request->input('price'),
            ], $request->input('event_id') ?: null);
        } catch (\Throwable) {
            $eventId = $request->input('event_id') ?: TrackingService::eventId('view');
        }

        return response()->json(['event_id' => $eventId]);
    }

    /**
     * Server-side AddPaymentInfo event (Meta CAPI + TikTok + GTM SS + GA4).
     * Returns event_id so the browser pixel can deduplicate.
     */
    public function addPaymentInfo(Request $request): JsonResponse
    {
        $request->validate([
            'items'        => 'required|array|min:1',
            'items.*.product_id'   => 'required|integer',
            'items.*.product_name' => 'nullable|string|max:255',
            'items.*.price'        => 'required|numeric|min:0',
            'items.*.quantity'     => 'required|integer|min:1',
            'value'        => 'required|numeric|min:0',
            'payment_type' => 'required|string|max:100',
            'first_name'   => 'nullable|string|max:255',
        ]);

        $eventId = null;
        try {
            $tracking = new TrackingService();
            $eventId  = $tracking->trackAddPaymentInfo(
                $request,
                $request->input('items'),
                (float) $request->input('value'),
                $request->input('payment_type'),
                ['first_name' => $request->input('first_name')],
            );
        } catch (\Throwable) {
            $eventId = TrackingService::eventId('payment');
        }

        return response()->json(['event_id' => $eventId]);
    }

    /**
     * Server-side InitiateCheckout / begin_checkout event (Meta CAPI + TikTok + GTM SS + GA4).
     * Returns event_id so the browser pixel can deduplicate.
     */
    public function beginCheckout(Request $request): JsonResponse
    {
        $request->validate([
            'items'                  => 'nullable|array',
            'items.*.product_id'     => 'nullable|integer',
            'items.*.product_name'   => 'nullable|string|max:255',
            'items.*.price'          => 'nullable|numeric|min:0',
            'items.*.quantity'       => 'nullable|integer|min:1',
            'value'                  => 'nullable|numeric|min:0',
        ]);

        $eventId = null;
        try {
            $tracking = new TrackingService();
            $eventId  = $tracking->trackBeginCheckout(
                $request,
                $request->input('items', []),
                (float) $request->input('value', 0),
            );
        } catch (\Throwable) {
            $eventId = TrackingService::eventId('checkout');
        }

        return response()->json(['event_id' => $eventId]);
    }

    /**
     * Server-side PageView event (Meta CAPI + TikTok + GTM SS + GA4).
     * Browser pixel fires fbq('track','PageView') with the returned event_id for deduplication.
     */
    public function pageView(Request $request): JsonResponse
    {
        $request->validate([
            'url' => 'nullable|url|max:2048',
        ]);

        $eventId = null;
        try {
            $tracking = new TrackingService();
            $eventId  = $tracking->trackPageView($request, $request->input('url') ?: null);
        } catch (\Throwable) {
            $eventId = TrackingService::eventId('pv');
        }

        return response()->json(['event_id' => $eventId]);
    }

    /**
     * Return the client's IP address as JSON.
     * Used by the Meta client-side param builder SDK as the getIpFn callback,
     * which saves the IP to the _fbi cookie so the server can read it back
     * and send the best available client_ip_address to Meta CAPI.
     * IPv6 is preferred over IPv4 per the param builder best practices.
     */
    public function clientIp(Request $request): JsonResponse
    {
        $ip = TrackingService::resolveClientIp($request);

        return response()->json(['ip' => $ip]);
    }
}
