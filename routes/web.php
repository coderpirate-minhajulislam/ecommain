<?php

use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\BlockedIpController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CourierDashboardController;
use App\Http\Controllers\Admin\MetaAdsController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\ContactMessagesController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\SteadfastWebhookController;
use App\Http\Controllers\Admin\ExportUsersController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Feed\FacebookCatalogFeedController;
use App\Http\Controllers\Admin\LandingPageController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PaymentMethodController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\ShippingZoneController;
use App\Http\Controllers\Admin\SubCategoryController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Manager\DashboardController as ManagerDashboardController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Shop\ContactController;
use App\Http\Controllers\Shop\CouponController as ShopCouponController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\ShopController;
use App\Http\Controllers\Shop\TrackingController;
use App\Http\Controllers\Shop\TrackOrderController;
use App\Http\Controllers\SuperAdmin\DashboardController as SuperAdminDashboardController;
use App\Http\Controllers\SuperAdmin\SettingsController as SuperAdminSettingsController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController;
use App\Http\Controllers\UserDashboardController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

// Steadfast webhook (public, CSRF excluded in bootstrap/app.php)
Route::post('/webhooks/steadfast', [SteadfastWebhookController::class, 'handle'])->name('webhooks.steadfast');

// Facebook Catalog Product Feed (public, not blocked by maintenance)
Route::get('/feed/facebook-catalog.xml', FacebookCatalogFeedController::class)->name('feed.facebook-catalog');

// PWA Web App Manifest (dynamic — title/theme-color from settings, icons are static files)
Route::get('/manifest.json', function () {
    $title      = \App\Models\Setting::get('site_title', 'My Store');
    $primaryHex = \App\Models\Setting::get('theme_primary_hex', '#16a34a');

    return response()->json([
        'name'             => $title,
        'short_name'       => $title,
        'start_url'        => '/',
        'display'          => 'standalone',
        'background_color' => '#ffffff',
        'theme_color'      => $primaryHex,
        'orientation'      => 'any',
        'icons'            => [
            ['src' => '/icon-192.png',         'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any'],
            ['src' => '/icon-512.png',         'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any'],
            ['src' => '/apple-touch-icon.png', 'sizes' => '180x180', 'type' => 'image/png', 'purpose' => 'maskable'],
        ],
    ])->header('Content-Type', 'application/manifest+json');
})->name('pwa.manifest');

// All public / shop routes — blocked during maintenance (super_admin bypasses)
Route::middleware('maintenance')->group(function () {
    Route::get('/', [ShopController::class, 'home'])->name('home');

    // Shop routes
    Route::get('/products', [ShopController::class, 'products'])->name('shop.products');
    Route::get('/category/{slug}', [ShopController::class, 'category'])->name('shop.category');
    Route::get('/product/{product}', [ShopController::class, 'productDetail'])->name('shop.product');
    Route::get('/cart', [ShopController::class, 'cart'])->name('shop.cart');
    Route::get('/checkout', [ShopController::class, 'checkout'])->name('shop.checkout');
    Route::post('/checkout/check-phone', [OrderController::class, 'checkPhoneRatio'])->name('shop.checkout.check-phone');
    Route::post('/checkout/init', [OrderController::class, 'initCheckout'])->name('shop.checkout.init');
    Route::post('/checkout', [OrderController::class, 'store'])->name('shop.order.store')->middleware('check.blocked');
    Route::get('/order/success/{orderNumber}', [OrderController::class, 'success'])->name('shop.order.success');
    Route::get('/about', [ShopController::class, 'about'])->name('about');
    Route::get('/contact', [ShopController::class, 'contact'])->name('contact');
    Route::get('/track-order', [TrackOrderController::class, 'index'])->name('shop.track-order');
    Route::post('/track-order', [TrackOrderController::class, 'search'])->name('shop.track-order.search');
    Route::get('/lp/{slug}', [ShopController::class, 'landing'])->name('shop.landing');
    Route::post('/lp/{slug}', [OrderController::class, 'storeLanding'])->name('shop.landing.order')->middleware('check.blocked');

    // Cart product zone refresh (AJAX)
    Route::get('/api/products/zones', [\App\Http\Controllers\Shop\ShopController::class, 'productZones'])->name('shop.products.zones');

    // Server-side tracking API (deduplication with browser pixels)
    Route::get('/api/tracking/client-ip', [TrackingController::class, 'clientIp'])->name('tracking.client-ip');
    Route::post('/api/tracking/page-view', [TrackingController::class, 'pageView'])->name('tracking.page-view');
    Route::post('/api/tracking/view-content', [TrackingController::class, 'viewContent'])->name('tracking.view-content');
    Route::post('/api/tracking/add-to-cart', [TrackingController::class, 'addToCart'])->name('tracking.add-to-cart');
    Route::post('/api/tracking/add-payment-info', [TrackingController::class, 'addPaymentInfo'])->name('tracking.add-payment-info');
    Route::post('/api/tracking/begin-checkout', [TrackingController::class, 'beginCheckout'])->name('tracking.begin-checkout');

    // Coupon apply (AJAX)
    Route::post('/coupon/apply', [ShopCouponController::class, 'apply'])->name('shop.coupon.apply');

    // Public review submission (no auth required)
    Route::post('/reviews', [ReviewController::class, 'store'])->name('reviews.store');

    // Public contact form submission
    Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');
    Route::get('/page/{slug}', [ShopController::class, 'page'])->name('shop.page');
});

