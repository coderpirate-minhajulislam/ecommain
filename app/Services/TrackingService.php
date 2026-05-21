<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Unified server-side tracking facade.
 * Fires events to Meta CAPI, TikTok Events API, GTM server-side,
 * and GA4 Measurement Protocol in a single call.
 */
class TrackingService
{
    private MetaConversionsService $meta;
    private GtmServerService $gtmSS;
    private TikTokEventsService $tiktok;
    private Ga4MeasurementService $ga4;
    private GoogleAdsConversionsService $googleAds;

    public function __construct()
    {
        $this->meta      = new MetaConversionsService();
        $this->gtmSS     = new GtmServerService();
        $this->tiktok    = new TikTokEventsService();
        $this->ga4       = new Ga4MeasurementService();
        $this->googleAds = new GoogleAdsConversionsService();
    }

    /**
     * Resolve the fbc parameter for Meta CAPI.
     *
     * Priority:
     *   1. Fresh fbclid from the current request URL param (always most accurate).
     *   2. Fresh fbclid extracted from the Referer header.
     *   3. The _fbc cookie — only when its embedded timestamp is ≤ 90 days old.
     *
     * An expired _fbc cookie (> 90 days) is discarded so Meta's Conversions API
     * does not flag the "Server sending expired fbclid value" diagnostic error.
     *
     * Format: fb.{version}.{creation_time_ms}.{fbclid}
     */
    public static function resolveFbc(Request $request): ?string
    {
        // 1. Fresh fbclid in URL params
        if ($fbclid = $request->input('fbclid')) {
            return 'fb.1.' . (string) (int) round(microtime(true) * 1000) . '.' . $fbclid;
        }

        // 2. Fresh fbclid in Referer header
        if ($referer = $request->header('referer')) {
            if (preg_match('/[?&]fbclid=([^&]+)/', $referer, $m)) {
                return 'fb.1.' . (string) (int) round(microtime(true) * 1000) . '.' . $m[1];
            }
        }

        // 3. _fbc cookie — validate it is not older than 90 days
        if ($fbc = $request->cookie('_fbc')) {
            // Strip param-builder appendix (last dot-segment if it looks like an 8-char or 2-char token)
            $fbc = self::stripParamBuilderAppendix($fbc);
            // Parse creation_time_ms from fb.{v}.{ts_ms}.{fbclid}
            if (preg_match('/^fb\.\d+\.(\d+)\./', $fbc, $m)) {
                $createdAtMs = (int) $m[1];
                $ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
                if ((int) round(microtime(true) * 1000) - $createdAtMs <= $ninetyDaysMs) {
                    return $fbc;
                }
                // Cookie is stale — discard it to avoid Meta's expired-fbclid error
                return null;
            }
            // Unrecognised format — return as-is and let Meta validate it
            return $fbc;
        }

        return null;
    }

    /**
     * Resolve the fbp (Meta Browser ID) parameter for Meta CAPI.
     *
     * Priority:
     *   1. _fbp cookie set by the browser Meta Pixel or client-side param builder SDK.
     *   2. Generate a server-side fbp using the same format as the Meta Pixel.
     *
     * Generating fbp server-side when the cookie is missing ensures every CAPI event
     * carries an fbp value, which directly improves Event Match Quality (EMQ).
     *
     * Format: fb.{subdomain_index}.{creation_time_ms}.{random_int}
     */
    public static function resolveFbp(Request $request): string
    {
        if ($fbp = $request->cookie('_fbp')) {
            return self::stripParamBuilderAppendix($fbp);
        }

        // Generate a new fbp — same format as the Meta Pixel JS
        $ts   = (int) round(microtime(true) * 1000);
        $rand = mt_rand(0, 2147483647);
        return 'fb.1.' . $ts . '.' . $rand;
    }

