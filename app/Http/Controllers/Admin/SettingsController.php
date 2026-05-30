<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\PathaoService;
use App\Services\CarrybeeService;
use App\Services\ImageService;
use App\Services\RedxService;
use App\Services\SteadfastService;
use App\Services\WebPushService;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function gtm(): Response
    {
        return Inertia::render('admin/settings/gtm', [
            'gtmId' => Setting::get('gtm_id', ''),
        ]);
    }

    public function updateGtm(Request $request): RedirectResponse
    {
        $request->validate([
            'gtm_id' => ['nullable', 'string', 'max:50', 'regex:/^(GTM-[A-Z0-9]+)?$/'],
        ]);

        Setting::set('gtm_id', $request->input('gtm_id') ?? '');

        return back()->with('success', 'GTM settings saved successfully.');
    }

    public function tracking(): Response
    {
        return Inertia::render('admin/settings/tracking', [
            'metaPixelId'          => Setting::get('meta_pixel_id', ''),
            'metaAccessToken'      => Setting::get('meta_access_token', ''),
            'metaTestEventCode'    => Setting::get('meta_test_event_code', ''),
            'metaAdAccountId'      => Setting::get('meta_ad_account_id', ''),
            'metaAdsAccessToken'   => Setting::get('meta_ads_access_token', ''),
            'gtmSsUrl'             => Setting::get('gtm_ss_url', ''),
            'tiktokPixelId'        => Setting::get('tiktok_pixel_id', ''),
            'tiktokAccessToken'    => Setting::get('tiktok_access_token', ''),
            'tiktokTestEventCode'  => Setting::get('tiktok_test_event_code', ''),
            'ga4MeasurementId'     => Setting::get('ga4_measurement_id', ''),
            'ga4ApiSecret'         => Setting::get('ga4_api_secret', ''),
            'purchaseEventTrigger' => Setting::get('purchase_event_trigger', 'on_place_order'),
            'gadsCustomerId'       => Setting::get('gads_customer_id', ''),
            'gadsDeveloperToken'   => Setting::get('gads_developer_token', ''),
            'gadsOauthClientId'    => Setting::get('gads_oauth_client_id', ''),
            'gadsOauthClientSecret' => Setting::get('gads_oauth_client_secret', ''),
            'gadsRefreshToken'     => Setting::get('gads_refresh_token', ''),
            'gadsConversionActionId' => Setting::get('gads_conversion_action_id', ''),
            'gadsCurrencyCode'     => Setting::get('gads_currency_code', 'BDT'),
        ]);
    }

    public function updateTracking(Request $request): RedirectResponse
    {
        $request->validate([
            'meta_pixel_id'           => ['nullable', 'string', 'max:50', 'regex:/^(\d+)?$/'],
            'meta_access_token'       => ['nullable', 'string', 'max:500'],
            'meta_test_event_code'    => ['nullable', 'string', 'max:50'],
            'meta_ad_account_id'      => ['nullable', 'string', 'max:30', 'regex:/^(act_)?\d*$/'],
            'meta_ads_access_token'   => ['nullable', 'string', 'max:500'],
            'gtm_ss_url'              => ['nullable', 'url', 'max:255', 'regex:/^(https:\/\/.+)?$/'],
            'tiktok_pixel_id'         => ['nullable', 'string', 'max:50'],
            'tiktok_access_token'     => ['nullable', 'string', 'max:500'],
            'tiktok_test_event_code'  => ['nullable', 'string', 'max:50'],
            'ga4_measurement_id'      => ['nullable', 'string', 'max:50', 'regex:/^(G-[A-Z0-9]+)?$/'],
            'ga4_api_secret'          => ['nullable', 'string', 'max:255'],
            'purchase_event_trigger'  => ['nullable', 'string', 'in:on_place_order,on_delivered'],
            'gads_customer_id'        => ['nullable', 'string', 'max:20', 'regex:/^(\d[\d\-]*)?$/'],
            'gads_developer_token'    => ['nullable', 'string', 'max:255'],
            'gads_oauth_client_id'    => ['nullable', 'string', 'max:255'],
            'gads_oauth_client_secret' => ['nullable', 'string', 'max:255'],
            'gads_refresh_token'      => ['nullable', 'string', 'max:500'],
            'gads_conversion_action_id' => ['nullable', 'string', 'max:30', 'regex:/^(\d+)?$/'],
            'gads_currency_code'      => ['nullable', 'string', 'max:5', 'regex:/^[A-Z]{3}$/'],
        ]);

        Setting::set('meta_pixel_id', $request->input('meta_pixel_id') ?? '');
        Setting::set('meta_access_token', $request->input('meta_access_token') ?? '');
        Setting::set('meta_test_event_code', trim($request->input('meta_test_event_code') ?? ''));
        Setting::set('meta_ad_account_id', trim($request->input('meta_ad_account_id') ?? ''));
        Setting::set('meta_ads_access_token', trim($request->input('meta_ads_access_token') ?? ''));
        // Clear cached Meta Ads data when credentials change
        \Illuminate\Support\Facades\Cache::flush();
        Setting::set('gtm_ss_url', $request->input('gtm_ss_url') ?? '');
        Setting::set('tiktok_pixel_id', $request->input('tiktok_pixel_id') ?? '');
        Setting::set('tiktok_access_token', $request->input('tiktok_access_token') ?? '');
        Setting::set('tiktok_test_event_code', trim($request->input('tiktok_test_event_code') ?? ''));
        Setting::set('ga4_measurement_id', $request->input('ga4_measurement_id') ?? '');
        Setting::set('ga4_api_secret', $request->input('ga4_api_secret') ?? '');
        Setting::set('purchase_event_trigger', $request->input('purchase_event_trigger') ?? 'on_place_order');
        Setting::set('gads_customer_id', $request->input('gads_customer_id') ?? '');
        Setting::set('gads_developer_token', $request->input('gads_developer_token') ?? '');
        Setting::set('gads_oauth_client_id', $request->input('gads_oauth_client_id') ?? '');
        Setting::set('gads_oauth_client_secret', $request->input('gads_oauth_client_secret') ?? '');
        Setting::set('gads_refresh_token', $request->input('gads_refresh_token') ?? '');
        Setting::set('gads_conversion_action_id', $request->input('gads_conversion_action_id') ?? '');
        Setting::set('gads_currency_code', $request->input('gads_currency_code') ?? 'BDT');

        // Clear cached Google Ads access token so it will be refreshed with new credentials
        \Illuminate\Support\Facades\Cache::forget('gads_access_token');

        return back()->with('success', 'Tracking settings saved successfully.');
    }

    public function pathao(): Response
    {
        return Inertia::render('admin/settings/pathao', [
            'clientId'      => Setting::get('pathao_client_id', ''),
            'clientSecret'  => Setting::get('pathao_client_secret', ''),
            'username'      => Setting::get('pathao_username', ''),
            'isConnected'   => (bool) Setting::get('pathao_access_token', ''),
        ]);
    }

    public function updatePathao(Request $request): RedirectResponse
    {
        $request->validate([
            'client_id'     => ['required', 'string', 'max:255'],
            'client_secret' => ['required', 'string', 'max:255'],
            'username'      => ['required', 'email', 'max:255'],
            'password'      => ['nullable', 'string', 'max:255'],
        ]);

        Setting::set('pathao_client_id', $request->input('client_id'));
        Setting::set('pathao_client_secret', $request->input('client_secret'));
        Setting::set('pathao_username', $request->input('username'));

        if ($request->filled('password')) {
            Setting::set('pathao_password', $request->input('password'));
            // Clear cached tokens so they regenerate with new credentials
            Setting::set('pathao_access_token', '');
            Setting::set('pathao_refresh_token', '');
            Setting::set('pathao_token_expires_at', '0');
        }

        // Test connection
        $service = new PathaoService();
        try {
            $service->issueToken();
            return back()->with('success', 'Pathao credentials saved and connection verified successfully.');
        } catch (\Throwable $e) {
            return back()->withErrors(['client_id' => 'Credentials saved but connection test failed: ' . $e->getMessage()]);
        }
    }

    public function steadfast(): Response
    {
        return Inertia::render('admin/settings/steadfast', [
            'apiKey'       => Setting::get('steadfast_api_key', ''),
            'isConnected'  => (bool) Setting::get('steadfast_api_key', '') && (bool) Setting::get('steadfast_secret_key', ''),
            'callbackUrl'  => url('/webhooks/steadfast'),
            'webhookToken' => Setting::get('steadfast_webhook_token', ''),
        ]);
    }

    public function updateSteadfast(Request $request): RedirectResponse
    {
        $request->validate([
            'api_key'       => ['required', 'string', 'max:255'],
            'secret_key'    => ['required', 'string', 'max:255'],
            'webhook_token' => ['nullable', 'string', 'max:255'],
        ]);

        Setting::set('steadfast_api_key', $request->input('api_key'));
        Setting::set('steadfast_secret_key', $request->input('secret_key'));

        if ($request->filled('webhook_token')) {
            Setting::set('steadfast_webhook_token', $request->input('webhook_token'));
        }

        $service = new SteadfastService();
        try {
            $service->getBalance();
            return back()->with('success', 'Steadfast credentials saved and connection verified successfully.');
        } catch (\Throwable $e) {
            return back()->withErrors(['api_key' => 'Credentials saved but connection test failed: ' . $e->getMessage()]);
        }
    }

    public function redx(): Response
    {
        return Inertia::render('admin/settings/redx', [
            'accessToken' => Setting::get('redx_access_token', ''),
            'isSandbox'   => (bool) Setting::get('redx_sandbox', '0'),
            'isConnected' => (bool) Setting::get('redx_access_token', ''),
        ]);
    }

    public function updateRedx(Request $request): RedirectResponse
    {
        $request->validate([
            'access_token' => ['required', 'string', 'max:1000'],
            'is_sandbox'   => ['boolean'],
        ]);

        Setting::set('redx_access_token', $request->input('access_token'));
        Setting::set('redx_sandbox', $request->boolean('is_sandbox') ? '1' : '0');

        $service = new RedxService();
        try {
            $service->testConnection();
            return back()->with('success', 'RedX credentials saved and connection verified successfully.');
        } catch (\Throwable $e) {
            return back()->withErrors(['access_token' => 'Credentials saved but connection test failed: ' . $e->getMessage()]);
        }
    }

    public function carrybee(): Response
    {
        return Inertia::render('admin/settings/carrybee', [
            'clientId'      => Setting::get('carrybee_client_id', ''),
            'clientSecret'  => Setting::get('carrybee_client_secret', ''),
            'clientContext' => Setting::get('carrybee_client_context', ''),
            'isSandbox'     => (bool) Setting::get('carrybee_sandbox', '0'),
            'isConnected'   => (bool) Setting::get('carrybee_client_id', ''),
        ]);
    }

    public function updateCarrybee(Request $request): RedirectResponse
    {
        $request->validate([
            'client_id'      => ['required', 'string', 'max:500'],
            'client_secret'  => ['required', 'string', 'max:500'],
            'client_context' => ['required', 'string', 'max:500'],
            'is_sandbox'     => ['boolean'],
        ]);

        Setting::set('carrybee_client_id', $request->input('client_id'));
        Setting::set('carrybee_client_secret', $request->input('client_secret'));
        Setting::set('carrybee_client_context', $request->input('client_context'));
        Setting::set('carrybee_sandbox', $request->boolean('is_sandbox') ? '1' : '0');

        $service = new CarrybeeService();
        try {
            $service->testConnection();
            return back()->with('success', 'Carrybee credentials saved and connection verified successfully.');
        } catch (\Throwable $e) {
            return back()->withErrors(['client_id' => 'Credentials saved but connection test failed: ' . $e->getMessage()]);
        }
    }

    public function bdcourier(): Response
    {
        return Inertia::render('admin/settings/bdcourier', [
            'apiKey'      => Setting::get('bdcourier_api_key', ''),
            'isConnected' => (bool) Setting::get('bdcourier_api_key', ''),
            'minSuccessRatio' => (int) Setting::get('bdcourier_min_success_ratio', 0),
            'blockZeroRatio' => (bool) Setting::get('bdcourier_block_zero_ratio', false),
            'codRestrictedMessage' => Setting::get('bdcourier_cod_restricted_message', 'Based on your phone number history, Cash on Delivery is not available. Please select a payment method below.'),
        ]);
    }

    public function updateBdcourier(Request $request): RedirectResponse
    {
        $request->validate([
            'api_key' => ['required', 'string', 'max:255'],
            'min_success_ratio' => ['required', 'integer', 'min:0', 'max:100'],
            'block_zero_ratio' => ['nullable', 'boolean'],
            'cod_restricted_message' => ['nullable', 'string', 'max:500'],
        ]);

        Setting::set('bdcourier_api_key', $request->input('api_key'));
        Setting::set('bdcourier_min_success_ratio', $request->input('min_success_ratio', 0));
        Setting::set('bdcourier_block_zero_ratio', $request->boolean('block_zero_ratio') ? '1' : '0');
        Setting::set('bdcourier_cod_restricted_message', $request->input('cod_restricted_message', 'Based on your phone number history, Cash on Delivery is not available. Please select a payment method below.'));

        // Verify connection
        $apiKey = $request->input('api_key');
        $ch = curl_init('https://api.bdcourier.com/check-connection');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            return back()->withErrors(['api_key' => 'API key saved but connection test failed. Please verify your key.']);
        }

        $json = json_decode($response, true);
        if (($json['status'] ?? '') !== 'success') {
            return back()->withErrors(['api_key' => 'API key saved but returned an unexpected response. Please verify your key.']);
        }

        return back()->with('success', 'BD Courier API key saved and connection verified successfully.');
    }

    public function orderratiocheck(): Response
    {
        return Inertia::render('admin/settings/orderratiocheck', [
            'apiKey'      => Setting::get('orderratiocheck_api_key', ''),
            'domain'      => Setting::get('orderratiocheck_domain', ''),
            'isConnected' => (bool) Setting::get('orderratiocheck_api_key', ''),
            'minSuccessRatio' => (int) Setting::get('orderratiocheck_min_success_ratio', 0),
            'blockZeroRatio' => (bool) Setting::get('orderratiocheck_block_zero_ratio', false),
            'codRestrictedMessage' => Setting::get('orderratiocheck_cod_restricted_message', 'Based on your phone number history, Cash on Delivery is not available. Please select a payment method below.'),
        ]);
    }

    public function updateOrderratiocheck(Request $request): RedirectResponse
    {
        $request->validate([
            'api_key' => ['required', 'string', 'max:255'],
            'domain'  => ['required', 'string', 'max:255'],
            'min_success_ratio' => ['required', 'integer', 'min:0', 'max:100'],
            'block_zero_ratio' => ['nullable', 'boolean'],
            'cod_restricted_message' => ['nullable', 'string', 'max:500'],
        ]);

        Setting::set('orderratiocheck_api_key', $request->input('api_key'));
        Setting::set('orderratiocheck_domain', $request->input('domain'));
        Setting::set('orderratiocheck_min_success_ratio', $request->input('min_success_ratio', 0));
        Setting::set('orderratiocheck_block_zero_ratio', $request->boolean('block_zero_ratio') ? '1' : '0');
        Setting::set('orderratiocheck_cod_restricted_message', $request->input('cod_restricted_message', 'Based on your phone number history, Cash on Delivery is not available. Please select a payment method below.'));

        // Verify connection
        $apiKey = $request->input('api_key');
        $domain = $request->input('domain');
        $ch = curl_init('https://app.growever.bd/api/check-connection');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Referer: https://' . $domain . '/',
            'X-Domain: ' . $domain,
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            return back()->withErrors(['api_key' => 'API key saved but connection test failed. Please verify your key and registered domain.']);
        }

        $json = json_decode($response, true);
        if (($json['status'] ?? '') !== 'success') {
            return back()->withErrors(['api_key' => 'API key saved but returned an unexpected response. Please verify your key.']);
        }

        return back()->with('success', 'Order Ratio Check API key saved and connection verified successfully.');
    }

    public function siteBranding(): Response
    {
        return Inertia::render('admin/settings/site-branding', [
            'siteTitle'    => Setting::get('site_title', ''),
            'siteSubtitle' => Setting::get('site_subtitle', ''),
            'siteLogo'     => Setting::get('site_logo', ''),
            'sitePhone'    => Setting::get('site_phone', ''),
            'siteWhatsapp' => Setting::get('site_whatsapp', ''),
        ]);
    }

    public function updateSiteBranding(Request $request): RedirectResponse
    {
        $request->validate([
            'site_title'    => ['nullable', 'string', 'max:150'],
            'site_subtitle' => ['nullable', 'string', 'max:255'],
            'site_phone'    => ['nullable', 'string', 'max:30'],
            'site_whatsapp' => ['nullable', 'string', 'max:30'],
            'site_logo'     => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,svg,webp', 'max:10240'],
        ]);

        if ($request->hasFile('site_logo')) {
            $dir = public_path('uploads/site');
            if (!File::exists($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            $oldLogo = Setting::get('site_logo', '');
            if ($oldLogo && file_exists(public_path($oldLogo))) {
                unlink(public_path($oldLogo));
            }
            $file = $request->file('site_logo');
            // SVGs are vector files; keep as-is. Raster formats get converted to WebP.
            if (strtolower($file->getClientOriginalExtension()) === 'svg') {
                $fileName = 'logo_' . time() . '.svg';
                $file->move($dir, $fileName);
                Setting::set('site_logo', 'uploads/site/' . $fileName);
            } else {
                $basename = 'logo_' . time();
                (new ImageService())->saveAsWebP($file, $dir, $basename);
                Setting::set('site_logo', 'uploads/site/' . $basename . '.webp');
            }
            // Regenerate PWA icons whenever the logo changes
            \Illuminate\Support\Facades\Artisan::call('pwa:generate-icons');
        }

        Setting::set('site_title',    $request->input('site_title') ?? '');
        Setting::set('site_subtitle', $request->input('site_subtitle') ?? '');
        Setting::set('site_phone',    $request->input('site_phone') ?? '');
        Setting::set('site_whatsapp', $request->input('site_whatsapp') ?? '');

        return back()->with('success', 'Site branding saved successfully.');
    }

    public function topbar(): Response
    {
        return Inertia::render('admin/settings/topbar', [
            'topbarText' => Setting::get('topbar_text', ''),
        ]);
    }

    public function updateTopbar(Request $request): RedirectResponse
    {
        Setting::set('topbar_text', $request->input('topbar_text') ?? '');

        return back()->with('success', 'Top bar text saved successfully.');
    }

    public function freeShipping(): Response
    {
        return Inertia::render('admin/settings/free-shipping', [
            'freeShippingEnabled' => (bool) Setting::get('free_shipping_enabled', true),
            'freeShippingAmount' => (int) Setting::get('free_shipping_amount', 0),
        ]);
    }

    public function updateFreeShipping(Request $request): RedirectResponse
    {
        $request->validate([
            'free_shipping_enabled' => ['required', 'boolean'],
            'free_shipping_amount' => ['required', 'integer', 'min:0'],
        ]);

        Setting::set('free_shipping_enabled', $request->boolean('free_shipping_enabled') ? '1' : '0');
        Setting::set('free_shipping_amount', (string) $request->integer('free_shipping_amount'));

        return back()->with('success', 'Free shipping settings saved successfully.');
    }

    public function theme(): Response
    {
        return Inertia::render('admin/settings/theme', [
            'primaryHue'   => (int) Setting::get('theme_primary_hue', 152),
            'primaryHex'   => Setting::get('theme_primary_hex', '#16a34a'),
            'secondaryHue' => (int) Setting::get('theme_secondary_hue', 143),
            'secondaryHex' => Setting::get('theme_secondary_hex', '#dcfce7'),
            'outlineHue'   => (int) Setting::get('theme_outline_hue', 143),
            'outlineHex'   => Setting::get('theme_outline_hex', '#bbf7d0'),
            'homeLayout'        => Setting::get('home_layout', '1'),
            'productCardLayout' => Setting::get('product_card_layout', '1'),
        ]);
    }

    public function updateTheme(Request $request): RedirectResponse
    {
        $request->validate([
            'primary_hue'        => ['required', 'integer', 'min:0', 'max:360'],
            'primary_hex'        => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'secondary_hue'      => ['required', 'integer', 'min:0', 'max:360'],
            'secondary_hex'      => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'outline_hue'        => ['required', 'integer', 'min:0', 'max:360'],
            'outline_hex'        => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'home_layout'        => ['required', 'string', 'in:1,2,3'],
            'product_card_layout' => ['required', 'string', 'in:1,2'],
        ]);

        Setting::set('theme_primary_hue',    (string) $request->integer('primary_hue'));
        Setting::set('theme_primary_hex',    strtolower($request->input('primary_hex')));
        Setting::set('theme_secondary_hue',  (string) $request->integer('secondary_hue'));
        Setting::set('theme_secondary_hex',  strtolower($request->input('secondary_hex')));
        Setting::set('theme_outline_hue',    (string) $request->integer('outline_hue'));
        Setting::set('theme_outline_hex',    strtolower($request->input('outline_hex')));
        Setting::set('home_layout',          $request->input('home_layout'));
        Setting::set('product_card_layout',  $request->input('product_card_layout'));

        return back()->with('success', 'Theme updated successfully.');
    }

    public function trustBadges(): Response
    {
        $default = [
            ['icon' => 'Truck',      'title' => 'Free Shipping', 'desc' => 'On orders over ৳500'],
            ['icon' => 'Shield',     'title' => 'Secure Payment', 'desc' => '100% protected'],
            ['icon' => 'RotateCcw',  'title' => 'Easy Returns',  'desc' => '30-day guarantee'],
        ];

        $raw    = Setting::get('trust_badges', '');
        $badges = $raw ? json_decode($raw, true) : $default;

        return Inertia::render('admin/settings/trust-badges', [
            'badges' => $badges,
        ]);
    }

    public function updateTrustBadges(Request $request): RedirectResponse
    {
        $request->validate([
            'badges'             => ['required', 'array', 'max:10'],
            'badges.*.icon'      => ['required', 'string', 'max:50'],
            'badges.*.title'     => ['required', 'string', 'max:100'],
            'badges.*.desc'      => ['required', 'string', 'max:200'],
        ]);

        Setting::set('trust_badges', json_encode($request->input('badges')));

        return back()->with('success', 'Trust badges saved successfully.');
    }

    public function aboutPage(): Response
    {
        $defaultValues = [
            ['icon' => 'Heart',  'title' => 'Customer First',  'description' => 'We put our customers at the center of everything we do.'],
            ['icon' => 'Shield', 'title' => 'Quality Assured', 'description' => 'Every product is carefully vetted to meet our high standards.'],
            ['icon' => 'Truck',  'title' => 'Fast Delivery',   'description' => 'We partner with reliable carriers to deliver quickly.'],
            ['icon' => 'Zap',    'title' => 'Innovation',      'description' => 'We constantly evolve to bring you the latest products.'],
        ];
        $defaultStats = [
            ['value' => '50K+', 'label' => 'Happy Customers'],
            ['value' => '10K+', 'label' => 'Products'],
            ['value' => '99%',  'label' => 'Satisfaction Rate'],
            ['value' => '24/7', 'label' => 'Support'],
        ];
        $defaultTeam = [
            ['name' => 'Sarah Johnson', 'role' => 'CEO & Founder', 'avatar' => '👩‍💼'],
            ['name' => 'Michael Chen',  'role' => 'CTO',           'avatar' => '👨‍💻'],
        ];

        return Inertia::render('admin/settings/about-page', [
            'heroTitle'      => Setting::get('about_hero_title',      'About Us'),
            'heroSubtitle'   => Setting::get('about_hero_subtitle',   "We're passionate about bringing you the best products at the best prices."),
            'storyHeading'   => Setting::get('about_story_heading',   'Our Story'),
            'storyPara1'     => Setting::get('about_story_para1',     'Founded in 2020, our store started as a small idea — to create a marketplace where quality meets affordability.'),
            'storyPara2'     => Setting::get('about_story_para2',     'Today, we offer thousands of products. Our commitment to quality and exceptional service remains at the core of everything we do.'),
            'missionTitle'   => Setting::get('about_mission_title',   'Our Mission'),
            'missionText'    => Setting::get('about_mission_text',    'To empower every customer with access to high-quality products, transparent pricing, and an unmatched shopping experience.'),
            'stats'          => json_decode(Setting::get('about_stats',  json_encode($defaultStats)),  true),
            'values'         => json_decode(Setting::get('about_values', json_encode($defaultValues)), true),
            'team'           => json_decode(Setting::get('about_team',   json_encode($defaultTeam)),   true),
        ]);
    }

    public function uploadTeamImage(Request $request): JsonResponse
    {
        $request->validate([
            'image'     => ['required', 'image', 'max:10240'],
            'old_image' => ['nullable', 'string', 'max:500'],
        ]);

        // Delete old image if it exists inside uploads/team/
        $oldImage = $request->input('old_image');
        if ($oldImage && str_starts_with(ltrim($oldImage, '/'), 'uploads/team/')) {
            $oldPath = public_path(ltrim($oldImage, '/'));
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        $dir = public_path('uploads/team');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        $file = $request->file('image');
        $basename = 'team_' . time() . '_' . uniqid();
        (new ImageService())->saveAsWebP($file, $dir, $basename);

        return response()->json(['url' => 'uploads/team/' . $basename . '.webp']);
    }

    public function updateAboutPage(Request $request): RedirectResponse
    {
        $request->validate([
            'hero_title'       => ['nullable', 'string', 'max:200'],
            'hero_subtitle'    => ['nullable', 'string', 'max:500'],
            'story_heading'    => ['nullable', 'string', 'max:200'],
            'story_para1'      => ['nullable', 'string', 'max:2000'],
            'story_para2'      => ['nullable', 'string', 'max:2000'],
            'mission_title'    => ['nullable', 'string', 'max:200'],
            'mission_text'     => ['nullable', 'string', 'max:2000'],
            'stats'            => ['nullable', 'array', 'max:8'],
            'stats.*.value'    => ['required', 'string', 'max:50'],
            'stats.*.label'    => ['required', 'string', 'max:100'],
            'values'           => ['nullable', 'array', 'max:8'],
            'values.*.icon'    => ['required', 'string', 'max:50'],
            'values.*.title'   => ['required', 'string', 'max:100'],
            'values.*.description' => ['required', 'string', 'max:300'],
            'team'             => ['nullable', 'array', 'max:12'],
            'team.*.name'      => ['required', 'string', 'max:100'],
            'team.*.role'      => ['required', 'string', 'max:100'],
            'team.*.avatar'    => ['nullable', 'string', 'max:500'],
        ]);

        Setting::set('about_hero_title',    $request->input('hero_title', ''));
        Setting::set('about_hero_subtitle', $request->input('hero_subtitle', ''));
        Setting::set('about_story_heading', $request->input('story_heading', ''));
        Setting::set('about_story_para1',   $request->input('story_para1', ''));
        Setting::set('about_story_para2',   $request->input('story_para2', ''));
        Setting::set('about_mission_title', $request->input('mission_title', ''));
        Setting::set('about_mission_text',  $request->input('mission_text', ''));
        Setting::set('about_stats',         json_encode($request->input('stats', [])));
        Setting::set('about_values',        json_encode($request->input('values', [])));
        Setting::set('about_team',          json_encode($request->input('team', [])));

        return back()->with('success', 'About page updated successfully.');
    }

    public function checkoutLabels(): Response
    {
        return Inertia::render('admin/settings/checkout-labels', [
            'labelAddToCart'          => Setting::get('label_add_to_cart',          'Add to Cart'),
            'labelBuyNow'             => Setting::get('label_buy_now',              'Buy Now'),
            'cardBuyNowEnabled'       => (bool) Setting::get('card_buy_now_enabled', true),
            'labelFreeShipping'       => Setting::get('label_free_shipping',        'Free Shipping'),
            'labelDeliveryPrefix'     => Setting::get('label_delivery_prefix',      'Delivery: '),
            'labelDeliveryExtra'      => Setting::get('label_delivery_extra',       ''),
            'labelDeliveryArea'       => Setting::get('label_delivery_area',        'Delivery Area'),
            'labelShippingInfo'       => Setting::get('label_shipping_info',        'Shipping Information'),
            'labelFullName'           => Setting::get('label_full_name',            'Full Name'),
            'labelPhoneNumber'        => Setting::get('label_phone_number',         'Phone Number'),
            'labelEmail'              => Setting::get('label_email',                'Email Address'),
            'checkoutEmailEnabled'    => (bool) Setting::get('checkout_email_enabled', false),
            'checkoutEmailHelpText'   => Setting::get('checkout_email_help_text',   ''),
            'labelDistrict'           => Setting::get('label_district',             'District'),
            'labelAddress'            => Setting::get('label_address',              'Address'),
            'labelNote'               => Setting::get('label_note',                 'Note'),
            'labelPaymentMethod'      => Setting::get('label_payment_method',       'Payment Method'),            'labelYourProducts'      => Setting::get('label_your_products',         'Your Products'),
            'labelYourOrder'         => Setting::get('label_your_order',             'Your Order'),            'labelOrderSummary'       => Setting::get('label_order_summary',        'Order Summary'),
            'labelPlaceOrder'         => Setting::get('label_place_order',          'Place Order'),
            'labelProceedToCheckout'  => Setting::get('label_proceed_to_checkout',  'Proceed to Checkout'),
            'labelContinueShopping'   => Setting::get('label_continue_shopping',    'Continue Shopping'),
            'labelOrderConfirmed'           => Setting::get('label_order_confirmed',           'Order Confirmed!'),
            'labelOrderConfirmedSub'       => Setting::get('label_order_confirmed_sub',       'Thank you, {name}! Your order has been placed.'),
            'labelYouMayAlsoLike'          => Setting::get('label_you_may_also_like',          'You May Also Like'),
            'orderSuccessRelatedEnabled'   => (bool) Setting::get('order_success_related_enabled', true),
            'labelReviewHeading'      => Setting::get('label_review_heading',        'Submit a Review'),
            'labelReviewSubheading'   => Setting::get('label_review_subheading',     'Share your thoughts about this product.'),
            'labelReviewNote'         => Setting::get('label_review_note',           'Anyone can submit a review!'),
            'labelReviewName'         => Setting::get('label_review_name',           'Your Name'),
            'labelReviewEmail'        => Setting::get('label_review_email',          'Email Address'),
            'labelReviewRating'       => Setting::get('label_review_rating',         'Rating'),

            'labelReviewBody'         => Setting::get('label_review_body',           'Your Review (Minimum 10 characters)'),
            'labelReviewSubmit'       => Setting::get('label_review_submit',         'Submit Review'),
            'labelCustomerReviews'    => Setting::get('label_customer_reviews',      'Customer Reviews'),
            'cartPageEnabled'         => (bool) Setting::get('cart_page_enabled', true),
        ]);
    }

    public function updateCheckoutLabels(Request $request): RedirectResponse
    {
        $request->validate([
            'label_add_to_cart'          => ['nullable', 'string', 'max:100'],
            'label_buy_now'              => ['nullable', 'string', 'max:100'],
            'card_buy_now_enabled'       => ['required', 'boolean'],
            'label_free_shipping'        => ['nullable', 'string', 'max:200'],
            'label_delivery_prefix'      => ['nullable', 'string', 'max:100'],
            'label_delivery_extra'       => ['nullable', 'string', 'max:300'],
            'label_delivery_area'        => ['nullable', 'string', 'max:100'],
            'label_shipping_info'        => ['nullable', 'string', 'max:100'],
            'label_full_name'            => ['nullable', 'string', 'max:100'],
            'label_phone_number'         => ['nullable', 'string', 'max:100'],
            'label_email'                => ['nullable', 'string', 'max:100'],
            'checkout_email_enabled'     => ['required', 'boolean'],
            'checkout_email_help_text'   => ['nullable', 'string', 'max:300'],
            'label_district'             => ['nullable', 'string', 'max:100'],
            'label_address'              => ['nullable', 'string', 'max:100'],
            'label_note'                 => ['nullable', 'string', 'max:100'],
            'label_payment_method'       => ['nullable', 'string', 'max:100'],
            'label_your_products'         => ['nullable', 'string', 'max:100'],
            'label_your_order'           => ['nullable', 'string', 'max:100'],
            'label_order_summary'        => ['nullable', 'string', 'max:100'],
            'label_place_order'          => ['nullable', 'string', 'max:100'],
            'label_proceed_to_checkout'  => ['nullable', 'string', 'max:100'],
            'label_continue_shopping'    => ['nullable', 'string', 'max:100'],
            'label_order_confirmed'              => ['nullable', 'string', 'max:200'],
            'label_order_confirmed_sub'        => ['nullable', 'string', 'max:500'],
            'label_you_may_also_like'          => ['nullable', 'string', 'max:200'],
            'order_success_related_enabled'    => ['required', 'boolean'],
            'label_review_heading'      => ['nullable', 'string', 'max:200'],
            'label_review_subheading'   => ['nullable', 'string', 'max:500'],
            'label_review_note'         => ['nullable', 'string', 'max:300'],
            'label_review_name'         => ['nullable', 'string', 'max:100'],
            'label_review_email'        => ['nullable', 'string', 'max:100'],
            'label_review_rating'       => ['nullable', 'string', 'max:100'],
            'label_review_body'         => ['nullable', 'string', 'max:200'],
            'label_review_submit'       => ['nullable', 'string', 'max:100'],
            'label_customer_reviews'    => ['nullable', 'string', 'max:200'],
            'cart_page_enabled'         => ['required', 'boolean'],
        ]);

        Setting::set('label_add_to_cart',          $request->input('label_add_to_cart',          'Add to Cart'));
        Setting::set('label_buy_now',              $request->input('label_buy_now',              'Buy Now'));
        Setting::set('card_buy_now_enabled',       $request->boolean('card_buy_now_enabled') ? '1' : '0');
        Setting::set('label_free_shipping',        $request->input('label_free_shipping',        'Free Shipping'));
        Setting::set('label_delivery_prefix',      $request->input('label_delivery_prefix',      'Delivery: '));
        Setting::set('label_delivery_extra',       $request->input('label_delivery_extra',       ''));
        Setting::set('label_delivery_area',        $request->input('label_delivery_area',        'Delivery Area'));
        Setting::set('label_shipping_info',        $request->input('label_shipping_info',        'Shipping Information'));
        Setting::set('label_full_name',            $request->input('label_full_name',            'Full Name'));
        Setting::set('label_phone_number',         $request->input('label_phone_number',         'Phone Number'));
        Setting::set('label_email',                $request->input('label_email',                'Email Address'));
        Setting::set('checkout_email_enabled',     $request->boolean('checkout_email_enabled') ? '1' : '0');
        Setting::set('checkout_email_help_text',   $request->input('checkout_email_help_text',   ''));
        Setting::set('label_district',             $request->input('label_district',             'District'));
        Setting::set('label_address',              $request->input('label_address',              'Address'));
        Setting::set('label_note',                 $request->input('label_note',                 'Note'));
        Setting::set('label_payment_method',       $request->input('label_payment_method',       'Payment Method'));
        Setting::set('label_your_products',        $request->input('label_your_products',        'Your Products'));
        Setting::set('label_your_order',           $request->input('label_your_order',           'Your Order'));
        Setting::set('label_order_summary',        $request->input('label_order_summary',        'Order Summary'));
        Setting::set('label_place_order',          $request->input('label_place_order',          'Place Order'));
        Setting::set('label_proceed_to_checkout',  $request->input('label_proceed_to_checkout',  'Proceed to Checkout'));
        Setting::set('label_continue_shopping',    $request->input('label_continue_shopping',    'Continue Shopping'));
        Setting::set('label_order_confirmed',           $request->input('label_order_confirmed',      'Order Confirmed!'));
        Setting::set('label_order_confirmed_sub',      $request->input('label_order_confirmed_sub',  'Thank you, {name}! Your order has been placed.'));
        Setting::set('label_you_may_also_like',        $request->input('label_you_may_also_like',     'You May Also Like'));
        Setting::set('order_success_related_enabled',  $request->boolean('order_success_related_enabled') ? '1' : '0');
        Setting::set('label_review_heading',      $request->input('label_review_heading',      'Submit a Review'));
        Setting::set('label_review_subheading',   $request->input('label_review_subheading',   'Share your thoughts about this product.'));
        Setting::set('label_review_note',         $request->input('label_review_note',         'Anyone can submit a review!'));
        Setting::set('label_review_name',         $request->input('label_review_name',         'Your Name'));
        Setting::set('label_review_email',        $request->input('label_review_email',        'Email Address'));
        Setting::set('label_review_rating',       $request->input('label_review_rating',       'Rating'));
        Setting::set('label_review_body',         $request->input('label_review_body',         'Your Review (Minimum 10 characters)'));
        Setting::set('label_review_submit',       $request->input('label_review_submit',       'Submit Review'));
        Setting::set('label_customer_reviews',    $request->input('label_customer_reviews',    'Customer Reviews'));
        Setting::set('cart_page_enabled',           $request->boolean('cart_page_enabled') ? '1' : '0');

        return back()->with('success', 'Checkout labels saved successfully.');
    }

    public function contactPage(): Response
    {
        $defaultFaqs = json_encode([
            ['q' => 'How long does shipping take?',  'a' => 'Standard shipping takes 3-5 business days. Express shipping is available for 1-2 day delivery.'],
            ['q' => 'What is your return policy?',   'a' => 'We offer a 30-day hassle-free return policy on all items in their original condition.'],
            ['q' => 'How can I track my order?',     'a' => "Once your order ships, you'll receive a tracking number via email to monitor your delivery."],
        ]);

        return Inertia::render('admin/settings/contact-page', [
            'pageTitle'    => Setting::get('contact_page_title',    'Contact Us'),
            'pageSubtitle' => Setting::get('contact_page_subtitle', "Have a question or need help? We'd love to hear from you."),
            'address'      => Setting::get('contact_address',       '123 Commerce Street, Business City, BC 10001'),
            'phone'        => Setting::get('contact_phone',         '+1 (234) 567-890'),
            'phoneHref'    => Setting::get('contact_phone_href',    'tel:+1234567890'),
            'email'        => Setting::get('contact_email',         'support@yourstore.com'),
            'emailHref'    => Setting::get('contact_email_href',    'mailto:support@yourstore.com'),
            'hours'        => Setting::get('contact_hours',         'Mon - Fri: 9AM - 6PM, Sat: 10AM - 4PM'),
            'mapEmbed'     => Setting::get('contact_map_embed',     ''),
            'faqs'         => json_decode(Setting::get('contact_faqs', $defaultFaqs), true) ?? [],
        ]);
    }

    public function updateContactPage(Request $request): RedirectResponse
    {
        $request->validate([
            'page_title'    => ['nullable', 'string', 'max:200'],
            'page_subtitle' => ['nullable', 'string', 'max:500'],
            'address'       => ['nullable', 'string', 'max:500'],
            'phone'         => ['nullable', 'string', 'max:50'],
            'phone_href'    => ['nullable', 'string', 'max:200'],
            'email'         => ['nullable', 'string', 'max:150'],
            'email_href'    => ['nullable', 'string', 'max:200'],
            'hours'         => ['nullable', 'string', 'max:200'],
            'map_embed'     => ['nullable', 'string', 'max:2000'],
            'faqs'          => ['nullable', 'array', 'max:30'],
            'faqs.*.q'      => ['required', 'string', 'max:500'],
            'faqs.*.a'      => ['required', 'string', 'max:2000'],
        ]);

        Setting::set('contact_page_title',    $request->input('page_title', ''));
        Setting::set('contact_page_subtitle', $request->input('page_subtitle', ''));
        Setting::set('contact_address',       $request->input('address', ''));
        Setting::set('contact_phone',         $request->input('phone', ''));
        Setting::set('contact_phone_href',    $request->input('phone_href', ''));
        Setting::set('contact_email',         $request->input('email', ''));
        Setting::set('contact_email_href',    $request->input('email_href', ''));
        Setting::set('contact_hours',         $request->input('hours', ''));
        Setting::set('contact_map_embed',     $request->input('map_embed', ''));
        Setting::set('contact_faqs',          json_encode($request->input('faqs', [])));

        return back()->with('success', 'Contact page updated successfully.');
    }

    public function notifications(): Response
    {
        return Inertia::render('admin/settings/notifications', [
            'enabled' => (bool) Setting::get('order_notifications_enabled', true),
            'soundEnabled' => (bool) Setting::get('order_notifications_sound', true),
            'pollingInterval' => (int) Setting::get('order_notifications_interval', 30),
        ]);
    }

    public function updateNotifications(Request $request): RedirectResponse
    {
        $request->validate([
            'enabled' => ['required', 'boolean'],
            'sound_enabled' => ['required', 'boolean'],
            'polling_interval' => ['required', 'integer', 'min:10', 'max:300'],
        ]);

        Setting::set('order_notifications_enabled', $request->boolean('enabled') ? '1' : '0');
        Setting::set('order_notifications_sound', $request->boolean('sound_enabled') ? '1' : '0');
        Setting::set('order_notifications_interval', (string) $request->integer('polling_interval'));

        return back()->with('success', 'Notification settings saved successfully.');
    }

    public function checkNewOrders(Request $request): JsonResponse
    {
        $lastCheckedId = (int) $request->query('last_id', 0);

        $query = Order::where('id', '>', $lastCheckedId)->orderByDesc('id');

        $newCount = $query->count();
        $latest = $query->first(['id', 'order_number', 'first_name', 'total', 'created_at']);

        return response()->json([
            'new_count' => $newCount,
            'latest_id' => $latest?->id ?? $lastCheckedId,
            'latest' => $latest ? [
                'order_number' => $latest->order_number,
                'customer' => $latest->first_name,
                'total' => $latest->total,
            ] : null,
        ]);
    }

    public function testPush(): JsonResponse
    {
        try {
            $service = new WebPushService();
            $subscriptionCount = \App\Models\PushSubscription::count();

            $service->sendToAll([
                'title' => '🧪 Test Push Notification',
                'body' => 'If you see this, push notifications are working!',
                'url' => '/admin/settings/notifications',
                'tag' => 'push-test-' . time(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Test push sent to {$subscriptionCount} subscriber(s).",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Push failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function email(): Response
    {
        return Inertia::render('admin/settings/email', [
            'mailMailer'      => Setting::get('mail_mailer', 'smtp'),
            'mailHost'        => Setting::get('mail_host', ''),
            'mailPort'        => Setting::get('mail_port', '587'),
            'mailUsername'    => Setting::get('mail_username', ''),
            'mailPassword'    => Setting::get('mail_password', '') ? '********' : '',
            'mailEncryption'  => Setting::get('mail_encryption', 'tls'),
            'mailFromAddress' => Setting::get('mail_from_address', ''),
            'mailFromName'    => Setting::get('mail_from_name', ''),
        ]);
    }

    public function updateEmail(Request $request): RedirectResponse
    {
        $request->validate([
            'mail_mailer'       => ['required', 'string', 'in:smtp,sendmail,log'],
            'mail_host'         => ['required_if:mail_mailer,smtp', 'nullable', 'string', 'max:255'],
            'mail_port'         => ['required_if:mail_mailer,smtp', 'nullable', 'integer', 'min:1', 'max:65535'],
            'mail_username'     => ['nullable', 'string', 'max:255'],
            'mail_password'     => ['nullable', 'string', 'max:255'],
            'mail_encryption'   => ['nullable', 'string', 'in:tls,ssl,none'],
            'mail_from_address' => ['required', 'email', 'max:255'],
            'mail_from_name'    => ['required', 'string', 'max:255'],
        ]);

        Setting::set('mail_mailer', $request->input('mail_mailer'));
        Setting::set('mail_host', $request->input('mail_host') ?? '');
        Setting::set('mail_port', (string) ($request->input('mail_port') ?? '587'));
        Setting::set('mail_username', $request->input('mail_username') ?? '');

        // Only update password if not the placeholder
        $password = $request->input('mail_password');
        if ($password && $password !== '********') {
            Setting::set('mail_password', $password);
        }

        Setting::set('mail_encryption', $request->input('mail_encryption') ?? 'tls');
        Setting::set('mail_from_address', $request->input('mail_from_address'));
        Setting::set('mail_from_name', $request->input('mail_from_name'));

        return back()->with('success', 'Email settings saved successfully.');
    }

    public function testEmail(Request $request): JsonResponse
    {
        $request->validate([
            'to' => ['required', 'email', 'max:255'],
        ]);

        try {
            $mailer = Setting::get('mail_mailer', 'smtp');
            $encryption = Setting::get('mail_encryption', 'tls');

            config([
                'mail.default' => $mailer,
                'mail.mailers.smtp.host'       => Setting::get('mail_host', '127.0.0.1'),
                'mail.mailers.smtp.port'       => (int) Setting::get('mail_port', 587),
                'mail.mailers.smtp.username'   => Setting::get('mail_username'),
                'mail.mailers.smtp.password'   => Setting::get('mail_password'),
                'mail.mailers.smtp.encryption' => $encryption === 'none' ? null : $encryption,
                'mail.from.address'            => Setting::get('mail_from_address', 'test@example.com'),
                'mail.from.name'               => Setting::get('mail_from_name', 'Test'),
            ]);

            \Illuminate\Support\Facades\Mail::raw(
                'This is a test email from your store admin panel. If you received this, your email configuration is working correctly.',
                function ($message) use ($request) {
                    $message->to($request->input('to'))
                            ->subject('Test Email - ' . config('app.name'));
                }
            );

            return response()->json([
                'success' => true,
                'message' => 'Test email sent to ' . $request->input('to'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ─── Facebook Catalog Settings ───────────────────────────────────

    public function facebookCatalog(): Response
    {
        return Inertia::render('admin/settings/facebook-catalog', [
            'catalogEnabled'    => (bool) Setting::get('fb_catalog_enabled', false),
            'fbBusinessId'      => Setting::get('fb_business_id', ''),
            'fbCatalogId'       => Setting::get('fb_catalog_id', ''),
            'fbCatalogCurrency' => Setting::get('fb_catalog_currency', 'BDT'),
            'fbCatalogBrand'    => Setting::get('fb_catalog_brand', ''),
            'feedUrl'           => url('/feed/facebook-catalog.xml'),
        ]);
    }

    public function updateFacebookCatalog(Request $request): RedirectResponse
    {
        $request->validate([
            'fb_catalog_enabled'  => ['required', 'boolean'],
            'fb_business_id'      => ['nullable', 'string', 'max:50'],
            'fb_catalog_id'       => ['nullable', 'string', 'max:50'],
            'fb_catalog_currency' => ['required', 'string', 'max:10'],
            'fb_catalog_brand'    => ['nullable', 'string', 'max:100'],
        ]);

        Setting::set('fb_catalog_enabled', $request->boolean('fb_catalog_enabled') ? '1' : '0');
        Setting::set('fb_business_id', $request->input('fb_business_id') ?? '');
        Setting::set('fb_catalog_id', $request->input('fb_catalog_id') ?? '');
        Setting::set('fb_catalog_currency', $request->input('fb_catalog_currency') ?? 'BDT');
        Setting::set('fb_catalog_brand', $request->input('fb_catalog_brand') ?? '');

        return back()->with('success', 'Facebook Catalog settings saved successfully.');
    }

    public function shippingReturnPolicy(): Response
    {
        return Inertia::render('admin/settings/shipping-return-policy', [
            'shippingReturnPolicy' => Setting::get('shipping_return_policy', ''),
        ]);
    }

    public function updateShippingReturnPolicy(Request $request): RedirectResponse
    {
        $request->validate([
            'shipping_return_policy' => ['nullable', 'string', 'max:10000'],
        ]);

        Setting::set('shipping_return_policy', $request->input('shipping_return_policy') ?? '');

        return back()->with('success', 'Shipping & Return Policy saved successfully.');
    }

    public function seo(): Response
    {
        return Inertia::render('admin/settings/seo', [
            'siteMetaTitle'       => Setting::get('seo_meta_title', ''),
            'siteMetaDescription' => Setting::get('seo_meta_description', ''),
            'siteMetaKeywords'    => Setting::get('seo_meta_keywords', ''),
            'ogImage'             => Setting::get('seo_og_image', ''),
            'robotsTxt'           => Setting::get('seo_robots_txt', "User-agent: *\nAllow: /"),
            'seoMetaTags'         => json_decode(Setting::get('seo_meta_tags', '[]'), true) ?: [],
        ]);
    }

    public function updateSeo(Request $request): RedirectResponse
    {
        $request->validate([
            'site_meta_title'       => ['nullable', 'string', 'max:255'],
            'site_meta_description' => ['nullable', 'string', 'max:500'],
            'site_meta_keywords'    => ['nullable', 'string', 'max:500'],
            'robots_txt'            => ['nullable', 'string', 'max:2000'],
            'og_image'              => ['nullable', 'image', 'max:10240'],
            'meta_tags'             => ['nullable', 'array', 'max:50'],
            'meta_tags.*'           => ['required', 'string', 'max:1000'],
        ]);

        Setting::set('seo_meta_title',       $request->input('site_meta_title') ?? '');
        Setting::set('seo_meta_description', $request->input('site_meta_description') ?? '');
        Setting::set('seo_meta_keywords',    $request->input('site_meta_keywords') ?? '');
        Setting::set('seo_robots_txt',       $request->input('robots_txt') ?? "User-agent: *\nAllow: /");
        Setting::set('seo_meta_tags',        json_encode($request->input('meta_tags', [])));

        // Write robots.txt to the public directory so it is served as a static file
        File::put(public_path('robots.txt'), $request->input('robots_txt') ?? "User-agent: *\nAllow: /");

        if ($request->hasFile('og_image')) {
            $dir = public_path('uploads/seo');
            if (!File::isDirectory($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            (new ImageService())->saveAsWebP($request->file('og_image'), $dir, 'og-image');
            Setting::set('seo_og_image', 'uploads/seo/og-image.webp');
        }

        return back()->with('success', 'SEO settings saved successfully.');
    }
}
