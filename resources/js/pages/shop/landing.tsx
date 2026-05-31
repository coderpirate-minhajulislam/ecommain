import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    Battery,
    Bluetooth,
    Box,
    CheckCircle,
    ChevronRight,
    Cpu,
    Headphones,
    ListChecks,
    Lock,
    MapPin,
    MessageCircle,
    Minus,
    Phone,
    PlayCircle,
    Plus,
    RefreshCcw,
    Shield,
    ShieldCheck,
    Signal,
    Tag,
    ThumbsUp,
    Truck,
    Upload,
    Volume2,
    Wallet,
    Wifi,
    X,
    Zap,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { GtmScript } from '@/components/ecommerce/gtm-script';
import { GtmSsScript } from '@/components/ecommerce/gtm-ss-script';
import { MetaPixelScript } from '@/components/ecommerce/meta-pixel-script';
import { TikTokPixelScript } from '@/components/ecommerce/tiktok-pixel-script';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { buildItem, gtmViewItem, gtmAddToCart, gtmBeginCheckout, gtmAddShippingInfo, gtmAddPaymentInfo } from '@/lib/gtm';
import { pixelViewContent, pixelAddToCart, pixelInitiateCheckout, pixelAddPaymentInfo, buildContent } from '@/lib/meta-pixel';
import { tiktokViewContent, tiktokAddToCart, tiktokInitiateCheckout, tiktokAddPaymentInfo, tiktokPlaceAnOrder, tiktokCompletePayment, buildTikTokContent } from '@/lib/tiktok-pixel';
import { buildDistrictOptions, filterShippingZoneNamesForDistrict } from '@/lib/shipping-zone-class';
import type { Product } from '@/types/global';
import { bangladeshDistricts } from '@/data/bangladesh-districts';

type PaymentMethodOption = {
    name: string;
    slug: string;
    description: string | null;
    account_number: string | null;
    logo: string | null;
    icon: string | null;
    account_label: string | null;
    instructions_text: string | null;
    payment_number_label: string | null;
    payment_amount_label: string | null;
    requires_payment_details: boolean;
};

type LandingPageData = {
    id: number;
    product_id: number;
    title: string;
    slug: string;
    subtitle: string | null;
    hero_text: string | null;
    hero_images: string[] | null;
    badge_text: string | null;
    icon_name: string | null;
    phone: string | null;
    use_cases: { label: string; icon_name?: string }[] | null;
    use_cases_title: string | null;
    use_cases_subtitle: string | null;
    features: { title: string; desc: string; icon_name?: string }[] | null;
    features_title: string | null;
    features_subtitle: string | null;
    specifications: { title: string; specs: string[]; icon_name?: string }[] | null;
    specifications_title: string | null;
    specifications_subtitle: string | null;
    authentic_badge_text: string | null;
    authentic_badge_icon: string | null;
    delivery_badge_text: string | null;
    delivery_badge_icon: string | null;
    why_buy: { title: string; desc: string; icon_name?: string }[] | null;
    why_buy_title: string | null;
    why_buy_super_text: string | null;
    why_buy_subtitle: string | null;
    checkout_banner_text: string | null;
    checkout_title: string | null;
    review_images_title: string | null;
    order_now_text: string | null;
    footer_text: string | null;
    is_active: boolean;
    countdown_enabled: boolean;
    countdown_end_time: string | null;
    hero_video: string | null;
    review_images: string[] | null;
};

type ExtraProductVariant = {
    id: number;
    size: string | null;
    color: string | null;
    price: string;
    original_price: string | null;
    in_stock: boolean;
    stock_quantity: number | null;
};

type ExtraProduct = {
    id: number;
    name: string;
    price: string;
    original_price: string | null;
    in_stock: boolean;
    stock_quantity: number | null;
    free_shipping: boolean;
    shipping_zones: { zone: string; charge: number }[];
    allowed_payment_methods: string[];
    size_label: string | null;
    color_label: string | null;
    image: string | null;
    variants: ExtraProductVariant[];
};

function formatPrice(price: string | number | null | undefined): string {
    if (price === null || price === undefined) {
        return '';
    }

    const num = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(num)) return '';

    return `৳${num.toFixed(0)}`;
}

function getIconComponent(iconName: string | null, className: string = 'h-5 w-5') {
    if (!iconName) {
        return null;
    }

    // Convert kebab-case to PascalCase (e.g., "check-circle" -> "CheckCircle", "package" -> "Package")
    const pascalCaseName = iconName
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    const IconComponent = (Icons as Record<string, any>)[pascalCaseName];

    if (IconComponent) {
        return <IconComponent className={className} />;
    }

    return null;
}

function getYouTubeEmbedUrl(url: string | null): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
}

