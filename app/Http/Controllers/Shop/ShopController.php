<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\BlockedIp;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\LandingPage;
use App\Models\Page;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Setting;
use App\Models\ShippingZone;
use App\Models\SubCategory;
use App\Services\TrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    private function categories(): array
    {
        return Cache::remember('shop.categories', 3600, function () {
            return Category::with('subCategories:id,category_id,name,slug')
                ->withCount('products')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'icon', 'image_path'])
                ->toArray();
        });
    }

    private function checkoutLabels(): array
    {
        // Get COD restricted message from either Order Ratio Check or BD Courier, prioritize whichever is configured
        $codRestrictedMessage = Setting::get('orderratiocheck_cod_restricted_message');
        if (!$codRestrictedMessage) {
            $codRestrictedMessage = Setting::get('bdcourier_cod_restricted_message');
        }
        if (!$codRestrictedMessage) {
            $codRestrictedMessage = 'Based on your phone number history, Cash on Delivery is not available. Please select a payment method below.';
        }

        return [
            'addToCart'            => Setting::get('label_add_to_cart',           'Add to Cart'),
            'buyNow'               => Setting::get('label_buy_now',                'Buy Now'),
            'freeShipping'         => Setting::get('label_free_shipping',          'Free Shipping'),
            'deliveryPrefix'       => Setting::get('label_delivery_prefix',        'Delivery: '),
            'deliveryExtra'        => Setting::get('label_delivery_extra',         ''),
            'deliveryArea'         => Setting::get('label_delivery_area',          'Delivery Area'),
            'shippingInfo'         => Setting::get('label_shipping_info',          'Shipping Information'),
            'fullName'             => Setting::get('label_full_name',              'Full Name'),
            'phoneNumber'          => Setting::get('label_phone_number',           'Phone Number'),
            'email'                => Setting::get('label_email',                  'Email Address'),
            'emailEnabled'         => (bool) Setting::get('checkout_email_enabled', false),
            'emailHelpText'        => Setting::get('checkout_email_help_text',     ''),
            'district'             => Setting::get('label_district',               'District'),
            'address'              => Setting::get('label_address',                'Address'),
            'note'                 => Setting::get('label_note',                   'Note'),
            'paymentMethod'        => Setting::get('label_payment_method',         'Payment Method'),
            'yourProducts'         => Setting::get('label_your_products',          'Your Products'),
            'yourOrder'            => Setting::get('label_your_order',              'Your Order'),
            'orderSummary'         => Setting::get('label_order_summary',          'Order Summary'),
            'placeOrder'           => Setting::get('label_place_order',            'Place Order'),
            'proceedToCheckout'    => Setting::get('label_proceed_to_checkout',    'Proceed to Checkout'),
            'continueShopping'     => Setting::get('label_continue_shopping',      'Continue Shopping'),
            'orderConfirmed'       => Setting::get('label_order_confirmed',        'Order Confirmed!'),
            'orderConfirmedSub'    => Setting::get('label_order_confirmed_sub',    'Thank you, {name}! Your order has been placed.'),
            'reviewHeading'        => Setting::get('label_review_heading',         'Submit a Review'),
            'reviewSubheading'     => Setting::get('label_review_subheading',      'Share your thoughts about this product.'),
            'reviewNote'           => Setting::get('label_review_note',            'Anyone can submit a review!'),
            'reviewName'           => Setting::get('label_review_name',            'Your Name'),
            'reviewEmail'          => Setting::get('label_review_email',           'Email Address'),
            'reviewRating'         => Setting::get('label_review_rating',          'Rating'),
            'reviewBody'           => Setting::get('label_review_body',            'Your Review (Minimum 10 characters)'),
            'reviewSubmit'         => Setting::get('label_review_submit',          'Submit Review'),
            'customerReviews'      => Setting::get('label_customer_reviews',       'Customer Reviews'),
            'codRestrictedMessage' => $codRestrictedMessage,
        ];
    }

    public function home(): Response
    {
        $defaultBadges = [
            ['icon' => 'Truck',     'title' => 'Free Shipping', 'desc' => 'On orders over ৳500'],
            ['icon' => 'Shield',    'title' => 'Secure Payment', 'desc' => '100% protected'],
            ['icon' => 'RotateCcw', 'title' => 'Easy Returns',  'desc' => '30-day guarantee'],
        ];
        $badgesRaw   = Setting::get('trust_badges', '');
        $trustBadges = $badgesRaw ? json_decode($badgesRaw, true) : $defaultBadges;

        $banners = Cache::remember('shop.banners', 3600, function () {
            return Banner::where('is_active', true)->where('position', 'hero')->orderBy('sort_order')->orderBy('id')->get(['id', 'title', 'subtitle', 'button_text', 'button_link', 'image_path'])->toArray();
        });

        $midBanners = Cache::remember('shop.mid_banners', 3600, function () {
            return Banner::where('is_active', true)->where('position', 'mid')->orderBy('sort_order')->orderBy('id')->get(['id', 'title', 'subtitle', 'button_text', 'button_link', 'image_path'])->toArray();
        });

        $popupBanners = Cache::remember('shop.popup_banners', 3600, function () {
            return Banner::where('is_active', true)->where('position', 'popup')->orderBy('sort_order')->orderBy('id')->get(['id', 'title', 'subtitle', 'button_text', 'button_link', 'image_path', 'popup_timer'])->toArray();
        });

        $featuredProducts = Cache::remember('shop.products.featured', 900, function () {
            return Product::with('category:id,name', 'images', 'variants')
                ->where('in_stock', true)
                ->where('is_featured', true)
                ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'free_shipping')
                ->latest()
                ->limit(20)
                ->get()->toArray();
        });

        $offerProducts = Cache::remember('shop.products.offers', 120, function () {
            return Product::with('category:id,name', 'images', 'variants')
                ->where('in_stock', true)
                ->whereNotNull('offer_timer')
                ->where('offer_timer', '>', now())
                ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'free_shipping', 'offer_timer')
                ->limit(20)
                ->get()->toArray();
        });

        $dealsProducts = Cache::remember('shop.products.deals', 120, function () {
            return Product::with('category:id,name', 'images', 'variants')
                ->where('in_stock', true)
                ->whereNotNull('offer_timer')
                ->where('offer_timer', '>', now())
                ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'free_shipping', 'offer_timer')
                ->limit(4)
                ->get()->toArray();
        });

        $newArrivalProducts = Cache::remember('shop.products.new_arrivals', 900, function () {
            return Product::with('category:id,name', 'images', 'variants')
                ->where('in_stock', true)
                ->where('is_new_arrival', true)
                ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'free_shipping')
                ->latest()
                ->limit(20)
                ->get()->toArray();
        });

        $allProducts = Cache::remember('shop.products.all', 900, function () {
            return Product::with('category:id,name', 'images', 'variants')
                ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'free_shipping', 'offer_timer')
                ->orderBy('name')
                ->limit(100)
                ->get()->toArray();
        });

        return Inertia::render('shop/home', [
            'banners'            => $banners,
            'midBanners'         => $midBanners,
            'categories'         => $this->categories(),
            'featuredProducts'   => $featuredProducts,
            'offerProducts'      => $offerProducts,
            'dealsProducts'      => $dealsProducts,
            'newArrivalProducts' => $newArrivalProducts,
            'products'           => $allProducts,
            'trustBadges'        => $trustBadges,
            'seoTitle'           => Setting::get('seo_meta_title', ''),
            'seoDescription'     => Setting::get('seo_meta_description', ''),
            'seoKeywords'        => Setting::get('seo_meta_keywords', ''),
            'seoOgImage'         => Setting::get('seo_og_image') ? url(Setting::get('seo_og_image')) : '',
            'homeLayout'         => Setting::get('home_layout', '1'),
            'popupBanners'       => $popupBanners,
        ]);
    }

    public function products(Request $request): Response
    {
        $search = $request->query('search', '');
        $sort   = $request->query('sort', 'newest');
        $filter = $request->query('filter', '');

        // Server-side tracking: Search event (Meta CAPI)
        $searchEventId = null;
        if ($search) {
            try {
                $searchEventId = (new TrackingService())->trackSearch($request, $search);
            } catch (\Throwable) {
            }
        }

        $query = Product::with('category:id,name', 'images', 'variants')
            ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'sub_category_id', 'free_shipping', 'offer_timer')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($filter === 'new-arrivals', fn ($q) => $q->where('is_new_arrival', true))
            ->when($filter === 'featured', fn ($q) => $q->where('is_featured', true))
            ->when($filter === 'deals', fn ($q) => $q->whereNotNull('original_price')->whereColumn('price', '<', 'original_price'))
            ->when($sort === 'price-low',  fn ($q) => $q->orderBy('price'))
            ->when($sort === 'price-high', fn ($q) => $q->orderByDesc('price'))
            ->when($sort !== 'price-low' && $sort !== 'price-high', fn ($q) => $q->orderByDesc('created_at'));

        $paginated = $query->paginate(20)->withQueryString();

        // Server-side tracking: ViewCategory event (Meta CAPI) — only when not a search
        $viewCategoryEventId = null;
        if (! $search) {
            try {
                $productIds = collect($paginated->items())->pluck('id')->toArray();
                $listName   = match ($filter) {
                    'new-arrivals' => 'New Arrivals',
                    'featured'     => 'Featured',
                    'deals'        => 'Deals',
                    default        => 'All Products',
                };
                $viewCategoryEventId = (new TrackingService())->trackViewCategory($request, $productIds, $listName);
            } catch (\Throwable) {
            }
        }

        return Inertia::render('shop/products', [
            'categories'          => $this->categories(),
            'products'            => $paginated,
            'search'              => $search,
            'sort'                => $sort,
            'filter'              => $filter,
            'viewCategoryEventId' => $viewCategoryEventId,
            'searchEventId'       => $searchEventId,
        ]);
    }

    public function category(Request $request, string $slug): Response
    {
        $sort = $request->query('sort', 'newest');

        // Try to find as subcategory first
        $subCategory = \App\Models\SubCategory::where('slug', $slug)->first();
        if ($subCategory) {
            $categorySlug = $subCategory->category->slug;
            $query = Product::with('category:id,name', 'images', 'variants')
                ->where(function ($q) use ($subCategory) {
                    $q->where('sub_category_id', $subCategory->id)
                      ->orWhereJsonContains('extra_sub_category_ids', $subCategory->id);
                })
                ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'sub_category_id', 'free_shipping', 'offer_timer')
                ->when($sort === 'price-low',  fn ($q) => $q->orderBy('price'))
                ->when($sort === 'price-high', fn ($q) => $q->orderByDesc('price'))
                ->when($sort !== 'price-low' && $sort !== 'price-high', fn ($q) => $q->orderByDesc('created_at'));

            $paginated = $query->paginate(20)->withQueryString();

            $viewCategoryEventId = null;
            try {
                $productIds = collect($paginated->items())->pluck('id')->toArray();
                $viewCategoryEventId = (new TrackingService())->trackViewCategory($request, $productIds, $subCategory->name);
            } catch (\Throwable) {
            }

            return Inertia::render('shop/products', [
                'categories'             => $this->categories(),
                'products'               => $paginated,
                'search'                 => '',
                'sort'                   => $sort,
                'defaultCategorySlug'    => $categorySlug,
                'defaultSubCategorySlug' => $slug,
                'viewCategoryEventId'    => $viewCategoryEventId,
            ]);
        }

        // Try to find as category
        $category = Category::where('slug', $slug)->first();
        if ($category) {
            $query = Product::with('category:id,name', 'images', 'variants')
                ->where(function ($q) use ($category) {
                    $q->where('category_id', $category->id)
                      ->orWhereJsonContains('extra_category_ids', $category->id);
                })
                ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'sub_category_id', 'free_shipping', 'offer_timer')
                ->when($sort === 'price-low',  fn ($q) => $q->orderBy('price'))
                ->when($sort === 'price-high', fn ($q) => $q->orderByDesc('price'))
                ->when($sort !== 'price-low' && $sort !== 'price-high', fn ($q) => $q->orderByDesc('created_at'));

            $paginated = $query->paginate(20)->withQueryString();

            $viewCategoryEventId = null;
            try {
                $productIds = collect($paginated->items())->pluck('id')->toArray();
                $viewCategoryEventId = (new TrackingService())->trackViewCategory($request, $productIds, $category->name);
            } catch (\Throwable) {
            }

            return Inertia::render('shop/products', [
                'categories'          => $this->categories(),
                'products'            => $paginated,
                'search'              => '',
                'sort'                => $sort,
                'defaultCategorySlug' => $slug,
                'viewCategoryEventId' => $viewCategoryEventId,
            ]);
        }

        // Not found
        abort(404);
    }

    public function productDetail(Request $request, Product $product): Response
    {
        $product->load('category:id,name', 'subCategory:id,name', 'images', 'variants');

        $related = Cache::remember('shop.products.related.' . $product->id, 900, function () use ($product) {
            return Product::with('category:id,name', 'images', 'variants')
                ->where(function ($q) use ($product) {
                    $q->where('category_id', $product->category_id)
                      ->orWhereJsonContains('extra_category_ids', (int) $product->category_id);
                })
                ->where('id', '!=', $product->id)
                ->select('id', 'name', 'slug', 'price', 'original_price', 'in_stock', 'stock_quantity', 'category_id', 'free_shipping')
                ->limit(20)
                ->get()->toArray();
        });

        $approvedReviews = Cache::remember('shop.reviews.' . $product->id, 600, function () use ($product) {
            return $product->reviews()
                ->approved()
                ->latest()
                ->get(['id', 'name', 'rating', 'comment', 'created_at'])->toArray();
        });

        // Generate event ID for ViewContent deduplication — CAPI fires client-side
        // (via /api/tracking/view-content) so the request carries the settled _fbc cookie.
        $viewEventId = \App\Services\TrackingService::eventId('view');

        return Inertia::render('shop/product-detail', [
            'product'              => $product,
            'relatedProducts'      => $related,
            'reviews'              => $approvedReviews,
            'categories'           => $this->categories(),
            'labels'               => $this->checkoutLabels(),
            'viewEventId'          => $viewEventId,
            'shippingReturnPolicy' => Setting::get('shipping_return_policy', ''),
            'seoTitle'             => $product->meta_title ?: $product->name,
            'seoDescription'       => $product->meta_description ?: ($product->short_description ?: Setting::get('seo_meta_description', '')),
            'seoKeywords'          => $product->meta_keywords ?: Setting::get('seo_meta_keywords', ''),
            'seoOgImage'           => $product->images->first()?->image_path
                ? url($product->images->first()->image_path)
                : (Setting::get('seo_og_image') ? url(Setting::get('seo_og_image')) : ''),
        ]);
    }

    public function productZones(Request $request): \Illuminate\Http\JsonResponse
    {
        $items = $request->query('items', []);

        // New format: items[][product_id] + items[][variant_id]
        if (!empty($items)) {
            $productIds = array_unique(array_filter(array_map(fn ($i) => (int) ($i['product_id'] ?? 0), $items)));
            $variantIds  = array_unique(array_filter(array_map(fn ($i) => (int) ($i['variant_id'] ?? 0), $items)));

            $products = Product::whereIn('id', $productIds)->get(['id', 'free_shipping', 'shipping_zones'])->keyBy('id');
            $variants = \App\Models\ProductVariant::whereIn('id', $variantIds)->get(['id', 'product_id', 'free_shipping', 'shipping_zones'])->keyBy('id');

            $result = [];
            foreach ($items as $item) {
                $productId = (int) ($item['product_id'] ?? 0);
                $variantId = (int) ($item['variant_id'] ?? 0);
                $product = $products->get($productId);
                if (! $product) continue;

                $freeShipping  = (bool) $product->free_shipping;
                $shippingZones = $product->shipping_zones ?? [];

                if ($variantId) {
                    $variant = $variants->get($variantId);
                    if ($variant && $variant->free_shipping !== null) {
                        $freeShipping  = (bool) $variant->free_shipping;
                        $shippingZones = $variant->free_shipping ? [] : ($variant->shipping_zones ?? []);
                    }
                }

                $result[] = [
                    'product_id'     => $productId,
                    'variant_id'     => $variantId ?: null,
                    'free_shipping'  => $freeShipping,
                    'shipping_zones' => $shippingZones,
                ];
            }

            return response()->json($result);
        }

        // Backward compat: old ?ids[]=1 format (product-level only)
        $ids = array_filter(array_map('intval', (array) $request->query('ids', [])));
        if (empty($ids)) {
            return response()->json([]);
        }
        $products = Product::whereIn('id', $ids)->get(['id', 'free_shipping', 'shipping_zones']);

        return response()->json($products->map(fn ($p) => [
            'product_id'     => $p->id,
            'variant_id'     => null,
            'free_shipping'  => (bool) $p->free_shipping,
            'shipping_zones' => $p->shipping_zones ?? [],
        ])->values());
    }

    public function cart(): Response
    {
        return Inertia::render('shop/cart', [
            'categories'          => $this->categories(),
            'freeShippingEnabled' => (bool) Setting::get('free_shipping_enabled', true),
            'freeShippingAmount'  => (int) Setting::get('free_shipping_amount', 0),
            'shippingZones'       => Cache::remember('shop.shipping_zones', 3600, fn () => ShippingZone::orderBy('sort_order')->orderBy('name')->pluck('name')->toArray()),
            'shippingZoneClasses' => Cache::remember('shop.shipping_zone_classes', 3600, fn () => ShippingZone::orderBy('sort_order')->orderBy('name')->get(['name', 'districts'])->map(fn ($zone) => [
                'name' => $zone->name,
                'districts' => $zone->districts ?? [],
            ])->toArray()),
            'labels'              => $this->checkoutLabels(),
        ]);
    }

    public function checkout(): Response
    {
        $paymentMethods = Cache::remember('shop.payment_methods', 3600, function () {
            return PaymentMethod::where('is_active', true)->orderBy('sort_order')->get(['name', 'slug', 'description', 'account_number', 'logo', 'icon', 'account_label', 'instructions_text', 'payment_number_label', 'payment_amount_label', 'requires_payment_details'])->toArray();
        });

        return Inertia::render('shop/checkout', [
            'categories'          => $this->categories(),
            'freeShippingEnabled' => (bool) Setting::get('free_shipping_enabled', true),
            'freeShippingAmount'  => (int) Setting::get('free_shipping_amount', 0),
            'paymentMethods'      => $paymentMethods,
            'shippingZones'       => Cache::remember('shop.shipping_zones', 3600, fn () => ShippingZone::orderBy('sort_order')->orderBy('name')->pluck('name')->toArray()),
            'shippingZoneClasses' => Cache::remember('shop.shipping_zone_classes', 3600, fn () => ShippingZone::orderBy('sort_order')->orderBy('name')->get(['name', 'districts'])->map(fn ($zone) => [
                'name' => $zone->name,
                'districts' => $zone->districts ?? [],
            ])->toArray()),
            'labels'              => $this->checkoutLabels(),
            'hasGlobalCoupons'    => Cache::remember('shop.has_global_coupons', 600, fn () => Coupon::where('is_active', true)->where('is_global', true)->exists()),
            'couponProductIds'    => Cache::remember('shop.coupon_product_ids', 600, fn () => Coupon::where('is_active', true)->where('is_global', false)->with('products:id')->get()->flatMap(fn ($c) => $c->products->pluck('id'))->unique()->values()->toArray()),
        ]);
    }

    public function landing(Request $request, string $slug): Response
    {
        $landingPage = LandingPage::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $product = Product::with('category:id,name', 'subCategory:id,name', 'images', 'variants')->findOrFail($landingPage->product_id);

        $extraProducts = [];
        if (!empty($landingPage->extra_product_ids)) {
            $extraProducts = Product::with('images', 'variants')
                ->whereIn('id', $landingPage->extra_product_ids)
                ->get(['id', 'name', 'price', 'original_price', 'in_stock', 'free_shipping', 'shipping_zones', 'allowed_payment_methods', 'size_label', 'color_label'])
                ->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'name' => $p->name,
                        'price' => $p->price,
                        'original_price' => $p->original_price,
                        'in_stock' => $p->in_stock,
                        'free_shipping' => $p->free_shipping,
                        'shipping_zones' => $p->shipping_zones ?? [],
                        'allowed_payment_methods' => $p->allowed_payment_methods ?? [],
                        'size_label' => $p->size_label,
                        'color_label' => $p->color_label,
                        'image' => $p->images->first() ? '/' . $p->images->first()->image_path : null,
                        'variants' => $p->variants->map(fn($v) => [
                            'id' => $v->id,
                            'size' => $v->size,
                            'color' => $v->color,
                            'price' => $v->price,
                            'original_price' => $v->original_price,
                            'in_stock' => $v->in_stock,
                        ])->values()->toArray(),
                    ];
                })
                ->values()
                ->toArray();
        }

        // Resolve per-landing-page free shipping override vs global
        $globalEnabled = (bool) Setting::get('free_shipping_enabled', true);
        $globalAmount  = (int) Setting::get('free_shipping_amount', 0);
        $lpOverride = $landingPage->free_shipping_enabled;
        $freeShippingEnabled = $lpOverride === null ? $globalEnabled : $lpOverride;
        $freeShippingAmount = ($landingPage->free_shipping_amount !== null)
            ? (int) $landingPage->free_shipping_amount
            : $globalAmount;

        // Generate event ID for ViewContent deduplication — CAPI fires client-side
        // (via /api/tracking/view-content) so the request carries the settled _fbc cookie.
        $viewEventId = \App\Services\TrackingService::eventId('view');

        $view = match ($landingPage->template) {
            'v2'    => 'shop/landing-v2',
            'v3'    => 'shop/landing-v3',
            default => 'shop/landing',
        };

        return Inertia::render($view, [
            'landingPage'         => $landingPage,
            'viewEventId'         => $viewEventId,
            'product'             => $product,
            'extraProducts'       => $extraProducts,
            'freeShippingEnabled' => $freeShippingEnabled,
            'freeShippingAmount'  => $freeShippingAmount,
            'isBlocked'           => BlockedIp::isBlocked($request->ip()),
            'labels'              => $this->checkoutLabels(),
            'shippingZones'       => Cache::remember('shop.shipping_zones', 3600, fn () => ShippingZone::orderBy('sort_order')->orderBy('name')->pluck('name')->toArray()),
            'shippingZoneClasses' => Cache::remember('shop.shipping_zone_classes', 3600, fn () => ShippingZone::orderBy('sort_order')->orderBy('name')->get(['name', 'districts'])->map(fn ($zone) => [
                'name' => $zone->name,
                'districts' => $zone->districts ?? [],
            ])->toArray()),
            'paymentMethods' => Cache::remember('shop.payment_methods', 3600, function () {
                return PaymentMethod::where('is_active', true)->orderBy('sort_order')->get(['name', 'slug', 'description', 'account_number', 'logo', 'icon', 'account_label', 'instructions_text', 'payment_number_label', 'payment_amount_label', 'requires_payment_details'])->toArray();
            }),
            'hasGlobalCoupons'    => Cache::remember('shop.has_global_coupons', 600, fn () => Coupon::where('is_active', true)->where('is_global', true)->exists()),
            'couponProductIds'    => Cache::remember('shop.coupon_product_ids', 600, fn () => Coupon::where('is_active', true)->where('is_global', false)->with('products:id')->get()->flatMap(fn ($c) => $c->products->pluck('id'))->unique()->values()->toArray()),
        ]);
    }

    public function about(): Response
    {
        $defaultValues = [
            ['icon' => 'Heart',  'title' => 'Customer First',  'description' => 'We put our customers at the center of everything we do, ensuring the best shopping experience.'],
            ['icon' => 'Shield', 'title' => 'Quality Assured', 'description' => 'Every product is carefully vetted to meet our high standards of quality and durability.'],
            ['icon' => 'Truck',  'title' => 'Fast Delivery',   'description' => 'We partner with reliable carriers to get your orders delivered quickly and safely.'],
            ['icon' => 'Zap',    'title' => 'Innovation',      'description' => 'We constantly evolve our platform to bring you the latest products and features.'],
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
            ['name' => 'Emily Davis',   'role' => 'Head of Design', 'avatar' => '👩‍🎨'],
            ['name' => 'James Wilson',  'role' => 'Head of Operations', 'avatar' => '👨‍💼'],
        ];

        return Inertia::render('shop/about', [
            'categories'   => $this->categories(),
            'heroTitle'    => Setting::get('about_hero_title',      'About Us'),
            'heroSubtitle' => Setting::get('about_hero_subtitle',   "We're passionate about bringing you the best products at the best prices. Since our founding, we've been dedicated to making online shopping simple, enjoyable, and accessible for everyone."),
            'storyHeading' => Setting::get('about_story_heading',   'Our Story'),
            'storyPara1'   => Setting::get('about_story_para1',     'Founded in 2020, our store started as a small idea — to create a marketplace where quality meets affordability. What began as a passion project has grown into a trusted destination for thousands of happy customers.'),
            'storyPara2'   => Setting::get('about_story_para2',     'Today, we offer over 10,000 products across multiple categories, from electronics and fashion to home essentials and beyond. Our commitment to quality, fast shipping, and exceptional customer service remains at the core of everything we do.'),
            'missionTitle' => Setting::get('about_mission_title',   'Our Mission'),
            'missionText'  => Setting::get('about_mission_text',    'To empower every customer with access to high-quality products, transparent pricing, and an unmatched shopping experience — all backed by a team that truly cares.'),
            'stats'        => json_decode(Setting::get('about_stats',  json_encode($defaultStats)),  true),
            'values'       => json_decode(Setting::get('about_values', json_encode($defaultValues)), true),
            'team'         => json_decode(Setting::get('about_team',   json_encode($defaultTeam)),   true),
        ]);
    }

    public function page(string $slug): Response
    {
        $page = Page::where('slug', $slug)->where('is_active', true)->firstOrFail();

        return Inertia::render('shop/page', [
            'categories' => $this->categories(),
            'page'       => $page->only('title', 'slug', 'content'),
        ]);
    }

    public function contact(): Response
    {
        $defaultFaqs = json_encode([
            ['q' => 'How long does shipping take?',  'a' => 'Standard shipping takes 3-5 business days. Express shipping is available for 1-2 day delivery.'],
            ['q' => 'What is your return policy?',   'a' => 'We offer a 30-day hassle-free return policy on all items in their original condition.'],
            ['q' => 'How can I track my order?',     'a' => "Once your order ships, you'll receive a tracking number via email to monitor your delivery."],
        ]);

        return Inertia::render('shop/contact', [
            'categories'   => $this->categories(),
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
}