// Redirect /dashboard to the correct role-based dashboard
Route::middleware(['auth', 'verified'])->get('dashboard', function () {
    $url = match (auth()->user()->role) {
        User::ROLE_SUPER_ADMIN => '/super-admin/dashboard',
        User::ROLE_ADMIN => '/admin/dashboard',
        User::ROLE_MANAGER => '/manager/dashboard',
        default => '/user/dashboard',
    };

    return redirect($url);
})->name('dashboard');

// Admin routes (accessible by admin and manager)
Route::middleware(['auth', 'verified', 'role:admin,manager'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', AdminDashboardController::class)->name('dashboard');
    Route::post('cache/clear', [AdminDashboardController::class, 'clearCache'])->name('cache.clear');
    Route::get('meta-ads/insights', [AdminDashboardController::class, 'metaAdsInsights'])->name('meta-ads.insights');
    Route::get('meta-ads', [MetaAdsController::class, 'index'])->name('meta-ads.index');
    Route::get('meta-ads/data', [MetaAdsController::class, 'insights'])->name('meta-ads.data');
    Route::get('meta-ads/auto-tracking', [MetaAdsController::class, 'autoTracking'])->name('meta-ads.auto-tracking.status');
    Route::post('meta-ads/auto-tracking', [MetaAdsController::class, 'autoTracking'])->name('meta-ads.auto-tracking.enable');
    Route::get('courier-dashboard', CourierDashboardController::class)->name('courier-dashboard');
    Route::post('courier-dashboard/sync', [CourierDashboardController::class, 'sync'])->name('courier-dashboard.sync');
    Route::get('courier-dashboard/orders', [CourierDashboardController::class, 'orders'])->name('courier-dashboard.orders');
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/export/excel', [ReportController::class, 'exportExcel'])->name('reports.export.excel');
    Route::get('reports/export/pdf', [ReportController::class, 'exportPdf'])->name('reports.export.pdf');
    Route::get('users/export/excel', [ExportUsersController::class, 'excel'])->name('users.export.excel');
    Route::get('users/export/pdf', [ExportUsersController::class, 'pdf'])->name('users.export.pdf');
    Route::resource('users', UserController::class)->except(['show']);
    Route::resource('categories', CategoryController::class)->except(['show']);
    Route::resource('sub-categories', SubCategoryController::class)->except(['show']);
    Route::resource('products', ProductController::class)->except(['show']);
    Route::get('orders/{order}/invoice', [AdminOrderController::class, 'invoice'])->name('orders.invoice');
    Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('orders.status');
    Route::patch('orders/{order}/note', [AdminOrderController::class, 'updateNote'])->name('orders.note');
    Route::resource('orders', AdminOrderController::class);
    Route::resource('landing-pages', LandingPageController::class)->except(['show']);
    Route::resource('banners', BannerController::class)->except(['show']);
    Route::resource('payment-methods', PaymentMethodController::class)->except(['show']);
    Route::resource('coupons', CouponController::class)->except(['show']);
    Route::resource('shipping-zones', ShippingZoneController::class)->except(['show']);

    // Blocked IPs & Phones
    Route::get('blocked-ips', [BlockedIpController::class, 'index'])->name('blocked-ips.index');
    Route::post('blocked-ips', [BlockedIpController::class, 'store'])->name('blocked-ips.store');
    Route::delete('blocked-ips/{id}', [BlockedIpController::class, 'destroy'])->name('blocked-ips.destroy');
    Route::post('blocked-ips/from-order', [BlockedIpController::class, 'blockFromOrder'])->name('blocked-ips.from-order');

    // Site Branding Settings
    Route::get('settings/site-branding', [AdminSettingsController::class, 'siteBranding'])->name('settings.site-branding');
    Route::post('settings/site-branding', [AdminSettingsController::class, 'updateSiteBranding'])->name('settings.site-branding.update');

    // GTM Settings
    Route::get('settings/gtm', [AdminSettingsController::class, 'gtm'])->name('settings.gtm');
    Route::post('settings/gtm', [AdminSettingsController::class, 'updateGtm'])->name('settings.gtm.update');

    // Tracking Settings (Meta Pixel, CAPI, GTM Server-Side)
    Route::get('settings/tracking', [AdminSettingsController::class, 'tracking'])->name('settings.tracking');
    Route::post('settings/tracking', [AdminSettingsController::class, 'updateTracking'])->name('settings.tracking.update');

    // Pathao Courier Settings
    Route::get('settings/pathao', [AdminSettingsController::class, 'pathao'])->name('settings.pathao');
    Route::post('settings/pathao', [AdminSettingsController::class, 'updatePathao'])->name('settings.pathao.update');

    // RedX Courier Settings
    Route::get('settings/redx', [AdminSettingsController::class, 'redx'])->name('settings.redx');
    Route::post('settings/redx', [AdminSettingsController::class, 'updateRedx'])->name('settings.redx.update');

    // Steadfast Courier Settings
    Route::get('settings/steadfast', [AdminSettingsController::class, 'steadfast'])->name('settings.steadfast');
    Route::post('settings/steadfast', [AdminSettingsController::class, 'updateSteadfast'])->name('settings.steadfast.update');

    // BD Courier Settings
    Route::get('settings/bdcourier', [AdminSettingsController::class, 'bdcourier'])->name('settings.bdcourier');
    Route::post('settings/bdcourier', [AdminSettingsController::class, 'updateBdcourier'])->name('settings.bdcourier.update');

    // Order Ratio Check Settings
    Route::get('settings/orderratiocheck', [AdminSettingsController::class, 'orderratiocheck'])->name('settings.orderratiocheck');
    Route::post('settings/orderratiocheck', [AdminSettingsController::class, 'updateOrderratiocheck'])->name('settings.orderratiocheck.update');

    // Free Shipping Settings
    Route::get('settings/free-shipping', [AdminSettingsController::class, 'freeShipping'])->name('settings.free-shipping');
    Route::post('settings/free-shipping', [AdminSettingsController::class, 'updateFreeShipping'])->name('settings.free-shipping.update');

    // Top Bar Text Settings
    Route::get('settings/topbar', [AdminSettingsController::class, 'topbar'])->name('settings.topbar');
    Route::post('settings/topbar', [AdminSettingsController::class, 'updateTopbar'])->name('settings.topbar.update');

    // Theme Color Settings
    Route::get('settings/theme', [AdminSettingsController::class, 'theme'])->name('settings.theme');
    Route::post('settings/theme', [AdminSettingsController::class, 'updateTheme'])->name('settings.theme.update');

    // Trust Badges Settings
    Route::get('settings/trust-badges', [AdminSettingsController::class, 'trustBadges'])->name('settings.trust-badges');
    Route::post('settings/trust-badges', [AdminSettingsController::class, 'updateTrustBadges'])->name('settings.trust-badges.update');

    // About Page Settings
    Route::get('settings/about-page', [AdminSettingsController::class, 'aboutPage'])->name('settings.about-page');
    Route::post('settings/about-page', [AdminSettingsController::class, 'updateAboutPage'])->name('settings.about-page.update');
    Route::post('settings/upload-team-image', [AdminSettingsController::class, 'uploadTeamImage'])->name('settings.upload-team-image');

    // Contact Page Settings
    Route::get('settings/contact-page', [AdminSettingsController::class, 'contactPage'])->name('settings.contact-page');
    Route::post('settings/contact-page', [AdminSettingsController::class, 'updateContactPage'])->name('settings.contact-page.update');

    // Checkout & Product Labels Settings
    Route::get('settings/checkout-labels', [AdminSettingsController::class, 'checkoutLabels'])->name('settings.checkout-labels');
    Route::post('settings/checkout-labels', [AdminSettingsController::class, 'updateCheckoutLabels'])->name('settings.checkout-labels.update');

    // Notification Settings
    Route::get('settings/notifications', [AdminSettingsController::class, 'notifications'])->name('settings.notifications');
    Route::post('settings/notifications', [AdminSettingsController::class, 'updateNotifications'])->name('settings.notifications.update');
    Route::get('notifications/check-new-orders', [AdminSettingsController::class, 'checkNewOrders'])->name('notifications.check-new-orders');

    // Email Settings
    Route::get('settings/email', [AdminSettingsController::class, 'email'])->name('settings.email');
    Route::post('settings/email', [AdminSettingsController::class, 'updateEmail'])->name('settings.email.update');
    Route::post('settings/email/test', [AdminSettingsController::class, 'testEmail'])->name('settings.email.test');

    // Facebook Catalog Settings
    Route::get('settings/facebook-catalog', [AdminSettingsController::class, 'facebookCatalog'])->name('settings.facebook-catalog');
    Route::post('settings/facebook-catalog', [AdminSettingsController::class, 'updateFacebookCatalog'])->name('settings.facebook-catalog.update');

    // Shipping & Return Policy
    Route::get('settings/shipping-return-policy', [AdminSettingsController::class, 'shippingReturnPolicy'])->name('settings.shipping-return-policy');
    Route::post('settings/shipping-return-policy', [AdminSettingsController::class, 'updateShippingReturnPolicy'])->name('settings.shipping-return-policy.update');

    // SEO Settings
    Route::get('settings/seo', [AdminSettingsController::class, 'seo'])->name('settings.seo');
    Route::post('settings/seo', [AdminSettingsController::class, 'updateSeo'])->name('settings.seo.update');

    // Push Subscription
    Route::post('push-subscriptions/subscribe', [\App\Http\Controllers\Admin\PushSubscriptionController::class, 'subscribe'])->name('push.subscribe');
    Route::post('push-subscriptions/unsubscribe', [\App\Http\Controllers\Admin\PushSubscriptionController::class, 'unsubscribe'])->name('push.unsubscribe');
    Route::post('push-subscriptions/test', [AdminSettingsController::class, 'testPush'])->name('push.test');

    // Pages
    Route::get('pages', [PageController::class, 'index'])->name('pages.index');
    Route::get('pages/{page}/edit', [PageController::class, 'edit'])->name('pages.edit');
    Route::put('pages/{page}', [PageController::class, 'update'])->name('pages.update');

    // Contact Messages
    Route::get('contacts', [ContactMessagesController::class, 'index'])->name('contacts.index');
    Route::patch('contacts/{contact}/mark-read', [ContactMessagesController::class, 'markRead'])->name('contacts.mark-read');
    Route::patch('contacts/{contact}', [ContactMessagesController::class, 'update'])->name('contacts.update');
    Route::delete('contacts/{contact}', [ContactMessagesController::class, 'destroy'])->name('contacts.destroy');

    // Pathao Courier - send order
    Route::get('orders/{order}/pathao/stores', [AdminOrderController::class, 'pathaoStores'])->name('orders.pathao.stores');
    Route::get('orders/{order}/pathao/locations', [AdminOrderController::class, 'pathaoLocations'])->name('orders.pathao.locations');
    Route::post('orders/{order}/pathao/send', [AdminOrderController::class, 'pathaoSend'])->name('orders.pathao.send');

    // RedX Courier - send order
    Route::get('orders/{order}/redx/areas', [AdminOrderController::class, 'redxAreas'])->name('orders.redx.areas');
    Route::get('orders/{order}/redx/pickup-stores', [AdminOrderController::class, 'redxPickupStores'])->name('orders.redx.pickup-stores');
    Route::post('orders/{order}/redx/send', [AdminOrderController::class, 'redxSend'])->name('orders.redx.send');

    // Carrybee Courier - settings & send order
    Route::get('settings/carrybee', [AdminSettingsController::class, 'carrybee'])->name('settings.carrybee');
    Route::post('settings/carrybee', [AdminSettingsController::class, 'updateCarrybee'])->name('settings.carrybee.update');
    Route::get('orders/{order}/carrybee/area-suggestions', [AdminOrderController::class, 'carrybeeAreaSuggestions'])->name('orders.carrybee.area-suggestions');
    Route::get('orders/{order}/carrybee/stores', [AdminOrderController::class, 'carrybeeStores'])->name('orders.carrybee.stores');
    Route::post('orders/{order}/carrybee/send', [AdminOrderController::class, 'carrybeeSend'])->name('orders.carrybee.send');

    // Steadfast Courier - send order
    Route::post('orders/{order}/steadfast/send', [AdminOrderController::class, 'steadfastSend'])->name('orders.steadfast.send');

    // Courier status sync (manual refresh for a single order)
    Route::post('orders/{order}/courier/sync-status', [AdminOrderController::class, 'syncCourierStatus'])->name('orders.courier.sync-status');

    // BD Courier - order ratio check
    Route::get('orders/{order}/courier-check', [AdminOrderController::class, 'courierCheck'])->name('orders.courier.check');

    // Reviews management
    Route::patch('reviews/{review}/approve', [AdminReviewController::class, 'approve'])->name('reviews.approve');
    Route::patch('reviews/{review}/reject', [AdminReviewController::class, 'reject'])->name('reviews.reject');
    Route::resource('reviews', AdminReviewController::class)->except(['create', 'store', 'show']);

});