    /**
     * Resolve the best available client IP address for Meta CAPI.
     *
     * Following the param builder library best practices:
     *   1. _fbi cookie — written by the client-side param builder JS SDK.
     *      Contains the browser's actual IP (potentially IPv6), with an appendix
     *      suffix that we strip before forwarding.
     *   2. X-Forwarded-For — first public IP in the chain, IPv6 preferred over IPv4.
     *   3. Laravel request IP ($request->ip()) as the final fallback.
     *
     * IPv6 is always preferred over IPv4 for users on IPv6-enabled networks.
     */
    public static function resolveClientIp(Request $request): string
    {
        // 1. _fbi cookie (set by client-side param builder SDK — may carry IPv6)
        if ($fbi = $request->cookie('_fbi')) {
            $ip = self::stripParamBuilderAppendix($fbi);
            if (self::isPublicIp($ip)) {
                return $ip;
            }
        }

        // 2. X-Forwarded-For — prefer IPv6, then IPv4, skip private ranges
        if ($xff = $request->header('X-Forwarded-For')) {
            $ips = array_map('trim', explode(',', $xff));
            // IPv6 first pass
            foreach ($ips as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
            // IPv4 second pass
            foreach ($ips as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return $request->ip() ?? '';
    }

    /**
     * Strip the param builder appendix suffix from fbc/fbp/fbi values.
     *
     * The client-side and server-side param builder SDKs append an 8-character (v2)
     * or 2-character (v1) quality token as the last dot-separated segment. We must
     * strip it before sending to Meta's Conversions API, otherwise Meta will reject
     * the value as malformed.
     *
     * Format with appendix: fb.1.{ts}.{payload}.{appendix}
     * We strip the appendix only when the last segment is exactly 2 or 8 characters
     * and consists entirely of letters/digits (matching the known appendix formats).
     */
    private static function stripParamBuilderAppendix(string $value): string
    {
        $lastDot = strrpos($value, '.');
        if ($lastDot === false) {
            return $value;
        }
        $suffix = substr($value, $lastDot + 1);
        $len    = strlen($suffix);
        if (($len === 2 || $len === 8) && ctype_alnum($suffix)) {
            return substr($value, 0, $lastDot);
        }
        return $value;
    }

    /**
     * Check whether an IP address is a public (non-private, non-reserved) IP.
     */
    private static function isPublicIp(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) !== false;
    }

    /**
     * Extract user data from the request for Meta CAPI.
     * Implements the param builder library's best practices:
     *   - fbc: from URL fbclid / referer / cookie (with 90-day expiry check)
     *   - fbp: from _fbp cookie or generated server-side (ensures 100% fbp coverage)
     *   - client_ip_address: from _fbi cookie (client-side SDK) → X-Forwarded-For (IPv6 first) → request IP
     *   - client_user_agent: from request header
     */
    public function userDataFromRequest(Request $request, array $extra = []): array
    {
        $data = [
            'client_ip_address' => self::resolveClientIp($request),
            'client_user_agent' => $request->userAgent(),
            'fbp'               => self::resolveFbp($request),
            'country'           => 'bd',
        ];

        if ($fbc = self::resolveFbc($request)) {
            $data['fbc'] = $fbc;
        }

        // Always include logged-in user email + external_id for maximum EMQ on every event
        $authUser = Auth::user();
        if ($authUser) {
            if (! isset($extra['em']) && ! empty($authUser->email)) {
                $data['em'] = $authUser->email;
            }
            if (! isset($extra['external_id'])) {
                $data['external_id'] = (string) $authUser->id;
            }
        } elseif (! isset($extra['external_id']) && $request->hasSession()) {
            // Guest: use session ID as stable external_id so every CAPI event carries
            // a consistent identifier — dramatically improves Event Match Quality.
            $data['external_id'] = $request->session()->getId();
        }

        return array_merge($data, $extra);
    }

    /**
     * Resolve the ttclid for TikTok Events API.
     *
     * Priority:
     *   1. Fresh ttclid from the current request URL param (always preferred — guaranteed < 7 days old).
     *   2. The ttclid cookie set by TikTok Pixel (browser auto-expires it after 7 days).
     *
     * Sending an expired ttclid reduces TikTok Event Match Quality and attribution accuracy.
     */
    public static function resolveTtclid(Request $request): ?string
    {
        // 1. Fresh ttclid in URL params — prefer over cookie to avoid stale values
        if ($ttclid = $request->input('ttclid')) {
            return $ttclid;
        }

        // 2. Cookie (set by TikTok Pixel, browser-enforced 7-day TTL)
        if ($ttclid = $request->cookie('ttclid')) {
            return $ttclid;
        }

        return null;
    }

    /**
     * Resolve the gclid for Google Ads Conversions API.
     *
     * Priority:
     *   1. Fresh gclid from the current request URL param.
     *   2. The _gcl_aw cookie — only when its embedded Unix timestamp is ≤ 90 days old.
     *      Cookie format: GCL.{unix_timestamp_seconds}.{gclid}
     *
     * Sending an expired gclid causes Google Ads to drop the conversion or attribute it incorrectly.
     */
    public static function resolveGclid(Request $request): ?string
    {
        // 1. Fresh gclid in URL params
        if ($gclid = $request->input('gclid')) {
            return $gclid;
        }

        // 2. _gcl_aw cookie — validate embedded timestamp (seconds)
        if ($gclAw = $request->cookie('_gcl_aw')) {
            if (preg_match('/^GCL\.(\d+)\.(.+)$/', $gclAw, $m)) {
                $createdAt  = (int) $m[1]; // Unix timestamp in seconds
                $ninetyDays = 90 * 24 * 60 * 60;
                if (time() - $createdAt <= $ninetyDays) {
                    return $m[2];
                }
                // Cookie is stale — discard to avoid attribution errors
                return null;
            }
        }

        return null;
    }

    /**
     * Extract user data from the request for TikTok Events API.
     * Includes ttclid/ttp cookies for EMQ improvement.
     */
    public function tiktokUserDataFromRequest(Request $request, array $extra = []): array
    {
        $data = [
            'ip'         => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        if ($ttclid = self::resolveTtclid($request)) {
            $data['ttclid'] = $ttclid;
        }
        if ($ttp = $request->cookie('_ttp')) {
            $data['ttp'] = $ttp;
        }

        // Always include logged-in user email + external_id for maximum EMQ on every event
        $authUser = Auth::user();
        if ($authUser) {
            if (! isset($extra['email']) && ! empty($authUser->email)) {
                $data['email'] = $authUser->email;
            }
            if (! isset($extra['external_id'])) {
                $data['external_id'] = (string) $authUser->id;
            }
        } elseif (! isset($extra['external_id']) && $request->hasSession()) {
            // Guest: use session ID as stable external_id for TikTok EMQ.
            $data['external_id'] = $request->session()->getId();
        }

        return array_merge($data, $extra);
    }

    /**
     * Get or generate a GA4 client ID (from _ga cookie or generate UUID).
     */
    public function clientId(Request $request): string
    {
        $ga = $request->cookie('_ga');
        if ($ga && preg_match('/GA\d+\.\d+\.(\d+\.\d+)/', $ga, $m)) {
            return $m[1];
        }

        return Str::uuid()->toString();
    }

    /**
     * Generate a unique event ID for deduplication between browser & server.
     */
    public static function eventId(string $prefix = ''): string
    {
        return ($prefix ? $prefix . '_' : '') . Str::uuid()->toString();
    }

    /**
     * Generate a deterministic fake email from a billing name for EMQ improvement.
     * Strips all non-alphanumeric characters and appends @gmail.com.
     * Returns null when the name contains no Latin characters (e.g. pure Bengali script).
     * This email is NEVER saved to the database or sent to the customer.
     */
    private static function generateEmailFromName(string $firstName, string $lastName = ''): ?string
    {
        $normalize = fn (string $s): string => strtolower(preg_replace('/[^a-z0-9]/i', '', $s));
        $base = $normalize($firstName) . $normalize($lastName);

        return strlen($base) >= 3 ? $base . '@gmail.com' : null;
    }

    /**
     * Normalize a Bangladeshi phone number to E.164 format (+880XXXXXXXXXX).
     */
    public static function normalizePhone(string $phone): string
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

    // â”€â”€â”€ Ecommerce events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Track a Purchase event (server-side) â€” fired when order is placed.
     * Returns the event ID for browser-side deduplication.
     */
    public function trackPurchase(Request $request, array $orderData, array $customerData = []): string
    {
        $eventId  = self::eventId('purchase');
        $url      = ! empty($orderData['order_number'])
            ? rtrim(config('app.url'), '/') . '/order/success/' . $orderData['order_number']
            : $request->fullUrl();
        $clientId = $this->clientId($request);

        // Enrich email: prefer order-level email, fall back to logged-in user email,
        // then fall back to a generated email from billing name for EMQ improvement.
        // The generated email is NEVER saved to the order — it is only used here for tracking.
        $authUser = Auth::user();
        if (empty($customerData['email']) && $authUser && ! empty($authUser->email)) {
            $customerData['email'] = $authUser->email;
        }

        // Last resort: generate a deterministic email from billing name for EMQ improvement.
        // This is ONLY used for CAPI user_data — never saved to the order or sent to the customer.
        if (empty($customerData['email']) && ! empty($customerData['first_name'])) {
            $generated = self::generateEmailFromName(
                $customerData['first_name'],
                $customerData['last_name'] ?? ''
            );
            if ($generated !== null) {
                $customerData['email'] = $generated;
            }
        }

        // Phone-based fallback: when name is Bengali (no Latin chars), generateEmailFromName()
        // returns null. Use the phone number to ensure every order carries an email for Meta EMQ.
        // E.g. "01712345678@gmail.com" — deterministic, never saved or sent to the customer.
        if (empty($customerData['email']) && ! empty($customerData['phone'])) {
            $digits = preg_replace('/\D/', '', $customerData['phone']);
            if (strlen($digits) >= 7) {
                // Convert E.164 (+8801712345678 → 01712345678) to local 11-digit form
                $localDigits = (strlen($digits) === 13 && str_starts_with($digits, '880'))
                    ? '0' . substr($digits, 3)
                    : $digits;
                $customerData['email'] = $localDigits . '@gmail.com';
            }
        }

        // Generate stable external_id for all users — use user_id when logged in,
        // otherwise use normalised phone for consistent guest identification across events.
        // Pass the raw value here; each service's normalizeUserData() hashes it once.
        $externalId = $customerData['user_id'] ?? null;
        if (! $externalId && ! empty($customerData['phone'])) {
            $externalId = self::normalizePhone($customerData['phone']);
        }

        // â"€â"€ Meta CAPI â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
        $userData = $this->userDataFromRequest($request, array_filter([
            'fn'          => $customerData['first_name'] ?? null,
            'ph'          => $customerData['phone'] ?? null,
            'em'          => $customerData['email'] ?? null,
            'ct'          => $customerData['city'] ?? null,
            'country'     => $customerData['country'] ?? 'bd',
            'external_id' => $externalId,
        ], fn ($v) => $v !== null));

        $contents = array_map(fn ($item) => [
            'id'         => (string) ($item['product_id'] ?? ''),
            'quantity'   => (int) ($item['quantity'] ?? 1),
            'item_price' => (float) ($item['price'] ?? 0),
        ], $orderData['items'] ?? []);

        try {
            $this->meta->purchase($eventId, $url, $userData, [
                'content_ids'  => array_map('strval', array_column($orderData['items'] ?? [], 'product_id')),
                'content_type' => 'product',
                'value'        => (float) ($orderData['total'] ?? 0),
                'contents'     => $contents,
                'order_id'     => $orderData['order_number'] ?? '',
                'num_items'    => count($orderData['items'] ?? []),
            ]);
        } catch (\Throwable) {
        }

        // â”€â”€ GTM Server-Side (GA4 via GTM) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        try {
            $this->gtmSS->purchase(
                $clientId,
                $orderData,
                $customerData['user_id'] ?? null,
                $customerData,
                $eventId,
            );
        } catch (\Throwable) {
        }

        // â”€â”€ GA4 Measurement Protocol (direct) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $ga4Items = array_map([Ga4MeasurementService::class, 'buildItem'], $orderData['items'] ?? []);
        try {
            $this->ga4->purchase(
                $clientId,
                $orderData['order_number'] ?? '',
                (float) ($orderData['total'] ?? 0),
                (float) ($orderData['shipping'] ?? 0),
                $ga4Items,
                $eventId,
                (float) ($orderData['discount'] ?? 0) > 0 ? (float) $orderData['discount'] : null,
                $orderData['coupon_code'] ?? null,
                $customerData['user_id'] ?? null,
                $customerData,
            );
        } catch (\Throwable) {
        }

        // â”€â”€ TikTok Events API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $tiktokContents = array_map(fn ($item) => [
            'content_id'   => (string) ($item['product_id'] ?? ''),
            'content_type' => 'product',
            'content_name' => $item['product_name'] ?? $item['name'] ?? '',
            'quantity'     => (int) ($item['quantity'] ?? 1),
            'price'        => (float) ($item['price'] ?? 0),
        ], $orderData['items'] ?? []);

        $tiktokUserData = $this->tiktokUserDataFromRequest($request, array_filter([
            'email'        => $customerData['email'] ?? null,
            'phone_number' => $customerData['phone'] ?? null,
            'external_id'  => $externalId,
        ], fn ($v) => $v !== null));

        try {
            $this->tiktok->placeAnOrder($eventId, $url, $tiktokUserData, [
                'contents'     => $tiktokContents,
                'content_type' => 'product',
                'value'        => (float) ($orderData['total'] ?? 0),
                'order_id'     => $orderData['order_number'] ?? '',
            ]);

            $this->tiktok->completePayment($eventId . '_cp', $url, $tiktokUserData, [
                'contents'     => $tiktokContents,
                'content_type' => 'product',
                'value'        => (float) ($orderData['total'] ?? 0),
                'order_id'     => $orderData['order_number'] ?? '',
            ]);
        } catch (\Throwable) {
        }

        // ── Google Ads Conversion API ─────────────────────────────────────────
        // resolveGclid() validates the _gcl_aw cookie timestamp; expired values (>90 days)
        // are discarded to prevent incorrect attribution in Google Ads.
        $gclid = self::resolveGclid($request);
        if ($gclid) {
            try {
                $this->googleAds->purchase(
                    $gclid,
                    (float) ($orderData['total'] ?? 0),
                    $orderData['order_number'] ?? '',
                    null,
                    $customerData['email'] ?? null,
                    $customerData['phone'] ?? null,
                    $customerData['first_name'] ?? null,
                );
            } catch (\Throwable) {
            }
        }

        return $eventId;
    }
    public function trackPurchaseFromOrder(Order $order): string
    {
        $eventId  = self::eventId('purchase');
        $url      = rtrim(config('app.url'), '/') . '/order/success/' . $order->order_number;
        $clientId = $order->ga4_client_id ?: Str::uuid()->toString();

        $orderItems = $order->items->map(fn ($item) => [
            'product_id'    => $item->product_id,
            'product_name'  => $item->product_name,
            'variant_label' => $item->variant_label,
            'price'         => (float) $item->price,
            'quantity'      => (int) $item->quantity,
            'total'         => (float) $item->total,
        ])->toArray();

        $orderData = [
            'order_number' => $order->order_number,
            'total'        => (float) $order->total,
            'shipping'     => (float) $order->shipping,
            'discount'     => (float) $order->discount,
            'coupon_code'  => $order->coupon_code,
            'items'        => $orderItems,
        ];

        $customerData = [
            'first_name' => $order->first_name,
            'phone'      => $order->phone,
            'email'      => $order->email,
            'address'    => $order->address,
            'city'       => $order->delivery_zone,
            'country'    => 'bd',
            'user_id'    => $order->user_id ? (string) $order->user_id : null,
        ];

        // â”€â”€ Meta CAPI â€” use persisted cookies for best EMQ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $metaUserData = [
            'fn'      => $order->first_name,
            'ph'      => $order->phone,
            'ct'      => $order->delivery_zone,
            'country' => 'bd',
        ];
        // Stable external_id: user_id for logged-in, normalised phone for guests.
        // normalizeUserData() in MetaConversionsService will hash it once.
        if ($order->user_id) {
            $metaUserData['external_id'] = (string) $order->user_id;
        } elseif ($order->phone) {
            $metaUserData['external_id'] = self::normalizePhone($order->phone);
        }
        if ($order->ip_address) {
            $metaUserData['client_ip_address'] = $order->ip_address;
        }
        // Stored user_agent — critical EMQ signal for on_delivered events with no live HTTP request
        if ($order->user_agent) {
            $metaUserData['client_user_agent'] = $order->user_agent;
        }
        // Email — prefer order-level email, fall back to associated user email,
        // then generate from billing name for EMQ improvement (never saved to order).
        $orderUser = $order->user;
        $email = $order->email ?: ($orderUser && ! empty($orderUser->email) ? $orderUser->email : null);
        if (! $email) {
            $email = self::generateEmailFromName($order->first_name, $order->last_name ?? '');
        }
        if ($email) {
            $customerData['email'] = $email;
            $metaUserData['em']    = $email;
        }
        // Persist stored fbc/fbp for deduplication + EMQ
        if ($order->fbc) {
            $metaUserData['fbc'] = $order->fbc;
        }
        if ($order->fbp) {
            $metaUserData['fbp'] = $order->fbp;
        }

