<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Google Ads Conversion API — server-side conversion tracking.
 * Sends purchase conversions directly from Laravel to Google Ads
 * using OAuth2 refresh token auth. No third-party proxy required.
 *
 * Docs: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
 */
class GoogleAdsConversionsService
{
    private const TOKEN_URL   = 'https://oauth2.googleapis.com/token';
    private const API_VERSION = 'v18';
    private const CACHE_KEY   = 'gads_access_token';

    private string $customerId;
    private string $developerToken;
    private string $oauthClientId;
    private string $oauthClientSecret;
    private string $refreshToken;
    private string $conversionActionId;
    private string $currencyCode;

    public function __construct()
    {
        $this->customerId         = preg_replace('/[^0-9]/', '', Setting::get('gads_customer_id', ''));
        $this->developerToken     = Setting::get('gads_developer_token', '');
        $this->oauthClientId      = Setting::get('gads_oauth_client_id', '');
        $this->oauthClientSecret  = Setting::get('gads_oauth_client_secret', '');
        $this->refreshToken       = Setting::get('gads_refresh_token', '');
        $this->conversionActionId = Setting::get('gads_conversion_action_id', '');
        $this->currencyCode       = Setting::get('gads_currency_code', 'BDT') ?: 'BDT';
    }

    public function isConfigured(): bool
    {
        return $this->customerId !== ''
            && $this->developerToken !== ''
            && $this->oauthClientId !== ''
            && $this->oauthClientSecret !== ''
            && $this->refreshToken !== ''
            && $this->conversionActionId !== '';
    }

    /**
     * Upload a click conversion (Purchase) to Google Ads.
     * Supports Enhanced Conversions by sending hashed PII as userIdentifiers.
     *
     * @param  string  $gclid    Google Click ID captured from _gcl_aw cookie or gclid URL param.
     * @param  float   $value    Conversion value (order total).
     * @param  string  $orderId  Order number for deduplication.
     * @param  string|null $conversionDateTime  ISO-style "Y-m-d H:i:sP". Defaults to now().
     * @param  string|null $email     Customer email (plain text — will be SHA-256 hashed).
     * @param  string|null $phone     Customer phone (plain text — will be normalized + hashed).
     * @param  string|null $firstName Customer first name (plain text — will be hashed).
     */
    public function purchase(
        string $gclid,
        float $value,
        string $orderId,
        ?string $conversionDateTime = null,
        ?string $email = null,
        ?string $phone = null,
        ?string $firstName = null,
    ): void {
        if (! $this->isConfigured() || $gclid === '') {
            return;
        }

        $accessToken = $this->getAccessToken();
        if ($accessToken === null) {
            return;
        }

        $conversionActionResourceName = sprintf(
            'customers/%s/conversionActions/%s',
            $this->customerId,
            $this->conversionActionId,
        );

        $dateTime = $conversionDateTime
            ?? now()->format('Y-m-d H:i:sP');

        $conversion = [
                    'gclid'            => $gclid,
                    'conversionAction' => $conversionActionResourceName,
                    'conversionDateTime' => $dateTime,
                    'conversionValue'  => $value,
                    'currencyCode'     => $this->currencyCode,
                    'orderId'          => $orderId,
                ];

        // Enhanced Conversions: attach hashed PII for improved attribution
        $userIdentifiers = $this->buildUserIdentifiers($email, $phone, $firstName);
        if (! empty($userIdentifiers)) {
            $conversion['userIdentifiers'] = $userIdentifiers;
        }

        $payload = [
            'conversions'    => [$conversion],
            'partialFailure' => true,
        ];

        $apiUrl = sprintf(
            'https://googleads.googleapis.com/%s/customers/%s:uploadClickConversions',
            self::API_VERSION,
            $this->customerId,
        );

        try {
            $response = Http::timeout(8)
                ->withHeaders([
                    'Authorization'  => 'Bearer ' . $accessToken,
                    'developer-token' => $this->developerToken,
                    'Content-Type'   => 'application/json',
                ])
                ->post($apiUrl, $payload);

            if (! $response->successful()) {
                Log::warning('Google Ads conversion upload failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                    'order'  => $orderId,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Google Ads conversion upload exception', [
                'message' => $e->getMessage(),
                'order'   => $orderId,
            ]);
        }
    }

    /**
     * Build Enhanced Conversions userIdentifiers array with SHA-256 hashed PII.
     * Google Ads requires each identifier as a separate object in the array.
     */
    private function buildUserIdentifiers(?string $email, ?string $phone, ?string $firstName): array
    {
        $identifiers = [];

        if ($email && trim($email) !== '') {
            $identifiers[] = [
                'hashedEmail' => hash('sha256', strtolower(trim($email))),
            ];
        }

        if ($phone && trim($phone) !== '') {
            $normalized = $this->normalizePhone($phone);
            $identifiers[] = [
                'hashedPhoneNumber' => hash('sha256', $normalized),
            ];
        }

        if ($firstName && trim($firstName) !== '') {
            $identifiers[] = [
                'addressInfo' => [
                    'hashedFirstName' => hash('sha256', strtolower(trim($firstName))),
                    'countryCode' => 'BD',
                ],
            ];
        }

        return $identifiers;
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

    /**
     * Get a valid access token, refreshing via OAuth2 if needed.
     * Cached for 50 minutes to avoid redundant token requests.
     */
    private function getAccessToken(): ?string
    {
        return Cache::remember(self::CACHE_KEY, 50 * 60, function () {
            try {
                $response = Http::timeout(8)->asForm()->post(self::TOKEN_URL, [
                    'client_id'     => $this->oauthClientId,
                    'client_secret' => $this->oauthClientSecret,
                    'refresh_token' => $this->refreshToken,
                    'grant_type'    => 'refresh_token',
                ]);

                if ($response->successful() && isset($response['access_token'])) {
                    return $response['access_token'];
                }

                Log::warning('Google Ads OAuth2 token refresh failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('Google Ads OAuth2 token exception', [
                    'message' => $e->getMessage(),
                ]);
            }

            return null;
        });
    }
}
