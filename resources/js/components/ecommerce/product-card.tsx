import { Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { buildItem, gtmAddToCart } from '@/lib/gtm';
import { pixelAddToCart, buildContent } from '@/lib/meta-pixel';
import { tiktokAddToCart, buildTikTokContent } from '@/lib/tiktok-pixel';
import { addToCart } from '@/stores/use-cart';
import type { Product } from '@/types/global';

function trackAddToCartServer(productId: number, productName: string, price: number, quantity: number): Promise<string | undefined> {
    return fetch('/api/tracking/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ product_id: productId, product_name: productName, price, quantity }),
    })
        .then((r) => r.json())
        .then((d: { event_id?: string }) => d.event_id)
        .catch(() => undefined);
}

function formatPrice(price: string | null): string {
    if (!price) {
        return '';
    }

    return `৳${parseFloat(price).toFixed(0)}`;
}

function CountdownTimer({ targetDate }: { targetDate: string | null }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        if (!targetDate) {
            return;
        }

        const calculate = () => {
            const diff = new Date(targetDate).getTime() - Date.now();

            if (diff <= 0) {
                setTimeLeft(null);

                return;
            }

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        };

        calculate();
        const timer = setInterval(calculate, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-700 text-[11px] font-semibold">
            <span>⏱</span>
            <span>
                {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
                {timeLeft.hours}h {timeLeft.minutes}m
            </span>
        </div>
    );
}

interface ProductCardProps {
    product: Product;
    /** Extra badge shown top-left (e.g. "New") */
    topLeftBadge?: React.ReactNode;
    onCardClick?: () => void;
}

export function ProductCardSkeleton() {
    const pageProps = usePage().props as { productCardLayout?: string };
    const layout = pageProps.productCardLayout ?? '1';

    if (layout === '2') {
        return (
            <div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="relative aspect-square overflow-hidden bg-muted/40">
                    <Skeleton className="h-full w-full rounded-none" />
                    <Skeleton className="absolute right-2 top-2 h-5 w-12 rounded" />
                </div>
                <div className="p-2.5">
                    <Skeleton className="mb-1.5 h-2.5 w-16" />
                    <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-12 shrink-0" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                    <Skeleton className="h-9 flex-1 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="relative aspect-square overflow-hidden bg-muted/40">
                <Skeleton className="h-full w-full rounded-none" />
                <Skeleton className="absolute left-2 top-2 h-5 w-16 rounded" />
                <Skeleton className="absolute right-2 top-2 h-5 w-12 rounded" />
            </div>

            <div className="flex flex-1 flex-col p-2">
                <Skeleton className="mb-2 h-3 w-20" />
                <div className="mb-2 flex items-baseline gap-2">
                    <Skeleton className="h-5 w-18" />
                    <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="mb-1.5 h-4 w-full" />
                <Skeleton className="mb-2 h-4 w-4/5" />
                <Skeleton className="h-3 w-24" />
            </div>

            <div className="flex flex-col gap-1.5 px-2 pb-2">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
            </div>
        </div>
    );
}

export function ProductCard({ product, topLeftBadge, onCardClick }: ProductCardProps) {
    const pageProps = usePage().props as { addToCartLabel?: string; buyNowLabel?: string; cardBuyNowEnabled?: boolean; productCardLayout?: string };
    const productCardLayout = pageProps.productCardLayout ?? '1';

    if (productCardLayout === '2') {
        return <ProductCard2Inner product={product} topLeftBadge={topLeftBadge} onCardClick={onCardClick} />;
    }

    const addToCartLabel   = pageProps.addToCartLabel   ?? 'Add to Cart';
    const buyNowLabel      = pageProps.buyNowLabel      ?? 'Buy Now';
    const cardBuyNowEnabled = pageProps.cardBuyNowEnabled ?? true;
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const discountPct =
        product.original_price && parseFloat(product.original_price) > parseFloat(product.price)
            ? Math.round(
                  ((parseFloat(product.original_price) - parseFloat(product.price)) /
                      parseFloat(product.original_price)) *
                      100,
              )
            : null;

    function handleAddToCart(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (hasVariants) {
            router.visit(`/product/${product.slug}`);

            return;
        }

        const price = parseFloat(product.price);

        addToCart(
            {
                productId: product.id,
                variantId: null,
                slug: product.slug,
                name: product.name,
                price,
                image: product.images?.[0]?.image_path ?? null,
                variantLabel: null,
                freeShipping: product.free_shipping,
                shippingZones: product.shipping_zones ?? [],
                allowedPaymentMethods: product.allowed_payment_methods ?? [],
            },
            1,
        );

        // Fire server-side CAPI, then use returned event_id for browser pixel deduplication
        trackAddToCartServer(product.id, product.name, price, 1).then((eventId) => {
            gtmAddToCart(
                buildItem(product.id, product.name, price, 1, {
                    category: product.category?.name,
                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                }),
                eventId,
            );
            pixelAddToCart([product.id], product.name, price, [buildContent(product.id, 1, price)], eventId);
            tiktokAddToCart([buildTikTokContent(product.id, 1, price, product.name)], price, eventId);
        });

        toast.success(`${product.name} added to cart`);
    }

    function handleBuyNow(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        // Always go to product detail when product has variants
        if (hasVariants) {
            router.visit(`/product/${product.slug}`);

            return;
        }

        const price = parseFloat(product.price);

        addToCart(
            {
                productId: product.id,
                variantId: null,
                slug: product.slug,
                name: product.name,
                price,
                image: product.images?.[0]?.image_path ?? null,
                variantLabel: null,
                freeShipping: product.free_shipping,
                shippingZones: product.shipping_zones ?? [],
                allowedPaymentMethods: product.allowed_payment_methods ?? [],
            },
            1,
        );

        // Fire server-side CAPI, then use returned event_id for browser pixel deduplication
        trackAddToCartServer(product.id, product.name, price, 1).then((eventId) => {
            gtmAddToCart(
                buildItem(product.id, product.name, price, 1, {
                    category: product.category?.name,
                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                }),
                eventId,
            );
            pixelAddToCart([product.id], product.name, price, [buildContent(product.id, 1, price)], eventId);
            tiktokAddToCart([buildTikTokContent(product.id, 1, price, product.name)], price, eventId);
        });

        router.visit('/checkout');
    }

    return (
        <Link
            href={`/product/${product.slug}`}
            onClick={onCardClick}
            className="group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200"
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-muted">
                {product.images?.[0] ? (
                    <img
                        src={`/${product.images[0].image_path}`}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl">📦</div>
                )}

                {/* Top-left badge (out of stock / custom) */}
                {!product.in_stock ? (
                    <span className="absolute left-2 top-2 text-[10px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        Out of stock
                    </span>
                ) : (
                    topLeftBadge && (
                        <span className="absolute left-2 top-2">{topLeftBadge}</span>
                    )
                )}

                {/* Discount badge top-right */}
                {discountPct && (
                    <span className="absolute right-2 top-2 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                        -{discountPct}%
                    </span>
                )}

                {/* Add to cart button — removed from here, moved to card bottom */}
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 p-2">
                {product.category?.name && (
                    <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wide mb-1">
                        {product.category.name}
                    </p>
                )}

                <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-base font-bold text-primary">{formatPrice(product.price)}</span>
                    {product.original_price && parseFloat(product.original_price) > parseFloat(product.price) && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                    )}
                </div>

                <p className="text-[13px] text-foreground leading-snug line-clamp-2 mb-1.5 flex-1">{product.name}</p>

                {product.free_shipping && (
                    <p className="text-xs font-semibold text-primary/70">Free Shipping</p>
                )}

                {product.offer_timer && (
                    <div className="mt-1">
                        <CountdownTimer targetDate={product.offer_timer} />
                    </div>
                )}


            </div>

            {/* Buttons — Add to Cart + optional Buy Now */}
            <div className="flex flex-col gap-1.5 px-2 pb-2">
                <button
                    onClick={handleAddToCart}
                    disabled={!product.in_stock}
                    title="Add to cart"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary bg-background px-3 py-2 text-xs font-semibold text-primary shadow transition-colors hover:bg-primary/10 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{addToCartLabel}</span>
                </button>

                {cardBuyNowEnabled && (
                    <button
                        onClick={handleBuyNow}
                        disabled={!product.in_stock}
                        title={hasVariants ? 'View product' : 'Buy Now'}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Zap className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{buyNowLabel}</span>
                    </button>
                )}
            </div>
        </Link>
    );
}

// ─── Product Card Layout 2 ────────────────────────────────────────────────────
function ProductCard2Inner({ product, topLeftBadge, onCardClick }: ProductCardProps) {
    const pageProps = usePage().props as { addToCartLabel?: string; buyNowLabel?: string; cardBuyNowEnabled?: boolean };
    const addToCartLabel    = pageProps.addToCartLabel    ?? 'Add to Cart';
    const buyNowLabel       = pageProps.buyNowLabel       ?? 'Buy Now';
    const cardBuyNowEnabled = pageProps.cardBuyNowEnabled ?? true;
    const hasVariants       = (product.variants?.length ?? 0) > 0;

    const discountPct =
        product.original_price && parseFloat(product.original_price) > parseFloat(product.price)
            ? Math.round(
                  ((parseFloat(product.original_price) - parseFloat(product.price)) /
                      parseFloat(product.original_price)) *
                      100,
              )
            : null;

    function handleAddToCart(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (hasVariants) {
            router.visit(`/product/${product.slug}`);
            return;
        }

        const price = parseFloat(product.price);

        addToCart(
            {
                productId: product.id,
                variantId: null,
                slug: product.slug,
                name: product.name,
                price,
                image: product.images?.[0]?.image_path ?? null,
                variantLabel: null,
                freeShipping: product.free_shipping,
                shippingZones: product.shipping_zones ?? [],
                allowedPaymentMethods: product.allowed_payment_methods ?? [],
            },
            1,
        );

        trackAddToCartServer(product.id, product.name, price, 1).then((eventId) => {
            gtmAddToCart(
                buildItem(product.id, product.name, price, 1, {
                    category: product.category?.name,
                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                }),
                eventId,
            );
            pixelAddToCart([product.id], product.name, price, [buildContent(product.id, 1, price)], eventId);
            tiktokAddToCart([buildTikTokContent(product.id, 1, price, product.name)], price, eventId);
        });

        toast.success(`${product.name} added to cart`);
    }

    function handleBuyNow(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (hasVariants) {
            router.visit(`/product/${product.slug}`);
            return;
        }

        const price = parseFloat(product.price);

        addToCart(
            {
                productId: product.id,
                variantId: null,
                slug: product.slug,
                name: product.name,
                price,
                image: product.images?.[0]?.image_path ?? null,
                variantLabel: null,
                freeShipping: product.free_shipping,
                shippingZones: product.shipping_zones ?? [],
                allowedPaymentMethods: product.allowed_payment_methods ?? [],
            },
            1,
        );

        trackAddToCartServer(product.id, product.name, price, 1).then((eventId) => {
            gtmAddToCart(
                buildItem(product.id, product.name, price, 1, {
                    category: product.category?.name,
                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                }),
                eventId,
            );
            pixelAddToCart([product.id], product.name, price, [buildContent(product.id, 1, price)], eventId);
            tiktokAddToCart([buildTikTokContent(product.id, 1, price, product.name)], price, eventId);
        });

        router.visit('/checkout');
    }

    return (
        <Link
            href={`/product/${product.slug}`}
            onClick={onCardClick}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow duration-200"
        >
            {/* Image area */}
            <div className="relative aspect-square overflow-hidden bg-muted/40">
                {product.images?.[0] ? (
                    <img
                        src={`/${product.images[0].image_path}`}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
                )}

                {/* Top-left: out of stock or custom badge */}
                {!product.in_stock ? (
                    <span className="absolute left-2 top-2 text-[10px] font-semibold bg-background/80 text-foreground px-1.5 py-0.5 rounded backdrop-blur-sm">
                        Out of stock
                    </span>
                ) : (
                    topLeftBadge && <span className="absolute left-2 top-2">{topLeftBadge}</span>
                )}

                {/* Discount badge top-right */}
                {discountPct && (
                    <span className="absolute right-2 top-2 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                        -{discountPct}%
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-2.5">
                {product.category?.name && (
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                        {product.category.name}
                    </p>
                )}
                <div className="flex items-baseline justify-between gap-1">
                    <p className="text-[13px] font-semibold text-foreground leading-snug line-clamp-1 flex-1">
                        {product.name}
                    </p>
                    <span className="text-sm font-bold text-primary shrink-0">{formatPrice(product.price)}</span>
                </div>
                {product.original_price && parseFloat(product.original_price) > parseFloat(product.price) && (
                    <span className="text-xs text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                )}
                {product.free_shipping && (
                    <p className="text-xs font-semibold text-primary/70">Free Shipping</p>
                )}
                {product.offer_timer && (
                    <div className="mt-1">
                        <CountdownTimer targetDate={product.offer_timer} />
                    </div>
                )}
            </div>

            {/* Action bar */}
            <div className="px-2.5 pb-2.5 flex items-center gap-1.5">
                {cardBuyNowEnabled ? (
                    <>
                        {/* Cart icon-only button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={!product.in_stock}
                            title={addToCartLabel}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground hover:bg-muted/60 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </button>
                        {/* Buy Now full button */}
                        <button
                            onClick={handleBuyNow}
                            disabled={!product.in_stock}
                            title={hasVariants ? 'View product' : buyNowLabel}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Zap className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{buyNowLabel}</span>
                        </button>
                    </>
                ) : (
                    /* Buy now disabled — full Add to Cart button */
                    <button
                        onClick={handleAddToCart}
                        disabled={!product.in_stock}
                        title={addToCartLabel}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{addToCartLabel}</span>
                    </button>
                )}
            </div>
        </Link>
    );
}
