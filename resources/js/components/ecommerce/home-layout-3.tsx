import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight, Tag, Truck } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProductCard } from '@/components/ecommerce/product-card';
import { buildItem, gtmSelectItem, gtmViewItemList } from '@/lib/gtm';
import type { Banner, Product, SharedCategory } from '@/types/global';

// ─── Two-tone section heading ─────────────────────────────────────────────────
function SectionHeadingV3({ first, accent, href }: { first: string; accent: string; href?: string }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold md:text-2xl">
                {first} <span className="text-primary">{accent}</span>
            </h2>
            {href && (
                <Link href={href} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            )}
        </div>
    );
}

// ─── Full-height slider (fills parent container) ──────────────────────────────
function LayoutSlider({ items, className = 'min-h-52' }: { items: Banner[]; className?: string }) {
    const [current, setCurrent] = useState(0);
    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        if (items.length <= 1) {
            return;
        }

        const id = setInterval(() => {
            setCurrent((c) => (c + 1) % items.length);
        }, 5000);

        return () => clearInterval(id);
    }, [items]);

    function prev() {
        setCurrent((c) => (c - 1 + items.length) % items.length);
    }

    function next() {
        setCurrent((c) => (c + 1) % items.length);
    }

    function onTouchStart(e: React.TouchEvent) {
        dragStartX.current = e.touches[0].clientX;
        isDragging.current = false;
    }

    function onTouchMove(e: React.TouchEvent) {
        if (dragStartX.current !== null && Math.abs(e.touches[0].clientX - dragStartX.current) > 8) {
            isDragging.current = true;
        }
    }

    function onTouchEnd(e: React.TouchEvent) {
        if (dragStartX.current === null) {
            return;
        }

        const diff = dragStartX.current - e.changedTouches[0].clientX;

        if (isDragging.current && Math.abs(diff) > 40) {
            if (diff > 0) {
                next();
            } else {
                prev();
            }
        }

        dragStartX.current = null;
        isDragging.current = false;
    }

    function onTouchCancel() {
        dragStartX.current = null;
        isDragging.current = false;
    }

    function onMouseDown(e: React.MouseEvent) {
        if (e.button !== 0) return;
        dragStartX.current = e.clientX;
        isDragging.current = false;
        (e.currentTarget as HTMLElement).setPointerCapture(e.nativeEvent.pointerId ?? 1);
        e.preventDefault();
    }

    function onMouseMove() {
        if (dragStartX.current !== null) {
            isDragging.current = true;
        }
    }

    function onMouseUp(e: React.MouseEvent) {
        if (dragStartX.current === null) {
            return;
        }

        const diff = dragStartX.current - e.clientX;

        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                next();
            } else {
                prev();
            }
        }

        dragStartX.current = null;
        isDragging.current = false;
    }

    function onMouseLeave() {
        dragStartX.current = null;
        isDragging.current = false;
    }

    function onClickCapture(e: React.MouseEvent) {
        if (isDragging.current) {
            e.preventDefault();
        }
    }

    return (
        <div
            className={`group relative h-full overflow-hidden rounded-2xl select-none cursor-grab active:cursor-grabbing ${className}`}
            style={{ touchAction: 'pan-y' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchCancel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onClickCapture={onClickCapture}
        >
            {items.map((b, i) => (
                <div
                    key={b.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
                >
                    {b.image_path && (
                        <img
                            src={`/${b.image_path}`}
                            alt={b.title || 'Banner'}
                            className="h-full w-full object-cover"
                            style={{ position: 'absolute', inset: 0 }}
                        />
                    )}
                    {(b.title || b.subtitle || b.button_text) && (
                        <div className="absolute inset-0 z-10 flex flex-col justify-center px-5 py-5 md:px-8">
                            {b.title && (
                                <h2 className="mb-1.5 text-xl font-extrabold leading-tight text-foreground drop-shadow-sm md:text-2xl">
                                    {b.title}
                                </h2>
                            )}
                            {b.subtitle && (
                                <p className="mb-3 text-sm text-foreground/70">{b.subtitle}</p>
                            )}
                            {b.button_text && b.button_link && (
                                <a
                                    href={b.button_link}
                                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-foreground/20 bg-background/80 px-4 py-1.5 text-sm font-semibold text-foreground shadow backdrop-blur-sm transition hover:bg-background"
                                >
                                    {b.button_text} <ArrowRight className="h-3.5 w-3.5" />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            ))}
            {items.length > 1 && (
                <>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={prev}
                        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={next}
                        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                        aria-label="Next"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBannerV3() {
    const { banners } = usePage<{ banners: Banner[] }>().props;

    // ── 0 banners: fallback placeholder ──────────────────────────────────────
    if (!banners || banners.length === 0) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:h-80">
                {/* Left large panel */}
                <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 p-8 md:p-10 sm:col-span-3 sm:h-full flex flex-col justify-center">
                    <span className="mb-3 inline-block text-xs font-semibold text-primary">Top Collection</span>
                    <h1 className="mb-2 text-2xl font-extrabold leading-tight md:text-3xl">
                        Discover <span className="text-primary">Amazing</span> Deals
                    </h1>
                    <p className="mb-6 text-sm text-muted-foreground">Shop top brands at unbeatable prices every day.</p>
                    <div>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow transition hover:bg-primary/90"
                        >
                            Shop Now <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
                {/* Right two stacked panels */}
                <div className="grid grid-rows-2 gap-3 sm:col-span-2 sm:h-full">
                    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 p-6 flex flex-col justify-center">
                        <span className="mb-2 inline-block text-xs font-semibold text-primary">New Season</span>
                        <h2 className="mb-1 text-xl font-extrabold leading-tight">
                            New <span className="text-primary">Arrivals</span>
                        </h2>
                        <p className="mb-4 text-xs text-muted-foreground">Fresh picks just landed in store.</p>
                        <div>
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow transition hover:bg-primary/90"
                            >
                                Shop Now <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 p-6 flex flex-col justify-center">
                        <span className="mb-2 inline-block text-xs font-semibold text-primary">Members Only</span>
                        <h2 className="mb-1 text-xl font-extrabold leading-tight">
                            Free <span className="text-primary">Shipping</span>
                        </h2>
                        <p className="mb-4 text-xs text-muted-foreground">On all orders. No minimum required.</p>
                        <div>
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow transition hover:bg-primary/90"
                            >
                                Shop Now <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── exactly 1 banner: full-width slider ──────────────────────────────────
    if (banners.length === 1) {
        return (
            <div className="relative overflow-hidden rounded-2xl" style={{ paddingBottom: '42%', minHeight: '220px' }}>
                <div className="absolute inset-0">
                    <LayoutSlider items={banners} />
                </div>
            </div>
        );
    }

    // ── exactly 2 banners: left large (3/5) + right single slider (2/5) ──────
    if (banners.length === 2) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:h-85 sm:grid-cols-5">
                <div className="sm:col-span-3 sm:h-full">
                    <LayoutSlider items={[banners[0]]} />
                </div>
                <div className="sm:col-span-2 sm:h-full">
                    <LayoutSlider items={[banners[1]]} className="min-h-40" />
                </div>
            </div>
        );
    }

    // ── 3+ banners: divide by index mod 3 across left + right-top + right-bottom
    const leftBanners = banners.filter((_, i) => i % 3 === 0);
    const topBanners = banners.filter((_, i) => i % 3 === 1);
    const bottomBanners = banners.filter((_, i) => i % 3 === 2);

    return (
        <div className="grid grid-cols-1 gap-4 sm:h-85 sm:grid-cols-5">
            <div className="sm:col-span-3 sm:h-full">
                <LayoutSlider items={leftBanners} />
            </div>
            <div className="grid grid-rows-2 gap-3 sm:col-span-2 sm:h-full">
                <LayoutSlider items={topBanners} className="min-h-28" />
                <LayoutSlider items={bottomBanners} className="min-h-28" />
            </div>
        </div>
    );
}

// ─── Top Categories with count badges ────────────────────────────────────────
function CategoryScrollV3() {
    const { categories } = usePage<{ categories: SharedCategory[] }>().props;

    return (
        <section>
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-extrabold md:text-2xl">
                    Top <span className="text-primary">Categories</span>
                </h2>
                <Link
                    href="/products"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
            <div className="overflow-x-auto px-2" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-3 rounded-xl">
                    {categories.length === 0 && (
                        <p className="px-4 py-8 text-sm text-muted-foreground">No categories yet.</p>
                    )}
                    {categories.map((cat) => {
                        const Icon = cat.icon
                            ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[cat.icon] || Tag
                            : Tag;

                        return (
                            <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className="group flex shrink-0 flex-col items-center gap-3 px-4 py-4 sm:px-6 sm:py-5 transition hover:bg-primary/5 min-w-[92px] sm:min-w-[120px] border border-border rounded-xl bg-background shadow-sm"
                            >
                                <div className="relative">
                                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full bg-muted transition group-hover:bg-primary/10">
                                        {cat.image_path ? (
                                            <img
                                                src={'/' + cat.image_path}
                                                alt={cat.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Icon className="h-6 w-6 text-muted-foreground transition group-hover:text-primary" />
                                        )}
                                    </div>
                                    {typeof cat.products_count === 'number' && (
                                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                            {cat.products_count}
                                        </span>
                                    )}
                                </div>
                                <span className="text-center text-sm font-medium leading-tight text-foreground/80 truncate" style={{ maxWidth: 120 }}>
                                    {cat.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Offer Products ───────────────────────────────────────────────────────────
function OffersV3() {
    const { offerProducts } = usePage<{ offerProducts: Product[] }>().props;

    useEffect(() => {
        if (!offerProducts || offerProducts.length === 0) {
            return;
        }

        const gtmItems = offerProducts.slice(0, 20).map((p, i) =>
            buildItem(p.id, p.name, parseFloat(p.price), 1, {
                category: p.category?.name,
                originalPrice: p.original_price ? parseFloat(p.original_price) : null,
                index: i,
            }),
        );

        gtmViewItemList(gtmItems, 'Offer Products');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!offerProducts || offerProducts.length === 0) {
        return null;
    }

    return (
        <section>
            <SectionHeadingV3 first="Hot" accent="Offers" href="/products" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
                {offerProducts.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onCardClick={() =>
                            gtmSelectItem(
                                buildItem(product.id, product.name, parseFloat(product.price), 1, {
                                    category: product.category?.name,
                                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                                    index,
                                }),
                                'Offer Products',
                            )
                        }
                    />
                ))}
            </div>
        </section>
    );
}

// ─── Featured Products ────────────────────────────────────────────────────────
function FeaturedV3() {
    const { featuredProducts } = usePage<{ featuredProducts: Product[] }>().props;

    useEffect(() => {
        if (!featuredProducts || featuredProducts.length === 0) {
            return;
        }

        const gtmItems = featuredProducts.slice(0, 20).map((p, i) =>
            buildItem(p.id, p.name, parseFloat(p.price), 1, {
                category: p.category?.name,
                originalPrice: p.original_price ? parseFloat(p.original_price) : null,
                index: i,
            }),
        );

        gtmViewItemList(gtmItems, 'Featured Products');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!featuredProducts || featuredProducts.length === 0) {
        return null;
    }

    return (
        <section>
            <SectionHeadingV3 first="Featured" accent="Products" href="/products" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
                {featuredProducts.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onCardClick={() =>
                            gtmSelectItem(
                                buildItem(product.id, product.name, parseFloat(product.price), 1, {
                                    category: product.category?.name,
                                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                                    index,
                                }),
                                'Featured Products',
                            )
                        }
                    />
                ))}
            </div>
        </section>
    );
}

// ─── Mid Banner ───────────────────────────────────────────────────────────────
function MidBannerV3() {
    const { midBanners } = usePage<{ midBanners: Banner[] }>().props;
    const [current, setCurrent] = useState(0);
    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        if (!midBanners || midBanners.length <= 1) {
            return;
        }

        const id = setInterval(() => {
            setCurrent((c) => (c + 1) % midBanners.length);
        }, 5000);

        return () => clearInterval(id);
    }, [midBanners]);

    if (!midBanners || midBanners.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 p-8 md:p-12">
                <div className="max-w-lg">
                    <span className="mb-3 inline-block text-xs font-semibold text-primary">Limited Time</span>
                    <h2 className="mb-2 text-2xl font-extrabold leading-tight text-foreground md:text-3xl">
                        Up to <span className="text-primary">50% Off</span> Today
                    </h2>
                    <p className="mb-6 text-sm text-muted-foreground">Grab the hottest deals before they're gone.</p>
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow transition hover:bg-primary/90"
                    >
                        Shop Now <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    function prev() {
        setCurrent((c) => (c - 1 + midBanners.length) % midBanners.length);
    }

    function next() {
        setCurrent((c) => (c + 1) % midBanners.length);
    }

    function onTouchStart(e: React.TouchEvent) {
        dragStartX.current = e.touches[0].clientX;
        isDragging.current = false;
    }

    function onTouchMove(e: React.TouchEvent) {
        if (dragStartX.current !== null && Math.abs(e.touches[0].clientX - dragStartX.current) > 8) {
            isDragging.current = true;
        }
    }

    function onTouchEnd(e: React.TouchEvent) {
        if (dragStartX.current === null) {
            return;
        }

        const diff = dragStartX.current - e.changedTouches[0].clientX;

        if (isDragging.current && Math.abs(diff) > 40) {
            if (diff > 0) {
                next();
            } else {
                prev();
            }
        }

        dragStartX.current = null;
        isDragging.current = false;
    }

    function onTouchCancel() {
        dragStartX.current = null;
        isDragging.current = false;
    }

    function onMouseDown(e: React.MouseEvent) {
        if (e.button !== 0) return;
        dragStartX.current = e.clientX;
        isDragging.current = false;
        (e.currentTarget as HTMLElement).setPointerCapture(e.nativeEvent.pointerId ?? 1);
        e.preventDefault();
    }

    function onMouseMove(e: React.MouseEvent) {
        if (dragStartX.current !== null && Math.abs(e.clientX - dragStartX.current) > 8) {
            isDragging.current = true;
        }
    }

    function onMouseUp(e: React.MouseEvent) {
        if (dragStartX.current === null) {
            return;
        }

        const diff = dragStartX.current - e.clientX;

        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                next();
            } else {
                prev();
            }
        }

        dragStartX.current = null;
        isDragging.current = false;
    }

    function onMouseLeave() {
        dragStartX.current = null;
        isDragging.current = false;
    }

    function onClickCapture(e: React.MouseEvent) {
        if (isDragging.current) {
            e.preventDefault();
        }
    }

    return (
        <div
            className="group relative overflow-hidden rounded-2xl select-none cursor-grab active:cursor-grabbing"
            style={{ minHeight: '200px', touchAction: 'pan-y' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchCancel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onClickCapture={onClickCapture}
        >
            {midBanners.map((b, i) => (
                <div
                    key={b.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
                >
                    <img
                        src={`/${b.image_path}`}
                        alt={b.title || 'Banner'}
                        className="h-full w-full object-cover"
                        style={{ position: 'absolute', inset: 0 }}
                    />
                    {(b.title || b.subtitle || b.button_text) && (
                        <div className="absolute inset-0 z-10 flex h-full flex-col justify-center px-6 py-8 md:px-12">
                            <div className="max-w-lg">
                                {b.title && (
                                    <h2 className="mb-2 text-2xl font-extrabold text-primary drop-shadow md:text-4xl">
                                        {b.title}
                                    </h2>
                                )}
                                {b.subtitle && (
                                    <p className="mb-5 text-sm text-primary/80 md:text-base">{b.subtitle}</p>
                                )}
                                {b.button_text && b.button_link && (
                                    <a
                                        href={b.button_link}
                                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow transition hover:bg-primary/90"
                                    >
                                        {b.button_text} <ArrowRight className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <div className="relative invisible" style={{ paddingBottom: '37%' }} />
            {midBanners.length > 1 && (
                <>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={prev}
                        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                        aria-label="Previous banner"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={next}
                        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                        aria-label="Next banner"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                        {midBanners.map((_, i) => (
                            <button
                                key={i}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => setCurrent(i)}
                                className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── New Arrivals ─────────────────────────────────────────────────────────────
function NewArrivalsV3() {
    const { newArrivalProducts } = usePage<{ newArrivalProducts: Product[] }>().props;

    useEffect(() => {
        if (!newArrivalProducts || newArrivalProducts.length === 0) {
            return;
        }

        const gtmItems = newArrivalProducts.slice(0, 20).map((p, i) =>
            buildItem(p.id, p.name, parseFloat(p.price), 1, {
                category: p.category?.name,
                originalPrice: p.original_price ? parseFloat(p.original_price) : null,
                index: i,
            }),
        );

        gtmViewItemList(gtmItems, 'New Arrivals');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!newArrivalProducts || newArrivalProducts.length === 0) {
        return null;
    }

    return (
        <section>
            <SectionHeadingV3 first="New" accent="Arrivals" href="/products" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
                {newArrivalProducts.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        topLeftBadge={
                            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow">NEW</span>
                        }
                        onCardClick={() =>
                            gtmSelectItem(
                                buildItem(product.id, product.name, parseFloat(product.price), 1, {
                                    category: product.category?.name,
                                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                                    index,
                                }),
                                'New Arrivals',
                            )
                        }
                    />
                ))}
            </div>
        </section>
    );
}

// ─── Deals Section ────────────────────────────────────────────────────────────
function DealsV3() {
    const { dealsProducts } = usePage<{ dealsProducts: Product[] }>().props;

    useEffect(() => {
        if (!dealsProducts || dealsProducts.length === 0) {
            return;
        }

        const gtmItems = dealsProducts.slice(0, 20).map((p, i) =>
            buildItem(p.id, p.name, parseFloat(p.price), 1, {
                category: p.category?.name,
                originalPrice: p.original_price ? parseFloat(p.original_price) : null,
                index: i,
            }),
        );

        gtmViewItemList(gtmItems, 'Deals of the Day');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!dealsProducts || dealsProducts.length === 0) {
        return null;
    }

    return (
        <section>
            <SectionHeadingV3 first="Deals" accent="of the Day" href="/products" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
                {dealsProducts.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onCardClick={() =>
                            gtmSelectItem(
                                buildItem(product.id, product.name, parseFloat(product.price), 1, {
                                    category: product.category?.name,
                                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                                    index,
                                }),
                                'Deals of the Day',
                            )
                        }
                    />
                ))}
            </div>
        </section>
    );
}

// ─── Trust Badges ─────────────────────────────────────────────────────────────
function TrustBadgesV3() {
    const { trustBadges } = usePage<{ trustBadges?: { icon: string; title: string; desc: string }[] }>().props;

    const badges = trustBadges && trustBadges.length > 0 ? trustBadges : [
        { icon: 'Truck',     title: 'Free Shipping', desc: 'On orders over ৳500' },
        { icon: 'Shield',    title: 'Secure Payment', desc: '100% protected' },
        { icon: 'RotateCcw', title: 'Easy Returns',   desc: '30-day guarantee' },
    ];

    return (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {badges.map((badge, i) => {
                const Icon =
                    (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[badge.icon] ||
                    Truck;

                return (
                    <div key={i} className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{badge.title}</p>
                            <p className="text-xs text-muted-foreground">{badge.desc}</p>
                        </div>
                    </div>
                );
            })}
        </section>
    );
}

// ─── Root Layout 3 export ─────────────────────────────────────────────────────
export function HomeLayout3() {
    return (
        <div className="flex flex-col gap-8">
            <HeroBannerV3 />
            <CategoryScrollV3 />
            <OffersV3 />
            <FeaturedV3 />
            <MidBannerV3 />
            <NewArrivalsV3 />
            <DealsV3 />
            <TrustBadgesV3 />
        </div>
    );
}
