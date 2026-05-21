import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight, TrendingUp, Truck, Tag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProductCard } from '@/components/ecommerce/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildItem, gtmViewItemList, gtmSelectItem } from '@/lib/gtm';
import type { Banner, Product, SharedCategory } from '@/types/global';

function isHomeProductVisit(url: string | URL): boolean {
    try {
        const pathname = new URL(typeof url === 'string' ? url : url.href, window.location.origin).pathname;

        return pathname === '/' || pathname === '/home';
    } catch {
        return false;
    }
}


export function HeroBanner() {
    const { banners } = usePage<{ banners: Banner[] }>().props;
    const [current, setCurrent] = useState(0);
    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        if (!banners || banners.length <= 1) {
            return;
        }

        const id = setInterval(() => {
            setCurrent((c) => (c + 1) % banners.length);
        }, 5000);

        return () => clearInterval(id);
    }, [banners]);

    function prev() {
        setCurrent((c) => (c - 1 + banners.length) % banners.length);
    }

    function next() {
        setCurrent((c) => (c + 1) % banners.length);
    }

    // Touch handlers
    function onTouchStart(e: React.TouchEvent) {
        dragStartX.current = e.touches[0].clientX;
    }

    function onTouchEnd(e: React.TouchEvent) {
        if (dragStartX.current === null) {
            return;
        }

        const diff = dragStartX.current - e.changedTouches[0].clientX;

        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                next();
            } else {
                prev();
            }
        }

        dragStartX.current = null;
    }

    // Mouse drag handlers
    function onMouseDown(e: React.MouseEvent) {
        dragStartX.current = e.clientX;
        isDragging.current = false;
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

    // Prevent link clicks during drag
    function onClickCapture(e: React.MouseEvent) {
        if (isDragging.current) {
            e.preventDefault();
        }
    }

    // Fallback static banner when no banners are configured
    if (!banners || banners.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary/20 to-primary/5 p-8 md:p-12">
                <div className="relative z-10 max-w-lg">
                    <span className="mb-3 inline-block text-xs font-semibold text-primary">100% Natural</span>
                    <h1 className="mb-3 text-2xl font-extrabold leading-tight text-foreground md:text-4xl">
                        Discover <span className="text-primary">Amazing</span> Deals
                    </h1>
                    <p className="mb-6 text-sm text-muted-foreground md:text-base">
                        Shop top brands at unbeatable prices every day.
                    </p>
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

    return (
        <div
            className="group relative overflow-hidden rounded-xl select-none cursor-grab active:cursor-grabbing"
            style={{ minHeight: '220px' }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onClickCapture={onClickCapture}
        >
            {/* Slides */}
            {banners.map((b, i) => (
                <div
                    key={b.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                        i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    <img
                        src={`/${b.image_path}`}
                        alt={b.title || 'Banner'}
                        className="h-full w-full object-cover"
                        style={{ position: 'absolute', inset: 0 }}
                    />
                    {/* Content — no overlay, text-shadow keeps it readable */}
                    {(b.title || b.subtitle || b.button_text) && (
                        <div className="absolute inset-0 z-10 flex h-full flex-col justify-center px-6 py-8 md:px-12 md:py-12">
                            <div className="max-w-lg">
                                {b.title && (
                                    <h1 className="mb-2 text-2xl font-bold text-primary md:text-4xl">{b.title}</h1>
                                )}
                                {b.subtitle && (
                                    <p className="mb-5 text-sm text-primary/80 md:text-base">{b.subtitle}</p>
                                )}
                                {b.button_text && b.button_link && (
                                    <a
                                        href={b.button_link}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        {b.button_text} <ArrowRight className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Spacer to give height */}
            <div className="relative invisible" style={{ paddingBottom: '37%' }} />

            {/* Arrows — only if multiple banners */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                        aria-label="Previous banner"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                        aria-label="Next banner"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                        {banners.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-2 rounded-full transition-all ${
                                    i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                                }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function CategoryGrid() {
    const { categories } = usePage<{ categories: SharedCategory[] }>().props;

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold md:text-xl">Shop by Category</h2>
                <Link href="/products" className="text-sm font-medium text-primary hover:underline">
                    View all
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                {categories.length === 0 && (
                    <p className="col-span-full text-center text-sm text-muted-foreground py-8">No categories yet.</p>
                )}
                {categories.map((cat) => {
                    const Icon = cat.icon
                        ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[cat.icon] || Tag
                        : Tag;

                    return (
                        <Link
                            key={cat.id}
                            href={`/category/${cat.slug}`}
                            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:shadow-md"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                {cat.image_path ? (
                                    <img src={'/' + cat.image_path} alt={cat.name} className="h-full w-full object-cover rounded-xl" />
                                ) : (
                                    <Icon className="h-6 w-6" />
                                )}
                            </div>
                            <span className="text-xs font-medium sm:text-sm">{cat.name}</span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

export function FeaturedProducts() {
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

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold md:text-xl">Featured Products</h2>
                <Link href="/products" className="text-sm font-medium text-primary hover:underline">See more</Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                {featuredProducts.length === 0 && (
                    <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No products yet.</p>
                )}
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

export function MidBanner() {
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
    }

    function onTouchEnd(e: React.TouchEvent) {
        if (dragStartX.current === null) {
            return;
        }

        const diff = dragStartX.current - e.changedTouches[0].clientX;

        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                next();
            } else {
                prev();
            }
        }

        dragStartX.current = null;
    }

    function onMouseDown(e: React.MouseEvent) {
        dragStartX.current = e.clientX;
        isDragging.current = false;
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
            className="group relative overflow-hidden rounded-xl select-none cursor-grab active:cursor-grabbing"
            style={{ minHeight: '220px' }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onClickCapture={onClickCapture}
        >
            {midBanners.map((b, i) => (
                <div
                    key={b.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                        i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    <img
                        src={`/${b.image_path}`}
                        alt={b.title || 'Banner'}
                        className="h-full w-full object-cover"
                        style={{ position: 'absolute', inset: 0 }}
                    />
                    {(b.title || b.subtitle || b.button_text) && (
                        <div className="absolute inset-0 z-10 flex h-full flex-col justify-center px-6 py-8 md:px-12 md:py-12">
                            <div className="max-w-lg">
                                {b.title && (
                                    <h2 className="mb-2 text-2xl font-bold text-primary md:text-4xl">{b.title}</h2>
                                )}
                                {b.subtitle && (
                                    <p className="mb-5 text-sm text-primary/80 md:text-base">{b.subtitle}</p>
                                )}
                                {b.button_text && b.button_link && (
                                    <a
                                        href={b.button_link}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
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
                        onClick={prev}
                        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                        aria-label="Previous banner"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                        aria-label="Next banner"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                        {midBanners.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-2 rounded-full transition-all ${
                                    i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                                }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function OfferProducts() {
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
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold md:text-xl">Offer Products</h2>
                <Link href="/products" className="text-sm font-medium text-primary hover:underline">See more</Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
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

export function NewArrivalProducts() {
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
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold md:text-xl">New Arrivals</h2>
                <Link href="/products" className="text-sm font-medium text-primary hover:underline">See more</Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                {newArrivalProducts.map((product, index) => (
                          <ProductCard
                              key={product.id}
                              product={product}
                              topLeftBadge={
                                  <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">New</span>
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

export function DealsSection() {
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
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold md:text-xl">Deals of the Day</h2>
                <Link href="/products" className="text-sm font-medium text-primary hover:underline">See more</Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
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

export function TrustBadges() {
    const { trustBadges } = usePage<{ trustBadges?: { icon: string; title: string; desc: string }[] }>().props;

    const badges = trustBadges && trustBadges.length > 0 ? trustBadges : [
        { icon: 'Truck',     title: 'Free Shipping', desc: 'On orders over ৳500' },
        { icon: 'Shield',    title: 'Secure Payment', desc: '100% protected' },
        { icon: 'RotateCcw', title: 'Easy Returns',   desc: '30-day guarantee' },
    ];

    return (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {badges.map((badge, i) => {
                const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[badge.icon] || Truck;

                return (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{badge.title}</p>
                            <p className="text-xs text-muted-foreground">{badge.desc}</p>
                        </div>
                    </div>
                );
            })}
        </section>
    );
}