        $contents = array_map(fn ($item) => [
            'id'         => (string) ($item['product_id'] ?? ''),
            'quantity'   => (int) ($item['quantity'] ?? 1),
            'item_price' => (float) ($item['price'] ?? 0),
        ], $orderItems);

        $this->meta->purchase($eventId, $url, $metaUserData, [
            'content_ids'  => array_map('strval', array_column($orderItems, 'product_id')),
            'content_type' => 'product',
            'value'        => (float) $order->total,
            'contents'     => $contents,
            'order_id'     => $order->order_number,
            'num_items'    => count($orderItems),
        ]);

        // â”€â”€ GTM Server-Side â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->gtmSS->purchase($clientId, $orderData, $customerData['user_id'] ?? null, $customerData, $eventId);

        // â”€â”€ GA4 Measurement Protocol (direct) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $ga4Items = array_map([Ga4MeasurementService::class, 'buildItem'], $orderItems);
        $this->ga4->purchase(
            $clientId,
            $order->order_number,
            (float) $order->total,
            (float) $order->shipping,
            $ga4Items,
            $eventId,
            (float) $order->discount > 0 ? (float) $order->discount : null,
            $order->coupon_code,
            $customerData['user_id'] ?? null,
            $customerData,
        );

        // ── TikTok Events API — use persisted cookies for best EMQ ────
        $tiktokContents = array_map(fn ($item) => [
            'content_id'   => (string) ($item['product_id'] ?? ''),
            'content_type' => 'product',
            'content_name' => $item['product_name'] ?? '',
            'quantity'     => (int) ($item['quantity'] ?? 1),
            'price'        => (float) ($item['price'] ?? 0),
        ], $orderItems);

