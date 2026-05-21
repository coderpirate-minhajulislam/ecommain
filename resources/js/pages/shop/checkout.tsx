import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Lock, ShoppingBag, Wallet, Plus, Minus, Trash2, Truck, Upload, X, Tag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ShopLayout } from '@/components/ecommerce/shop-layout';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart, clearCart, updateCartQuantity, removeFromCart, refreshCartZones, getCartItems } from '@/stores/use-cart';
import { buildItem, gtmBeginCheckout, gtmAddShippingInfo, gtmAddPaymentInfo, gtmRemoveFromCart } from '@/lib/gtm';
import { pixelInitiateCheckout, pixelAddPaymentInfo, buildContent } from '@/lib/meta-pixel';
import { tiktokInitiateCheckout, tiktokAddPaymentInfo, buildTikTokContent } from '@/lib/tiktok-pixel';
import { bangladeshDistricts } from '@/data/bangladesh-districts';

function formatPrice(amount: number): string {
    return `৳${amount.toFixed(0)}`;
}

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
    email: string;
    emailEnabled: boolean;
    emailHelpText: string;
    address: string;
    paymentMethod: string;
    orderSummary: string;
    placeOrder: string;
};

export default function CheckoutPage() {
    useFlashToast();
    const { paymentMethods: serverMethods, freeShippingAmount, freeShippingEnabled, labels, hasGlobalCoupons, couponProductIds, shippingZones: serverZones = [], metaPixelId, pixelExternalId } = usePage<{ paymentMethods: PaymentMethodOption[]; freeShippingAmount: number; freeShippingEnabled: boolean; labels?: CheckoutLabels; hasGlobalCoupons?: boolean; couponProductIds?: number[]; shippingZones?: string[]; metaPixelId?: string; pixelExternalId?: string }>().props;
    const [deliveryZone, setDeliveryZone] = useState('');
    const { items, subtotal, shipping } = useCart(deliveryZone, freeShippingAmount, freeShippingEnabled);

    // Refresh cart zone data from server on mount — fixes stale localStorage after backup restore
    useEffect(() => {
        const cartItems = getCartItems();
        if (cartItems.length === 0) return;
        const params = cartItems.map((item, idx) =>
            `items[${idx}][product_id]=${item.productId}&items[${idx}][variant_id]=${item.variantId ?? ''}`
        ).join('&');
        fetch(`/api/products/zones?${params}`)
            .then((r) => r.json())
            .then((data) => refreshCartZones(data))
            .catch(() => {/* silent fail */});
    }, []);

    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const total = subtotal + shipping - couponDiscount;

    const allZones = useMemo(() => {
        const productZoneSet = new Set<string>();
        let hasNonFreeShippingItems = false;
        items.forEach((item) => {
            if (!item.freeShipping) {
                hasNonFreeShippingItems = true;
                item.shippingZones?.forEach((z) => productZoneSet.add(z.zone));
            }
        });

        if (!hasNonFreeShippingItems) return [];

        if (serverZones.length > 0) {
            const intersection = serverZones.filter((z) => productZoneSet.has(z));
            // Fallback: stale/missing zone data in localStorage — show all server zones
            return intersection.length > 0 ? intersection : serverZones;
        }

        return [...productZoneSet];
    }, [items, serverZones]);

    // Set default delivery zone
    if (!deliveryZone) {
        if (allZones.length > 0) {
            setDeliveryZone(allZones[0]);
        } else if (items.length > 0) {
            // All products have free shipping, set a default zone
            setDeliveryZone('Default');
        }
    }

    const { data, setData, post, processing, errors, transform } = useForm({
        first_name: '',
        phone: '',
        email: '',
        district: '',
        address: '',
        delivery_zone: '',
        payment_method: serverMethods.length > 0 ? serverMethods[0].slug : '',
        payment_phone: '',
        payment_amount: '',
        payment_screenshot: null as File | null,
        items: [] as { product_id: number; variant_id: number | null; quantity: number }[],
        note: '',
        utm_source:   typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('utm_source')   ?? '') : '',
        utm_medium:   typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('utm_medium')   ?? '') : '',
        utm_campaign: typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('utm_campaign') ?? '') : '',
        utm_content:  typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('utm_content')  ?? '') : '',
        utm_term:     typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('utm_term')     ?? '') : '',
    });

    // Calculate paid amount and due based on payment method
    const selectedPaymentMethod = serverMethods.find((m) => m.slug === data.payment_method);
    const paidAmount = selectedPaymentMethod?.requires_payment_details && data.payment_amount
        ? Math.min(parseFloat(data.payment_amount) || 0, total)
        : 0;
    const dueAmount = Math.max(0, total - paidAmount);

    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [districtSearch, setDistrictSearch] = useState('');
    const [districtOpen, setDistrictOpen] = useState(false);
    const districtRef = useRef<HTMLDivElement>(null);
    const [phoneRestricted, setPhoneRestricted] = useState(false);
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
            return;
        }
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
                if (json.restricted) {
                    // Auto-select first payment method that requires details
                    const detailMethod = serverMethods.find((m) => m.requires_payment_details);
                    if (detailMethod) {
                        setData('payment_method', detailMethod.slug);
                    }
                }
            } catch {
                setPhoneRestricted(false);
            }
        }, 500);
        return () => { if (phoneCheckRef.current) clearTimeout(phoneCheckRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkedPhone]);

    // Filter payment methods based on restriction and product-level allowed methods
    const availableMethods = useMemo(() => {
        let methods = serverMethods;

        // Filter by product-level allowed payment methods (intersection of all cart items)
        const itemsWithRestrictions = items.filter((item) => item.allowedPaymentMethods && item.allowedPaymentMethods.length > 0);
        if (itemsWithRestrictions.length > 0) {
            // Only show methods allowed by ALL restricted products
            const allowedSlugs = itemsWithRestrictions.reduce<Set<string>>((acc, item, idx) => {
                const set = new Set(item.allowedPaymentMethods!);
                if (idx === 0) return set;
                return new Set([...acc].filter((slug) => set.has(slug)));
            }, new Set());
            methods = methods.filter((m) => allowedSlugs.has(m.slug));
        }

        if (phoneRestricted) {
            methods = methods.filter((m) => m.requires_payment_details);
        }
        return methods;
    }, [phoneRestricted, serverMethods, items]);

    // Auto-select first available payment method if current is not in the list
    useEffect(() => {
        if (availableMethods.length > 0 && !availableMethods.find((m) => m.slug === data.payment_method)) {
            setData('payment_method', availableMethods[0].slug);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableMethods]);

    const gtmItems = useMemo(
        () =>
            items.map((item, i) =>
                buildItem(item.productId, item.name, item.price, item.quantity, {
                    variant: item.variantLabel,
                    index: i,
                }),
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [items.length],
    );

    // GTM: begin_checkout once when page loads with items
    const beginFiredRef = useRef(false);
    const [checkoutEventId, setCheckoutEventId] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (items.length === 0 || beginFiredRef.current) return;
        beginFiredRef.current = true;

        // Fire server-side (Meta CAPI + TikTok Events API + GTM SS + GA4) and get event_id for deduplication
        const serverItems = items.map((item) => ({
            product_id: item.productId,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
        }));
        fetch('/checkout/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ items: serverItems, value: subtotal }),
        })
            .then((res) => res.json())
            .then((data: { event_id?: string }) => {
                const eventId = data.event_id || undefined;
                setCheckoutEventId(eventId);
                gtmBeginCheckout(gtmItems, subtotal, eventId);
                // Meta Pixel: InitiateCheckout (with event_id for deduplication)
                pixelInitiateCheckout(
                    items.map((item) => item.productId),
                    items.reduce((sum, item) => sum + item.quantity, 0),
                    subtotal,
                    items.map((item) => buildContent(item.productId, item.quantity, item.price)),
                    eventId,
                );
                // TikTok Pixel: InitiateCheckout (with event_id for deduplication)
                tiktokInitiateCheckout(
                    items.map((item) => buildTikTokContent(item.productId, item.quantity, item.price, item.name)),
                    subtotal,
                    eventId,
                );
            })
            .catch(() => {
                // Fallback: fire browser events without deduplication
                gtmBeginCheckout(gtmItems, subtotal);
                pixelInitiateCheckout(
                    items.map((item) => item.productId),
                    items.reduce((sum, item) => sum + item.quantity, 0),
                    subtotal,
                    items.map((item) => buildContent(item.productId, item.quantity, item.price)),
                );
                tiktokInitiateCheckout(
                    items.map((item) => buildTikTokContent(item.productId, item.quantity, item.price, item.name)),
                    subtotal,
                );
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    // GTM: add_shipping_info — fires once when all shipping fields + zone are complete
    const shippingCompleteFiredRef = useRef(false);
    useEffect(() => {
        if (
            shippingCompleteFiredRef.current ||
            items.length === 0 ||
            !data.first_name.trim() ||
            !data.phone.trim() ||
            !data.address.trim() ||
            !deliveryZone
        ) {
            return;
        }

        shippingCompleteFiredRef.current = true;
        gtmAddShippingInfo(gtmItems, total, deliveryZone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.first_name, data.phone, data.address, deliveryZone]);

    // Meta Pixel Advanced Matching: reinit with phone when user enters a valid 11-digit number.
    // This improves match quality for all subsequent pixel events (AddPaymentInfo, etc.).
    useEffect(() => {
        if (metaPixelId && data.phone.length === 11 && typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
            const advMatch: Record<string, string> = { ph: data.phone };
            if (pixelExternalId) advMatch.external_id = pixelExternalId;
            (window as any).fbq('init', metaPixelId, advMatch);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.phone]);

    // GTM: add_payment_info when payment method changes
    const prevPaymentRef = useRef('');
    useEffect(() => {
        if (!data.payment_method || data.payment_method === prevPaymentRef.current || items.length === 0) return;
        prevPaymentRef.current = data.payment_method;
        const methodName = serverMethods.find((m) => m.slug === data.payment_method)?.name ?? data.payment_method;
        const serverItems = items.map((item) => ({
            product_id: item.productId,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
        }));
        // Fire server-side CAPI (Meta + TikTok + GTM SS + GA4), then use event_id for browser deduplication
        fetch('/api/tracking/add-payment-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ items: serverItems, value: total, payment_type: methodName, first_name: data.first_name || undefined }),
        })
            .then((r) => r.json())
            .then((d: { event_id?: string }) => {
                const eventId = d.event_id;
                gtmAddPaymentInfo(gtmItems, total, methodName, eventId);
                pixelAddPaymentInfo(
                    items.map((item) => item.productId),
                    total,
                    items.map((item) => buildContent(item.productId, item.quantity, item.price)),
                    eventId,
                );
                tiktokAddPaymentInfo(
                    items.map((item) => buildTikTokContent(item.productId, item.quantity, item.price, item.name)),
                    total,
                    eventId,
                );
            })
            .catch(() => {
                // Fallback without deduplication
                gtmAddPaymentInfo(gtmItems, total, methodName);
                pixelAddPaymentInfo(
                    items.map((item) => item.productId),
                    total,
                    items.map((item) => buildContent(item.productId, item.quantity, item.price)),
                );
                tiktokAddPaymentInfo(
                    items.map((item) => buildTikTokContent(item.productId, item.quantity, item.price, item.name)),
                    total,
                );
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.payment_method]);

    // Coupon apply
    async function handleApplyCoupon() {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
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
                    product_ids: items.map((i) => i.productId),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Invalid coupon code.');
            }
            setCouponDiscount(data.discount);
            setAppliedCoupon(data.code);
            setCouponError('');
            toast.success(`Coupon applied! You save ৳${data.discount}`);
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
        transform((formData) => ({
            ...formData,
            items: items.map((i) => ({
                product_id: i.productId,
                variant_id: i.variantId,
                quantity: i.quantity,
            })),
            delivery_zone: deliveryZone,
            coupon_code: appliedCoupon || undefined,
        }));
        post('/checkout', {
            forceFormData: true,
            onSuccess: () => clearCart(),
            onError: () => toast.error('Please fix the errors below and try again.'),
        });
    }

    if (items.length === 0) {
        return (
            <>
                <Head title="Checkout" />
                <ShopLayout>
                    <div className="py-16 text-center">
                        <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                        <p className="mb-1 text-lg font-medium">Your cart is empty</p>
                        <p className="mb-4 text-sm text-muted-foreground">Add some products before checking out</p>
                        <Button asChild>
                            <Link href="/products">Continue Shopping</Link>
                        </Button>
                    </div>
                </ShopLayout>
            </>
        );
    }

    return (
        <>
            <Head title="Checkout" />
            <ShopLayout>
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    <span>/</span>
                    <Link href="/cart" className="hover:text-foreground">Cart</Link>
                    <span>/</span>
                    <span className="text-foreground">Checkout</span>
                </div>

                <h1 className="mb-6 text-xl font-bold md:text-2xl">Checkout</h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Form */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Delivery Zone */}
                            {allZones.length > 0 && (
                                <Card className="p-4">
                                    <h2 className="mb-3 text-base font-semibold">{labels?.deliveryArea ?? 'Delivery Area'}</h2>
                                    <div className="flex flex-wrap gap-3">
                                        {allZones.map((zone) => (
                                            <button
                                                key={zone}
                                                type="button"
                                                onClick={() => setDeliveryZone(zone)}
                                                className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${deliveryZone === zone ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:border-primary/50'}`}
                                            >
                                                {zone}
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Blocked warning */}
                            {errors.blocked && (
                                <Card className="border-destructive bg-destructive/5 p-4">
                                    <div className="flex items-center gap-3 text-destructive">
                                        <span className="text-lg font-bold">⚠</span>
                                        <p className="text-sm font-medium">{errors.blocked}</p>
                                    </div>
                                </Card>
                            )}

                            {/* Shipping info */}
                            <Card className="p-4">
                                <h2 className="mb-4 text-base font-semibold">{labels?.shippingInfo ?? 'Shipping Information'}</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
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
                                    <div className="sm:col-span-2">
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
                                        {data.phone && !data.phone.startsWith('01') && (
                                            <p className="mt-1 text-xs text-destructive">Phone number must start with 01 (e.g., 01XXXXXXXXX). Do not enter +88 or 88.</p>
                                        )}
                                        {data.phone && data.phone.startsWith('01') && data.phone.length !== 11 && (
                                            <p className="mt-1 text-xs text-destructive">Phone number must be exactly 11 digits.</p>
                                        )}
                                        {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                                    </div>
                                    {labels?.emailEnabled && (
                                        <div className="sm:col-span-2">
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
                                    <div className="sm:col-span-2" ref={districtRef}>
                                        <Label htmlFor="district">{labels?.district ?? 'District'} *</Label>
                                        <div className="relative mt-1">
                                            <Input
                                                id="district"
                                                value={districtOpen ? districtSearch : data.district}
                                                onChange={(e) => { setDistrictSearch(e.target.value); setDistrictOpen(true); }}
                                                onFocus={() => { setDistrictOpen(true); setDistrictSearch(data.district); }}
                                                placeholder="Search district..."
                                                className=""
                                                autoComplete="off"
                                            />
                                            {districtOpen && (() => {
                                                const filtered = bangladeshDistricts.filter((d) =>
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
                                    <div className="sm:col-span-2">
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
                                    <div className="sm:col-span-2">
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
                            </Card>

                            {/* Payment Method */}
                            <Card className="p-4">
                                <h2 className="mb-3 text-base font-semibold">{labels?.paymentMethod ?? 'Payment Method'}</h2>
                                {phoneRestricted && (
                                    <div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
                                        <strong>⚠</strong> {labels?.codRestrictedMessage ?? 'Based on your phone number history, Cash on Delivery is not available. Please select a payment method below.'}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {availableMethods.map((method) => (
                                        <button
                                            key={method.slug}
                                            type="button"
                                            onClick={() => setData('payment_method', method.slug)}
                                            className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-center transition-colors sm:gap-2 sm:p-4 ${
                                                data.payment_method === method.slug
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-input hover:border-primary/50'
                                            }`}
                                        >
                                            {method.logo ? (
                                                <img src={method.logo} alt={method.name} className="h-8 w-8 object-contain" />
                                            ) : method.icon && (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[method.icon] ? (
                                                (() => { const IconComp = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[method.icon!]; return <IconComp className="h-5 w-5" />; })()
                                            ) : (
                                                <Wallet className="h-5 w-5" />
                                            )}
                                            <span className="text-sm font-medium">{method.name}</span>
                                            {method.description && <span className="text-[10px] text-muted-foreground">{method.description}</span>}
                                        </button>
                                    ))}
                                </div>
                                {errors.payment_method && <p className="mt-2 text-xs text-destructive">{errors.payment_method}</p>}

                                {data.payment_method && (() => {
                                    const selectedMethod = serverMethods.find((m) => m.slug === data.payment_method);

                                    if (!selectedMethod?.requires_payment_details) {
                                        return null;
                                    }

                                    return (
                                    <div className="mt-4 space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                                        {selectedMethod?.account_number && (
                                            <p className="text-sm font-semibold text-primary">{selectedMethod.account_label || `Send to: ${selectedMethod.account_number}`}</p>
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
                            </Card>
                        </div>

                        {/* Order summary */}
                        <Card className="h-fit overflow-hidden p-4">
                            <h2 className="mb-4 text-base font-semibold">{labels?.orderSummary ?? 'Order Summary'}</h2>

                            {/* Free shipping banner */}
                            {freeShippingEnabled && freeShippingAmount > 0 && (
                                subtotal >= freeShippingAmount ? (
                                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                                        <Truck className="h-4 w-4 shrink-0" />
                                        <span className="font-medium">Free shipping applied!</span>
                                    </div>
                                ) : (
                                    <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Truck className="h-4 w-4 shrink-0" />
                                            <span>Add <strong>৳{(freeShippingAmount - subtotal).toFixed(0)}</strong> more for free shipping</span>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-300"
                                                style={{ width: `${Math.min(100, (subtotal / freeShippingAmount) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            )}

                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={`${item.productId}-${item.variantId}`} className="pb-3 border-b last:border-b-0">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/30">
                                                {item.image ? (
                                                    <img src={`/${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-lg">📦</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium line-clamp-2">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {item.variantLabel && `${item.variantLabel}`}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    gtmRemoveFromCart(
                                                        buildItem(item.productId, item.name, item.price, item.quantity, {
                                                            variant: item.variantLabel,
                                                        }),
                                                    );
                                                    removeFromCart(item.productId, item.variantId);
                                                }}
                                                className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
                                                title="Remove from cart"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between pl-15">
                                            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50">
                                                <button
                                                    type="button"
                                                    onClick={() => updateCartQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                                                    className="p-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                                                    className="p-1 hover:bg-gray-100 transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                                </div>

                                {/* Coupon */}
                                {(hasGlobalCoupons || items.some((i) => (couponProductIds ?? []).includes(i.productId))) && (
                                    <div className="pt-1">
                                        {appliedCoupon ? (
                                            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950">
                                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                                                    <Tag className="h-3.5 w-3.5" />
                                                    <span className="font-medium">{appliedCoupon}</span>
                                                    <span>−{formatPrice(couponDiscount)}</span>
                                                </div>
                                                <button type="button" onClick={handleRemoveCoupon} className="text-green-700 hover:text-red-500 dark:text-green-400">
                                                    <X className="h-3.5 w-3.5" />
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
                                                        className="h-9 text-xs"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleApplyCoupon}
                                                        disabled={couponLoading || !couponCode.trim()}
                                                        className="shrink-0"
                                                    >
                                                        {couponLoading ? 'Applying...' : 'Apply'}
                                                    </Button>
                                                </div>
                                                {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
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
                                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                            <span>Advance Paid</span>
                                            <span>−{formatPrice(paidAmount)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-base font-bold">
                                            <span>Due</span>
                                            <span className={dueAmount === 0 ? 'text-green-600 dark:text-green-400' : 'text-primary'}>
                                                {dueAmount === 0 ? '৳0' : formatPrice(dueAmount)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button type="submit" className="mt-4 w-full text-sm sm:text-base" size="lg" disabled={processing}>
                                <Lock className="mr-1.5 h-4 w-4 shrink-0" />
                                <span className="truncate">{processing ? 'Placing Order...' : `${labels?.placeOrder ?? 'Place Order'} — ${paidAmount > 0 ? formatPrice(dueAmount) + ' Due' : formatPrice(total)}`}</span>
                            </Button>
                        </Card>
                    </div>
                </form>
            </ShopLayout>
        </>
    );
}
