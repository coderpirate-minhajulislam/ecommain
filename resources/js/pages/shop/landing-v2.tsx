import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    Battery,
    Bluetooth,
    Box,
    CheckCircle,
    ChevronRight,
    Clock,
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
    ChevronLeft,
    Star,
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
import { tiktokViewContent, tiktokAddToCart, tiktokInitiateCheckout, tiktokAddPaymentInfo, buildTikTokContent } from '@/lib/tiktok-pixel';
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
    if (price === null || price === undefined) return '';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '';
    return `৳${num.toFixed(0)}`;
}

function getIconComponent(iconName: string | null, className: string = 'h-5 w-5') {
    if (!iconName) return null;
    const pascalCaseName = iconName
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
    const IconComponent = (Icons as Record<string, any>)[pascalCaseName];
    if (IconComponent) return <IconComponent className={className} />;
    return null;
}

function getYouTubeEmbedUrl(url: string | null): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function LandingPageV2() {
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
    const [featureImageIndex, setFeatureImageIndex] = useState(0);
    const [selectedReviewIndex, setSelectedReviewIndex] = useState(0);

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

    useEffect(() => {
        if (allSelectedZones.length > 0) {
            if (!allSelectedZones.includes(deliveryZone)) setDeliveryZone(allSelectedZones[0]);
        } else {
            setDeliveryZone('Default');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allSelectedZones]);

    // Countdown
    useEffect(() => {
        if (!landingPage.countdown_enabled || !landingPage.countdown_end_time) return;
        const calc = () => {
            const diff = new Date(landingPage.countdown_end_time as string).getTime() - Date.now();
            if (diff <= 0) { setCountdownRemaining(null); return; }
            setCountdownRemaining({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
            });
        };
        calc();
        const interval = setInterval(calc, 1000);
        return () => clearInterval(interval);
    }, [landingPage.countdown_enabled, landingPage.countdown_end_time]);

    function getItemPrice(productId: number): number {
        if (productId === product.id) return parseFloat(activePrice);
        const extra = extraProducts.find((p) => p.id === productId);
        if (!extra) return 0;
        const variantId = extraVariants[productId] ?? null;
        if (variantId) {
            const v = extra.variants.find((v) => v.id === variantId);
            if (v) return parseFloat(v.price);
        }
        return parseFloat(extra.price);
    }

    const hasMultipleProducts = extraProducts.length > 0;
    const primaryItem = selectedItems.find((i) => i.product_id === product.id);
    const primaryQty = primaryItem?.quantity ?? quantity;

    const missingVariant = selectedItems.filter((i) => i.selected).some((i) => {
        if (i.product_id === product.id) return variants.length > 0 && selectedVariantId === null;
        const ep = extraProducts.find((p) => p.id === i.product_id);
        return ep && ep.variants.length > 0 && (extraVariants[i.product_id] ?? null) === null;
    });

    const subtotal = selectedItems.filter((i) => i.selected).reduce((sum, i) => sum + getItemPrice(i.product_id) * i.quantity, 0);

    const shipping = (() => {
        if (freeShippingEnabled && freeShippingAmount > 0 && subtotal >= freeShippingAmount) return 0;
        if (!deliveryZone) return 0;
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
                if (ep && !ep.free_shipping) zones = ep.shipping_zones;
            }
            const matched = zones.find((z) => z.zone === deliveryZone);
            if (matched && Number(matched.charge) > maxCharge) maxCharge = Number(matched.charge);
        });
        return maxCharge;
    })();

    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const total = subtotal + shipping - couponDiscount;

    function updateSelectedItem(productId: number, changes: Partial<{ quantity: number; selected: boolean }>) {
        setSelectedItems((prev) => prev.map((i) => i.product_id === productId ? { ...i, ...changes } : i));
        if (productId === product.id && changes.quantity !== undefined) setQuantity(changes.quantity);
    }

    // GTM
    const gtmItem = useMemo(() => {
        const variantLabel = selectedVariant ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ') : null;
        return buildItem(product.id, product.name, parseFloat(activePrice), primaryQty, {
            category: product.category?.name, variant: variantLabel,
            originalPrice: activeOriginalPrice ? parseFloat(activeOriginalPrice) : null,
        });
    }, [product.id, product.name, activePrice, primaryQty, selectedVariant, activeOriginalPrice, product.category?.name]);

    const viewItemFiredRef = useRef(false);
    useEffect(() => {
        if (viewItemFiredRef.current) return;
        viewItemFiredRef.current = true;
        gtmViewItem(gtmItem, viewEventId || undefined);
        pixelViewContent([product.id], product.name, parseFloat(String(activePrice)), viewEventId || undefined);
        tiktokViewContent([buildTikTokContent(product.id, 1, parseFloat(String(activePrice)), product.name)], parseFloat(String(activePrice)), viewEventId || undefined);
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

    const gtmCheckoutDataRef = useRef({ gtmItem, total });
    useEffect(() => { gtmCheckoutDataRef.current = { gtmItem, total }; }, [gtmItem, total]);

    const beginFiredRef = useRef(false);
    useEffect(() => {
        const el = checkoutRef.current;
        if (!el) return;
        const observer = new IntersectionObserver((entries) => {
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
                        pixelInitiateCheckout([product.id], item.quantity, t, [buildContent(product.id, item.quantity, item.price)], eventId);
                        tiktokInitiateCheckout([buildTikTokContent(product.id, item.quantity, item.price, product.name)], t, eventId);
                    })
                    .catch(() => {
                        gtmBeginCheckout([item], t);
                        pixelInitiateCheckout([product.id], item.quantity, t, [buildContent(product.id, item.quantity, item.price)]);
                        tiktokInitiateCheckout([buildTikTokContent(product.id, item.quantity, item.price, product.name)], t);
                    });
            }
        }, { threshold: 0.2 });
        observer.observe(el);
        return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Capture UTM params from the landing URL into sessionStorage on first load.
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

    const selectedPaymentMethod = serverMethods.find((m) => m.slug === data.payment_method);
    const paidAmount = selectedPaymentMethod?.requires_payment_details && data.payment_amount ? Math.min(parseFloat(data.payment_amount) || 0, total) : 0;
    const dueAmount = Math.max(0, total - paidAmount);

    const filteredZones = useMemo(() => {
        return filterShippingZoneNamesForDistrict(data.district, allSelectedZones, shippingZoneClasses);
    }, [allSelectedZones, data.district, shippingZoneClasses]);

    const districtOptions = useMemo(() => {
        return buildDistrictOptions(bangladeshDistricts, shippingZoneClasses);
    }, [shippingZoneClasses]);

    useEffect(() => {
        if (filteredZones.length > 0) {
            if (!filteredZones.includes(deliveryZone)) setDeliveryZone(filteredZones[0]);
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

    function handlePhoneChange(value: string) {
        const cleaned = value.replace(/\D/g, '').slice(0, 11);
        setData('phone', cleaned);
        setCheckedPhone(cleaned);
    }

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (districtRef.current && !districtRef.current.contains(e.target as Node)) setDistrictOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (phoneCheckRef.current) clearTimeout(phoneCheckRef.current);
        if (checkedPhone.length !== 11) { setPhoneRestricted(false); setPhoneCheckLoading(false); return; }
        setPhoneCheckLoading(true);
        phoneCheckRef.current = setTimeout(async () => {
            try {
                const res = await fetch('/checkout/check-phone', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '', 'Accept': 'application/json' },
                    body: JSON.stringify({ phone: checkedPhone }),
                });
                const json = await res.json();
                setPhoneRestricted(!!json.restricted);
                setPhoneCheckLoading(false);
                if (json.restricted) {
                    const detailMethod = serverMethods.find((m) => m.requires_payment_details);
                    if (detailMethod) setData('payment_method', detailMethod.slug);
                }
            } catch { setPhoneRestricted(false); setPhoneCheckLoading(false); }
        }, 500);
        return () => { if (phoneCheckRef.current) clearTimeout(phoneCheckRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkedPhone]);

    const paymentMethodOptions = useMemo(() => {
        let methods = serverMethods;
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
        if (phoneRestricted) methods = methods.filter((m) => m.requires_payment_details);
        return methods;
    }, [phoneRestricted, serverMethods, selectedItems, product, extraProducts]);

    useEffect(() => {
        if (paymentMethodOptions.length > 0 && !paymentMethodOptions.find((m) => m.slug === data.payment_method)) {
            setData('payment_method', paymentMethodOptions[0].slug);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentMethodOptions]);

    const shippingCompleteFiredRef = useRef(false);
    useEffect(() => {
        if (shippingCompleteFiredRef.current || !data.first_name.trim() || !data.phone.trim() || !data.address.trim() || !deliveryZone) return;
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

    const prevPaymentRef = useRef('');
    useEffect(() => {
        if (!data.payment_method || data.payment_method === prevPaymentRef.current) return;
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

    async function handleApplyCoupon() {
        if (!couponCode.trim()) return;
        setCouponLoading(true); setCouponError('');
        try {
            const productIds = selectedItems.filter((i) => i.selected).map((i) => i.product_id);
            const res = await fetch('/coupon/apply', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '', 'Accept': 'application/json' }, body: JSON.stringify({ code: couponCode.trim(), subtotal, product_ids: productIds }) });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message || 'Invalid coupon code.');
            setCouponDiscount(d.discount); setAppliedCoupon(d.code); setCouponError('');
        } catch (err: any) { setCouponDiscount(0); setAppliedCoupon(''); setCouponError(err.message || 'Invalid coupon code.'); }
        finally { setCouponLoading(false); }
    }

    function handleRemoveCoupon() { setCouponCode(''); setCouponDiscount(0); setAppliedCoupon(''); setCouponError(''); }

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
                    variant_id: i.product_id === product.id ? selectedVariantId : (extraVariants[i.product_id] ?? null)
                })),
                delivery_zone: deliveryZone,
                coupon_code: appliedCoupon || undefined,
                ...freshUtmData,
            }));
        } else {
            transform((formData) => ({
                ...formData,
                variant_id: selectedVariantId,
                quantity: primaryQty,
                delivery_zone: deliveryZone,
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

    const heroImages = (landingPage.hero_images && landingPage.hero_images.length > 0)
        ? landingPage.hero_images.map((path) => ({ src: `/${path}` }))
        : [];
    const productFirstImage = product.images?.[0]?.image_path ? `/${product.images[0].image_path}` : null;
    const heroImage = heroImages.length > 0 ? heroImages[0].src : productFirstImage;

    return (
        <>
            <Head title={landingPage.title} />
            {gtmSsUrl ? <GtmSsScript gtmId={gtmId} gtmSsUrl={gtmSsUrl} /> : <GtmScript gtmId={gtmId} />}
            <MetaPixelScript pixelId={metaPixelId} pixelExternalId={pixelExternalId} />
            <TikTokPixelScript pixelId={tiktokPixelId} />

            <div className="min-h-screen bg-white text-gray-900">
                {/* ── Sticky Top Bar ── */}
                <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
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
                        <a href={`tel:${(landingPage.phone || '').replace(/[^+\d]/g, '')}`} className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary sm:text-sm">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{landingPage.phone}</span>
                        </a>
                    </div>
                </header>

                {/* ── 1. Hero Section — Light BG with question hook ── */}
                <section className="border-b border-gray-100 bg-linear-to-b from-primary/5 to-white">
                    <div className="mx-auto max-w-5xl px-4 py-10 text-center md:py-16">
                        {landingPage.subtitle && (
                            <p className="mx-auto mb-3 max-w-xl text-sm font-medium uppercase tracking-wider text-primary md:text-base">{landingPage.subtitle}</p>
                        )}
                        <h1 className="mb-3 text-2xl font-extrabold text-gray-900 md:text-4xl">{landingPage.title}</h1>
                        {landingPage.hero_text && (
                            <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-gray-500 md:text-xl">{landingPage.hero_text}</p>
                        )}
                        <Button size="lg" onClick={scrollToCheckout} className="px-8 text-base shadow-lg">
                            {landingPage.order_now_text || 'Order Now'} <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </section>

                {/* ── 2. Product Showcase — Title + Images ── */}
                {heroImages.length > 0 && (
                    <section className="border-b border-gray-100 py-10 md:py-14">
                        <div className="mx-auto max-w-5xl px-4">
                            <h2 className="mb-6 text-center text-xl font-bold text-primary md:text-2xl">{landingPage.use_cases_title || product.name}</h2>
                            {/* Main image */}
                            <div className="mx-auto mb-4 max-w-2xl overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                <img src={heroImages[selectedImageIndex]?.src} alt={product.name} className="h-auto w-full object-cover" />
                            </div>
                            {/* Thumbnails */}
                            {heroImages.length > 1 && (
                                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                                    {heroImages.map((img, i) => (
                                        <button key={i} onClick={() => setSelectedImageIndex(i)} className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-colors sm:h-16 sm:w-16 ${i === selectedImageIndex ? 'border-primary' : 'border-gray-200'}`}>
                                            <img src={img.src} alt="" className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {/* CTA below images */}
                            <div className="mt-6 text-center">
                                <Button size="lg" onClick={scrollToCheckout} className="px-8 shadow-lg">
                                    {landingPage.order_now_text || 'Order Now'} <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── 3. Two-Column: Features List + Video ── */}
                {((landingPage.features && landingPage.features.length > 0) || landingPage.hero_video) && (
                    <section className="border-b border-gray-100 bg-gray-50 py-10 md:py-14">
                        <div className="mx-auto max-w-5xl px-4">
                            <div className="grid gap-8 md:grid-cols-2">
                                {/* Left — Features as bordered card */}
                                {landingPage.features && landingPage.features.length > 0 && (
                                    <div className="rounded-xl border border-primary/20 bg-white p-5 shadow-sm">
                                        <h3 className="mb-4 text-center text-lg font-bold text-primary">{landingPage.features_title || 'Features'}</h3>
                                        <ul className="space-y-3">
                                            {landingPage.features.map((f, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        {getIconComponent(f.icon_name || null, 'h-3.5 w-3.5') || <CheckCircle className="h-3.5 w-3.5" />}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                                                        {f.desc && <p className="text-xs text-gray-500">{f.desc}</p>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {/* Right — Video (inline embed) */}
                                {landingPage.hero_video && (() => {
                                    const embedUrl = getYouTubeEmbedUrl(landingPage.hero_video);
                                    if (!embedUrl) return null;
                                    return (
                                        <div className="flex items-center justify-center">
                                            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                <iframe src={embedUrl} className="h-full w-full" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={landingPage.title} />
                                            </div>
                                        </div>
                                    );
                                })()}
                                {/* If no video, show hero image gallery or features_subtitle */}
                                {!landingPage.hero_video && (
                                    <div className="flex items-center justify-center">
                                        {heroImages.length > 0 ? (
                                            <div className="w-full space-y-2">
                                                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                    <img src={heroImages[featureImageIndex]?.src} alt={product.name} className="h-auto w-full object-cover" />
                                                </div>
                                                {heroImages.length > 1 && (
                                                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                                                        {heroImages.map((img, i) => (
                                                            <button key={i} onClick={() => setFeatureImageIndex(i)} className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-colors sm:h-16 sm:w-16 ${i === featureImageIndex ? 'border-primary' : 'border-gray-200'}`}>
                                                                <img src={img.src} alt="" className="h-full w-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : productFirstImage ? (
                                            <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                <img src={productFirstImage} alt={product.name} className="h-auto w-full object-cover" />
                                            </div>
                                        ) : landingPage.features_subtitle ? (
                                            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                                                <p className="text-base font-medium text-gray-700">{landingPage.features_subtitle}</p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── 4. Why Buy — Highlighted box ── */}
                {landingPage.why_buy && landingPage.why_buy.length > 0 && (
                    <section className="border-b border-gray-100 py-10 md:py-14">
                        <div className="mx-auto max-w-5xl px-4">
                            {landingPage.why_buy_super_text && (
                                <p className="mb-1 text-center text-sm font-semibold uppercase tracking-wider text-primary">{landingPage.why_buy_super_text}</p>
                            )}
                            <h2 className="mb-2 text-center text-xl font-bold text-gray-900 md:text-2xl">{landingPage.why_buy_title || 'Why Buy From Us?'}</h2>
                            {landingPage.why_buy_subtitle && (
                                <p className="mx-auto mb-6 max-w-lg text-center text-sm text-gray-500">{landingPage.why_buy_subtitle}</p>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                                {landingPage.why_buy.map((item, i) => (
                                    <div key={i} className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            {getIconComponent(item.icon_name || null, 'h-6 w-6 text-primary') || <ThumbsUp className="h-6 w-6 text-primary" />}
                                        </div>
                                        <h4 className="mb-1 text-sm font-bold text-gray-800">{item.title}</h4>
                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── 5. Two-Column: Specifications + Size/Price ── */}
                {landingPage.specifications && landingPage.specifications.length > 0 && (
                    <section className="border-b border-gray-100 bg-gray-50 py-10 md:py-14">
                        <div className="mx-auto max-w-5xl px-4">
                            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 md:text-2xl">{landingPage.specifications_title || 'Specifications'}</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                {landingPage.specifications.map((group, i) => (
                                    <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <div className="mb-3 flex items-center gap-2">
                                            {getIconComponent(group.icon_name || null, 'h-5 w-5 text-primary') || <ListChecks className="h-5 w-5 text-primary" />}
                                            <h3 className="text-base font-bold text-gray-800">{group.title}</h3>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {group.specs.map((spec, j) => (
                                                <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                                    <span>{spec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── 5b. Review Images Gallery ── */}
                {landingPage.review_images && landingPage.review_images.length > 0 && (
                    <section className="border-b border-gray-100 py-10 md:py-14">
                        <div className="mx-auto max-w-5xl px-4">
                            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 md:text-2xl">{landingPage.review_images_title || 'Customer Reviews'}</h2>
                            {/* Main large image */}
                            <div className="mx-auto mb-4 max-w-2xl overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                <img src={`/${landingPage.review_images[selectedReviewIndex]}`} alt={`Customer review ${selectedReviewIndex + 1}`} className="h-auto w-full object-cover" />
                            </div>
                            {/* Thumbnails */}
                            {landingPage.review_images.length > 1 && (
                                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                                    {landingPage.review_images.map((img, i) => (
                                        <button key={i} onClick={() => setSelectedReviewIndex(i)} className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-16 sm:w-16 ${i === selectedReviewIndex ? 'border-primary' : 'border-gray-200'}`}>
                                            <img src={`/${img}`} alt="" className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── 6. Authentic + Delivery Badges ── */}
                {(landingPage.authentic_badge_text || landingPage.delivery_badge_text) && (
                    <section className="border-b border-gray-100 py-6">
                        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 px-4">
                            {landingPage.authentic_badge_text && (
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    {getIconComponent(landingPage.authentic_badge_icon || 'shield-check', 'h-5 w-5 text-primary')}
                                    <span>{landingPage.authentic_badge_text}</span>
                                </div>
                            )}
                            {landingPage.delivery_badge_text && (
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    {getIconComponent(landingPage.delivery_badge_icon || 'truck', 'h-5 w-5 text-primary')}
                                    <span>{landingPage.delivery_badge_text}</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── 7. Checkout Banner ── */}
                {landingPage.checkout_banner_text && (
                    <section className="bg-primary py-6 text-center">
                        <div className="mx-auto max-w-4xl px-4">
                            <p className="text-base font-bold text-primary-foreground md:text-lg">{landingPage.checkout_banner_text}</p>
                            <div className="mt-3">
                                <Button size="lg" variant="secondary" onClick={scrollToCheckout} className="px-8 shadow-lg">
                                    {landingPage.order_now_text || 'Order Now'} <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── WhatsApp + Call Buttons ── */}
                {(siteBranding?.whatsapp || siteBranding?.phone) && (
                    <div className="border-b border-gray-100 py-6">
                        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4">
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

                {/* ── 8. Checkout Section ── */}
                <section ref={checkoutRef} className="bg-gray-50 py-10 md:py-14">
                    <div className="mx-auto max-w-5xl px-4">
                        <h2 className="mb-6 text-center text-xl font-bold text-gray-900 md:text-2xl">
                            {landingPage.checkout_title || 'Order Now'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Left — Form */}
                                <div className="space-y-5">
                                    {/* Blocked warning */}
                                    {(isBlocked || errors.blocked) && (
                                        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                                            <strong>⚠</strong> {errors.blocked || 'Your access has been restricted.'}
                                        </div>
                                    )}

                                    {/* Shipping info */}
                                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <h3 className="mb-4 text-sm font-bold text-gray-800">{labels?.shippingInfo ?? 'Shipping Information'}</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="firstName">{labels?.fullName ?? 'Full Name'} *</Label>
                                                <Input id="firstName" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} placeholder="John Doe" className="mt-1" />
                                                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="phone">{labels?.phoneNumber ?? 'Phone Number'} *</Label>
                                                <Input id="phone" type="tel" value={data.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="01XXXXXXXXX" className="mt-1" maxLength={11} inputMode="numeric" />
                                                {phoneCheckLoading && <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">ℹ Verifying your phone number for Cash on Delivery eligibility...</p>}
                                                {data.phone && !data.phone.startsWith('01') && <p className="mt-1 text-xs text-red-500">Phone number must start with 01 (e.g., 01XXXXXXXXX). Do not enter +88 or 88.</p>}
                                                {data.phone && data.phone.startsWith('01') && data.phone.length !== 11 && <p className="mt-1 text-xs text-red-500">Phone number must be exactly 11 digits.</p>}
                                                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                            </div>
                                            {labels?.emailEnabled && (
                                                <div>
                                                    <Label htmlFor="email">{labels?.email ?? 'Email Address'}</Label>
                                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="example@email.com" className="mt-1" />
                                                    {labels?.emailHelpText && <p className="mt-1 text-xs text-gray-500">{labels.emailHelpText}</p>}
                                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                                </div>
                                            )}
                                            <div ref={districtRef}>
                                                <Label htmlFor="district">{labels?.district ?? 'District'} *</Label>
                                                <div className="relative mt-1">
                                                    <Input id="district" value={districtOpen ? districtSearch : data.district} onChange={(e) => { setDistrictSearch(e.target.value); setDistrictOpen(true); }} onFocus={() => { setDistrictOpen(true); setDistrictSearch(data.district); }} placeholder="Search district..." autoComplete="off" />
                                                    {districtOpen && (() => {
                                                        const filtered = districtOptions.filter((d) => d.toLowerCase().includes(districtSearch.toLowerCase()));
                                                        return filtered.length > 0 ? (
                                                            <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                                {filtered.map((d) => (
                                                                    <li key={d} onClick={() => { setData('district', d); setDistrictSearch(d); setDistrictOpen(false); }} className={`cursor-pointer px-3 py-2 text-sm hover:bg-primary/10 ${data.district === d ? 'bg-primary/10 font-medium' : ''}`}>{d}</li>
                                                                ))}
                                                            </ul>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                {errors.district && <p className="mt-1 text-xs text-red-500">{errors.district}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="address">{labels?.address ?? 'Address'} *</Label>
                                                <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="Full address" className="mt-1" />
                                                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
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
                                                {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <h3 className="mb-3 text-sm font-bold text-gray-800">{labels?.paymentMethod ?? 'Payment Method'}</h3>
                                        {phoneRestricted && (
                                            <div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800">
                                                <strong>⚠</strong> {labels?.codRestrictedMessage ?? 'Based on your phone number history, Cash on Delivery is not available.'}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {paymentMethodOptions.map((method) => (
                                                <button key={method.slug} type="button" onClick={() => setData('payment_method', method.slug)} className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-center transition-colors ${data.payment_method === method.slug ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                                                    {method.logo ? (
                                                        <img src={method.logo} alt={method.name} className="h-8 w-8 object-contain" />
                                                    ) : method.icon && (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[method.icon] ? (
                                                        (() => { const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[method.icon!]; return <IconComp className="h-5 w-5" />; })()
                                                    ) : (
                                                        <Wallet className="h-5 w-5" />
                                                    )}
                                                    <span className="text-xs font-medium">{method.name}</span>
                                                    {method.description && <span className="text-[10px] text-gray-400">{method.description}</span>}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.payment_method && <p className="mt-2 text-xs text-red-500">{errors.payment_method}</p>}

                                        {data.payment_method && (() => {
                                            const sm = paymentMethodOptions.find((m) => m.slug === data.payment_method);
                                            if (!sm?.requires_payment_details) return null;
                                            return (
                                                <div className="mt-4 space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                                                    {sm?.account_number && <p className="text-sm font-semibold text-primary">{sm.account_label || `Send to: ${sm.account_number}`}</p>}
                                                    <p className="text-xs font-medium text-primary">{sm?.instructions_text || 'Send payment and enter details below:'}</p>
                                                    <div>
                                                        <Label htmlFor="payment_phone">{sm?.payment_number_label || 'Payment Number'}</Label>
                                                        <Input id="payment_phone" type="tel" value={data.payment_phone} onChange={(e) => setData('payment_phone', e.target.value)} placeholder="01XXXXXXXXX" className="mt-1" />
                                                        {errors.payment_phone && <p className="mt-1 text-xs text-red-500">{errors.payment_phone}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="payment_amount">{sm?.payment_amount_label || 'Payment Amount (৳)'}</Label>
                                                        <Input id="payment_amount" type="number" min={0} step="any" value={data.payment_amount} onChange={(e) => setData('payment_amount', e.target.value)} placeholder="0" className="mt-1" />
                                                        {errors.payment_amount && <p className="mt-1 text-xs text-red-500">{errors.payment_amount}</p>}
                                                    </div>
                                                    <div>
                                                        <Label>Payment Screenshot <span className="font-normal text-red-500">*</span></Label>
                                                        {screenshotPreview ? (
                                                            <div className="relative mt-1 inline-block">
                                                                <img src={screenshotPreview} alt="Screenshot" className="h-24 w-auto rounded-lg border" />
                                                                <button type="button" onClick={() => { setData('payment_screenshot', null); setScreenshotPreview(null); }} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white"><X className="h-3.5 w-3.5" /></button>
                                                            </div>
                                                        ) : (
                                                            <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/30 px-3 py-2.5 text-sm text-gray-400 hover:border-primary/50">
                                                                <Upload className="h-4 w-4" /><span>Upload screenshot</span>
                                                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file = e.target.files?.[0] || null; setData('payment_screenshot', file); setScreenshotPreview(file ? URL.createObjectURL(file) : null); }} className="hidden" />
                                                            </label>
                                                        )}
                                                        {!data.payment_screenshot && <p className="mt-1 text-xs text-red-500">Payment screenshot is required.</p>}
                                                        {errors.payment_screenshot && <p className="mt-1 text-xs text-red-500">{errors.payment_screenshot}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Right — Product + Order Summary */}
                                <div className="space-y-5">
                                    {/* Product cards */}
                                    <div className={`grid gap-4 ${hasMultipleProducts ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                        {/* Primary product */}
                                        <div className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-colors ${(primaryItem?.selected ?? true) ? 'border-primary/50' : 'border-gray-200'}`}>
                                            {hasMultipleProducts && (
                                                <div className="mb-3 flex items-center gap-2">
                                                    <button type="button" role="checkbox" aria-checked={primaryItem?.selected ?? true} onClick={() => updateSelectedItem(product.id, { selected: !(primaryItem?.selected ?? true) })} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${(primaryItem?.selected ?? true) ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                                                        {(primaryItem?.selected ?? true) && <CheckCircle className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <span className="text-xs font-medium text-gray-400">Add to order</span>
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                    {productFirstImage ?? heroImage ? (
                                                        <img src={productFirstImage ?? heroImage!} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2">{product.name}</h3>
                                                    {product.category && <p className="text-xs text-gray-400">{product.category.name}</p>}
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="text-base font-bold text-primary">{formatPrice(activePrice)}</span>
                                                        {activeOriginalPrice && parseFloat(activeOriginalPrice) > parseFloat(activePrice) && (
                                                            <span className="text-xs text-gray-400 line-through">{formatPrice(activeOriginalPrice)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Variants */}
                                            {variants.length > 0 && (
                                                <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                                                    {sizes.length > 0 && (
                                                        <div>
                                                            <span className="mb-1.5 block text-xs font-medium text-gray-400">{product.size_label || 'Size'}</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {sizes.map((size) => {
                                                                    const mv = variants.filter((v) => v.size === size);
                                                                    const isSelected = selectedVariant?.size === size;
                                                                    return (
                                                                        <button key={size} type="button" onClick={() => { const match = mv.find((v) => !selectedVariant?.color || v.color === selectedVariant.color) || mv[0]; setSelectedVariantId(match.id); }} className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>{size}</button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {colors.length > 0 && (
                                                        <div>
                                                            <span className="mb-1.5 block text-xs font-medium text-gray-400">{product.color_label || 'Color'}</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {colors.map((color) => {
                                                                    const mv = variants.filter((v) => v.color === color);
                                                                    const isSelected = selectedVariant?.color === color;
                                                                    return (
                                                                        <button key={color} type="button" onClick={() => { const match = mv.find((v) => !selectedVariant?.size || v.size === selectedVariant.size) || mv[0]; setSelectedVariantId(match.id); }} className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>{color}</button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Stock Status Badge */}
                                            <div className="mt-3 border-t border-gray-100 pt-3">
                                                {isOutOfStock ? (
                                                    <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                                                ) : activeStockQuantity ? (
                                                    <span className="text-green-600 text-sm font-medium">In Stock ({activeStockQuantity} Available)</span>
                                                ) : (
                                                    <span className="text-blue-600 text-sm font-medium">In Stock (Unlimited)</span>
                                                )}
                                            </div>

                                            {/* Quantity */}
                                            <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                                                <span className="text-xs font-medium text-gray-400">Qty:</span>
                                                <div className="flex items-center rounded-md border border-gray-200">
                                                    <button type="button" onClick={() => updateSelectedItem(product.id, { quantity: Math.max(1, (primaryItem?.quantity ?? 1) - 1) })} className="px-2.5 py-1 text-gray-400 hover:text-gray-700"><Minus className="h-3.5 w-3.5" /></button>
                                                    <span className="w-8 text-center text-sm font-medium">{primaryItem?.quantity ?? 1}</span>
                                                    <button type="button" onClick={() => updateSelectedItem(product.id, { quantity: (primaryItem?.quantity ?? 1) + 1 })} className="px-2.5 py-1 text-gray-400 hover:text-gray-700"><Plus className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Extra products */}
                                        {extraProducts.map((ep) => {
                                            const item = selectedItems.find((i) => i.product_id === ep.id);
                                            const isSelected = item?.selected ?? false;
                                            const itemQty = item?.quantity ?? 1;
                                            return (
                                                <div key={ep.id} className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-colors ${isSelected ? 'border-primary/50' : 'border-gray-200'}`}>
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <button type="button" role="checkbox" aria-checked={isSelected} onClick={() => updateSelectedItem(ep.id, { selected: !isSelected })} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                                                            {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                                                        </button>
                                                        <span className="text-xs font-medium text-gray-400">Add to order</span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                            {ep.image ? <img src={ep.image} alt={ep.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-sm font-bold text-gray-800 line-clamp-2">{ep.name}</h3>
                                                            <span className="mt-1 text-base font-bold text-primary">{formatPrice(getItemPrice(ep.id))}</span>
                                                        </div>
                                                    </div>
                                                    {ep.variants.length > 0 && (() => {
                                                        const epSizes = [...new Set(ep.variants.filter((v) => v.size).map((v) => v.size!))];
                                                        const epColors = [...new Set(ep.variants.filter((v) => v.color).map((v) => v.color!))];
                                                        const epSelectedId = extraVariants[ep.id] ?? null;
                                                        const epSelected = ep.variants.find((v) => v.id === epSelectedId) ?? null;
                                                        return (
                                                            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                                                                {epSizes.length > 0 && (<div><span className="mb-1.5 block text-xs font-medium text-gray-400">{ep.size_label || 'Size'}</span><div className="flex flex-wrap gap-2">{epSizes.map((size) => { const mv = ep.variants.filter((v) => v.size === size); const isSel = epSelected?.size === size; return (<button key={size} type="button" onClick={() => { const match = mv.find((v) => !epSelected?.color || v.color === epSelected.color) || mv[0]; setExtraVariants((prev) => ({ ...prev, [ep.id]: match.id })); }} className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${isSel ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>{size}</button>); })}</div></div>)}
                                                                {epColors.length > 0 && (<div><span className="mb-1.5 block text-xs font-medium text-gray-400">{ep.color_label || 'Color'}</span><div className="flex flex-wrap gap-2">{epColors.map((color) => { const mv = ep.variants.filter((v) => v.color === color); const isSel = epSelected?.color === color; return (<button key={color} type="button" onClick={() => { const match = mv.find((v) => !epSelected?.size || v.size === epSelected.size) || mv[0]; setExtraVariants((prev) => ({ ...prev, [ep.id]: match.id })); }} className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${isSel ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>{color}</button>); })}</div></div>)}
                                                            </div>
                                                        );
                                                    })()}
                                                    {ep.variants.length > 0 && isSelected && (extraVariants[ep.id] ?? null) === null && <p className="mt-2 text-xs font-medium text-red-500">Please select a variant.</p>}
                                                    {(() => {
                                                        const epSelectedId = extraVariants[ep.id] ?? null;
                                                        const epSelectedVariant = epSelectedId ? ep.variants.find((v) => v.id === epSelectedId) : null;
                                                        const epActiveInStock = epSelectedVariant ? epSelectedVariant.in_stock : ep.in_stock;
                                                        const epActiveStockQuantity = epSelectedVariant ? epSelectedVariant.stock_quantity : ep.stock_quantity;
                                                        const epIsOutOfStock = !epActiveInStock || epActiveStockQuantity === 0;

                                                        return (
                                                            <div className="mt-3 border-t border-gray-100 pt-3">
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
                                                    <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                                                        <span className="text-xs font-medium text-gray-400">Qty:</span>
                                                        <div className="flex items-center rounded-md border border-gray-200">
                                                            <button type="button" onClick={() => updateSelectedItem(ep.id, { quantity: Math.max(1, itemQty - 1) })} className="px-2.5 py-1 text-gray-400 hover:text-gray-700"><Minus className="h-3.5 w-3.5" /></button>
                                                            <span className="w-8 text-center text-sm font-medium">{itemQty}</span>
                                                            <button type="button" onClick={() => updateSelectedItem(ep.id, { quantity: itemQty + 1 })} className="px-2.5 py-1 text-gray-400 hover:text-gray-700"><Plus className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Order Summary */}
                                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <h3 className="mb-3 text-sm font-bold text-gray-800">{labels?.yourOrder ?? 'Order Summary'}</h3>

                                        {freeShippingEnabled && freeShippingAmount > 0 && (
                                            subtotal >= freeShippingAmount ? (
                                                <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                                                    <Truck className="h-3.5 w-3.5 shrink-0" /><span className="font-medium">Free shipping applied!</span>
                                                </div>
                                            ) : (
                                                <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                                                    <div className="flex items-center gap-2 text-primary"><Truck className="h-3.5 w-3.5 shrink-0" /><span>Add <strong>৳{(freeShippingAmount - subtotal).toFixed(0)}</strong> more for free shipping</span></div>
                                                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-primary/20"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.min(100, (subtotal / freeShippingAmount) * 100)}%` }} /></div>
                                                </div>
                                            )
                                        )}

                                        {filteredZones.length > 0 && (
                                            <div className="mb-3">
                                                <p className="mb-2 text-xs font-medium text-gray-400">Delivery Area</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {filteredZones.map((zone) => (
                                                        <button key={zone} type="button" onClick={() => setDeliveryZone(zone)} className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${deliveryZone === zone ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}>{zone}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 text-sm">
                                            {hasMultipleProducts && selectedItems.filter((i) => i.selected).map((i) => {
                                                const name = i.product_id === product.id ? product.name : (extraProducts.find((ep) => ep.id === i.product_id)?.name ?? '');
                                                return (<div key={i.product_id} className="flex justify-between text-gray-500"><span className="max-w-[60%] truncate">{name} ×{i.quantity}</span><span>{formatPrice(getItemPrice(i.product_id) * i.quantity)}</span></div>);
                                            })}
                                            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                                            <div className="flex justify-between text-gray-500"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>

                                            {(hasGlobalCoupons || selectedItems.filter((i) => i.selected).some((i) => (couponProductIds ?? []).includes(i.product_id))) && (
                                                <div className="pt-1">
                                                    {appliedCoupon ? (
                                                        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                                                            <div className="flex items-center gap-2 text-xs text-green-700"><Tag className="h-3 w-3" /><span className="font-medium">{appliedCoupon}</span><span>−{formatPrice(couponDiscount)}</span></div>
                                                            <button type="button" onClick={handleRemoveCoupon} className="text-green-700 hover:text-red-500"><X className="h-3 w-3" /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            <div className="flex gap-2">
                                                                <Input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }} placeholder="Coupon code" className="h-8 text-xs" />
                                                                <Button type="button" variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="h-8 shrink-0 text-xs">{couponLoading ? '...' : 'Apply'}</Button>
                                                            </div>
                                                            {couponError && <p className="text-[10px] text-red-500">{couponError}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatPrice(couponDiscount)}</span></div>}

                                            <Separator />
                                            <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-primary">{formatPrice(total)}</span></div>
                                            {paidAmount > 0 && (
                                                <>
                                                    <div className="flex justify-between text-sm text-green-600"><span>Advance Paid</span><span>−{formatPrice(paidAmount)}</span></div>
                                                    <Separator />
                                                    <div className="flex justify-between text-base font-bold"><span>Due</span><span className={dueAmount === 0 ? 'text-green-600' : 'text-primary'}>{dueAmount === 0 ? '৳0' : formatPrice(dueAmount)}</span></div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {missingVariant && <p className="text-center text-xs text-red-500">Please select a variant (size/color) for all selected products before ordering.</p>}

                                    <Button type="submit" size="lg" disabled={processing || phoneCheckLoading || isOutOfStock || selectedItems.filter((i) => i.selected).length === 0 || missingVariant} className="w-full text-base font-bold shadow-lg">
                                        <Lock className="mr-2 h-4 w-4" />
                                        {phoneCheckLoading ? 'Verifying Phone...' : processing ? 'Placing Order...' : `${landingPage.order_now_text || 'Order Now'} — ${paidAmount > 0 ? formatPrice(dueAmount) + ' Due' : formatPrice(total)}`}
                                    </Button>

                                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
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
                <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
                    <p>
                        &copy; {new Date().getFullYear()} {siteBranding?.title || 'Our Store'}. All rights reserved.
                        <br />
                        Develop & Maintain by{' '}
                        <a href="https://wa.me/8801518401677" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">Grow Ever</a>
                    </p>
                </footer>
            </div>


        </>
    );
}
