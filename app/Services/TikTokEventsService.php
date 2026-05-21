<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * TikTok Events API — server-side event tracking.
 * Sends events directly to TikTok without third-party servers.
 */
class TikTokEventsService
{
    private const API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

    private string $pixelId;
    private string $accessToken;
    private ?string $testEventCode;

    public function __construct()
    {
        $this->pixelId       = Setting::get('tiktok_pixel_id', '');
        $this->accessToken   = Setting::get('tiktok_access_token', '');
        $this->testEventCode = trim(Setting::get('tiktok_test_event_code', '')) ?: null;
    }

    public function isConfigured(): bool
    {
        return $this->pixelId !== '' && $this->accessToken !== '';
    }

    /**
     * Send a single event to TikTok Events API.
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
            'pixel_code' => $this->pixelId,
            'partner_name' => 'Laravel',
            'data' => $events,
        ];

        if ($this->testEventCode) {
            $payload['test_event_code'] = $this->testEventCode;
        }

        try {
            $response = Http::withHeaders([
                'Access-Token' => $this->accessToken,
                'Content-Type' => 'application/json',
            ])->timeout(5)->post(self::API_URL, $payload);

            if (! $response->successful()) {
                Log::warning('TikTok Events API request failed', [
                    'status' => $response->status(),
                    'body'   => $response->json(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('TikTok Events API request exception', [
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
        array  $properties = [],
    ): array {
        $event = [
            'event'      => $eventName,
            'event_time' => time(),
            'event_id'   => $eventId,
            'page'       => [
                'url' => $sourceUrl,
            ],
            'user'       => $this->normalizeUserData($userData),
        ];

        if (! empty($properties)) {
            $event['properties'] = $properties;
        }

        return $event;
    }

    /**
     * Hash PII fields as required by TikTok.
     * TikTok requires SHA-256 hashing for: email, phone_number, external_id.
     */
    private function normalizeUserData(array $data): array
    {
        $normalized = [];

        $hashFields = ['email', 'phone_number', 'external_id'];

        foreach ($data as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            if (in_array($key, $hashFields, true)) {
                // Normalize phone to E.164 before hashing (TikTok requires this for match quality)
                if ($key === 'phone_number') {
                    $value = $this->normalizePhone((string) $value);
                }
                $normalized[$key] = hash('sha256', strtolower(trim((string) $value)));
            } else {
                // ip, user_agent, ttp, ttclid — sent as-is
                $normalized[$key] = $value;
            }
        }

        return $normalized;
    }

    /**
     * Normalize a Bangladeshi phone number to E.164 format (+880XXXXXXXXXX).
     * TikTok requires E.164 before SHA-256 hashing for best match quality.
     */
    private function normalizePhone(string $phone): string
    {
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
            'contents'     => $content['contents'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
        ]));
    }

    public function addToCart(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('AddToCart', $eventId, $url, $userData, [
            'contents'     => $content['contents'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
        ]));
    }

    public function initiateCheckout(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('InitiateCheckout', $eventId, $url, $userData, [
            'contents'     => $content['contents'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
        ]));
    }

    public function addPaymentInfo(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('AddPaymentInfo', $eventId, $url, $userData, [
            'contents'     => $content['contents'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
        ]));
    }

    public function completePayment(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('CompletePayment', $eventId, $url, $userData, [
            'contents'     => $content['contents'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
            'order_id'     => $content['order_id'] ?? '',
        ]));
    }

    public function placeAnOrder(string $eventId, string $url, array $userData, array $content): void
    {
        $this->sendEvent($this->buildEvent('PlaceAnOrder', $eventId, $url, $userData, [
            'contents'     => $content['contents'] ?? [],
            'content_type' => $content['content_type'] ?? 'product',
            'value'        => $content['value'] ?? 0,
            'currency'     => 'BDT',
            'order_id'     => $content['order_id'] ?? '',
        ]));
    }

    public function search(string $eventId, string $url, array $userData, string $searchString): void
    {
        $this->sendEvent($this->buildEvent('Search', $eventId, $url, $userData, [
            'query' => $searchString,
        ]));
    }

    public function contact(string $eventId, string $url, array $userData): void
    {
        $this->sendEvent($this->buildEvent('Contact', $eventId, $url, $userData));
    }

    public function pageView(string $eventId, string $url, array $userData): void
    {
        $this->sendEvent($this->buildEvent('Pageview', $eventId, $url, $userData));
    }
}
