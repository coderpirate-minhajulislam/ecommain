import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Minus, Plus, Phone, PlayCircle, ShoppingCart, Truck, X, Zap } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/ecommerce/product-card';
import { ReviewSubmissionForm } from '@/components/ecommerce/review-submission-form';
import { ReviewsList } from '@/components/ecommerce/reviews-list';
import { ShopLayout } from '@/components/ecommerce/shop-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { buildItem, gtmViewItem, gtmAddToCart } from '@/lib/gtm';
import { pixelViewContent, pixelAddToCart, buildContent } from '@/lib/meta-pixel';
import { tiktokViewContent, tiktokAddToCart, buildTikTokContent } from '@/lib/tiktok-pixel';
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

function getYouTubeEmbedUrl(url: string | null): string | null {
    if (!url) {
        return null;
    }

    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
}

function formatPrice(price: string | null): string {
    if (!price) {
        return '';
    }

    return `৳${parseFloat(price).toFixed(0)}`;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
}

function formatTimeRemaining(endTime: string | null): TimeRemaining {
    const defaultValue: TimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false };

    if (!endTime) {
        return defaultValue;
    }

    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, expired: false };
}

type CheckoutLabels = {
    addToCart: string;
    buyNow: string;
    freeShipping: string;
    deliveryPrefix: string;
    deliveryExtra: string;
    deliveryArea: string;
    shippingInfo: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    paymentMethod: string;
    orderSummary: string;
    placeOrder: string;
    reviewHeading?: string;
    reviewSubheading?: string;
    reviewNote?: string;
    reviewName?: string;
    reviewEmail?: string;
    reviewRating?: string;
    reviewTitle?: string;
    reviewBody?: string;
    reviewSubmit?: string;
    customerReviews?: string;
};

function isProductDetailVisit(url: string | URL): boolean {
    try {
        const pathname = new URL(typeof url === 'string' ? url : url.href, window.location.origin).pathname;

        return pathname.startsWith('/product/');
    } catch {
        return false;
    }
}


