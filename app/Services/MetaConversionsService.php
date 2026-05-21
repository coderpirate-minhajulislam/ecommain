<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Meta (Facebook) Conversions API — server-side event tracking.
 * Sends events directly to Meta without third-party servers.
 */
class MetaConversionsService
{
    private const API_VERSION = 'v22.0';

    private string $pixelId;
    private string $accessToken;
    private ?string $testEventCode;

    public function __construct()
    {
        $this->pixelId       = Setting::get('meta_pixel_id', '');
        $this->accessToken   = Setting::get('meta_access_token', '');
        $this->testEventCode = trim(Setting::get('meta_test_event_code', '')) ?: null;
    }

    public function isConfigured(): bool
    {
        return $this->pixelId !== '' && $this->accessToken !== '';
    }

    /**
     * Send a single event to the Meta Conversions API.
     */
    public function sendEvent(array $eventData): void
    {
        if (! $this->isConfigured()) {
            return;
        }

        $this->sendEvents([$eventData]);
    }

    /**
     * Send multiple events in a single batch request.
     */
    public function sendEvents(array $events): void
    {
        if (! $this->isConfigured() || empty($events)) {
            return;
        }

        $payload = [
            'data'          => $events,
            // access_token belongs in the POST body (Meta's recommended approach —
            // avoids the token appearing in server access logs or proxy caches).
            'access_token'  => $this->accessToken,
            // partner_agent identifies this integration to Meta's systems so events are
            // properly classified for Data Freshness and partner attribution.
            'partner_agent' => strtolower(preg_replace('/\s+/', '-', config('app.name', 'laravel'))) . '/laravel',
        ];

        if ($this->testEventCode) {
            $payload['test_event_code'] = $this->testEventCode;
        }

        // rawurlencode the pixel ID in the path (matches Meta's recommended URL construction).
        // access_token is now in the body — no longer needed in the query string.
        $url = sprintf(
            'https://graph.facebook.com/%s/%s/events',
            self::API_VERSION,
            rawurlencode($this->pixelId),
        );

        // Purchase events use a longer timeout to ensure reliable delivery to Meta.
        // Non-purchase events use 5 s so they don't stall page rendering.
        $hasPurchase = collect($events)->contains(
            fn ($e) => ($e['event_name'] ?? '') === 'Purchase'
        );
        $timeout = $hasPurchase ? 15 : 5;

        try {
            $request = Http::timeout($timeout);

            // Purchase is the highest-value event: retry transient failures to improve
            // server/browser deduplication consistency in Meta Event Manager.
            // 4 total attempts with 500 ms spacing gives ~1.5 s of retry window,
            // covering typical transient Meta API blips without stalling the request too long.
            if ($hasPurchase) {
                $request = $request->retry(3, 500);
            }

            $response = $request->post($url, $payload);

            if (! $response->successful()) {
                Log::warning('Meta CAPI request failed', [
                    'status' => $response->status(),
                    'body'   => $response->json(),
                ]);
                return;
            }

            // Detect silent rejection: Meta returns HTTP 200 but events_received=0
            // when the payload is invalid (bad pixel ID, malformed user_data, etc.).
            // This causes Data Freshness to show "Unknown" because no events are
            // actually counted by Meta, even though the HTTP call succeeded.
            $decoded        = $response->json();
            $eventsReceived = isset($decoded['events_received']) ? (int) $decoded['events_received'] : -1;

            if ($eventsReceived === 0) {
                Log::warning('Meta CAPI silently rejected event (events_received=0) — check pixel ID, access token and user_data', [
                    'events'          => array_column($events, 'event_name'),
                    'response'        => $decoded,
                    'user_data_keys'  => array_map(fn ($e) => array_keys($e['user_data'] ?? []), $events),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Meta CAPI request exception', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    // ─── Event builders ─────────────────────────────────────────────────

    /**
     * Build a standard event payload.
     */
    public function buildEvent(
        string $eventName,
        string $eventId,
        string $sourceUrl,
        array  $userData = [],
        array  $customData = [],
        ?string $actionSource = 'website',
    ): array {
        $event = [
            'event_name'    => $eventName,
            'event_time'    => time(),
            'event_id'      => $eventId,
            'event_source_url' => $sourceUrl,
            'action_source' => $actionSource,
            'user_data'     => $this->normalizeUserData($userData),
        ];

        if (! empty($customData)) {
            $event['custom_data'] = $customData;
        }

        return $event;
    }

    /**
     * Hash PII fields as required by Meta.
     */
    private function normalizeUserData(array $data): array
    {
        $hashed = [];

        // Fields that must be SHA-256 hashed
        $hashFields = ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country', 'db', 'ge', 'external_id'];

        foreach ($data as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            if (in_array($key, $hashFields, true)) {
                // Normalize phone to E.164 before hashing (Meta requires this for match quality)
                if ($key === 'ph') {
                    $value = $this->normalizePhone((string) $value);
                }
                $hashed[$key] = hash('sha256', strtolower(trim((string) $value)));
            } else {
                // client_ip_address, client_user_agent, fbc, fbp — sent as-is
                $hashed[$key] = $value;
            }
        }

        return $hashed;
    }

    /**
     * Normalize a Bangladeshi phone number to E.164 format (+880XXXXXXXXXX).
     * Meta requires E.164 before SHA-256 hashing for best match quality.
     */
    private function normalizePhone(string $phone): string
    {
        // Strip everything except digits and leading +
        $digits = preg_replace('/\D/', '', $phone);

        if ($digits === '') {
            return $phone;
        }

        // Already international: 8801XXXXXXXXX (13 digits)
        if (strlen($digits) === 13 && str_starts_with($digits, '880')) {
            return '+' . $digits;
        }

        // Local Bangladeshi format: 01XXXXXXXXX (11 digits)
        if (strlen($digits) === 11 && str_starts_with($digits, '01')) {
            return '+880' . $digits;
        }

        // 10-digit without leading 0: 1XXXXXXXXX
        if (strlen($digits) === 10 && str_starts_with($digits, '1')) {
            return '+8801' . substr($digits, 1);
        }

        return '+' . $digits;
    }

    // ─── Ecommerce event helpers ────────────────────────────────────────

    public function viewContent(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('ViewContent', $eventId, $url, $userData, [
            'content_ids'  => $content['content_ids'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'content_name' => $content['content_name'] ?? '',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
        ]));
    }

    public function addToCart(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('AddToCart', $eventId, $url, $userData, [
            'content_ids'  => $content['content_ids'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'content_name' => $content['content_name'] ?? '',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
            'contents'     => $content['contents'] ?? [],
        ]));
    }

    public function initiateCheckout(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('InitiateCheckout', $eventId, $url, $userData, [
            'content_ids'  => $content['content_ids'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'num_items'    => $content['num_items'] ?? 0,
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
            'contents'     => $content['contents'] ?? [],
        ]));
    }

    public function purchase(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('Purchase', $eventId, $url, $userData, [
            'content_ids'  => $content['content_ids'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
            'contents'     => $content['contents'] ?? [],
            'order_id'     => $content['order_id'] ?? '',
            'num_items'    => $content['num_items'] ?? 0,
        ]));
    }

    public function search(string $eventId, string $url, array $userData, string $searchString): void
    {
        $this->sendEvent($this->buildEvent('Search', $eventId, $url, $userData, [
            'search_string' => $searchString,
            'content_type'  => 'product',
        ]));
    }

    public function addPaymentInfo(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('AddPaymentInfo', $eventId, $url, $userData, [
            'content_ids'  => $content['content_ids'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
            'contents'     => $content['contents'] ?? [],
        ]));
    }

    public function completeRegistration(string $eventId, string $url, array $userData): void
    {
        $this->sendEvent($this->buildEvent('CompleteRegistration', $eventId, $url, $userData, [
            'status' => true,
        ]));
    }

    public function contact(string $eventId, string $url, array $userData): void
    {
        $this->sendEvent($this->buildEvent('Contact', $eventId, $url, $userData));
    }

    public function pageView(string $eventId, string $url, array $userData): void
    {
        $this->sendEvent($this->buildEvent('PageView', $eventId, $url, $userData));
    }

    /** Fired when a product list / category page is viewed (custom event). */
    public function viewCategory(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('ViewCategory', $eventId, $url, $userData, [
            'content_ids'      => array_map('strval', $content['content_ids'] ?? []),
            'content_type'     => 'product',
            'content_category' => $content['content_category'] ?? '',
        ]));
    }
}