// Super Admin routes
Route::middleware(['auth', 'verified', 'role:super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    Route::get('dashboard', SuperAdminDashboardController::class)->name('dashboard');
    Route::get('users/{user}/change-password', [SuperAdminUserController::class, 'changePassword'])->name('users.change-password');
    Route::post('users/{user}/change-password', [SuperAdminUserController::class, 'updatePassword'])->name('users.update-password');
    Route::patch('users/{user}/toggle-status', [SuperAdminUserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::resource('users', SuperAdminUserController::class)->except(['show']);

    // Maintenance Mode Settings
    Route::get('settings/maintenance', [SuperAdminSettingsController::class, 'maintenance'])->name('settings.maintenance');
    Route::post('settings/maintenance', [SuperAdminSettingsController::class, 'updateMaintenance'])->name('settings.maintenance.update');

    // Backup & Restore
    Route::get('backup', [BackupController::class, 'index'])->name('backup.index');
    Route::get('backup/download-database', [BackupController::class, 'downloadDatabase'])->name('backup.download-database');
    Route::get('backup/download-media', [BackupController::class, 'downloadMedia'])->name('backup.download-media');
    Route::post('backup/upload-database', [BackupController::class, 'uploadDatabase'])->name('backup.upload-database');
    Route::post('backup/upload-media', [BackupController::class, 'uploadMedia'])->name('backup.upload-media');
});

// Manager routes
Route::middleware(['auth', 'verified', 'role:manager'])->prefix('manager')->name('manager.')->group(function () {
    Route::get('dashboard', ManagerDashboardController::class)->name('dashboard');
});

// User routes
Route::middleware(['auth', 'verified', 'role:user'])->prefix('user')->name('user.')->group(function () {
    Route::get('dashboard', [UserDashboardController::class, 'index'])->name('dashboard');
    Route::get('track-orders', [UserDashboardController::class, 'trackOrdersPage'])->name('track-orders.page');
    Route::post('track-orders', [UserDashboardController::class, 'trackOrders'])->name('track-orders');
    Route::post('profile-image', [UserDashboardController::class, 'uploadProfileImage'])->name('profile-image.upload');
    Route::delete('profile-image', [UserDashboardController::class, 'deleteProfileImage'])->name('profile-image.delete');
});

require __DIR__.'/settings.php';
