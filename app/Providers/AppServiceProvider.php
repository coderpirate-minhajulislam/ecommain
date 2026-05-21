<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use App\Models\Setting;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->shareInertiaData();
        $this->configureMailFromDatabase();
    }

    protected function shareInertiaData(): void
    {
        Inertia::share([
            'gtmId'        => fn () => Setting::get('gtm_id', ''),
            'gtmSsUrl'     => fn () => Setting::get('gtm_ss_url', ''),
            'metaPixelId'       => fn () => Setting::get('meta_pixel_id', ''),
            'pixelExternalId'   => fn () => auth()->check()
                ? (string) auth()->id()
                : (request()->hasSession() ? request()->session()->getId() : null),
            'tiktokPixelId'    => fn () => Setting::get('tiktok_pixel_id', ''),
            'ga4MeasurementId' => fn () => Setting::get('ga4_measurement_id', ''),
            'topbarText'   => fn () => Setting::get('topbar_text', ''),
            'siteBranding' => fn () => [
                'logo'      => Setting::get('site_logo', ''),
                'title'     => Setting::get('site_title', ''),
                'subtitle'  => Setting::get('site_subtitle', ''),
                'phone'     => Setting::get('site_phone', ''),
                'whatsapp'  => Setting::get('site_whatsapp', ''),
            ],
            'addToCartLabel'    => fn () => Setting::get('label_add_to_cart', 'Add to Cart'),
            'buyNowLabel'        => fn () => Setting::get('label_buy_now', 'Buy Now'),
            'cardBuyNowEnabled'    => fn () => (bool) Setting::get('card_buy_now_enabled', true),
            'cartPageEnabled'      => fn () => (bool) Setting::get('cart_page_enabled', true),
            'productCardLayout'    => fn () => Setting::get('product_card_layout', '1'),
            'searchProducts'     => fn () => Cache::remember('shop.products.all', 900, function () {
                return Product::query()
                    ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'category_id', 'free_shipping')
                    ->with('images')
                    ->orderBy('name')
                    ->limit(100)
                    ->get()
                    ->toArray();
            }),
            'flash' => fn () => [
                'success' => session('success'),
                'error'   => session('error'),
                'info'    => session('info'),
            ],
            'notificationSettings' => function () {
                $user = auth()->user();
                if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
                    return null;
                }

                $vapidPublicKey = Setting::get('vapid_public_key', '');
                if (!$vapidPublicKey) {
                    try {
                        (new \App\Services\WebPushService());
                        $vapidPublicKey = Setting::get('vapid_public_key', '');
                    } catch (\Throwable) {
                        // Key generation failed — push won't work but site stays up
                    }
                }

                return [
                    'enabled'         => (bool) Setting::get('order_notifications_enabled', true),
                    'soundEnabled'    => (bool) Setting::get('order_notifications_sound', true),
                    'pollingInterval' => (int) Setting::get('order_notifications_interval', 30),
                    'vapidPublicKey'  => $vapidPublicKey,
                ];
            },
        ]);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    protected function configureMailFromDatabase(): void
    {
        try {
            $mailer = Setting::get('mail_mailer');
            if (!$mailer) {
                return;
            }

            $encryption = Setting::get('mail_encryption', 'tls');

            config([
                'mail.default' => $mailer,
                'mail.mailers.smtp.host'       => Setting::get('mail_host', '127.0.0.1'),
                'mail.mailers.smtp.port'       => (int) Setting::get('mail_port', 587),
                'mail.mailers.smtp.username'   => Setting::get('mail_username'),
                'mail.mailers.smtp.password'   => Setting::get('mail_password'),
                'mail.mailers.smtp.encryption' => $encryption === 'none' ? null : $encryption,
                'mail.from.address'            => Setting::get('mail_from_address', config('mail.from.address')),
                'mail.from.name'               => Setting::get('mail_from_name', config('mail.from.name')),
            ]);
        } catch (\Throwable) {
            // Database may not be available during migrations — silently fall back to .env config
        }
    }
}
