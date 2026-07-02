import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    Battery,
    Bluetooth,
    Box,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Cpu,
    Headphones,
    Headset,
    Heart,
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
    Star,
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
import { ImageGallery } from '@/components/ecommerce/image-gallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { readUtmValue, persistUtmValue, utmKeys } from '@/lib/utm';
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
    if (price === null || price === undefined) return '';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '';
    return `৳${num.toFixed(0)}`;
}

function getIconComponent(iconName: string | null, className: string = 'h-5 w-5') {
    if (!iconName) return null;
    const pascalCaseName = iconName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
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

function FloatingSupportBtn({ siteBranding }: { siteBranding?: { title?: string; phone?: string; whatsapp?: string } }) {
    const [open, setOpen] = useState(false);
    const phone    = siteBranding?.phone?.trim();
    const whatsapp = siteBranding?.whatsapp?.trim()?.replace(/\D/g, '');
    if (!phone && !whatsapp) return null;
    return (
        <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2 md:bottom-6">
            {open && (
                <div className="mb-1 flex flex-col gap-2">
                    {whatsapp && (
                        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110" title="WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                        </a>
                    )}
                    {phone && (
                        <a href={`tel:${phone}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform hover:scale-110" title="Call Us">
                            <Phone className="h-4 w-4" />
                        </a>
                    )}
                </div>
            )}
            <button onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110" title="Support">
                {open ? <X className="h-4 w-4" /> : <Headset className="h-5 w-5" />}
            </button>
        </div>
    );
}

export default function LandingPageV3() {
    const {
        product,
        landingPage,
        paymentMethods: serverMethods,
        extraProducts = [],
        gtmId,
        gtmSsUrl,
        metaPixelId,
        pixelExternalId,
        tiktokPixelId,
        freeShippingAmount = 0,
        freeShippingEnabled = true,
        siteBranding,
        labels,
        hasGlobalCoupons,
        couponProductIds,
        isBlocked,
        shippingZones: serverZones = [],
        shippingZoneClasses = [],
        viewEventId,
    } = usePage<{
        product: Product;
        landingPage: LandingPageData;
        paymentMethods: PaymentMethodOption[];
        extraProducts: ExtraProduct[];
        gtmId?: string;
        gtmSsUrl?: string;
        metaPixelId?: string;
        pixelExternalId?: string;
        tiktokPixelId?: string;
        freeShippingAmount: number;
        freeShippingEnabled: boolean;
        siteBranding?: { title?: string; phone?: string; whatsapp?: string };
        labels?: Record<string, string>;
        hasGlobalCoupons?: boolean;
        couponProductIds?: number[];
        isBlocked?: boolean;
        shippingZones?: string[];
        shippingZoneClasses?: { name: string; districts?: string[] | null }[];
        viewEventId?: string;
    }>().props;

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
    const formRef = useRef<HTMLFormElement>(null);

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
                const effectiveFree = selectedVariant && selectedVariant.free_shipping !== null ? selectedVariant.free_shipping : product.free_shipping;
                const effectiveZones =
                    selectedVariant && selectedVariant.free_shipping === false
                        ? (selectedVariant.shipping_zones || [])
                        : selectedVariant && selectedVariant.free_shipping === true
                          ? []
                          : product.shipping_zones || [];
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
            if (diff <= 0) {
                setCountdownRemaining(null);
                return;
            }
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
                const effectiveFree = selectedVariant && selectedVariant.free_shipping !== null ? selectedVariant.free_shipping : product.free_shipping;
                if (!effectiveFree) {
                    zones =
                        selectedVariant && selectedVariant.free_shipping === false
                            ? (selectedVariant.shipping_zones || [])
                            : product.shipping_zones || [];
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
        setSelectedItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, ...changes } : i)));
        if (productId === product.id && changes.quantity !== undefined) setQuantity(changes.quantity);
    }

    // GTM
    const gtmItem = useMemo(() => {
        const variantLabel = selectedVariant ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ') : null;
        return buildItem(product.id, product.name, parseFloat(activePrice), primaryQty, {
            category: product.category?.name,
            variant: variantLabel,
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
        }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const gtmCheckoutDataRef = useRef({ gtmItem, total });
    useEffect(() => {
        gtmCheckoutDataRef.current = { gtmItem, total };
    }, [gtmItem, total]);

    const beginFiredRef = useRef(false);
    useEffect(() => {
        const el = checkoutRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !beginFiredRef.current) {
                    beginFiredRef.current = true;
                    const { gtmItem: item, total: t } = gtmCheckoutDataRef.current;
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
            },
            { threshold: 0.2 },
        );
        observer.observe(el);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Capture UTM params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        utmKeys.forEach((key) => {
            const val = params.get(key);
            if (val) persistUtmValue(key, val);
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
        utm_source: readUtmValue('utm_source'),
        utm_medium: readUtmValue('utm_medium'),
        utm_campaign: readUtmValue('utm_campaign'),
        utm_content: readUtmValue('utm_content'),
        utm_term: readUtmValue('utm_term'),
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
            keys.forEach((key) => {
                const value = sessionStorage.getItem(key) || '';
                if (value || data[key] === '') setData(key, value);
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
        if (checkedPhone.length !== 11) {
            setPhoneRestricted(false);
            setPhoneCheckLoading(false);
            return;
        }
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
                    if (detailMethod) setData('payment_method', detailMethod.slug);
                }
            } catch {
                setPhoneRestricted(false);
                setPhoneCheckLoading(false);
            }
        }, 500);
        return () => {
            if (phoneCheckRef.current) clearTimeout(phoneCheckRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkedPhone]);

    const paymentMethodOptions = useMemo(() => {
        let methods = serverMethods;
        const selectedProductIds = selectedItems.filter((i) => i.selected).map((i) => i.product_id);
        const allProducts = [
            { id: product.id, allowed_payment_methods: product.allowed_payment_methods ?? [] },
            ...extraProducts.map((p) => ({ id: p.id, allowed_payment_methods: p.allowed_payment_methods ?? [] })),
        ];
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
                body: JSON.stringify({ code: couponCode.trim(), subtotal, product_ids: productIds }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message || 'Invalid coupon code.');
            setCouponDiscount(d.discount);
            setAppliedCoupon(d.code);
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

        if (phoneRestricted && data.payment_method === 'cod') {
            toast.error('Cash on Delivery is not available for your phone number. Please select an alternative payment method.');
            return;
        }

        const freshUtmData: Record<string, string> = {};
        utmKeys.forEach((key) => {
            freshUtmData[key] = readUtmValue(key) || data[key] || '';
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

    const heroImages = (landingPage.hero_images && landingPage.hero_images.length > 0) ? landingPage.hero_images.map((path) => ({ src: `/${path}` })) : [];
    const productFirstImage = product.images?.[0]?.image_path ? `/${product.images[0].image_path}` : null;

    // Auto-cycle hero image every 4s
    useEffect(() => {
        if (heroImages.length <= 1) return;
        const timer = setInterval(() => {
            setSelectedImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [heroImages.length]);

    const embedUrl = getYouTubeEmbedUrl(landingPage.hero_video);

    return (
        <>
            <Head title={landingPage.title} />
            {gtmSsUrl ? <GtmSsScript gtmId={gtmId} gtmSsUrl={gtmSsUrl} /> : <GtmScript gtmId={gtmId} />}
            <MetaPixelScript pixelId={metaPixelId} pixelExternalId={pixelExternalId} />
            <TikTokPixelScript pixelId={tiktokPixelId} />

            <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">

                {/* ── Sticky Top Bar ── */}
                <header className="sticky top-0 z-50 bg-primary shadow-md">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5">
                        {/* Badge */}
                        <div className="flex min-w-0 shrink items-center gap-1 rounded-full bg-white/20 px-2 py-1 sm:gap-1.5 sm:px-3">
                            {landingPage.icon_name && getIconComponent(landingPage.icon_name, 'h-3 w-3 shrink-0 text-white sm:h-3.5 sm:w-3.5')}
                            <span className="truncate text-[9px] font-bold uppercase tracking-wider text-white sm:text-[10px]">{landingPage.badge_text || 'Limited Offer'}</span>
                        </div>

                        {/* Countdown — hide days on mobile */}
                        {countdownRemaining && (
                            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                                {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit, idx) => (
                                    <span key={unit} className={`flex items-center ${unit === 'days' ? 'hidden sm:flex' : ''}`}>
                                        {idx > 0 && <span className="mx-0.5 text-[10px] font-bold text-white/70">:</span>}
                                        <span className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[9px] font-bold text-white sm:h-6 sm:w-6 sm:text-[10px]">
                                            {String(countdownRemaining[unit]).padStart(2, '0')}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Phone */}
                        <a
                            href={`tel:${(landingPage.phone || '').replace(/[^+\d]/g, '')}`}
                            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white hover:text-white/80"
                        >
                            <Phone className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{landingPage.phone}</span>
                            <span className="sm:hidden">Call</span>
                        </a>
                    </div>
                </header>

                {/* ── Hero Section ── */}
                <section className="bg-white pb-6 pt-4 md:pb-8 md:pt-6">
                    <div className="mx-auto max-w-5xl px-4">
                        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2 md:gap-6">
                            {/* Left: Text */}
                            <div className="order-2 min-w-0 md:order-1">
                                {landingPage.subtitle && (
                                    <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                                        {landingPage.subtitle}
                                    </span>
                                )}
                                <h1 className="mb-2 break-words text-xl font-extrabold leading-tight text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">
                                    {landingPage.title}
                                </h1>
                                {landingPage.hero_text && (
                                    <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-gray-500 md:text-base">{landingPage.hero_text}</p>
                                )}

                                {/* Price display */}
                                <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                                    <span className="text-2xl font-extrabold text-primary sm:text-3xl">{formatPrice(activePrice)}</span>
                                    {activeOriginalPrice && parseFloat(activeOriginalPrice) > parseFloat(activePrice) && (
                                        <span className="text-lg text-gray-400 line-through">{formatPrice(activeOriginalPrice)}</span>
                                    )}
                                    {activeOriginalPrice && parseFloat(activeOriginalPrice) > parseFloat(activePrice) && (
                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                                            {Math.round(((parseFloat(activeOriginalPrice) - parseFloat(activePrice)) / parseFloat(activeOriginalPrice)) * 100)}% OFF
                                        </span>
                                    )}
                                </div>

                                {/* Trust badges */}
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {landingPage.authentic_badge_text && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                                            {getIconComponent(landingPage.authentic_badge_icon || 'shield-check', 'h-4 w-4 text-green-500')}
                                            {landingPage.authentic_badge_text}
                                        </span>
                                    )}
                                    {landingPage.delivery_badge_text && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                                            {getIconComponent(landingPage.delivery_badge_icon || 'truck', 'h-4 w-4 text-blue-500')}
                                            {landingPage.delivery_badge_text}
                                        </span>
                                    )}
                                </div>

                                <Button size="lg" onClick={scrollToCheckout} className="w-full rounded-xl text-base font-bold shadow-lg sm:w-auto">
                                    {landingPage.order_now_text || 'Order Now'}
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>

                            {/* Right: Image Gallery */}
                            <div className="relative order-1 min-w-0 md:order-2">
                                <ImageGallery
                                    images={heroImages.length > 0 ? heroImages : (productFirstImage ? [{ src: productFirstImage }] : [])}
                                    alt={product.name}
                                    hasVideo={!!embedUrl}
                                    onVideoClick={() => setVideoOpen(true)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Video Modal */}
                {videoOpen && embedUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setVideoOpen(false)}>
                        <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setVideoOpen(false)} className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-1.5 shadow">
                                <X className="h-5 w-5 text-gray-700" />
                            </button>
                            <div className="aspect-video w-full overflow-hidden rounded-xl">
                                <iframe src={`${embedUrl}?autoplay=1`} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen title={landingPage.title} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Use Cases / Applications ── */}
                {landingPage.use_cases && landingPage.use_cases.length > 0 && (
                    <section className="border-b border-gray-100 bg-white py-8 md:py-10">
                        <div className="mx-auto max-w-5xl px-4">
                            <h2 className="mb-1 text-center text-xl font-bold text-gray-900 md:text-2xl">
                                {landingPage.use_cases_title || 'What Is This Product Used For?'}
                            </h2>
                            {landingPage.use_cases_subtitle && (
                                <p className="mb-6 text-center text-sm text-gray-500">{landingPage.use_cases_subtitle}</p>
                            )}
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5">
                                {landingPage.use_cases.map((uc, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-4 text-center shadow-sm">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            {getIconComponent(uc.icon_name || null, 'h-5 w-5') || <CheckCircle className="h-5 w-5" />}
                                        </div>
                                        <span className="whitespace-pre-line break-words text-xs font-semibold text-gray-700">{uc.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 text-center">
                                <Button onClick={scrollToCheckout} className="rounded-xl px-8 shadow-md">
                                    {landingPage.order_now_text || 'Order Now'} <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Features Grid ── */}
                {landingPage.features && landingPage.features.length > 0 && (
                    <section className="border-b border-gray-100 bg-gray-50 py-8 md:py-10">
                        <div className="mx-auto max-w-5xl px-4">
                            <h2 className="mb-1 text-center text-xl font-bold text-gray-900 md:text-2xl">
                                {landingPage.features_title || 'Product Features'}
                            </h2>
                            {landingPage.features_subtitle && (
                                <p className="mb-6 text-center text-sm text-gray-500">{landingPage.features_subtitle}</p>
                            )}
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {landingPage.features.map((f, i) => (
                                    <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            {getIconComponent(f.icon_name || null, 'h-5 w-5') || <Zap className="h-5 w-5" />}
                                        </div>
                                        <h4 className="mb-1 break-words text-sm font-bold text-gray-800">{f.title}</h4>
                                        {f.desc && <p className="whitespace-pre-line break-words text-xs leading-relaxed text-gray-500">{f.desc}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Video Standalone ── */}
                {embedUrl && !videoOpen && (
                    <section className="border-b border-gray-100 bg-white py-8 md:py-10">
                        <div className="mx-auto max-w-3xl px-4">
                            <div className="overflow-hidden rounded-2xl shadow-lg">
                                <div className="aspect-video w-full">
                                    <iframe src={embedUrl} className="h-full w-full" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={landingPage.title} />
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Why Buy ── */}
                {landingPage.why_buy && landingPage.why_buy.length > 0 && (
                    <section className="border-b border-gray-100 bg-white py-8 md:py-10">
                        <div className="mx-auto max-w-5xl px-4">
                            {landingPage.why_buy_super_text && (
                                <p className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-primary">{landingPage.why_buy_super_text}</p>
                            )}
                            <h2 className="mb-1 text-center text-xl font-bold text-gray-900 md:text-2xl">
                                {landingPage.why_buy_title || 'Why Choose Us?'}
                            </h2>
                            {landingPage.why_buy_subtitle && (
                                <p className="mb-6 text-center text-sm text-gray-500">{landingPage.why_buy_subtitle}</p>
                            )}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                {landingPage.why_buy.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                                            {getIconComponent(item.icon_name || null, 'h-4 w-4') || <ThumbsUp className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="break-words text-sm font-bold text-gray-800">{item.title}</p>
                                            <p className="whitespace-pre-line break-words text-xs text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Specifications ── */}
                {landingPage.specifications && landingPage.specifications.length > 0 && (
                    <section className="border-b border-gray-100 bg-gray-50 py-8 md:py-10">
                        <div className="mx-auto max-w-5xl px-4">
                            <h2 className="mb-1 text-center text-xl font-bold text-gray-900 md:text-2xl">
                                {landingPage.specifications_title || 'Product Specifications'}
                            </h2>
                            {landingPage.specifications_subtitle && (
                                <p className="mb-6 text-center text-sm text-gray-500">{landingPage.specifications_subtitle}</p>
                            )}
                            <div className="grid gap-4 md:grid-cols-2">
                                {landingPage.specifications.map((group, i) => (
                                    <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
                                        <div className="flex items-center gap-2 border-b border-gray-100 bg-primary/5 px-4 py-3">
                                            <span className="text-primary">
                                                {getIconComponent(group.icon_name || null, 'h-4 w-4') || <ListChecks className="h-4 w-4" />}
                                            </span>
                                            <h3 className="text-sm font-bold text-gray-800">{group.title}</h3>
                                        </div>
                                        <ul className="divide-y divide-gray-50 px-4 py-2">
                                            {group.specs.map((spec, j) => (
                                                <li key={j} className="flex items-start gap-2 py-2 text-sm text-gray-600">
                                                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                                    <span className="whitespace-pre-line break-words">{spec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Review Images Gallery ── */}
                {landingPage.review_images && landingPage.review_images.length > 0 && (
                    <section className="border-b border-gray-100 bg-white py-8 md:py-10">
                        <div className="mx-auto max-w-5xl px-4">
                            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 md:text-2xl">
                                {landingPage.review_images_title || 'Customer Reviews'}
                            </h2>
                            <div className="mx-auto mb-4 max-w-2xl overflow-hidden rounded-2xl shadow-sm">
                                <img
                                    src={`/${landingPage.review_images[selectedReviewIndex]}`}
                                    alt={`Customer review ${selectedReviewIndex + 1}`}
                                    className="h-auto w-full object-cover"
                                />
                            </div>
                            {landingPage.review_images.length > 1 && (
                                <div className="flex flex-wrap justify-center gap-2">
                                    {landingPage.review_images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedReviewIndex(i)}
                                            className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${i === selectedReviewIndex ? 'border-primary' : 'border-gray-200'}`}
                                        >
                                            <img src={`/${img}`} alt="" className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── Checkout Banner ── */}
                {landingPage.checkout_banner_text && (
                    <section className="bg-linear-to-r from-primary to-primary/80 py-6 text-center md:py-8">
                        <div className="mx-auto max-w-4xl px-4">
                            <p className="mb-3 text-sm font-bold text-white sm:mb-4 sm:text-base md:text-lg">{landingPage.checkout_banner_text}</p>
                            <Button size="lg" variant="secondary" onClick={scrollToCheckout} className="rounded-xl px-8 font-bold shadow-lg">
                                {landingPage.order_now_text || 'Order Now'} <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </section>
                )}

                {/* ── Checkout Section ── */}
                <section ref={checkoutRef} className="bg-white py-8 md:py-14">
                    <div className="mx-auto max-w-5xl px-4">
                        <div className="mb-5 text-center md:mb-6">
                            <h2 className="text-lg font-extrabold text-gray-900 sm:text-xl md:text-2xl">
                                {landingPage.checkout_title || 'Order Now'}
                            </h2>
                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Fill in your details below to place your order</p>
                        </div>

                        <form ref={formRef} onSubmit={handleSubmit}>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Left — Form */}
                                <div className="space-y-5">
                                    {/* Blocked warning */}
                                    {(isBlocked || errors.blocked) && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                            <strong>⚠</strong> {errors.blocked || 'Your access has been restricted.'}
                                        </div>
                                    )}

                                    {/* Shipping info */}
                                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            {labels?.shippingInfo ?? 'Delivery Information'}
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="firstName">{labels?.fullName ?? 'Full Name'} *</Label>
                                                <Input id="firstName" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} placeholder="Your full name" className="mt-1" />
                                                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="phone">{labels?.phoneNumber ?? 'Phone Number'} *</Label>
                                                <Input id="phone" type="tel" value={data.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="01XXXXXXXXX" className="mt-1" maxLength={11} inputMode="numeric" />
                                                {phoneCheckLoading && <p className="mt-1 text-xs text-blue-600">ℹ Verifying...</p>}
                                                {data.phone && !data.phone.startsWith('01') && <p className="mt-1 text-xs text-red-500">Phone must start with 01</p>}
                                                {data.phone && data.phone.startsWith('01') && data.phone.length !== 11 && <p className="mt-1 text-xs text-red-500">Phone must be 11 digits</p>}
                                                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                            </div>
                                            {labels?.emailEnabled && (
                                                <div>
                                                    <Label htmlFor="email">{labels?.email ?? 'Email'}</Label>
                                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="example@email.com" className="mt-1" />
                                                    {labels?.emailHelpText && <p className="mt-1 text-xs text-gray-500">{labels.emailHelpText}</p>}
                                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
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
                                                        const filtered = districtOptions.filter((d) => d.toLowerCase().includes(districtSearch.toLowerCase()));
                                                        return filtered.length > 0 ? (
                                                            <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
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
                                                <Textarea id="note" value={data.note} onChange={(e) => setData('note', e.target.value)} placeholder="Any special instructions..." className="mt-1" rows={3} />
                                                {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                                            <Wallet className="h-4 w-4 text-primary" />
                                            {labels?.paymentMethod ?? 'Payment Method'}
                                        </h3>
                                        {phoneRestricted && (
                                            <div className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                                                <strong>⚠</strong> {labels?.codRestrictedMessage ?? 'Based on your phone history, Cash on Delivery is not available.'}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {paymentMethodOptions.map((method) => (
                                                <button key={method.slug} type="button" onClick={() => setData('payment_method', method.slug)} className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all ${data.payment_method === method.slug ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-200 hover:border-primary/40'}`}>
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
                                                <div className="mt-4 space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
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
                                                            <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary/30 px-3 py-2.5 text-sm text-gray-400 hover:border-primary/50">
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
                                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                                    {productFirstImage ? (
                                                        <img src={productFirstImage} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : heroImages[0]?.src ? (
                                                        <img src={heroImages[0].src} alt={product.name} className="h-full w-full object-cover" />
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
                                                                        <button key={size} type="button" onClick={() => { const match = mv.find((v) => !selectedVariant?.color || v.color === selectedVariant.color) || mv[0]; setSelectedVariantId(match.id); }} className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>{size}</button>
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
                                                                        <button key={color} type="button" onClick={() => { const match = mv.find((v) => !selectedVariant?.size || v.size === selectedVariant.size) || mv[0]; setSelectedVariantId(match.id); }} className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>{color}</button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Stock */}
                                            <div className="mt-3 border-t border-gray-100 pt-3">
                                                {isOutOfStock ? (
                                                    <span className="text-sm font-medium text-red-600">Out of Stock</span>
                                                ) : activeStockQuantity ? (
                                                    <span className="text-sm font-medium text-green-600">In Stock ({activeStockQuantity} Available)</span>
                                                ) : (
                                                    <span className="text-sm font-medium text-blue-600">In Stock</span>
                                                )}
                                            </div>

                                            {/* Quantity */}
                                            <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                                                <span className="text-xs font-medium text-gray-400">Qty:</span>
                                                <div className="flex items-center rounded-xl border border-gray-200">
                                                    <button type="button" onClick={() => updateSelectedItem(product.id, { quantity: Math.max(1, (primaryItem?.quantity ?? 1) - 1) })} className="px-3 py-1.5 text-gray-400 hover:text-gray-700"><Minus className="h-3.5 w-3.5" /></button>
                                                    <span className="w-8 text-center text-sm font-semibold">{primaryItem?.quantity ?? 1}</span>
                                                    <button type="button" onClick={() => updateSelectedItem(product.id, { quantity: (primaryItem?.quantity ?? 1) + 1 })} className="px-3 py-1.5 text-gray-400 hover:text-gray-700"><Plus className="h-3.5 w-3.5" /></button>
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
                                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
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
                                                                {epSizes.length > 0 && (<div><span className="mb-1.5 block text-xs font-medium text-gray-400">{ep.size_label || 'Size'}</span><div className="flex flex-wrap gap-2">{epSizes.map((size) => { const mv = ep.variants.filter((v) => v.size === size); const isSel = epSelected?.size === size; return (<button key={size} type="button" onClick={() => { const match = mv.find((v) => !epSelected?.color || v.color === epSelected.color) || mv[0]; setExtraVariants((prev) => ({ ...prev, [ep.id]: match.id })); }} className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${isSel ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>{size}</button>); })}</div></div>)}
                                                                {epColors.length > 0 && (<div><span className="mb-1.5 block text-xs font-medium text-gray-400">{ep.color_label || 'Color'}</span><div className="flex flex-wrap gap-2">{epColors.map((color) => { const mv = ep.variants.filter((v) => v.color === color); const isSel = epSelected?.color === color; return (<button key={color} type="button" onClick={() => { const match = mv.find((v) => !epSelected?.size || v.size === epSelected.size) || mv[0]; setExtraVariants((prev) => ({ ...prev, [ep.id]: match.id })); }} className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${isSel ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>{color}</button>); })}</div></div>)}
                                                            </div>
                                                        );
                                                    })()}
                                                    {ep.variants.length > 0 && isSelected && (extraVariants[ep.id] ?? null) === null && <p className="mt-2 text-xs font-medium text-red-500">Please select a variant.</p>}
                                                    {(() => {
                                                        const epSelectedId = extraVariants[ep.id] ?? null;
                                                        const epSelectedVariant = epSelectedId ? ep.variants.find((v) => v.id === epSelectedId) : null;
                                                        const epActiveInStock = epSelectedVariant ? epSelectedVariant.in_stock : ep.in_stock;
                                                        const epActiveStockQty = epSelectedVariant ? epSelectedVariant.stock_quantity : ep.stock_quantity;
                                                        const epIsOutOfStock = !epActiveInStock || epActiveStockQty === 0;
                                                        return (
                                                            <div className="mt-3 border-t border-gray-100 pt-3">
                                                                {epIsOutOfStock ? (
                                                                    <span className="text-sm font-medium text-red-600">Out of Stock</span>
                                                                ) : epActiveStockQty ? (
                                                                    <span className="text-sm font-medium text-green-600">In Stock ({epActiveStockQty})</span>
                                                                ) : (
                                                                    <span className="text-sm font-medium text-blue-600">In Stock</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                                                        <span className="text-xs font-medium text-gray-400">Qty:</span>
                                                        <div className="flex items-center rounded-xl border border-gray-200">
                                                            <button type="button" onClick={() => updateSelectedItem(ep.id, { quantity: Math.max(1, itemQty - 1) })} className="px-3 py-1.5 text-gray-400 hover:text-gray-700"><Minus className="h-3.5 w-3.5" /></button>
                                                            <span className="w-8 text-center text-sm font-semibold">{itemQty}</span>
                                                            <button type="button" onClick={() => updateSelectedItem(ep.id, { quantity: itemQty + 1 })} className="px-3 py-1.5 text-gray-400 hover:text-gray-700"><Plus className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Order Summary */}
                                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                        <h3 className="mb-3 text-sm font-bold text-gray-800">{labels?.yourOrder ?? 'Order Summary'}</h3>

                                        {freeShippingEnabled && freeShippingAmount > 0 && (
                                            subtotal >= freeShippingAmount ? (
                                                <div className="mb-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                                                    <Truck className="h-3.5 w-3.5 shrink-0" /><span className="font-medium">Free shipping applied!</span>
                                                </div>
                                            ) : (
                                                <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
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
                                                        <button key={zone} type="button" onClick={() => setDeliveryZone(zone)} className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${deliveryZone === zone ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}>{zone}</button>
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
                                                        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2">
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

                                    {missingVariant && <p className="text-center text-xs text-red-500">Please select a variant for all selected products.</p>}

                                    <Button type="submit" size="lg" disabled={processing || phoneCheckLoading || isOutOfStock || selectedItems.filter((i) => i.selected).length === 0 || missingVariant} className="w-full rounded-xl text-base font-bold shadow-lg">
                                        <Lock className="mr-2 h-4 w-4" />
                                        {phoneCheckLoading ? 'Verifying...' : processing ? 'Placing Order...' : `${landingPage.order_now_text || 'Order Now'} — ${paidAmount > 0 ? formatPrice(dueAmount) + ' Due' : formatPrice(total)}`}
                                    </Button>

                                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                                        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Secure</span>
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

                {/* ── Sticky Mobile Bottom Bar ── */}
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-lg md:hidden">
                    <Button
                        onClick={() => {
                            if (formRef.current) {
                                formRef.current.requestSubmit();
                            }
                        }}
                        disabled={processing || phoneCheckLoading || isOutOfStock || selectedItems.filter((i) => i.selected).length === 0 || missingVariant}
                        className="w-full rounded-xl font-bold shadow-md"
                        size="lg"
                    >
                        <Lock className="mr-2 h-4 w-4" />
                        {phoneCheckLoading ? 'Verifying...' : processing ? 'Placing Order...' : `${landingPage.order_now_text || 'Order Now'} — ${paidAmount > 0 ? formatPrice(dueAmount) + ' Due' : formatPrice(total)}`}
                    </Button>
                </div>

                {/* ── Floating Support Button ── */}
                <FloatingSupportBtn siteBranding={siteBranding} />
            </div>
        </>
    );
}
