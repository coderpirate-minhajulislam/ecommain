<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GA4 Measurement Protocol — server-side event tracking.
 * Sends events directly from Laravel to Google Analytics 4
 * without routing through a third-party server.
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */
class Ga4MeasurementService
{
    private const API_URL = 'https://www.google-analytics.com/mp/collect';

    private string $measurementId;
    private string $apiSecret;

    public function __construct()
    {
        $this->measurementId = Setting::get('ga4_measurement_id', '');
        $this->apiSecret     = Setting::get('ga4_api_secret', '');
    }

    public function isConfigured(): bool
    {
        return $this->measurementId !== '' && $this->apiSecret !== '';
    }

    /**
     * Send one or more events to GA4 Measurement Protocol.
     * GA4 MP accepts up to 25 events per request.
     */
    public function sendEvents(string $clientId, array $events, ?string $userId = null): void
    {
        if (! $this->isConfigured() || empty($events)) {
            return;
        }

        $payload = [
            'client_id' => $clientId,
            'events'    => $events,
        ];

        if ($userId) {
            $payload['user_id'] = $userId;
        }

        // Enhanced user_data for GA4 Enhanced Conversions — hashed PII
        if (! empty($events[0]['params']['_user_data'])) {
            $payload['user_data'] = $events[0]['params']['_user_data'];
            unset($events[0]['params']['_user_data']);
            $payload['events'] = $events;
        }

        try {
            $response = Http::timeout(5)->post(
                self::API_URL . '?' . http_build_query([
                    'measurement_id' => $this->measurementId,
                    'api_secret'     => $this->apiSecret,
                ]),
                $payload,
            );

            // GA4 MP returns 204 on success; log unexpected responses
            if ($response->status() >= 400) {
                Log::warning('GA4 MP request failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('GA4 MP request exception', ['message' => $e->getMessage()]);
        }
    }

    /**
     * Build a GA4 event array for use inside the events[] payload.
     */
    public function buildEvent(string $name, array $params = []): array
    {
        return [
            'name'   => $name,
            'params' => array_merge(['engagement_time_msec' => 100], $params),
        ];
    }

    // ─── Ecommerce event helpers ─────────────────────────────────────────

    /**
     * Fire a purchase event.
     * event_id is passed as a custom param for deduplication matching against GTM/browser.
     */
    public function purchase(
        string  $clientId,
        string  $transactionId,
        float   $value,
        float   $shipping,
        array   $items,
        string  $eventId,
        ?float  $discount = null,
        ?string $coupon = null,
        ?string $userId = null,
        ?array  $customerData = null,
    ): void {
        $params = [
            'currency'       => 'BDT',
            'transaction_id' => $transactionId,
            'value'          => $value,
            'shipping'       => $shipping,
            'items'          => $items,
            'event_id'       => $eventId,  // deduplication key
        ];

        if ($discount !== null && $discount > 0) {
            $params['discount'] = $discount;
        }
        if ($coupon) {
            $params['coupon'] = $coupon;
        }

        // Attach hashed user_data for GA4 Enhanced Conversions
        if ($customerData) {
            $userData = [];
            if (! empty($customerData['email'])) {
                $userData['sha256_email_address'] = [hash('sha256', strtolower(trim($customerData['email'])))];
            }
            if (! empty($customerData['phone'])) {
                $userData['sha256_phone_number'] = [hash('sha256', $this->normalizePhone($customerData['phone']))];
            }
            if (! empty($customerData['first_name'])) {
                $userData['address'] = [
                    'sha256_first_name' => hash('sha256', strtolower(trim($customerData['first_name']))),
                    'country' => $customerData['country'] ?? 'BD',
                ];
            }
            if (! empty($userData)) {
                $params['_user_data'] = $userData;
            }
        }

        $this->sendEvents($clientId, [$this->buildEvent('purchase', $params)], $userId);
    }

    /**
     * Fire a begin_checkout event.
     */
    public function beginCheckout(
        string  $clientId,
        float   $value,
        array   $items,
        string  $eventId,
        ?string $userId = null,
    ): void {
        $this->sendEvents($clientId, [$this->buildEvent('begin_checkout', [
            'currency' => 'BDT',
            'value'    => $value,
            'items'    => $items,
            'event_id' => $eventId,
        ])], $userId);
    }

    /**
     * Fire a view_item event.
     */
    public function viewItem(
        string  $clientId,
        array   $item,
        float   $value,
        string  $eventId,
        ?string $userId = null,
    ): void {
        $this->sendEvents($clientId, [$this->buildEvent('view_item', [
            'currency' => 'BDT',
            'value'    => $value,
            'items'    => [$item],
            'event_id' => $eventId,
        ])], $userId);
    }

    /**
     * Fire an add_to_cart event.
     */
    public function addToCart(
        string  $clientId,
        array   $item,
        float   $value,
        string  $eventId,
        ?string $userId = null,
    ): void {
        $this->sendEvents($clientId, [$this->buildEvent('add_to_cart', [
            'currency' => 'BDT',
            'value'    => $value,
            'items'    => [$item],
            'event_id' => $eventId,
        ])], $userId);
    }

    /**
     * Fire a search event.
     */
    public function search(
        string  $clientId,
        string  $searchTerm,
        string  $eventId,
        ?string $userId = null,
    ): void {
        $this->sendEvents($clientId, [$this->buildEvent('search', [
            'search_term' => $searchTerm,
            'event_id'    => $eventId,
        ])], $userId);
    }

    /**
     * Fire a contact event.
     */
    public function contact(
        string  $clientId,
        string  $eventId,
        ?string $userId = null,
    ): void {
        $this->sendEvents($clientId, [$this->buildEvent('contact', [
            'event_id' => $eventId,
        ])], $userId);
    }

    public function pageView(
        string  $clientId,
        string  $eventId,
        ?string $userId = null,
    ): void {
        $this->sendEvents($clientId, [$this->buildEvent('page_view', [
            'event_id' => $eventId,
        ])], $userId);
    }

    /**
     * Fire an add_payment_info event.
     */
    public function addPaymentInfo(
        string  $clientId,
        float   $value,
        array   $items,
        string  $paymentType,
        string  $eventId,
        ?string $userId = null,
    ): void {
        $this->sendEvents($clientId, [$this->buildEvent('add_payment_info', [
            'currency'     => 'BDT',
            'value'        => $value,
            'payment_type' => $paymentType,
            'items'        => $items,
            'event_id'     => $eventId,
        ])], $userId);
    }

    /**
     * Build a GA4 item array from an order item.
     */
    public static function buildItem(array $item): array
    {
        $ga4Item = [
            'item_id'   => (string) ($item['product_id'] ?? ''),
            'item_name' => $item['product_name'] ?? '',
            'price'     => (float) ($item['price'] ?? 0),
            'quantity'  => (int) ($item['quantity'] ?? 1),
        ];

        if (! empty($item['variant_label'])) {
            $ga4Item['item_variant'] = $item['variant_label'];
        }

        return $ga4Item;
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