        $tiktokUserData = ['phone_number' => $order->phone];
        // Stable external_id: user_id for logged-in, normalised phone for guests.
        // normalizeUserData() in TikTokEventsService will hash it once.
        if ($order->user_id) {
            $tiktokUserData['external_id'] = (string) $order->user_id;
        } elseif ($order->phone) {
            $tiktokUserData['external_id'] = self::normalizePhone($order->phone);
        }
        if ($order->ip_address) {
            $tiktokUserData['ip'] = $order->ip_address;
        }
        // Stored user_agent — key signal for TikTok identity matching on delayed events
        if ($order->user_agent) {
            $tiktokUserData['user_agent'] = $order->user_agent;
        }
        // Email — use order-level email (already resolved above)
        if ($email) {
            $tiktokUserData['email'] = $email;
        }
        if ($order->ttclid) {
            $tiktokUserData['ttclid'] = $order->ttclid;
        }
        if ($order->ttp) {
            $tiktokUserData['ttp'] = $order->ttp;
        }

        $this->tiktok->placeAnOrder($eventId, $url, $tiktokUserData, [
            'contents'     => $tiktokContents,
            'content_type' => 'product',
            'value'        => (float) $order->total,
            'order_id'     => $order->order_number,
        ]);

        $this->tiktok->completePayment($eventId . '_cp', $url, $tiktokUserData, [
            'contents'     => $tiktokContents,
            'content_type' => 'product',
            'value'        => (float) $order->total,
            'order_id'     => $order->order_number,
        ]);