export default function ProductDetail() {
    const pageProps = usePage<{ product: Product; relatedProducts: Product[]; reviews: any[]; siteBranding?: { phone?: string; whatsapp?: string }; labels?: CheckoutLabels; viewEventId?: string; shippingReturnPolicy?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string; seoOgImage?: string }>().props;
    const product = pageProps.product;
    const relatedProducts = pageProps.relatedProducts;
    const reviews = pageProps.reviews;
    const viewEventId = pageProps.viewEventId;
    const phone    = pageProps.siteBranding?.phone?.trim();
    const whatsapp = pageProps.siteBranding?.whatsapp?.trim()?.replace(/\D/g, '');
    const labels   = pageProps.labels;
    const shippingReturnPolicy = pageProps.shippingReturnPolicy;
    const seoTitle = pageProps.seoTitle;
    const seoDescription = pageProps.seoDescription;
    const seoKeywords = pageProps.seoKeywords;
    const seoOgImage = pageProps.seoOgImage;

    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [isThumbnailOverride, setIsThumbnailOverride] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'policy' | 'reviews'>('details');
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
    const [buyNowShake, setBuyNowShake] = useState(false);
const [showFullDescription, setShowFullDescription] = useState(false);
    const imgDragStartX = useRef<number | null>(null);
    const imgIsDragging = useRef(false);
    const imgAutoSlidePaused = useRef(false);

    useEffect(() => {
        const trigger = () => {
            setBuyNowShake(true);
            setTimeout(() => setBuyNowShake(false), 400);
        };
        // First shake after 3s, then every 6s
        const initial = setTimeout(() => {
            trigger();
            const interval = setInterval(trigger, 6000);

            return () => clearInterval(interval);
        }, 3000);

        return () => clearTimeout(initial);
    }, []);

    // Only compute variants after we know product exists
    const variants = useMemo(() => product?.variants || [], [product?.variants]);
    const sizes = useMemo(() => [...new Set(variants.filter((v) => v.size).map((v) => v.size!))], [variants]);
    const colors = useMemo(() => [...new Set(variants.filter((v) => v.color).map((v) => v.color!))], [variants]);

    const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
    const activePrice = selectedVariant ? selectedVariant.price : product?.price;
    const activeOriginalPrice = selectedVariant ? selectedVariant.original_price : product?.original_price;
    const activeInStock = selectedVariant ? selectedVariant.in_stock : product?.in_stock;
    const activeStockQuantity = selectedVariant ? selectedVariant.stock_quantity : product?.stock_quantity;
    const isOutOfStock = !activeInStock || activeStockQuantity === 0;
    const productImages = product?.images?.map((img) => img.image_path) ?? [];
    const hasVariantImage = Boolean(selectedVariant?.image_path);
    const imagePaths = productImages;
    const currentGalleryImagePath = imagePaths[selectedImage] ?? null;
    const displayedImagePath = hasVariantImage && !isThumbnailOverride
        ? selectedVariant!.image_path!
        : currentGalleryImagePath ?? selectedVariant?.image_path ?? null;

    // Variant shipping: if null → inherit from product; if true → free; if false → use variant zones
    const activeFreeShipping = selectedVariant && selectedVariant.free_shipping !== null
        ? selectedVariant.free_shipping
        : (product?.free_shipping ?? false);
    const activeShippingZones = selectedVariant && selectedVariant.free_shipping === false && selectedVariant.shipping_zones?.length
        ? selectedVariant.shipping_zones
        : (product?.shipping_zones ?? []);

    function handleGalleryThumbSelect(index: number) {
        setSelectedImage(index);
        setIsThumbnailOverride(true);
        imgAutoSlidePaused.current = true;
        setTimeout(() => { imgAutoSlidePaused.current = false; }, 8000);
    }

    function imgPrev() {
        if (imagePaths.length <= 1) {
            return;
        }

        setSelectedImage((i) => (i - 1 + imagePaths.length) % imagePaths.length);
        setIsThumbnailOverride(true);
    }

    function imgNext() {
        if (imagePaths.length <= 1) {
            return;
        }

        setSelectedImage((i) => (i + 1) % imagePaths.length);
        setIsThumbnailOverride(true);
    }

    // Auto-slide every 4 seconds (pauses on interaction)
    useEffect(() => {
        if (imagePaths.length <= 1) return;
        const timer = setInterval(() => {
            if (!imgAutoSlidePaused.current && !hasVariantImage) {
                setSelectedImage((i) => (i + 1) % imagePaths.length);
                setIsThumbnailOverride(true);
            }
        }, 4000);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imagePaths.length, hasVariantImage]);

    function onImgTouchStart(e: React.TouchEvent) {
        imgDragStartX.current = e.touches[0].clientX;
        imgIsDragging.current = false;
        imgAutoSlidePaused.current = true;
    }

    function onImgTouchMove(e: React.TouchEvent) {
        if (imgDragStartX.current !== null && Math.abs(e.touches[0].clientX - imgDragStartX.current) > 8) {
            imgIsDragging.current = true;
        }
    }

    function onImgTouchEnd(e: React.TouchEvent) {
        if (imgDragStartX.current === null) return;
        const diff = imgDragStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            diff > 0 ? imgNext() : imgPrev();
        }
        imgDragStartX.current = null;
        imgIsDragging.current = false;
        setTimeout(() => { imgAutoSlidePaused.current = false; }, 8000);
    }

    function onImgMouseDown(e: React.MouseEvent) {
        if (e.button !== 0) return;
        imgDragStartX.current = e.clientX;
        imgIsDragging.current = false;
        // Capture pointer so mouse-up fires even outside the element
        (e.currentTarget as HTMLElement).setPointerCapture(e.nativeEvent.pointerId ?? 1);
        e.preventDefault();
        imgAutoSlidePaused.current = true;
    }

    function onImgMouseMove(e: React.MouseEvent) {
        if (imgDragStartX.current !== null && Math.abs(e.clientX - imgDragStartX.current) > 8) {
            imgIsDragging.current = true;
        }
    }

    function onImgMouseUp(e: React.MouseEvent) {
        if (imgDragStartX.current === null) return;
        const diff = imgDragStartX.current - e.clientX;
        if (imgIsDragging.current && Math.abs(diff) > 40) {
            diff > 0 ? imgNext() : imgPrev();
        }
        imgDragStartX.current = null;
        imgIsDragging.current = false;
        setTimeout(() => { imgAutoSlidePaused.current = false; }, 8000);
    }

    function onImgMouseLeave() {
        // No-op: pointer capture handles out-of-bounds mouse movement
    }

    function onImgClickCapture(e: React.MouseEvent) {
        if (imgIsDragging.current) {
            e.preventDefault();
        }
    }

    useEffect(() => {
        if (!product?.offer_timer) {
            return;
        }

        const interval = setInterval(() => {
            setTimeRemaining(formatTimeRemaining(product.offer_timer));
        }, 1000);

        return () => clearInterval(interval);
    }, [product?.offer_timer]);

    // GTM: view_item when product page loads
    useEffect(() => {
        if (!product) {
            return;
        }

        gtmViewItem(
            buildItem(product.id, product.name, parseFloat(product.price), 1, {
                category: product.category?.name,
                originalPrice: product.original_price ? parseFloat(product.original_price) : null,
            }),
            viewEventId || undefined,
        );
        // Meta Pixel: ViewContent (browser-side, with event ID for deduplication)
        pixelViewContent(
            [product.id],
            product.name,
            parseFloat(product.price),
            viewEventId || undefined,
        );
        // TikTok Pixel: ViewContent
        tiktokViewContent(
            [buildTikTokContent(product.id, 1, parseFloat(product.price), product.name)],
            parseFloat(product.price),
            viewEventId || undefined,
        );
        // Server-side CAPI: called from client so the request carries the fully-settled
        // _fbc cookie (after Meta Pixel SDK processes fbclid), maximising fbc coverage.
        fetch('/api/tracking/view-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                product_id: product.id,
                product_name: product.name,
                price: parseFloat(product.price),
                event_id: viewEventId || undefined,
            }),
        }).catch(() => { /* non-critical */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id]);

    useEffect(() => {
        if (!product?.images?.length) {
            setSelectedImage(0);
            setIsThumbnailOverride(false);
            return;
        }

        setIsThumbnailOverride(false);

        if (selectedVariant?.image_path) {
            const variantImageIndex = product.images.findIndex((img) => img.image_path === selectedVariant.image_path);
            setSelectedImage(variantImageIndex >= 0 ? variantImageIndex : 0);
            return;
        }

        if (selectedImage >= product.images.length) {
            setSelectedImage(0);
        }
    }, [product?.images, selectedVariantId, selectedVariant?.image_path]);

    if (!product) {
        return (
            <>
                <Head title="Product Not Found" />
                <ShopLayout>
                    <div className="py-16 text-center">
                        <p className="text-lg font-medium">Product not found</p>
                        <Button asChild className="mt-4">
                            <Link href="/products">Back to Shop</Link>
                        </Button>
                    </div>
                </ShopLayout>
            </>
        );
    }

    const discount = activeOriginalPrice
        ? Math.round(((parseFloat(activeOriginalPrice) - parseFloat(activePrice)) / parseFloat(activeOriginalPrice)) * 100)
        : 0;

    return (
        <>
            <Head title={seoTitle || product.name}>
                {seoDescription && <meta name="description" content={seoDescription} head-key="description" />}
                {seoKeywords && <meta name="keywords" content={seoKeywords} head-key="keywords" />}
                <meta property="og:title" content={seoTitle || product.name} head-key="og:title" />
                {seoDescription && <meta property="og:description" content={seoDescription} head-key="og:description" />}
                <meta property="og:type" content="product" head-key="og:type" />
                {seoOgImage && <meta property="og:image" content={seoOgImage} head-key="og:image" />}
                <meta name="twitter:card" content="summary_large_image" head-key="twitter:card" />
                <meta name="twitter:title" content={seoTitle || product.name} head-key="twitter:title" />
                {seoDescription && <meta name="twitter:description" content={seoDescription} head-key="twitter:description" />}
                {seoOgImage && <meta name="twitter:image" content={seoOgImage} head-key="twitter:image" />}
            </Head>
            <ShopLayout>
                <div className="w-full">
                {/* Breadcrumb */}
                <div className="mb-2 sm:mb-3 flex flex-wrap items-center gap-0.5 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground overflow-hidden">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-foreground">Shop</Link>
                    <span>/</span>
                    <span className="text-foreground">{product.name}</span>
                </div>

                {/* Product detail */}
                <div className="w-full grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Images - Left Column 50% */}
                    <div className="w-full">
                        <div className="lg:sticky lg:top-4">
                            {/* Desktop: side-by-side (thumbnails left, main image right) */}
                            <div className="hidden sm:flex gap-2 sm:gap-3">
                                {/* Vertical thumbnail strip on the left */}
                                {product.images && product.images.length > 1 && (
                                    <div className="flex flex-col gap-1.5 sm:gap-2">
                                        {product.images.map((img, i) => (
                                            <button
                                                key={img.id}
                                                onClick={() => handleGalleryThumbSelect(i)}
                                                className={`shrink-0 overflow-hidden rounded-md border-2 transition-all sm:h-18 sm:w-18 lg:h-20 lg:w-20 ${selectedImage === i ? 'border-primary ring-1 ring-primary/50' : 'border-muted-foreground/20 hover:border-primary/50'}`}
                                            >
                                                <img src={`/${img.image_path}`} alt="" className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {/* Large main image on the right — slider */}
                                <div
                                    className="group relative flex-1 overflow-hidden rounded-lg border border-border bg-muted/20 aspect-square select-none cursor-grab active:cursor-grabbing"
                                    onTouchStart={onImgTouchStart}
                                    onTouchMove={onImgTouchMove}
                                    onTouchEnd={onImgTouchEnd}
                                    onMouseDown={onImgMouseDown}
                                    onMouseMove={onImgMouseMove}
                                    onMouseUp={onImgMouseUp}
                                    onMouseLeave={onImgMouseLeave}
                                    onClickCapture={onImgClickCapture}
                                    style={{ touchAction: 'pan-y' }}
                                >
                                    {imagePaths.length === 0 && (
                                        <span className="flex h-full w-full items-center justify-center text-8xl">📦</span>
                                    )}
                                    {displayedImagePath && (
                                        <img
                                            key={displayedImagePath}
                                            src={`/${displayedImagePath}`}
                                            alt={product.name}
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    )}
                                    {product.youtube_video && (
                                        <button
                                            onClick={() => setVideoOpen(true)}
                                            className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-white transition-colors hover:bg-black/90"
                                        >
                                            <PlayCircle className="h-5 w-5 text-red-500" />
                                            <span className="text-xs font-medium">Watch Video</span>
                                        </button>
                                    )}
                                    {imagePaths.length > 1 && (
                                        <>
                                            <button
                                                onClick={imgPrev}
                                                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                                                aria-label="Previous image"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={imgNext}
                                                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                                                aria-label="Next image"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            {/* Mobile: main image top, thumbnails bottom */}
                            <div className="flex flex-col gap-2 sm:hidden">
                                <div
                                    className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/20 aspect-square select-none cursor-grab active:cursor-grabbing"
                                    onTouchStart={onImgTouchStart}
                                    onTouchMove={onImgTouchMove}
                                    onTouchEnd={onImgTouchEnd}
                                    onMouseDown={onImgMouseDown}
                                    onMouseMove={onImgMouseMove}
                                    onMouseUp={onImgMouseUp}
                                    onMouseLeave={onImgMouseLeave}
                                    onClickCapture={onImgClickCapture}
                                    style={{ touchAction: 'pan-y' }}
                                >
                                    {imagePaths.length === 0 && (
                                        <span className="flex h-full w-full items-center justify-center text-8xl">📦</span>
                                    )}
                                    {displayedImagePath && (
                                        <img
                                            key={displayedImagePath}
                                            src={`/${displayedImagePath}`}
                                            alt={product.name}
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    )}
                                    {product.youtube_video && (
                                        <button
                                            onClick={() => setVideoOpen(true)}
                                            className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-white transition-colors hover:bg-black/90"
                                        >
                                            <PlayCircle className="h-5 w-5 text-red-500" />
                                            <span className="text-xs font-medium">Watch Video</span>
                                        </button>
                                    )}
                                    {imagePaths.length > 1 && (
                                        <>
                                            <button
                                                onClick={imgPrev}
                                                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                                                aria-label="Previous image"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={imgNext}
                                                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                                                aria-label="Next image"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                            <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5">
                                                {imagePaths.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleGalleryThumbSelect(i)}
                                                        className={`h-1.5 rounded-full transition-all ${i === selectedImage ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                                                        aria-label={`Go to image ${i + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {product.images && product.images.length > 1 && (
                                    <div className="flex flex-row gap-1.5 flex-wrap">
                                        {product.images.map((img, i) => (
                                            <button
                                                key={img.id}
                                                onClick={() => handleGalleryThumbSelect(i)}
                                                className={`shrink-0 overflow-hidden rounded-md border-2 transition-all h-14 w-14 ${selectedImage === i ? 'border-primary ring-1 ring-primary/50' : 'border-muted-foreground/20 hover:border-primary/50'}`}
                                            >
                                                <img src={`/${img.image_path}`} alt="" className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info - Right Columns 50% */}
                    <div className="w-full space-y-3 sm:space-y-4 lg:space-y-5">
                        <div className="w-full">
                            <div className="mb-1.5 sm:mb-2 flex flex-wrap items-center gap-1 sm:gap-1.5">
                                <Badge variant="secondary" className="font-medium text-[11px] sm:text-xs py-0.5 px-1.5">{product.category?.name}</Badge>
                                {product.is_featured && <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] sm:text-xs py-0.5 px-1.5">⭐ Featured</Badge>}
                                {product.is_new_arrival && <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 text-[11px] sm:text-xs py-0.5 px-1.5">🆕 New</Badge>}
                            </div>
                            <h1 className="mb-2 sm:mb-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight wrap-break-word">{product.name}</h1>

                            {/* Price Section */}
                            <div className="mb-2 sm:mb-3 flex flex-wrap items-center gap-1 sm:gap-2 w-full">
                                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary wrap-break-word">{formatPrice(activePrice)}</span>
                                {activeOriginalPrice && (
                                    <span className="text-xs sm:text-sm md:text-base text-muted-foreground line-through">{formatPrice(activeOriginalPrice)}</span>
                                )}
                                {discount > 0 && (
                                    <Badge className="bg-red-500 text-white hover:bg-red-500 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">{-discount}%</Badge>
                                )}
                            </div>

                            {/* Countdown Timer */}
                            {product.offer_timer && new Date(product.offer_timer) > new Date() && !timeRemaining.expired && (
                                <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
                                    <p className="text-xs sm:text-sm font-semibold text-orange-600 uppercase tracking-wider">Limited Time Offer</p>
                                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                        <div className="rounded-md bg-primary px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                                            <div className="text-lg sm:text-2xl font-bold text-primary-foreground">{String(timeRemaining.days).padStart(2, '0')}</div>
                                            <div className="text-xs font-semibold text-primary-foreground/70">D</div>
                                        </div>
                                        <div className="rounded-md bg-primary px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                                            <div className="text-lg sm:text-2xl font-bold text-primary-foreground">{String(timeRemaining.hours).padStart(2, '0')}</div>
                                            <div className="text-xs font-semibold text-primary-foreground/70">H</div>
                                        </div>
                                        <div className="rounded-md bg-primary px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                                            <div className="text-lg sm:text-2xl font-bold text-primary-foreground">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                                            <div className="text-xs font-semibold text-primary-foreground/70">M</div>
                                        </div>
                                        <div className="rounded-md bg-primary px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                                            <div className="text-lg sm:text-2xl font-bold text-primary-foreground">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                                            <div className="text-xs font-semibold text-primary-foreground/70">S</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {product.short_description && (
                                <p className="whitespace-pre-wrap text-sm sm:text-base md:text-lg leading-relaxed text-muted-foreground w-full">{product.short_description}</p>
                            )}

                            {/* Stock Status Badge */}
                            <div className="mt-3 sm:mt-4 flex items-center gap-2">
                                {isOutOfStock ? (
                                    <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                                ) : activeStockQuantity ? (
                                    <span className="text-green-600 text-sm font-medium">In Stock ({activeStockQuantity} Available)</span>
                                ) : (
                                    <span className="text-blue-600 text-sm font-medium">In Stock (Available)</span>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <Separator className="my-2 sm:my-3" />

                        {/* Variants & Options */}
                        {variants.length > 0 && (
                            <div className="space-y-2 sm:space-y-3">
                                {sizes.length > 0 && (
                                    <div className="w-full">
                                        <label className="mb-2 block text-xs sm:text-sm font-semibold">{product.size_label || 'Size'}</label>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {sizes.map((size) => {
                                                const matchingVariants = variants.filter((v) => v.size === size);
                                                const isSelected = selectedVariant?.size === size;

                                                return (
                                                    <button
                                                        key={size}
                                                        type="button"
                                                        onClick={() => {
                                                            const match = matchingVariants.find(
                                                                (v) => !selectedVariant?.color || v.color === selectedVariant.color,
                                                            ) || matchingVariants[0];
                                                            setSelectedVariantId(match.id);
                                                        }}
                                                        className={`rounded-md border-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                                                            isSelected
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-input hover:border-primary/70 hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        {size}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {colors.length > 0 && (
                                    <div className="w-full">
                                        <label className="mb-2 block text-xs sm:text-sm font-semibold">{product.color_label || 'Color'}</label>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {colors.map((color) => {
                                                const matchingVariants = variants.filter((v) => v.color === color);
                                                const isSelected = selectedVariant?.color === color;

                                                return (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => {
                                                            const match = matchingVariants.find(
                                                                (v) => !selectedVariant?.size || v.size === selectedVariant.size,
                                                            ) || matchingVariants[0];
                                                            setSelectedVariantId(match.id);
                                                        }}
                                                        className={`rounded-md border-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                                                            isSelected
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-input hover:border-primary/70 hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        {color}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Divider */}
                        <Separator />

                        {/* Quantity & Actions */}
                        <div className="space-y-2 sm:space-y-3 w-full">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full">
                                <label className="text-[11px] sm:text-xs font-semibold whitespace-nowrap">Qty:</label>
                                <div className="flex items-center gap-0.5 rounded-lg border border-primary">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 sm:h-9 sm:w-9 text-primary hover:bg-primary/10 hover:text-primary"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={isOutOfStock}
                                    >
                                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <span className="w-8 text-center text-xs sm:text-sm font-semibold text-primary">{quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 sm:h-9 sm:w-9 text-primary hover:bg-primary/10 hover:text-primary"
                                        onClick={() => {
                                            const maxQty = activeStockQuantity || 999;
                                            setQuantity(Math.min(quantity + 1, maxQty));
                                        }}
                                        disabled={isOutOfStock || (activeStockQuantity !== null && quantity >= activeStockQuantity)}
                                    >
                                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                </div>
                                {!isOutOfStock && activeStockQuantity && quantity > activeStockQuantity && (
                                    <p className="text-xs text-destructive">Max {activeStockQuantity} Available</p>
                                )}
                            </div>

                            {/* Action Buttons — row 1: cart icon + buy now */}
                            <div className="flex items-center gap-2 w-full">
                                {/* Add to Cart — icon + text */}
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-12 flex-1 gap-2 px-6 text-base font-semibold border-primary text-primary hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer"
                                    disabled={isOutOfStock}
                                    title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                    onClick={() => {
                                        if (variants.length > 0 && !selectedVariantId) {
                                            toast.error('Please select a variation first');

                                            return;
                                        }

                                        const variantLabel = selectedVariant
                                            ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ')
                                            : null;
                                        addToCart(
                                            {
                                                productId: product.id,
                                                variantId: selectedVariant?.id ?? null,
                                                slug: product.slug,
                                                name: product.name,
                                                price: parseFloat(activePrice),
                                                image: product.images?.[0]?.image_path ?? null,
                                                variantLabel,
                                                freeShipping: activeFreeShipping,
                                                shippingZones: activeShippingZones.map((z) => ({ zone: z.zone, charge: Number(z.charge) })),
                                                allowedPaymentMethods: product.allowed_payment_methods ?? [],
                                            },
                                            quantity,
                                        );
                                        const price = parseFloat(activePrice);
                                        trackAddToCartServer(product.id, product.name, price, quantity).then((eventId) => {
                                            gtmAddToCart(
                                                buildItem(product.id, product.name, price, quantity, {
                                                    category: product.category?.name,
                                                    variant: variantLabel,
                                                    originalPrice: activeOriginalPrice ? parseFloat(activeOriginalPrice) : null,
                                                }),
                                                eventId,
                                            );
                                            pixelAddToCart(
                                                [product.id],
                                                product.name,
                                                price * quantity,
                                                [buildContent(product.id, quantity, price)],
                                                eventId,
                                            );
                                            tiktokAddToCart(
                                                [buildTikTokContent(product.id, quantity, price, product.name)],
                                                price * quantity,
                                                eventId,
                                            );
                                        });
                                        toast.success(`${product.name} added to cart`);
                                    }}
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    {labels?.addToCart ?? 'Add to Cart'}
                                </Button>

                                {/* Buy Now — fixed width */}
                                <Button
                                    size="lg"
                                    variant="default"
                                    className={`h-12 flex-1 px-6 font-semibold text-base active:scale-[0.98] transition-all cursor-pointer${buyNowShake ? ' animate-btn-shake' : ''}`}
                                    disabled={isOutOfStock}
                                    onClick={() => {
                                        if (variants.length > 0 && !selectedVariantId) {
                                            toast.error('Please select a variation first');

                                            return;
                                        }

                                        const variantLabel = selectedVariant
                                            ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ')
                                            : null;
                                        addToCart(
                                            {
                                                productId: product.id,
                                                variantId: selectedVariant?.id ?? null,
                                                slug: product.slug,
                                                name: product.name,
                                                price: parseFloat(activePrice),
                                                image: product.images?.[0]?.image_path ?? null,
                                                variantLabel,
                                                freeShipping: activeFreeShipping,
                                                shippingZones: activeShippingZones.map((z) => ({ zone: z.zone, charge: Number(z.charge) })),
                                                allowedPaymentMethods: product.allowed_payment_methods ?? [],
                                            },
                                            quantity,
                                        );
                                        const price = parseFloat(activePrice);
                                        trackAddToCartServer(product.id, product.name, price, quantity).then((eventId) => {
                                            gtmAddToCart(
                                                buildItem(product.id, product.name, price, quantity, {
                                                    category: product.category?.name,
                                                    variant: variantLabel,
                                                    originalPrice: activeOriginalPrice ? parseFloat(activeOriginalPrice) : null,
                                                }),
                                                eventId,
                                            );
                                            pixelAddToCart(
                                                [product.id],
                                                product.name,
                                                price * quantity,
                                                [buildContent(product.id, quantity, price)],
                                                eventId,
                                            );
                                            tiktokAddToCart(
                                                [buildTikTokContent(product.id, quantity, price, product.name)],
                                                price * quantity,
                                                eventId,
                                            );
                                        });
                                        router.visit('/checkout');
                                    }}
                                >
                                    <Zap className="mr-1.5 h-4 w-4" />
                                    {activeInStock ? (labels?.buyNow ?? 'Buy Now') : 'Out of Stock'}
                                </Button>
                            </div>
                        </div>

                        {/* Info badges */}
                        <div className="space-y-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 p-2 sm:p-3">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-medium text-green-600 dark:text-green-400 w-full">
                                <Truck className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                {activeFreeShipping ? (
                                    <span>✓ {labels?.freeShipping ?? 'Free Shipping'}</span>
                                ) : activeShippingZones && activeShippingZones.length > 0 ? (
                                    <span>
                                        {labels?.deliveryPrefix ?? 'Delivery: '}{activeShippingZones.map((z, i) => (
                                            <span key={z.zone}>{i > 0 ? ' / ' : ''}৳{Number(z.charge).toFixed(0)} ({z.zone})</span>
                                        ))}{labels?.deliveryExtra ? <span> {labels.deliveryExtra}</span> : null}
                                    </span>
                                ) : (
                                    <span>Delivery charges apply</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium">
                                {activeInStock ? (
                                    <span className="text-green-600 dark:text-green-400">● In Stock</span>
                                ) : (
                                    <span className="text-red-500">● Out of Stock</span>
                                )}
                            </div>
                        </div>

                        {/* WhatsApp + Call */}
                        <div className="flex gap-2">
                            {whatsapp && (
                                <a
                                    href={`https://wa.me/${whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-95"
                                >
                                    <MessageCircle className="h-4 w-4 shrink-0" />
                                    WhatsApp
                                </a>
                            )}
                            {phone && (
                                <a
                                    href={`tel:${phone}`}
                                    className="flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-95"
                                >
                                    <Phone className="h-4 w-4 shrink-0" />
                                    Call Us
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                </div>

                {/* Tabs: Product Details | Shipping & Return Policy | Reviews */}
                <div className="mt-6 sm:mt-8 lg:mt-12">
                    <div className="flex border-b border-border">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors relative ${activeTab === 'details' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Product Details
                            {activeTab === 'details' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                        {shippingReturnPolicy && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('policy')}
                                className={`px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors relative ${activeTab === 'policy' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Shipping & Return Policy
                                {activeTab === 'policy' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setActiveTab('reviews')}
                            className={`px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors relative ${activeTab === 'reviews' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
                            {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="pt-4 sm:pt-6">
                        {activeTab === 'details' && product.long_description && (
                            <div className="rounded-lg bg-muted/30 p-3 sm:p-4 lg:p-6">
                                <div className={`relative ${!showFullDescription ? 'max-h-[200px] sm:max-h-[280px] lg:max-h-[340px] overflow-hidden' : ''}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base md:text-lg text-muted-foreground">
                                        {product.long_description}
                                    </p>
                                    {!showFullDescription && product.long_description.length > 300 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
                                    )}
                                </div>
                                {product.long_description.length > 300 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowFullDescription(!showFullDescription)}
                                        className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                    >
                                        {showFullDescription ? (
                                            <>
                                                See Less <ChevronUp className="h-4 w-4" />
                                            </>
                                        ) : (
                                            <>
                                                See More <ChevronDown className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                        {activeTab === 'details' && !product.long_description && (
                            <p className="text-sm text-muted-foreground">No product details available.</p>
                        )}

                        {activeTab === 'policy' && shippingReturnPolicy && (
                            <div className="rounded-lg bg-muted/30 p-3 sm:p-4 lg:p-6">
                                <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base md:text-lg text-muted-foreground">{shippingReturnPolicy}</p>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                <div className="w-full">
                                    <ReviewsList reviews={reviews || []} customerReviewsLabel={labels?.customerReviews} />
                                </div>
                                <div className="w-full">
                                    <ReviewSubmissionForm productId={product.id} labels={labels} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-6 sm:mt-8 lg:mt-12 w-full">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                            <h2 className="text-base sm:text-lg lg:text-xl font-semibold">Related Products</h2>
                            {product.category?.slug && (
                                <Link href={`/category/${product.category.slug}`} className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline">
                                    See All &rarr;
                                </Link>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                            {relatedProducts.map((p) => (
                                      <ProductCard key={p.id} product={p} />
                                  ))}
                        </div>
                    </div>
                )}

            </ShopLayout>

            {/* YouTube Video Modal */}
            {videoOpen && product.youtube_video && (() => {
                const embedUrl = getYouTubeEmbedUrl(product.youtube_video);

                if (!embedUrl) {
                    return null;
                }

                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setVideoOpen(false)}
                    >
                        <div
                            className="relative w-full max-w-3xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setVideoOpen(false)}
                                className="absolute -top-10 right-0 flex items-center gap-1 text-white/80 hover:text-white"
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <div className="aspect-video w-full overflow-hidden rounded-lg">
                                <iframe
                                    src={embedUrl}
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={product.name}
                                />
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}

