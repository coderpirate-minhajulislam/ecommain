<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GTM Server-Side container — sends events directly from Laravel
 * to your own GTM server-side endpoint (no third-party proxy).
 */
class GtmServerService
{
    private string $endpointUrl;

    public function __construct()
    {
        $this->endpointUrl = rtrim(Setting::get('gtm_ss_url', ''), '/');
    }

    public function isConfigured(): bool
    {
        return $this->endpointUrl !== '' && filter_var($this->endpointUrl, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Send a single event to the GTM server-side container.
     * Uses the Measurement Protocol-style POST to the /collect endpoint.
     */
    public function sendEvent(array $eventData): void
    {
        if (! $this->isConfigured()) {
            return;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($this->endpointUrl . '/collect', $eventData);

            if (! $response->successful()) {
                Log::warning('GTM SS request failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('GTM SS request exception', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build a GA4 Measurement Protocol event for GTM server-side.
     */
    public function buildEvent(
        string  $eventName,
        string  $clientId,
        array   $eventParams = [],
        ?string $userId = null,
    ): array {
        $event = [
            'client_id' => $clientId,
            'events'    => [
                [
                    'name'   => $eventName,
                    'params' => array_merge($eventParams, [
                        'engagement_time_msec' => 100,
                    ]),
                ],
            ],
        ];

        if ($userId) {
            $event['user_id'] = $userId;
        }

        return $event;
    }

    // ─── Ecommerce helpers ──────────────────────────────────────────────

    public function purchase(string $clientId, array $orderData, ?string $userId = null, array $customerData = [], ?string $eventId = null): void
    {
        $items = array_map(fn ($item) => [
            'item_id'      => (string) ($item['product_id'] ?? ''),
            'item_name'    => $item['product_name'] ?? '',
            'item_variant' => $item['variant_label'] ?? null,
            'price'        => (float) ($item['price'] ?? 0),
            'quantity'     => (int) ($item['quantity'] ?? 1),
        ], $orderData['items'] ?? []);

        $params = [
            'currency'       => 'BDT',
            'transaction_id' => $orderData['order_number'] ?? '',
            'value'          => (float) ($orderData['total'] ?? 0),
            'shipping'       => (float) ($orderData['shipping'] ?? 0),
            'items'          => $items,
        ];

        if ($eventId) {
            $params['event_id'] = $eventId;
        }

        if (! empty($customerData['first_name'])) {
            $params['customer_name'] = $customerData['first_name'];
        }
        if (! empty($customerData['phone'])) {
            $params['customer_phone'] = $customerData['phone'];
        }
        if (! empty($customerData['address'])) {
            $params['customer_address'] = $customerData['address'];
        }
        if (! empty($customerData['city'])) {
            $params['customer_city'] = $customerData['city'];
        }

        if (! empty($orderData['coupon_code'])) {
            $params['coupon'] = $orderData['coupon_code'];
        }

        if (! empty($orderData['discount']) && (float) $orderData['discount'] > 0) {
            $params['discount'] = (float) $orderData['discount'];
        }

        $event = $this->buildEvent('purchase', $clientId, $params, $userId);

        // Enhanced user_data for GA4 Enhanced Conversions via GTM SS
        $userData = $this->buildHashedUserData($customerData);
        if (! empty($userData)) {
            $event['user_data'] = $userData;
        }

        $this->sendEvent($event);
    }

    public function beginCheckout(string $clientId, array $items, float $value, ?string $userId = null, ?string $eventId = null): void
    {
        $params = [
            'currency' => 'BDT',
            'value'    => $value,
            'items'    => $items,
        ];
        if ($eventId) {
            $params['event_id'] = $eventId;
        }
        $this->sendEvent($this->buildEvent('begin_checkout', $clientId, $params, $userId));
    }

    public function addToCart(string $clientId, array $item, float $value, ?string $userId = null, ?string $eventId = null): void
    {
        $params = [
            'currency' => 'BDT',
            'value'    => $value,
            'items'    => [$item],
        ];
        if ($eventId) {
            $params['event_id'] = $eventId;
        }
        $this->sendEvent($this->buildEvent('add_to_cart', $clientId, $params, $userId));
    }

    public function viewItem(string $clientId, array $item, float $value, ?string $userId = null, ?string $eventId = null): void
    {
        $params = [
            'currency' => 'BDT',
            'value'    => $value,
            'items'    => [$item],
        ];
        if ($eventId) {
            $params['event_id'] = $eventId;
        }
        $this->sendEvent($this->buildEvent('view_item', $clientId, $params, $userId));
    }

    public function search(string $clientId, string $searchTerm, ?string $userId = null, ?string $eventId = null): void
    {
        $params = ['search_term' => $searchTerm];
        if ($eventId) {
            $params['event_id'] = $eventId;
        }
        $this->sendEvent($this->buildEvent('search', $clientId, $params, $userId));
    }

    public function contact(string $clientId, ?string $userId = null, ?string $eventId = null): void
    {
        $params = [];
        if ($eventId) {
            $params['event_id'] = $eventId;
        }
        $this->sendEvent($this->buildEvent('contact', $clientId, $params, $userId));
    }

    public function pageView(string $clientId, ?string $userId = null, ?string $eventId = null): void
    {
        $params = [];
        if ($eventId) {
            $params['event_id'] = $eventId;
        }
        $this->sendEvent($this->buildEvent('page_view', $clientId, $params, $userId));
    }

    public function addPaymentInfo(string $clientId, array $items, float $value, string $paymentType, ?string $userId = null, ?string $eventId = null): void
    {
        $params = [
            'currency'     => 'BDT',
            'value'        => $value,
            'payment_type' => $paymentType,
            'items'        => $items,
        ];
        if ($eventId) {
            $params['event_id'] = $eventId;
        }
        $this->sendEvent($this->buildEvent('add_payment_info', $clientId, $params, $userId));
    }

    /**
     * Build SHA-256 hashed user_data for GA4 Enhanced Conversions via GTM SS.
     * GTM server container forwards this to GA4 for improved attribution.
     */
    private function buildHashedUserData(array $customerData): array
    {
        $userData = [];

        if (! empty($customerData['email'])) {
            $userData['sha256_email_address'] = hash('sha256', strtolower(trim($customerData['email'])));
        }

        if (! empty($customerData['phone'])) {
            $userData['sha256_phone_number'] = hash('sha256', $this->normalizePhone($customerData['phone']));
        }

        if (! empty($customerData['first_name'])) {
            $userData['address'] = [
                'sha256_first_name' => hash('sha256', strtolower(trim($customerData['first_name']))),
                'country' => $customerData['country'] ?? 'BD',
            ];
            if (! empty($customerData['city'])) {
                $userData['address']['city'] = strtolower(trim($customerData['city']));
            }
        }

        return $userData;
    }

    /**
     * Normalize a Bangladeshi phone number to E.164 format (+880XXXXXXXXXX).
     */
    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone);

        if ($digits === '') {
            return $phone;
        }

        if (strlen($digits) === 13 && str_starts_with($digits, '880')) {
            return '+' . $digits;
        }

        if (strlen($digits) === 11 && str_starts_with($digits, '01')) {
            return '+880' . $digits;
        }

        if (strlen($digits) === 10 && str_starts_with($digits, '1')) {
            return '+8801' . substr($digits, 1);
        }

        return '+' . $digits;
    }
}