        // ── Google Ads Conversion API — use persisted gclid from order row ────
        if ($order->gclid) {
            $this->googleAds->purchase(
                $order->gclid,
                (float) $order->total,
                $order->order_number,
                $order->created_at ? $order->created_at->format('Y-m-d H:i:sP') : null,
                $email,
                $order->phone,
                $order->first_name,
            );
        }

        return $eventId;
    }

    /**
     * Track InitiateCheckout / begin_checkout (server-side).
     */
    public function trackBeginCheckout(Request $request, array $items, float $value): string
    {
        $eventId  = self::eventId('checkout');
        $url      = $request->fullUrl();
        $clientId = $this->clientId($request);

        $contents = array_map(fn ($item) => [
            'id'         => (string) ($item['product_id'] ?? ''),
            'quantity'   => (int) ($item['quantity'] ?? 1),
            'item_price' => (float) ($item['price'] ?? 0),
        ], $items);

        // â”€â”€ Meta CAPI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->meta->initiateCheckout($eventId, $url, $this->userDataFromRequest($request), [
            'content_ids'  => array_column($items, 'product_id'),
            'content_type' => 'product',
            'num_items'    => count($items),
            'value'        => $value,
            'contents'     => $contents,
        ]);

        // â”€â”€ GTM Server-Side â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $gtmItems = array_map(fn ($item) => [
            'item_id'   => (string) ($item['product_id'] ?? ''),
            'item_name' => $item['product_name'] ?? $item['name'] ?? '',
            'price'     => (float) ($item['price'] ?? 0),
            'quantity'  => (int) ($item['quantity'] ?? 1),
        ], $items);
        $this->gtmSS->beginCheckout($clientId, $gtmItems, $value, null, $eventId);

        // â”€â”€ GA4 Measurement Protocol â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $ga4Items = array_map([Ga4MeasurementService::class, 'buildItem'], $items);
        $this->ga4->beginCheckout($clientId, $value, $ga4Items, $eventId);

        // â”€â”€ TikTok Events API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $tiktokContents = array_map(fn ($item) => [
            'content_id'   => (string) ($item['product_id'] ?? ''),
            'content_type' => 'product',
            'quantity'     => (int) ($item['quantity'] ?? 1),
            'price'        => (float) ($item['price'] ?? 0),
        ], $items);
        $this->tiktok->initiateCheckout($eventId, $url, $this->tiktokUserDataFromRequest($request), [
            'contents'     => $tiktokContents,
            'content_type' => 'product',
            'value'        => $value,
        ]);

        return $eventId;
    }

    /**
     * Track ViewContent / view_item (server-side).
     * Accepts an optional $eventId so the client can pass the pre-generated ID
     * for deduplication with the browser pixel.
     */
    public function trackViewContent(Request $request, array $product, ?string $eventId = null): string
    {
        $eventId  = self::eventId('view');
        $url      = $request->fullUrl();
        $clientId = $this->clientId($request);
        $price    = (float) ($product['price'] ?? 0);

        // â”€â”€ Meta CAPI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->meta->viewContent($eventId, $url, $this->userDataFromRequest($request), [
            'content_ids'  => [$product['id']],
            'content_type' => 'product',
            'content_name' => $product['name'] ?? '',
            'value'        => $price,
        ]);

        // â”€â”€ GTM Server-Side â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->gtmSS->viewItem($clientId, [
            'item_id'   => (string) $product['id'],
            'item_name' => $product['name'] ?? '',
            'price'     => $price,
            'quantity'  => 1,
        ], $price, null, $eventId);

        // â”€â”€ GA4 Measurement Protocol â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->ga4->viewItem($clientId, [
            'item_id'   => (string) $product['id'],
            'item_name' => $product['name'] ?? '',
            'price'     => $price,
            'quantity'  => 1,
        ], $price, $eventId);

        // â”€â”€ TikTok Events API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->tiktok->viewContent($eventId, $url, $this->tiktokUserDataFromRequest($request), [
            'contents'     => [[
                'content_id'   => (string) $product['id'],
                'content_type' => 'product',
                'content_name' => $product['name'] ?? '',
                'quantity'     => 1,
                'price'        => $price,
            ]],
            'content_type' => 'product',
            'value'        => $price,
        ]);

        return $eventId;
    }

    /**
     * Track AddToCart (server-side).
     */
    public function trackAddToCart(Request $request, array $product, int $quantity = 1): string
    {
        $eventId  = self::eventId('atc');
        $url      = $request->fullUrl();
        $clientId = $this->clientId($request);
        $price    = (float) ($product['price'] ?? 0);
        $value    = $price * $quantity;

        // â”€â”€ Meta CAPI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->meta->addToCart($eventId, $url, $this->userDataFromRequest($request), [
            'content_ids'  => [$product['id']],
            'content_type' => 'product',
            'content_name' => $product['name'] ?? '',
            'value'        => $value,
            'contents'     => [['id' => (string) $product['id'], 'quantity' => $quantity, 'item_price' => $price]],
        ]);

        // â”€â”€ GTM Server-Side â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->gtmSS->addToCart($clientId, [
            'item_id'   => (string) $product['id'],
            'item_name' => $product['name'] ?? '',
            'price'     => $price,
            'quantity'  => $quantity,
        ], $value, null, $eventId);

        // â”€â”€ GA4 Measurement Protocol â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->ga4->addToCart($clientId, [
            'item_id'   => (string) $product['id'],
            'item_name' => $product['name'] ?? '',
            'price'     => $price,
            'quantity'  => $quantity,
        ], $value, $eventId);

        // â”€â”€ TikTok Events API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $this->tiktok->addToCart($eventId, $url, $this->tiktokUserDataFromRequest($request), [
            'contents'     => [[
                'content_id'   => (string) $product['id'],
                'content_type' => 'product',
                'content_name' => $product['name'] ?? '',
                'quantity'     => $quantity,
                'price'        => $price,
            ]],
            'content_type' => 'product',
            'value'        => $value,
        ]);

        return $eventId;
    }

    /**
     * Track ViewCategory (server-side) — fired when a category / product-list page is viewed.
     * Returns the event ID for browser-side deduplication.
     */
    public function trackViewCategory(Request $request, array $productIds, string $categoryName): string
    {
        $eventId = self::eventId('viewcat');
        $url     = $request->fullUrl();

        $this->meta->viewCategory($eventId, $url, $this->userDataFromRequest($request), [
            'content_ids'      => $productIds,
            'content_category' => $categoryName,
        ]);

        return $eventId;
    }

    /**
     * Track Search (server-side).
     */
    public function trackSearch(Request $request, string $searchString): string
    {
        $eventId  = self::eventId('search');
        $url      = $request->fullUrl();
        $clientId = $this->clientId($request);
        $authUser = Auth::user();

        $this->meta->search($eventId, $url, $this->userDataFromRequest($request), $searchString);

        $this->tiktok->search($eventId, $url, $this->tiktokUserDataFromRequest($request), $searchString);

        $this->gtmSS->search($clientId, $searchString, $authUser ? (string) $authUser->id : null, $eventId);

        $this->ga4->search($clientId, $searchString, $eventId, $authUser ? (string) $authUser->id : null);

        return $eventId;
    }

    /**
     * Track PageView (server-side) — Meta CAPI, TikTok Events API, GTM SS, GA4.
     * Accepts an optional $pageUrl so the API endpoint can pass the real page URL
     * (not the /api/tracking/page-view endpoint URL).
     */
    public function trackPageView(Request $request, ?string $pageUrl = null): string
    {
        $eventId  = self::eventId('pv');
        $url      = $pageUrl ?? $request->fullUrl();
        $clientId = $this->clientId($request);
        $authUser = Auth::user();
        $userId   = $authUser ? (string) $authUser->id : null;

        // ── Meta CAPI ────────────────────────────────────────────────────────
        $this->meta->pageView($eventId, $url, $this->userDataFromRequest($request));

        // ── TikTok Events API ────────────────────────────────────────────────
        $this->tiktok->pageView($eventId, $url, $this->tiktokUserDataFromRequest($request));

        // ── GTM Server-Side ──────────────────────────────────────────────────
        $this->gtmSS->pageView($clientId, $userId, $eventId);

        // ── GA4 Measurement Protocol ─────────────────────────────────────────
        $this->ga4->pageView($clientId, $eventId, $userId);

        return $eventId;
    }

    /**
     * Track Contact form submission (server-side).
     */
    public function trackContact(Request $request, array $customerData = []): string
    {
        $eventId  = self::eventId('contact');
        $url      = $request->fullUrl();
        $clientId = $this->clientId($request);
        $authUser = Auth::user();

        // Generate email from name if no real email provided — improves EMQ, never stored.
        $contactEmail = $customerData['email'] ?? null;
        if (! $contactEmail && ! empty($customerData['name'])) {
            $contactEmail = self::generateEmailFromName($customerData['name']);
        }

        $this->meta->contact($eventId, $url, $this->userDataFromRequest($request, [
            'fn' => $customerData['name'] ?? null,
            'em' => $contactEmail,
            'ph' => $customerData['phone'] ?? null,
        ]));

        $this->tiktok->contact($eventId, $url, $this->tiktokUserDataFromRequest($request, [
            'email'        => $contactEmail,
            'phone_number' => $customerData['phone'] ?? null,
        ]));

        $this->gtmSS->contact($clientId, $authUser ? (string) $authUser->id : null, $eventId);

        $this->ga4->contact($clientId, $eventId, $authUser ? (string) $authUser->id : null);

        return $eventId;
    }

    /**
     * Track AddPaymentInfo (server-side).
     */
    public function trackAddPaymentInfo(Request $request, array $items, float $value, string $paymentType, array $customerData = []): string
    {
        $eventId  = self::eventId('payment');
        $url      = $request->fullUrl();
        $clientId = $this->clientId($request);
        $authUser = Auth::user();

        // Generate email from billing name for EMQ if no real email is available.
        // Never saved — only used as a CAPI/Events API matching signal.
        $email = null;
        if ($authUser && ! empty($authUser->email)) {
            $email = $authUser->email;
        } elseif (! empty($customerData['first_name'])) {
            $email = self::generateEmailFromName($customerData['first_name']);
        }

        $metaExtra  = $email ? ['em' => $email] : [];
        $tiktokExtra = $email ? ['email' => $email] : [];

        $contents = array_map(fn ($item) => [
            'id'         => (string) ($item['product_id'] ?? ''),
            'quantity'   => (int) ($item['quantity'] ?? 1),
            'item_price' => (float) ($item['price'] ?? 0),
        ], $items);

        $this->meta->addPaymentInfo($eventId, $url, $this->userDataFromRequest($request, $metaExtra), [
            'content_ids'  => array_column($items, 'product_id'),
            'content_type' => 'product',
            'value'        => $value,
            'contents'     => $contents,
        ]);

        $tiktokContents = array_map(fn ($item) => [
            'content_id'   => (string) ($item['product_id'] ?? ''),
            'content_type' => 'product',
            'quantity'     => (int) ($item['quantity'] ?? 1),
            'price'        => (float) ($item['price'] ?? 0),
        ], $items);

        $this->tiktok->addPaymentInfo($eventId, $url, $this->tiktokUserDataFromRequest($request, $tiktokExtra), [
            'contents'     => $tiktokContents,
            'content_type' => 'product',
            'value'        => $value,
        ]);

        $gtmItems = array_map(fn ($item) => [
            'item_id'   => (string) ($item['product_id'] ?? ''),
            'item_name' => $item['product_name'] ?? $item['name'] ?? '',
            'price'     => (float) ($item['price'] ?? 0),
            'quantity'  => (int) ($item['quantity'] ?? 1),
        ], $items);
        $this->gtmSS->addPaymentInfo($clientId, $gtmItems, $value, $paymentType, $authUser ? (string) $authUser->id : null, $eventId);

        $ga4Items = array_map([Ga4MeasurementService::class, 'buildItem'], $items);
        $this->ga4->addPaymentInfo($clientId, $value, $ga4Items, $paymentType, $eventId, $authUser ? (string) $authUser->id : null);

        return $eventId;
    }
}