export default function LandingPage() {
    const { product, landingPage, paymentMethods: serverMethods, extraProducts = [], gtmId, gtmSsUrl, metaPixelId, pixelExternalId, tiktokPixelId, freeShippingAmount = 0, freeShippingEnabled = true, siteBranding, labels, hasGlobalCoupons, couponProductIds, isBlocked, shippingZones: serverZones = [], shippingZoneClasses = [], viewEventId } = usePage<{ product: Product; landingPage: LandingPageData; paymentMethods: PaymentMethodOption[]; extraProducts: ExtraProduct[]; gtmId?: string; gtmSsUrl?: string; metaPixelId?: string; pixelExternalId?: string; tiktokPixelId?: string; freeShippingAmount: number; freeShippingEnabled: boolean; siteBranding?: { title?: string; phone?: string; whatsapp?: string }; labels?: Record<string, string>; hasGlobalCoupons?: boolean; couponProductIds?: number[]; isBlocked?: boolean; shippingZones?: string[]; shippingZoneClasses?: { name: string; districts?: string[] | null }[]; viewEventId?: string }>().props;

    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [extraVariants, setExtraVariants] = useState<Record<number, number | null>>({});
    const [quantity, setQuantity] = useState(1);
    const [selectedItems, setSelectedItems] = useState<{ product_id: number; quantity: number; selected: boolean }[]>(() => [
        { product_id: product.id, quantity: 1, selected: true },
        ...extraProducts.map((p) => ({ product_id: p.id, quantity: 1, selected: false })),
    ]);
    const [deliveryZone, setDeliveryZone] = useState('');
    const [countdownRemaining, setCountdownRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedReviewIndex, setSelectedReviewIndex] = useState(0);
    const [videoOpen, setVideoOpen] = useState(false);
    const checkoutRef = useRef<HTMLDivElement>(null);

    const variants = useMemo(() => product.variants || [], [product.variants]);
    const sizes = useMemo(() => [...new Set(variants.filter((v) => v.size).map((v) => v.size!))], [variants]);
    const colors = useMemo(() => [...new Set(variants.filter((v) => v.color).map((v) => v.color!))], [variants]);

    const shippingZones = useMemo(() => product.shipping_zones || [], [product.shipping_zones]);

    const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
    const activePrice = selectedVariant ? selectedVariant.price : product.price;
    const activeOriginalPrice = selectedVariant ? selectedVariant.original_price : product.original_price;
    const activeInStock = selectedVariant ? selectedVariant.in_stock : product.in_stock;
    const activeStockQuantity = selectedVariant ? selectedVariant.stock_quantity : product?.stock_quantity;
    const isOutOfStock = !activeInStock || activeStockQuantity === 0;

    // Union of zones from all currently selected items (excluding free-shipping ones)
    const allSelectedZones = useMemo(() => {
        const zoneSet = new Set<string>();
        let hasNonFreeShippingItems = false;
        selectedItems.filter((i) => i.selected).forEach((i) => {
            if (i.product_id === product.id) {
                // Resolve variant-level shipping for the main product
                const effectiveFree = (selectedVariant && selectedVariant.free_shipping !== null)
                    ? selectedVariant.free_shipping
                    : product.free_shipping;
                const effectiveZones = (selectedVariant && selectedVariant.free_shipping === false)
                    ? (selectedVariant.shipping_zones || [])
                    : (selectedVariant && selectedVariant.free_shipping === true ? [] : (product.shipping_zones || []));
                if (!effectiveFree) {
                    hasNonFreeShippingItems = true;
                    effectiveZones.forEach((z) => zoneSet.add(z.zone));
                }
            } else {
                const ep = extraProducts.find((p) => p.id === i.product_id);

                if (ep && !ep.free_shipping) {
                    hasNonFreeShippingItems = true;
                    ep.shipping_zones.forEach((z) => zoneSet.add(z.zone));
                }
            }
        });

        if (!hasNonFreeShippingItems) return [];

        if (serverZones.length > 0) {
            const intersection = serverZones.filter((z) => zoneSet.has(z));
            return intersection.length > 0 ? intersection : serverZones;
        }

        return [...zoneSet];
    }, [selectedItems, product.id, product.free_shipping, product.shipping_zones, extraProducts, serverZones, selectedVariant]);

    // Countdown timer
    useEffect(() => {
        if (!landingPage.countdown_enabled || !landingPage.countdown_end_time) {
            return;
        }

        const calculateCountdown = () => {
            const endTime = new Date(landingPage.countdown_end_time as string).getTime();
            const now = new Date().getTime();
            const diff = endTime - now;

            if (diff <= 0) {
                setCountdownRemaining(null);

                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdownRemaining({ days, hours, minutes, seconds });
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000);

        return () => clearInterval(interval);
    }, [landingPage.countdown_enabled, landingPage.countdown_end_time]);

    // Calculate total across all selected items
    function getItemPrice(productId: number): number {
        if (productId === product.id) {
            return parseFloat(activePrice);
        }

        const extra = extraProducts.find((p) => p.id === productId);

        if (!extra) {
            return 0;
        }

        const variantId = extraVariants[productId] ?? null;

        if (variantId) {
            const v = extra.variants.find((v) => v.id === variantId);

            if (v) {
                return parseFloat(v.price);
            }
        }

        return parseFloat(extra.price);
    }

    const hasMultipleProducts = extraProducts.length > 0;
    const primaryItem = selectedItems.find((i) => i.product_id === product.id);

    // Primary product quantity (synced with selectedItems)
    const primaryQty = primaryItem?.quantity ?? quantity;

    // True if any selected product has variants but none selected
    const missingVariant = selectedItems.filter((i) => i.selected).some((i) => {
        if (i.product_id === product.id) {
            return variants.length > 0 && selectedVariantId === null;
        }

        const ep = extraProducts.find((p) => p.id === i.product_id);

        return ep && ep.variants.length > 0 && (extraVariants[i.product_id] ?? null) === null;
    });

    const subtotal = selectedItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + getItemPrice(i.product_id) * i.quantity, 0);
    // Max shipping charge across all selected items for the chosen zone
    const shipping = (() => {
        // Free shipping threshold met
        if (freeShippingEnabled && freeShippingAmount > 0 && subtotal >= freeShippingAmount) return 0;
        if (!deliveryZone) {
            return 0;
        }

        let maxCharge = 0;

        selectedItems.filter((i) => i.selected).forEach((i) => {
            let zones: { zone: string; charge: number | string }[] = [];

            if (i.product_id === product.id) {
                // Resolve variant-level shipping for the main product
                const effectiveFree = (selectedVariant && selectedVariant.free_shipping !== null)
                    ? selectedVariant.free_shipping
                    : product.free_shipping;
                if (!effectiveFree) {
                    zones = (selectedVariant && selectedVariant.free_shipping === false)
                        ? (selectedVariant.shipping_zones || [])
                        : (product.shipping_zones || []);
                }
            } else {
                const ep = extraProducts.find((p) => p.id === i.product_id);

                if (ep && !ep.free_shipping) {
                    zones = ep.shipping_zones;
                }
            }

            const matched = zones.find((z) => z.zone === deliveryZone);

            if (matched && Number(matched.charge) > maxCharge) {
                maxCharge = Number(matched.charge);
            }
        });

        return maxCharge;
    })();

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    const total = subtotal + shipping - couponDiscount;

    // Helper to update a selected item
    function updateSelectedItem(productId: number, changes: Partial<{ quantity: number; selected: boolean }>) {
        setSelectedItems((prev) => prev.map((i) => i.product_id === productId ? { ...i, ...changes } : i));

        if (productId === product.id && changes.quantity !== undefined) {
            setQuantity(changes.quantity);
        }
    }

    // ── GTM helpers ──────────────────────────────────────────────────────────

    const gtmItem = useMemo(() => {
        const variantLabel = selectedVariant
            ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ')
            : null;

        return buildItem(product.id, product.name, parseFloat(activePrice), primaryQty, {
            category: product.category?.name,
            variant: variantLabel,
            originalPrice: activeOriginalPrice ? parseFloat(activeOriginalPrice) : null,
        });
    }, [product.id, product.name, activePrice, primaryQty, selectedVariant, activeOriginalPrice, product.category?.name]);

    // view_item — fires once on page load
    const viewItemFiredRef = useRef(false);
    useEffect(() => {
        if (viewItemFiredRef.current) {
            return;
        }

        viewItemFiredRef.current = true;
        gtmViewItem(gtmItem, viewEventId || undefined);
        // Meta Pixel: ViewContent (browser-side)
        pixelViewContent([product.id], product.name, parseFloat(String(activePrice)), viewEventId || undefined);
        // TikTok Pixel: ViewContent
        tiktokViewContent(
            [buildTikTokContent(product.id, 1, parseFloat(String(activePrice)), product.name)],
            parseFloat(String(activePrice)),
            viewEventId || undefined,
        );
        // Server-side CAPI: called from client so the request carries the settled _fbc cookie.
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
                price: parseFloat(String(activePrice)),
                event_id: viewEventId || undefined,
            }),
        }).catch(() => { /* non-critical */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep a ref with the latest gtmItem + total so the IntersectionObserver
    // callback always reads the current values instead of a stale closure.
    const gtmCheckoutDataRef = useRef({ gtmItem, total });
    useEffect(() => {
        gtmCheckoutDataRef.current = { gtmItem, total };
    }, [gtmItem, total]);

    // begin_checkout — fires once when checkout section scrolls into view
    const beginFiredRef = useRef(false);
    useEffect(() => {
        const el = checkoutRef.current;

        if (!el) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !beginFiredRef.current) {
                    beginFiredRef.current = true;
                    const { gtmItem: item, total: t } = gtmCheckoutDataRef.current;
                    // Server-side CAPI first, then fire browser pixels with event_id for deduplication
                    fetch('/api/tracking/begin-checkout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            items: [{ product_id: product.id, product_name: product.name, price: item.price, quantity: item.quantity }],
                            value: t,
                        }),
                    })
                        .then((r) => r.json())
                        .then((d: { event_id?: string }) => {
                            const eventId = d.event_id;
                            gtmBeginCheckout([item], t, eventId);
                            pixelInitiateCheckout(
                                [product.id],
                                item.quantity,
                                t,
                                [buildContent(product.id, item.quantity, item.price)],
                                eventId,
                            );
                            tiktokInitiateCheckout(
                                [buildTikTokContent(product.id, item.quantity, item.price, product.name)],
                                t,
                                eventId,
                            );
                        })
                        .catch(() => {
                            gtmBeginCheckout([item], t);
                            pixelInitiateCheckout(
                                [product.id],
                                item.quantity,
                                t,
                                [buildContent(product.id, item.quantity, item.price)],
                            );
                            tiktokInitiateCheckout(
                                [buildTikTokContent(product.id, item.quantity, item.price, product.name)],
                                t,
                            );
                        });
                }
            },
            { threshold: 0.2 },
        );

        observer.observe(el);

        return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Capture UTM params from the landing URL into sessionStorage on first load.
    // Runs once — only writes when the param is present, preserving the original
    // landing-page UTMs for the whole session.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
        keys.forEach((key) => {
            const val = params.get(key);
            if (val) sessionStorage.setItem(key, val);
        });
    }, []);

    const { data, setData, post, processing, errors, transform } = useForm({
        first_name: '',
        phone: '',
        email: '',
        district: '',
        address: '',
        payment_method: serverMethods.length > 0 ? serverMethods[0].slug : '',
        payment_phone: '',
        payment_amount: '',
        payment_screenshot: null as File | null,
        note: '',
        // Read UTMs from current URL first (synchronous), fallback to sessionStorage.
        // sessionStorage may not yet be populated when this form initialises because
        // the capture useEffect runs after the first render.
        utm_source:   (() => { const p = new URLSearchParams(window.location.search); return p.get('utm_source')   || sessionStorage.getItem('utm_source')   || ''; })(),
        utm_medium:   (() => { const p = new URLSearchParams(window.location.search); return p.get('utm_medium')   || sessionStorage.getItem('utm_medium')   || ''; })(),
        utm_campaign: (() => { const p = new URLSearchParams(window.location.search); return p.get('utm_campaign') || sessionStorage.getItem('utm_campaign') || ''; })(),
        utm_content:  (() => { const p = new URLSearchParams(window.location.search); return p.get('utm_content')  || sessionStorage.getItem('utm_content')  || ''; })(),
        utm_term:     (() => { const p = new URLSearchParams(window.location.search); return p.get('utm_term')     || sessionStorage.getItem('utm_term')     || ''; })(),
    });

    // Update form data with sessionStorage values after they're populated (handles mobile device delays)
    useEffect(() => {
        const timer = setTimeout(() => {
            const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
            keys.forEach((key) => {
                const value = sessionStorage.getItem(key) || '';
                if (value || data[key] === '') {
                    setData(key, value);
                }
            });
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Calculate paid amount and due based on payment method
    const selectedPaymentMethod = serverMethods.find((m) => m.slug === data.payment_method);
    const paidAmount = selectedPaymentMethod?.requires_payment_details && data.payment_amount
        ? Math.min(parseFloat(data.payment_amount) || 0, total)
        : 0;
    const dueAmount = Math.max(0, total - paidAmount);

    const filteredZones = useMemo(() => {
        return filterShippingZoneNamesForDistrict(data.district, allSelectedZones, shippingZoneClasses);
    }, [allSelectedZones, data.district, shippingZoneClasses]);

    const districtOptions = useMemo(() => {
        return buildDistrictOptions(bangladeshDistricts, shippingZoneClasses);
    }, [shippingZoneClasses]);

    useEffect(() => {
        if (filteredZones.length > 0) {
            if (!filteredZones.includes(deliveryZone)) {
                setDeliveryZone(filteredZones[0]);
            }
            return;
        }

        setDeliveryZone('Default');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredZones, deliveryZone]);

    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [districtSearch, setDistrictSearch] = useState('');
    const [districtOpen, setDistrictOpen] = useState(false);
    const districtRef = useRef<HTMLDivElement>(null);
    const [phoneRestricted, setPhoneRestricted] = useState(false);
    const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);
    const [checkedPhone, setCheckedPhone] = useState('');
    const phoneCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track phone input separately for reliable effect triggering
    function handlePhoneChange(value: string) {
        const cleaned = value.replace(/\D/g, '').slice(0, 11);
        setData('phone', cleaned);
        setCheckedPhone(cleaned);
    }

    // Close district dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (districtRef.current && !districtRef.current.contains(e.target as Node)) {
                setDistrictOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Auto-check phone cancel/return ratio when 11 digits entered
    useEffect(() => {
        if (phoneCheckRef.current) clearTimeout(phoneCheckRef.current);
        if (checkedPhone.length !== 11) {
            setPhoneRestricted(false);
            setPhoneCheckLoading(false);
            return;
        }
        // Set loading immediately when phone is complete
        setPhoneCheckLoading(true);
        phoneCheckRef.current = setTimeout(async () => {
            try {
                const res = await fetch('/checkout/check-phone', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ phone: checkedPhone }),
                });
                const json = await res.json();
                setPhoneRestricted(!!json.restricted);
                setPhoneCheckLoading(false);
                if (json.restricted) {
                    const detailMethod = serverMethods.find((m) => m.requires_payment_details);
                    if (detailMethod) {
                        setData('payment_method', detailMethod.slug);
                    }
                }
            } catch {
                setPhoneRestricted(false);
                setPhoneCheckLoading(false);
            }
        }, 500);
        return () => { if (phoneCheckRef.current) clearTimeout(phoneCheckRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkedPhone]);

    // Filter payment methods based on restriction and product-level allowed methods
    const paymentMethodOptions = useMemo(() => {
        let methods = serverMethods;

        // Collect allowed payment methods from all selected products
        const selectedProductIds = selectedItems.filter((i) => i.selected).map((i) => i.product_id);
        const allProducts = [{ id: product.id, allowed_payment_methods: product.allowed_payment_methods ?? [] }, ...extraProducts.map((p) => ({ id: p.id, allowed_payment_methods: p.allowed_payment_methods ?? [] }))];
        const selectedProducts = allProducts.filter((p) => selectedProductIds.includes(p.id));
        const productsWithRestrictions = selectedProducts.filter((p) => p.allowed_payment_methods.length > 0);

        if (productsWithRestrictions.length > 0) {
            const allowedSlugs = productsWithRestrictions.reduce<Set<string>>((acc, p, idx) => {
                const set = new Set(p.allowed_payment_methods);
                if (idx === 0) return set;
                return new Set([...acc].filter((slug) => set.has(slug)));
            }, new Set());
            methods = methods.filter((m) => allowedSlugs.has(m.slug));
        }

        if (phoneRestricted) {
            methods = methods.filter((m) => m.requires_payment_details);
        }
        return methods;
    }, [phoneRestricted, serverMethods, selectedItems, product, extraProducts]);

    // Auto-select first available payment method if current is not in the list
    useEffect(() => {
        if (paymentMethodOptions.length > 0 && !paymentMethodOptions.find((m) => m.slug === data.payment_method)) {
            setData('payment_method', paymentMethodOptions[0].slug);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentMethodOptions]);

    // add_shipping_info — fires once all shipping fields + zone are complete
    const shippingCompleteFiredRef = useRef(false);
    useEffect(() => {
        if (
            shippingCompleteFiredRef.current ||
            !data.first_name.trim() ||
            !data.phone.trim() ||
            !data.address.trim() ||
            !deliveryZone
        ) {
            return;
        }

        shippingCompleteFiredRef.current = true;
        gtmAddShippingInfo([gtmItem], total, deliveryZone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.first_name, data.phone, data.address, deliveryZone]);

    // Meta Pixel Advanced Matching: reinit with phone when user enters a valid 11-digit number.
    // This improves match quality for all subsequent pixel events (AddPaymentInfo, InitiateCheckout).
    useEffect(() => {
        if (metaPixelId && data.phone.length === 11 && typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
            const advMatch: Record<string, string> = { ph: data.phone };
            if (pixelExternalId) advMatch.external_id = pixelExternalId;
            (window as any).fbq('init', metaPixelId, advMatch);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.phone]);

    // add_payment_info — fires when payment method is selected/changed
    const prevPaymentRef = useRef('');
    useEffect(() => {
        if (!data.payment_method || data.payment_method === prevPaymentRef.current) {
            return;
        }

        prevPaymentRef.current = data.payment_method;
        const methodName = serverMethods.find((m) => m.slug === data.payment_method)?.name ?? data.payment_method;
        const price = parseFloat(String(activePrice));
        const gtmItems = [gtmItem];
        const pixelContents = [buildContent(product.id, primaryQty, price)];
        const tiktokContents = [buildTikTokContent(product.id, primaryQty, price, product.name)];
        // Server-side CAPI first, then fire browser pixels with event_id for deduplication
        fetch('/api/tracking/add-payment-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                items: [{ product_id: product.id, product_name: product.name, price, quantity: primaryQty }],
                value: total,
                payment_type: methodName,
            }),
        })
            .then((r) => r.json())
            .then((d: { event_id?: string }) => {
                const eventId = d.event_id;
                gtmAddPaymentInfo(gtmItems, total, methodName, eventId);
                pixelAddPaymentInfo([product.id], total, pixelContents, eventId);
                tiktokAddPaymentInfo(tiktokContents, total, eventId);
            })
            .catch(() => {
                gtmAddPaymentInfo(gtmItems, total, methodName);
                pixelAddPaymentInfo([product.id], total, pixelContents);
                tiktokAddPaymentInfo(tiktokContents, total);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.payment_method]);

    // Coupon apply
    async function handleApplyCoupon() {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const productIds = selectedItems.filter((i) => i.selected).map((i) => i.product_id);
            const res = await fetch('/coupon/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    code: couponCode.trim(),
                    subtotal,
                    product_ids: productIds,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Invalid coupon code.');
            }
            setCouponDiscount(data.discount);
            setAppliedCoupon(data.code);
            setCouponError('');
        } catch (err: any) {
            setCouponDiscount(0);
            setAppliedCoupon('');
            setCouponError(err.message || 'Invalid coupon code.');
        } finally {
            setCouponLoading(false);
        }
    }

    function handleRemoveCoupon() {
        setCouponCode('');
        setCouponDiscount(0);
        setAppliedCoupon('');
        setCouponError('');
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const activeSelected = selectedItems.filter((i) => i.selected);

        // Check if COD is selected when restricted
        if (phoneRestricted && data.payment_method === 'cod') {
            toast.error('Cash on Delivery is not available for your phone number. Please select an alternative payment method.');
            return;
        }

        // Ensure UTM parameters are read fresh from sessionStorage at submit time
        const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
        const freshUtmData: Record<string, string> = {};
        keys.forEach((key) => {
            freshUtmData[key] = sessionStorage.getItem(key) || data[key] || '';
        });

        if (hasMultipleProducts) {
            transform((formData) => ({
                ...formData,
                items: activeSelected.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    variant_id: i.product_id === product.id ? selectedVariantId : (extraVariants[i.product_id] ?? null),
                })),
                delivery_zone: deliveryZone,
                payment_method: formData.payment_method,
                payment_phone: formData.payment_phone,
                payment_amount: formData.payment_amount,
                coupon_code: appliedCoupon || undefined,
                ...freshUtmData,
            }));
        } else {
            transform((formData) => ({
                ...formData,
                variant_id: selectedVariantId,
                quantity: primaryQty,
                delivery_zone: deliveryZone,
                payment_method: formData.payment_method,
                payment_phone: formData.payment_phone,
                payment_amount: formData.payment_amount,
                coupon_code: appliedCoupon || undefined,
                ...freshUtmData,
            }));
        }

        post(`/lp/${landingPage.slug}`, { forceFormData: true });
    }

    const addToCartFiredRef = useRef(false);

    function scrollToCheckout() {
        if (!addToCartFiredRef.current) {
            addToCartFiredRef.current = true;
            const price = parseFloat(String(activePrice));
            const value = price * primaryQty;
            // Server-side CAPI first, then fire browser pixels with event_id for deduplication
            fetch('/api/tracking/add-to-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ product_id: product.id, product_name: product.name, price, quantity: primaryQty }),
            })
                .then((r) => r.json())
                .then((d: { event_id?: string }) => {
                    const eventId = d.event_id;
                    gtmAddToCart(gtmItem, eventId);
                    pixelAddToCart([product.id], product.name, value, [buildContent(product.id, primaryQty, price)], eventId);
                    tiktokAddToCart([buildTikTokContent(product.id, primaryQty, price, product.name)], value, eventId);
                })
                .catch(() => {
                    gtmAddToCart(gtmItem);
                    pixelAddToCart([product.id], product.name, value, [buildContent(product.id, primaryQty, price)]);
                    tiktokAddToCart([buildTikTokContent(product.id, primaryQty, price, product.name)], value);
                });
        }

        checkoutRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    // Hero images: only use admin-uploaded images, no product image fallback
    const heroImages = (landingPage.hero_images && landingPage.hero_images.length > 0)
        ? landingPage.hero_images.map((path) => ({ src: `/${path}` }))
        : [];
    const productFirstImage = product.images?.[0]?.image_path ? `/${product.images[0].image_path}` : null;
    const heroImage = heroImages.length > 0 ? heroImages[0].src : productFirstImage;

    const useCaseIcons = [
        <MapPin key="mp" className="h-5 w-5 text-primary" />,
        <Box key="bx" className="h-5 w-5 text-primary" />,
        <Shield key="sh" className="h-5 w-5 text-primary" />,
        <Wifi key="wf" className="h-5 w-5 text-primary" />,
        <Volume2 key="v2" className="h-5 w-5 text-primary" />,
        <Signal key="sg" className="h-5 w-5 text-primary" />,
        <Battery key="bt" className="h-5 w-5 text-primary" />,
        <Bluetooth key="bl" className="h-5 w-5 text-primary" />,
    ];

    const featureIcons = [
        <Bluetooth key="bl" className="h-5 w-5 text-primary" />,
        <Battery key="bt" className="h-5 w-5 text-primary" />,
        <Volume2 key="v2" className="h-5 w-5 text-primary" />,
        <Zap key="zp" className="h-5 w-5 text-primary" />,
        <Shield key="sh" className="h-5 w-5 text-primary" />,
        <Cpu key="cp" className="h-5 w-5 text-primary" />,
        <RefreshCcw key="rc" className="h-5 w-5 text-primary" />,
        <Headphones key="hp" className="h-5 w-5 text-primary" />,
    ];

    const specIcons = [
        <Bluetooth key="bl" className="h-4 w-4 text-primary" />,
        <Battery key="bt" className="h-4 w-4 text-primary" />,
        <Shield key="sh" className="h-4 w-4 text-primary" />,
        <ListChecks key="lc" className="h-4 w-4 text-primary" />,
        <Zap key="zp" className="h-4 w-4 text-primary" />,
        <Award key="aw" className="h-4 w-4 text-primary" />,
    ];

    const whyBuyIcons = [
        <ShieldCheck key="sc" className="h-6 w-6 text-primary" />,
        <RefreshCcw key="rc" className="h-6 w-6 text-primary" />,
        <Truck key="tr" className="h-6 w-6 text-primary" />,
        <ThumbsUp key="tu" className="h-6 w-6 text-primary" />,
    ];

    return (
        <>
            <Head title={landingPage.title} />
            {gtmSsUrl ? <GtmSsScript gtmId={gtmId} gtmSsUrl={gtmSsUrl} /> : <GtmScript gtmId={gtmId} />}
            <MetaPixelScript pixelId={metaPixelId} pixelExternalId={pixelExternalId} />
            <TikTokPixelScript pixelId={tiktokPixelId} />
            <div className="dark min-h-screen bg-background text-foreground">
                {/* ── Sticky Top Bar ── */}
                <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-md bg-primary px-2 py-1">
                                {landingPage.icon_name && getIconComponent(landingPage.icon_name, 'h-3.5 w-3.5 text-primary-foreground')}
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground sm:text-xs">{landingPage.badge_text || 'Limited Offer'}</span>
                            </div>
                        </div>
                        {countdownRemaining && (
                            <div className="flex items-center gap-1">
                                {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit, idx) => (
                                    <span key={unit} className="flex items-center">
                                        {idx > 0 && <span className="mx-0.5 text-xs font-bold text-primary">:</span>}
                                        <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground sm:h-8 sm:w-8 sm:text-xs">
                                            {String(countdownRemaining[unit]).padStart(2, '0')}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}
                        <a href={`tel:${(landingPage.phone || '').replace(/[^+\d]/g, '')}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:text-sm">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{landingPage.phone}</span>
                        </a>
                    </div>
                </header>

                {/* ── 1. Hero Section ── */}
                <section className="relative overflow-hidden bg-primary">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.2),transparent_70%)]" />
                    <div className={`relative mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:gap-8 sm:py-12 md:py-20 ${heroImages.length > 0 ? 'md:grid-cols-2' : 'max-w-2xl'}`}>
                        {/* Text */}
                        <div className={heroImages.length > 0 ? 'text-center md:text-left' : 'text-center'}>
                            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary-foreground/70 sm:mb-3 sm:text-sm">{landingPage.subtitle || 'Keep your valuables safe'}</p>
                            <h1 className="mb-3 text-2xl font-extrabold leading-tight text-primary-foreground sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
                                {landingPage.title}
                            </h1>
                            {(landingPage.hero_text || product.description) && (
                                <p className="mb-4 max-w-lg text-sm leading-relaxed text-primary-foreground/80 sm:mb-6 sm:text-base">{landingPage.hero_text || product.description}</p>
                            )}

                            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                                <Button
                                    size="lg"
                                    type="button"
                                    variant="secondary"
                                    onClick={scrollToCheckout}
                                    className="px-8 shadow-lg"
                                >
                                    {landingPage.order_now_text || 'Order Now'} <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1.5 text-sm text-primary-foreground/80">
                                    {getIconComponent(landingPage.delivery_badge_icon || 'truck', 'h-4 w-4') || <Truck className="h-4 w-4" />}
                                    {product.free_shipping ? (
                                        <span className="font-medium">{landingPage.delivery_badge_text || 'Free Shipping'}</span>
                                    ) : shippingZones.length > 0 ? (
                                        <span>{landingPage.delivery_badge_text || 'Delivery'}: {shippingZones.map((z, i) => (
                                            <span key={z.zone}>{i > 0 ? ' / ' : ''}৳{Number(z.charge).toFixed(0)} ({z.zone})</span>
                                        ))}</span>
                                    ) : (
                                        <span>{landingPage.delivery_badge_text || 'Delivery charges apply'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Image & Gallery */}
                        {heroImages.length > 0 && (
                        <div className="flex items-start justify-center">
                            <div className="flex flex-col gap-2 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                                {/* Large main image */}
                                <div className="relative overflow-hidden rounded-2xl bg-background shadow-2xl">
                                    <img
                                        src={heroImages[selectedImageIndex].src}
                                        alt={landingPage.title}
                                        className="w-full object-cover"
                                    />
                                    {landingPage.hero_video && (
                                        <button
                                            onClick={() => setVideoOpen(true)}
                                            className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-white transition-colors hover:bg-black/90"
                                        >
                                            <PlayCircle className="h-5 w-5 text-red-500" />
                                            <span className="text-xs font-medium">Watch Video</span>
                                        </button>
                                    )}
                                </div>
                                {/* Thumbnails below */}
                                {heroImages.length > 1 && (
                                    <div className="flex flex-row gap-1.5 flex-wrap">
                                        {heroImages.map((image, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImageIndex(index)}
                                                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                                                    selectedImageIndex === index
                                                        ? 'border-primary-foreground shadow-md'
                                                        : 'border-primary-foreground/30 hover:border-primary-foreground/60'
                                                }`}
                                            >
                                                <img
                                                    src={image.src}
                                                    alt={`${landingPage.title} - ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                </section>

                {/* ── 2. Use Cases Section ── */}
                <section className="bg-card">
                    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-14">
                        <div className="mb-6 text-center sm:mb-10">
                            <h2 className="mb-2 text-xl font-bold sm:text-2xl md:text-3xl">
                                {landingPage.use_cases_title || <>What Is <span className="text-primary">{product.name}</span> Used For?</>}
                            </h2>
                            <p className="text-xs text-muted-foreground sm:text-sm">{landingPage.use_cases_subtitle || 'Discover the many ways this product makes your life easier'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {(landingPage.use_cases || [
                                { label: 'Track Your Keys' },
                                { label: 'Find Your Bags' },
                                { label: 'Secure Valuables' },
                                { label: 'Remote Tracking' },
                                { label: 'Ring to Find' },
                                { label: 'Wide Range' },
                                { label: 'Long Battery Life' },
                                { label: 'Easy Connection' },
                            ]).map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 p-5 text-center transition-colors hover:bg-muted">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                                        {item.icon_name ? getIconComponent(item.icon_name, 'h-5 w-5 text-primary') : useCaseIcons[i % useCaseIcons.length]}
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 3. Features Section ── */}
                <section className="bg-secondary text-secondary-foreground">
                    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-14">
                        <div className="mb-6 text-center sm:mb-10">
                            <h2 className="mb-2 text-xl font-bold sm:text-2xl md:text-3xl">
                                {landingPage.features_title || <>Amazing Features That Keep You <span className="text-primary">Worry-Free</span></>}
                            </h2>
                            <p className="text-xs text-muted-foreground sm:text-sm">{landingPage.features_subtitle || 'Engineered with cutting-edge technology for your peace of mind'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                            {(landingPage.features || [
                                { title: 'Bluetooth 5.1', desc: 'Latest Bluetooth technology for fast, stable connections' },
                                { title: 'Long Battery', desc: 'Up to 12 months battery life on a single charge' },
                                { title: 'Loud Speaker', desc: 'Built-in speaker rings loud so you can find things fast' },
                                { title: 'Instant Alerts', desc: 'Get notified immediately when you leave something behind' },
                                { title: 'Privacy First', desc: 'Encrypted communications keep your data fully secure' },
                                { title: 'Smart Chip', desc: 'Advanced processor for accurate real-time tracking' },
                                { title: 'Replaceable Battery', desc: 'Easy to replace standard battery — no charging needed' },
                                { title: '24/7 Support', desc: 'Our support team is always ready to help you' },
                            ]).map((item, i) => (
                                <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        {item.icon_name ? getIconComponent(item.icon_name, 'h-5 w-5 text-primary') : featureIcons[i % featureIcons.length]}
                                    </div>
                                    <h3 className="mb-1 text-sm font-bold text-card-foreground">{item.title}</h3>
                                    <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-center">
                            <Button size="lg" onClick={scrollToCheckout} className="px-8">
                                {landingPage.order_now_text || 'Order Now'} <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ── 4. Specifications Section ── */}
                <section className="bg-card">
                    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-14">
                        <div className="mb-6 text-center sm:mb-10">
                            <h2 className="mb-1 text-xl font-bold sm:text-2xl md:text-3xl">
                                {landingPage.specifications_title || <>Detailed <span className="text-primary">Specifications</span></>}
                            </h2>
                            <p className="text-xs text-muted-foreground sm:text-sm">{landingPage.specifications_subtitle || 'Everything you need to know about this product'}</p>
                        </div>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {(landingPage.specifications || [
                                { title: 'Connectivity', specs: ['Bluetooth 5.1', 'Compatible with iOS & Android', 'Range up to 100ft'] },
                                { title: 'Battery', specs: ['CR2032 Coin Cell', 'Up to 12 months', 'Easy replacement'] },
                                { title: 'Security', specs: ['End-to-end encryption', 'Anti-stalking feature', 'Privacy certified'] },
                                { title: 'Dimensions', specs: ['Compact & lightweight', 'Water-resistant design', 'Durable materials'] },
                                { title: 'Performance', specs: ['Ultra-low latency', 'Location accuracy', 'Real-time updates'] },
                                { title: 'Warranty', specs: ['1 year guarantee', 'Free replacements', '30-day returns'] },
                            ]).map((item, i) => (
                                <div key={i} className="rounded-xl border border-border bg-muted/50 p-5">
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                                            {item.icon_name ? getIconComponent(item.icon_name, 'h-4 w-4 text-primary') : specIcons[i % specIcons.length]}
                                        </div>
                                        <h3 className="text-sm font-bold text-primary">{item.title}</h3>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {item.specs.map((spec, si) => (
                                            <li key={si} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                                {spec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex flex-wrap justify-center gap-4">
                            <div className="flex items-center gap-2 rounded-full bg-chart-4/10 px-4 py-2 text-sm text-chart-4">
                                {getIconComponent(landingPage.authentic_badge_icon || 'shield-check', 'h-4 w-4') || <ShieldCheck className="h-4 w-4" />}
                                {landingPage.authentic_badge_text || '100% Authentic Product'}
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-chart-2/10 px-4 py-2 text-sm text-chart-2">
                                {getIconComponent(landingPage.delivery_badge_icon || 'truck', 'h-4 w-4') || <Truck className="h-4 w-4" />}
                                {landingPage.delivery_badge_text || (product.free_shipping ? 'Free Shipping' : 'Cash on Delivery Available')}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 5. Why Buy From Us ── */}
                <section className="bg-background">
                    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-14">
                        <div className="mb-6 text-center sm:mb-10">
                            <p className="mb-1 text-xs text-muted-foreground sm:text-sm">{landingPage.why_buy_super_text || 'Customers love our store'}</p>
                            <h2 className="mb-2 text-xl font-bold sm:text-2xl md:text-3xl">
                                {landingPage.why_buy_title || <>Why Buy From <span className="text-primary">Us?</span></>}
                            </h2>
                            <p className="text-xs text-muted-foreground sm:text-sm">{landingPage.why_buy_subtitle || 'We\'re committed to your satisfaction every step of the way'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                            {(landingPage.why_buy || [
                                { title: '1 Year Warranty', desc: 'Full product warranty' },
                                { title: '7-Day Returns', desc: 'Easy return policy' },
                                { title: 'Fast Delivery', desc: 'Nationwide shipping' },
                                { title: '100% Genuine', desc: 'Authentic products only' },
                            ]).map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary text-lg">
                                        {item.icon_name ? getIconComponent(item.icon_name, 'h-6 w-6 text-primary') : whyBuyIcons[i % whyBuyIcons.length]}
                                    </div>
                                    <h3 className="text-sm font-bold">{item.title}</h3>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Review Images Gallery ── */}
                {landingPage.review_images && landingPage.review_images.length > 0 && (
                    <section className="border-t border-border bg-background">
                        <div className="mx-auto max-w-6xl px-4 py-14">
                            <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">{landingPage.review_images_title || 'Customer Reviews'}</h2>
                            <div className="mx-auto mb-4 max-w-2xl overflow-hidden rounded-xl border border-border shadow-sm">
                                <img src={`/${landingPage.review_images[selectedReviewIndex]}`} alt={`Customer review ${selectedReviewIndex + 1}`} className="h-auto w-full object-cover" />
                            </div>
                            {landingPage.review_images.length > 1 && (
                                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                                    {landingPage.review_images.map((img, i) => (
                                        <button key={i} onClick={() => setSelectedReviewIndex(i)} className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-16 sm:w-16 ${i === selectedReviewIndex ? 'border-primary' : 'border-border'}`}>
                                            <img src={`/${img}`} alt="" className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── WhatsApp + Call Buttons ── */}
                {(siteBranding?.whatsapp || siteBranding?.phone) && (
                    <div className="border-t border-border bg-card/50 py-6">
                        <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4">
                            {siteBranding.whatsapp?.trim() && (
                                <a
                                    href={`https://wa.me/${siteBranding.whatsapp.trim().replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-md bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-95"
                                >
                                    <MessageCircle className="h-4 w-4 shrink-0" />
                                    WhatsApp
                                </a>
                            )}
                            {siteBranding.phone?.trim() && (
                                <a
                                    href={`tel:${siteBranding.phone.trim()}`}
                                    className="flex items-center gap-1.5 rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-95"
                                >
                                    <Phone className="h-4 w-4 shrink-0" />
                                    Call Us
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* ── 6. Checkout Section ── */}
                <section ref={checkoutRef} className="border-t border-border bg-card" id="checkout">
                    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 md:py-14">
                        {/* Section banner */}
                        <div className="mb-6 rounded-xl bg-primary p-3 text-center sm:mb-8 sm:p-4">
                            <p className="text-sm font-bold text-primary-foreground sm:text-lg">
                                {landingPage.checkout_banner_text || (product.free_shipping ? <>Order now and enjoy <span className="underline decoration-chart-4 decoration-2">free shipping</span> on this product!</> : shippingZones.length > 0 ? <>Order now! Delivery: {shippingZones.map((z, i) => <span key={z.zone}>{i > 0 ? ' / ' : ''}৳{Number(z.charge).toFixed(0)} ({z.zone})</span>)}</> : <>Order now!</>)}
                            </p>
                        </div>

                        {/* Blocked warning */}
                        {(isBlocked || errors.blocked) && (
                            <div className="mb-6 rounded-xl border border-destructive bg-destructive/5 p-4">
                                <div className="flex items-center gap-3 text-destructive">
                                    <span className="text-lg font-bold">⚠</span>
                                    <p className="text-sm font-medium">{errors.blocked || 'Your access has been restricted. You cannot place orders.'}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
                                {/* Left — Shipping Form */}
                                <div className="space-y-4 sm:space-y-5">
                                    <h2 className="text-base font-bold sm:text-lg">{labels?.shippingInfo ?? 'Shipping Information'}</h2>
                                    <div className="rounded-xl border border-border bg-muted/50 p-3 sm:p-5">
                                        <div className="grid gap-3 sm:gap-4">
                                            <div>
                                                <Label htmlFor="firstName">{labels?.fullName ?? 'Full Name'} *</Label>
                                                <Input
                                                    id="firstName"
                                                    value={data.first_name}
                                                    onChange={(e) => setData('first_name', e.target.value)}
                                                    placeholder="John Doe"
                                                    className="mt-1"
                                                />
                                                {errors.first_name && <p className="mt-1 text-xs text-destructive">{errors.first_name}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="phone">{labels?.phoneNumber ?? 'Phone Number'} *</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={data.phone}
                                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                                    placeholder="01XXXXXXXXX"
                                                    className="mt-1"
                                                    maxLength={11}
                                                    inputMode="numeric"
                                                />
                                                {phoneCheckLoading && (
                                                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">ℹ Verifying your phone number for Cash on Delivery eligibility...</p>
                                                )}
                                                {data.phone && !data.phone.startsWith('01') && (
                                                    <p className="mt-1 text-xs text-destructive">Phone number must start with 01 (e.g., 01XXXXXXXXX). Do not enter +88 or 88.</p>
                                                )}
                                                {data.phone && data.phone.startsWith('01') && data.phone.length !== 11 && (
                                                    <p className="mt-1 text-xs text-destructive">Phone number must be exactly 11 digits.</p>
                                                )}
                                                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                                            </div>
                                            {labels?.emailEnabled && (
                                                <div>
                                                    <Label htmlFor="email">{labels?.email ?? 'Email Address'}</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        placeholder="example@email.com"
                                                        className="mt-1"
                                                    />
                                                    {labels?.emailHelpText && (
                                                        <p className="mt-1 text-xs text-muted-foreground">{labels.emailHelpText}</p>
                                                    )}
                                                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                                                </div>
                                            )}
                                            <div ref={districtRef}>
                                                <Label htmlFor="district">{labels?.district ?? 'District'} *</Label>
                                                <div className="relative mt-1">
                                                    <Input
                                                        id="district"
                                                        value={districtOpen ? districtSearch : data.district}
                                                        onChange={(e) => { setDistrictSearch(e.target.value); setDistrictOpen(true); }}
                                                        onFocus={() => { setDistrictOpen(true); setDistrictSearch(data.district); }}
                                                        placeholder="Search district..."
                                                        autoComplete="off"
                                                    />
                                                    {districtOpen && (() => {
                                                        const filtered = districtOptions.filter((d) =>
                                                            d.toLowerCase().includes(districtSearch.toLowerCase())
                                                        );
                                                        return filtered.length > 0 ? (
                                                            <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-md">
                                                                {filtered.map((d) => (
                                                                    <li
                                                                        key={d}
                                                                        onClick={() => { setData('district', d); setDistrictSearch(d); setDistrictOpen(false); }}
                                                                        className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent ${data.district === d ? 'bg-accent font-medium' : ''}`}
                                                                    >
                                                                        {d}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                {errors.district && <p className="mt-1 text-xs text-destructive">{errors.district}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="address">{labels?.address ?? 'Address'} *</Label>
                                                <Input
                                                    id="address"
                                                    value={data.address}
                                                    onChange={(e) => setData('address', e.target.value)}
                                                    placeholder="123 Main Street"
                                                    className="mt-1"
                                                />
                                                {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="note">{labels?.note ?? 'Note'}</Label>
                                                <Textarea
                                                    id="note"
                                                    value={data.note}
                                                    onChange={(e) => setData('note', e.target.value)}
                                                    placeholder="Any special instructions or notes for your order..."
                                                    className="mt-1"
                                                    rows={3}
                                                />
                                                {errors.note && <p className="mt-1 text-xs text-destructive">{errors.note}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="rounded-xl border border-border bg-muted/50 p-3 sm:p-5">
                                        <h3 className="mb-3 text-sm font-bold">{labels?.paymentMethod ?? 'Payment Method'}</h3>
                                        {phoneRestricted && (
                                            <div className="mb-3 rounded-lg border p-3 text-xs" style={{ backgroundColor: '#fefce8', borderColor: '#fde047', color: '#854d0e' }}>
                                                <strong>⚠</strong> {labels?.codRestrictedMessage ?? 'Based on your phone number history, Cash on Delivery is not available. Please select a payment method below.'}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                                            {paymentMethodOptions.map((method) => (
                                                <button
                                                    key={method.slug}
                                                    type="button"
                                                    onClick={() => setData('payment_method', method.slug)}
                                                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-colors ${
                                                        data.payment_method === method.slug
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border hover:border-primary/50'
                                                    }`}
                                                >
                                                    {method.logo ? (
                                                        <img src={method.logo} alt={method.name} className="h-8 w-8 object-contain" />
                                                    ) : method.icon && (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[method.icon] ? (
                                                        (() => { const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[method.icon!]; return <IconComp className="h-5 w-5" />; })()
                                                    ) : (
                                                        <Wallet className="h-5 w-5" />
                                                    )}
                                                    <span className="text-xs font-medium">{method.name}</span>
                                                    {method.description && <span className="text-[10px] text-muted-foreground">{method.description}</span>}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.payment_method && <p className="mt-2 text-xs text-destructive">{errors.payment_method}</p>}

                                        {data.payment_method && (() => {
                                            const selectedMethod = paymentMethodOptions.find((m) => m.slug === data.payment_method);

                                            if (!selectedMethod?.requires_payment_details) {
                                                return null;
                                            }

                                            return (
                                                <div className="mt-3 space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-2.5 sm:mt-4 sm:p-3">
                                                {selectedMethod?.account_number && (
                                                    <p className="text-xs font-semibold text-primary break-all sm:text-sm">{selectedMethod.account_label || `Send to: ${selectedMethod.account_number}`}</p>
                                                )}
                                                <p className="text-xs font-medium text-primary">{selectedMethod?.instructions_text || 'Send payment and enter details below:'}</p>
                                                <div>
                                                    <Label htmlFor="payment_phone">{selectedMethod?.payment_number_label || 'Payment Number'}</Label>
                                                    <Input
                                                        id="payment_phone"
                                                        type="tel"
                                                        value={data.payment_phone}
                                                        onChange={(e) => setData('payment_phone', e.target.value)}
                                                        placeholder="01XXXXXXXXX"
                                                        className="mt-1"
                                                    />
                                                    {errors.payment_phone && <p className="mt-1 text-xs text-destructive">{errors.payment_phone}</p>}
                                                </div>
                                                <div>
                                                    <Label htmlFor="payment_amount">{selectedMethod?.payment_amount_label || 'Payment Amount (৳)'}</Label>
                                                    <Input
                                                        id="payment_amount"
                                                        type="number"
                                                        min={0}
                                                        step="any"
                                                        value={data.payment_amount}
                                                        onChange={(e) => setData('payment_amount', e.target.value)}
                                                        placeholder="0"
                                                        className="mt-1"
                                                    />
                                                    {errors.payment_amount && <p className="mt-1 text-xs text-destructive">{errors.payment_amount}</p>}
                                                </div>
                                                <div>
                                                    <Label>Payment Screenshot <span className="text-destructive font-normal">*</span></Label>
                                                    {screenshotPreview ? (
                                                        <div className="relative mt-1 inline-block">
                                                            <img src={screenshotPreview} alt="Screenshot" className="h-24 w-auto rounded-lg border" />
                                                            <button
                                                                type="button"
                                                                onClick={() => { setData('payment_screenshot', null); setScreenshotPreview(null); }}
                                                                className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/30 px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/50">
                                                            <Upload className="h-4 w-4" />
                                                            <span>Upload screenshot</span>
                                                            <input
                                                                type="file"
                                                                accept="image/jpeg,image/png,image/webp"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0] || null;
                                                                    setData('payment_screenshot', file);
                                                                    setScreenshotPreview(file ? URL.createObjectURL(file) : null);
                                                                }}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    )}
                                                    {!data.payment_screenshot && <p className="mt-1 text-xs text-destructive">Payment screenshot is required.</p>}
                                                    {errors.payment_screenshot && <p className="mt-1 text-xs text-destructive">{errors.payment_screenshot}</p>}
                                                </div>
                                            </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Right — Product + Order Summary */}
                                <div className="space-y-4 sm:space-y-5">
                                    {/* Your Products heading */}
                                    <h2 className="text-base font-bold sm:text-lg">{labels?.yourProducts ?? 'Your Products'}</h2>

                                    {/* All product cards — unified grid */}
                                    <div className={`grid gap-3 sm:gap-4 ${(hasMultipleProducts || extraProducts.length > 0) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>

                                        {/* Primary product card */}
                                        <div className={`flex flex-col rounded-xl border bg-muted/50 p-3 transition-colors sm:p-4 ${(primaryItem?.selected ?? true) ? 'border-primary/50' : 'border-border'}`}>
                                            {hasMultipleProducts && (
                                                <div className="mb-3 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        role="checkbox"
                                                        aria-checked={primaryItem?.selected ?? true}
                                                        onClick={() => updateSelectedItem(product.id, { selected: !(primaryItem?.selected ?? true) })}
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${(primaryItem?.selected ?? true) ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
                                                    >
                                                        {(primaryItem?.selected ?? true) && <CheckCircle className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <span className="text-xs font-medium text-muted-foreground">Add to order</span>
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-accent sm:h-20 sm:w-20">
                                                    {productFirstImage ?? heroImage ? (
                                                        <img src={productFirstImage ?? heroImage!} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-bold line-clamp-2">{product.name}</h3>
                                                    {product.category && (
                                                        <p className="text-xs text-muted-foreground">{product.category.name}</p>
                                                    )}
                                                    <p className="mt-1 text-base font-bold text-primary">{formatPrice(activePrice)}</p>
                                                </div>
                                            </div>

                                            {/* Variants */}
                                            {variants.length > 0 && (
                                                <div className="mt-3 space-y-3 border-t border-border pt-3">
                                                    {sizes.length > 0 && (
                                                        <div>
                                                            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{product.size_label || 'Size'}</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {sizes.map((size) => {
                                                                    const mv = variants.filter((v) => v.size === size);
                                                                    const isSelected = selectedVariant?.size === size;
                                                                    return (
                                                                        <button
                                                                            key={size}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const match = mv.find((v) => !selectedVariant?.color || v.color === selectedVariant.color) || mv[0];
                                                                                setSelectedVariantId(match.id);
                                                                            }}
                                                                            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                                                                        >
                                                                            {size}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {colors.length > 0 && (
                                                        <div>
                                                            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{product.color_label || 'Color'}</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {colors.map((color) => {
                                                                    const mv = variants.filter((v) => v.color === color);
                                                                    const isSelected = selectedVariant?.color === color;
                                                                    return (
                                                                        <button
                                                                            key={color}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const match = mv.find((v) => !selectedVariant?.size || v.size === selectedVariant.size) || mv[0];
                                                                                setSelectedVariantId(match.id);
                                                                            }}
                                                                            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}
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

                                            {/* Stock Status Badge */}
                                            <div className="mt-3 pt-3 border-t border-border">
                                                {isOutOfStock ? (
                                                    <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                                                ) : activeStockQuantity ? (
                                                    <span className="text-green-600 text-sm font-medium">In Stock ({activeStockQuantity} Available)</span>
                                                ) : (
                                                    <span className="text-blue-600 text-sm font-medium">In Stock (Unlimited)</span>
                                                )}
                                            </div>

                                            {/* Quantity */}
                                            <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                                                <span className="text-xs font-medium text-muted-foreground">Qty:</span>
                                                <div className="flex items-center rounded-md border border-border">
                                                    <button type="button" onClick={() => updateSelectedItem(product.id, { quantity: Math.max(1, (primaryItem?.quantity ?? 1) - 1) })} className="px-2.5 py-1 text-muted-foreground hover:text-foreground">
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">{primaryItem?.quantity ?? 1}</span>
                                                    <button type="button" onClick={() => updateSelectedItem(product.id, { quantity: (primaryItem?.quantity ?? 1) + 1 })} className="px-2.5 py-1 text-muted-foreground hover:text-foreground">
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Extra product cards */}
                                        {extraProducts.map((ep) => {
                                            const item = selectedItems.find((i) => i.product_id === ep.id);
                                            const isSelected = item?.selected ?? false;
                                            const itemQty = item?.quantity ?? 1;

                                            return (
                                                <div key={ep.id} className={`flex flex-col rounded-xl border bg-muted/50 p-3 transition-colors sm:p-4 ${isSelected ? 'border-primary/50' : 'border-border'}`}>
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            role="checkbox"
                                                            aria-checked={isSelected}
                                                            onClick={() => updateSelectedItem(ep.id, { selected: !isSelected })}
                                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
                                                        >
                                                            {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                                                        </button>
                                                        <span className="text-xs font-medium text-muted-foreground">Add to order</span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-accent sm:h-20 sm:w-20">
                                                            {ep.image ? (
                                                                <img src={ep.image} alt={ep.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-sm font-bold line-clamp-2">{ep.name}</h3>
                                                            <p className="mt-1 text-base font-bold text-primary">{formatPrice(getItemPrice(ep.id))}</p>
                                                        </div>
                                                    </div>

                                                    {/* Extra product variants */}
                                                    {ep.variants.length > 0 && (() => {
                                                        const epSizes = [...new Set(ep.variants.filter((v) => v.size).map((v) => v.size!))];
                                                        const epColors = [...new Set(ep.variants.filter((v) => v.color).map((v) => v.color!))];
                                                        const epSelectedId = extraVariants[ep.id] ?? null;
                                                        const epSelected = ep.variants.find((v) => v.id === epSelectedId) ?? null;

                                                        return (
                                                            <div className="mt-3 space-y-3 border-t border-border pt-3">
                                                                {epSizes.length > 0 && (
                                                                    <div>
                                                                        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{ep.size_label || 'Size'}</span>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {epSizes.map((size) => {
                                                                                const mv = ep.variants.filter((v) => v.size === size);
                                                                                const isSelected = epSelected?.size === size;

                                                                                return (
                                                                                    <button
                                                                                        key={size}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const match = mv.find((v) => !epSelected?.color || v.color === epSelected.color) || mv[0];
                                                                                            setExtraVariants((prev) => ({ ...prev, [ep.id]: match.id }));
                                                                                        }}
                                                                                        className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                                                                                    >
                                                                                        {size}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {epColors.length > 0 && (
                                                                    <div>
                                                                        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{ep.color_label || 'Color'}</span>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {epColors.map((color) => {
                                                                                const mv = ep.variants.filter((v) => v.color === color);
                                                                                const isSelected = epSelected?.color === color;

                                                                                return (
                                                                                    <button
                                                                                        key={color}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const match = mv.find((v) => !epSelected?.size || v.size === epSelected.size) || mv[0];
                                                                                            setExtraVariants((prev) => ({ ...prev, [ep.id]: match.id }));
                                                                                        }}
                                                                                        className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                                                                                    >
                                                                                        {color}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Variant required warning – extra product */}
                                                    {ep.variants.length > 0 && isSelected && (extraVariants[ep.id] ?? null) === null && (
                                                        <p className="mt-2 text-xs font-medium text-destructive">Please select a variant to continue.</p>
                                                    )}

                                                    {/* Stock Status Badge – Extra Product */}
                                                    {(() => {
                                                        const epSelectedId = extraVariants[ep.id] ?? null;
                                                        const epSelectedVariant = epSelectedId ? ep.variants.find((v) => v.id === epSelectedId) : null;
                                                        const epActiveInStock = epSelectedVariant ? epSelectedVariant.in_stock : ep.in_stock;
                                                        const epActiveStockQuantity = epSelectedVariant ? epSelectedVariant.stock_quantity : ep.stock_quantity;
                                                        const epIsOutOfStock = !epActiveInStock || epActiveStockQuantity === 0;

                                                        return (
                                                            <div className="mt-3 pt-3 border-t border-border">
                                                                {epIsOutOfStock ? (
                                                                    <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                                                                ) : epActiveStockQuantity ? (
                                                                    <span className="text-green-600 text-sm font-medium">In Stock ({epActiveStockQuantity} Available)</span>
                                                                ) : (
                                                                    <span className="text-blue-600 text-sm font-medium">In Stock (Available)</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}

                                                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                                                        <span className="text-xs font-medium text-muted-foreground">Qty:</span>
                                                        <div className="flex items-center rounded-md border border-border">
                                                            <button type="button" onClick={() => updateSelectedItem(ep.id, { quantity: Math.max(1, itemQty - 1) })} className="px-2.5 py-1 text-muted-foreground hover:text-foreground">
                                                                <Minus className="h-3.5 w-3.5" />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-medium">{itemQty}</span>
                                                            <button type="button" onClick={() => updateSelectedItem(ep.id, { quantity: itemQty + 1 })} className="px-2.5 py-1 text-muted-foreground hover:text-foreground">
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Order Summary */}
                                    <div className="rounded-xl border border-border bg-muted/50 p-3 sm:p-4">
                                        <h3 className="mb-3 text-sm font-bold">{labels?.yourOrder ?? 'Your Order'}</h3>

                                        {/* Free shipping banner */}
                                        {freeShippingEnabled && freeShippingAmount > 0 && (
                                            subtotal >= freeShippingAmount ? (
                                                <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
                                                    <Truck className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="font-medium">Free shipping applied!</span>
                                                </div>
                                            ) : (
                                                <div className="mb-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <Truck className="h-3.5 w-3.5 shrink-0" />
                                                        <span>Add <strong>৳{(freeShippingAmount - subtotal).toFixed(0)}</strong> more for free shipping</span>
                                                    </div>
                                                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-primary/20">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all duration-300"
                                                            style={{ width: `${Math.min(100, (subtotal / freeShippingAmount) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {/* Delivery Zone Selector */}
                                            {filteredZones.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="mb-2 text-xs font-medium text-muted-foreground">Delivery Area</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {filteredZones.map((zone) => (
                                                            <button
                                                                key={zone}
                                                                type="button"
                                                                onClick={() => setDeliveryZone(zone)}
                                                                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${deliveryZone === zone ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                                                            >
                                                                {zone}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        <div className="space-y-2 text-sm">
                                            {hasMultipleProducts && selectedItems.filter((i) => i.selected).map((i) => {
                                                const name = i.product_id === product.id
                                                    ? product.name
                                                    : (extraProducts.find((ep) => ep.id === i.product_id)?.name ?? '');

                                                return (
                                                    <div key={i.product_id} className="flex justify-between gap-2 text-muted-foreground">
                                                        <span className="min-w-0 flex-1 truncate">{name} ×{i.quantity}</span>
                                                        <span className="shrink-0">{formatPrice(getItemPrice(i.product_id) * i.quantity)}</span>
                                                    </div>
                                                );
                                            })}
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Subtotal</span>
                                                <span>{formatPrice(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Shipping</span>
                                                <span className={shipping === 0 ? 'text-chart-2' : ''}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                                            </div>

                                            {/* Coupon */}
                                            {(hasGlobalCoupons || selectedItems.filter((i) => i.selected).some((i) => (couponProductIds ?? []).includes(i.product_id))) && (
                                                <div className="pt-1">
                                                    {appliedCoupon ? (
                                                        <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
                                                            <div className="flex items-center gap-2 text-xs text-green-400">
                                                                <Tag className="h-3 w-3" />
                                                                <span className="font-medium">{appliedCoupon}</span>
                                                                <span>−{formatPrice(couponDiscount)}</span>
                                                            </div>
                                                            <button type="button" onClick={handleRemoveCoupon} className="text-green-400 hover:text-red-400">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="text"
                                                                    value={couponCode}
                                                                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                                                                    placeholder="Coupon code"
                                                                    className="h-8 text-xs"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={handleApplyCoupon}
                                                                    disabled={couponLoading || !couponCode.trim()}
                                                                    className="shrink-0 h-8 text-xs"
                                                                >
                                                                    {couponLoading ? '...' : 'Apply'}
                                                                </Button>
                                                            </div>
                                                            {couponError && <p className="text-[10px] text-destructive">{couponError}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {couponDiscount > 0 && (
                                                <div className="flex justify-between text-green-400">
                                                    <span>Discount</span>
                                                    <span>−{formatPrice(couponDiscount)}</span>
                                                </div>
                                            )}

                                            <Separator />

                                            <div className="flex justify-between text-base font-bold">
                                                <span>Total</span>
                                                <span className="text-primary">{formatPrice(total)}</span>
                                            </div>

                                            {paidAmount > 0 && (
                                                <>
                                                    <div className="flex justify-between text-sm text-green-400">
                                                        <span>Advance Paid</span>
                                                        <span>−{formatPrice(paidAmount)}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-base font-bold">
                                                        <span>Due</span>
                                                        <span className={dueAmount === 0 ? 'text-green-400' : 'text-primary'}>
                                                            {dueAmount === 0 ? '৳0' : formatPrice(dueAmount)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Variant required warning */}
                                    {missingVariant && (
                                        <p className="text-xs text-destructive text-center">
                                            Please select a variant (size/color) for all selected products before ordering.
                                        </p>
                                    )}

                                    {/* Submit */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={processing || phoneCheckLoading || isOutOfStock || selectedItems.filter((i) => i.selected).length === 0 || missingVariant}
                                        className="w-full text-sm font-bold shadow-lg sm:text-base"
                                    >
                                        <Lock className="mr-2 h-4 w-4 shrink-0" />
                                        <span className="truncate">{phoneCheckLoading ? 'Verifying Phone...Please Wait' : processing ? 'Placing Order...' : `${landingPage.order_now_text || 'Order Now'} — ${paidAmount > 0 ? formatPrice(dueAmount) + ' Due' : formatPrice(total)}`}</span>
                                    </Button>

                                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Secure Payment</span>
                                        <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Fast Delivery</span>
                                        <span className="flex items-center gap-1"><RefreshCcw className="h-3 w-3" /> Easy Returns</span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-border bg-background py-6 text-center text-xs text-muted-foreground">
                    <p>
                        &copy; {new Date().getFullYear()} {siteBranding?.title || 'Our Store'}. All rights reserved.
                        <br />
                        Develop & Maintain by{' '}
                        <a
                            href="https://wa.me/8801518401677"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                        >
                            Grow Ever
                        </a>
                    </p>
                </footer>
            </div>

            {/* YouTube Video Modal */}
            {videoOpen && landingPage.hero_video && (() => {
                const embedUrl = getYouTubeEmbedUrl(landingPage.hero_video);
                if (!embedUrl) return null;
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
                                    title={landingPage.title}
                                />
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}
