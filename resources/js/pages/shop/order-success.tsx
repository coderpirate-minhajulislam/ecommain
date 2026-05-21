import { Head, Link, usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ProductCard } from '@/components/ecommerce/product-card';
import { ShopLayout } from '@/components/ecommerce/shop-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Product } from '@/types/global';
import { buildItem, gtmPurchase } from '@/lib/gtm';
import { pixelPurchase, buildContent } from '@/lib/meta-pixel';
import { tiktokPlaceAnOrder, tiktokCompletePayment, buildTikTokContent } from '@/lib/tiktok-pixel';

type OrderItem = {
    id: number;
    product_id: number;
    product_name: string;
    variant_label: string | null;
    price: string;
    quantity: number;
    total: string;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_method: string;
    payment_phone: string | null;
    payment_amount: string | null;
    subtotal: string;
    shipping: string;
    discount: string;
    coupon_code: string | null;
    total: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    items: OrderItem[];
};

function formatPrice(amount: string): string {
    return `\u09f3${parseFloat(amount).toFixed(0)}`;
}

/**
 * Generate a deterministic fake email from a billing name.
 * Used ONLY for Meta Pixel Advanced Matching (fbq init) to improve Event Match Score.
 * Never saved to the database, never sent anywhere.
 */
function generateEmailFromName(firstName: string, lastName?: string): string {
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const base = normalize(firstName) + normalize(lastName ?? '');
    return base.length >= 3 ? `${base}@gmail.com` : '';
}

export default function OrderSuccess() {
    const { order, paymentMethods, labels, purchaseEventId, pixelExternalId, metaPixelId, relatedProducts } = usePage<{ order: Order; paymentMethods: Record<string, string>; labels?: { continueShopping?: string; orderConfirmed?: string; orderConfirmedSub?: string; youMayAlsoLike?: string }; purchaseEventId?: string; pixelExternalId?: string; metaPixelId?: string; relatedProducts: Product[] }>().props;

    // GTM + Meta + TikTok: purchase events fire once on order confirmation.
    // Only fire browser pixels when purchaseEventId exists (i.e. trigger = "on_place_order").
    // In "on_delivered" mode, purchaseEventId is null — skip browser pixels to prevent
    // double-counting when server fires the event later upon delivery.
    const firedRef = useRef(false);
    useEffect(() => {
        if (firedRef.current || !order || !purchaseEventId) return;

        // Guard against duplicate Purchase firing if the success page is re-opened.
        // Meta deduplicates best when each order emits one browser Purchase event.
        const browserDedupeKey = `meta_purchase_fired:${order.order_number}`;
        try {
            if (typeof window !== 'undefined' && window.localStorage.getItem(browserDedupeKey) === purchaseEventId) {
                firedRef.current = true;
                return;
            }
        } catch {
            // Non-critical
        }

        firedRef.current = true;

        // Resolve email: prefer real order email, otherwise generate one from billing name.
        // The generated email is used ONLY for pixel Advanced Matching — never saved or sent.
        const matchEmail = order.email || generateEmailFromName(order.first_name, order.last_name);

        // Set user identity for Advanced Matching / Enhanced Conversions before firing events
        if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function' && metaPixelId) {
            const advancedMatch: Record<string, string> = {};
            if (matchEmail) advancedMatch.em = matchEmail;
            if (order.phone) advancedMatch.ph = order.phone;
            // external_id for deduplication: matches the value sent via CAPI (server hashes it;
            // pixel SDK also hashes it once, producing the same SHA-256 digest).
            if (pixelExternalId) advancedMatch.external_id = pixelExternalId;
            // Meta Pixel: Advanced Matching — re-init with email + phone + external_id for EMQ improvement
            (window as any).fbq('init', metaPixelId, advancedMatch);
        }
        if (matchEmail) {
            // TikTok: Identify user with email for improved match quality
            if (typeof window !== 'undefined' && typeof (window as any).ttq?.identify === 'function') {
                (window as any).ttq.identify({ email: matchEmail });
            }
            // GTM / GA4: Push user_data for Enhanced Conversions
            if (typeof window !== 'undefined') {
                (window as any).dataLayer = (window as any).dataLayer || [];
                (window as any).dataLayer.push({ user_data: { email: matchEmail } });
            }
        }
        const gtmItems = order.items.map((item, i) =>
            buildItem(item.product_id, item.product_name, parseFloat(item.price), item.quantity, {
                variant: item.variant_label,
                index: i,
            }),
        );
        gtmPurchase(
            order.order_number,
            parseFloat(order.total),
            parseFloat(order.shipping),
            gtmItems,
            {
                coupon: order.coupon_code ?? undefined,
                discount: parseFloat(order.discount) || undefined,
                eventId: purchaseEventId || undefined,
            },
        );
        // Meta Pixel: Purchase (with event ID for deduplication with server-side CAPI)
        pixelPurchase(
            order.items.map((item) => item.product_id),
            parseFloat(order.total),
            order.items.map((item) => buildContent(item.product_id, item.quantity, parseFloat(item.price))),
            order.order_number,
            order.items.reduce((sum, item) => sum + item.quantity, 0),
            purchaseEventId || undefined,
            metaPixelId || undefined,
        );
        // TikTok Pixel: PlaceAnOrder + CompletePayment
        const tiktokContents = order.items.map((item) => buildTikTokContent(item.product_id, item.quantity, parseFloat(item.price), item.product_name));
        tiktokPlaceAnOrder(tiktokContents, parseFloat(order.total), order.order_number, purchaseEventId || undefined);
        tiktokCompletePayment(tiktokContents, parseFloat(order.total), purchaseEventId ? purchaseEventId + '_cp' : undefined);

        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(browserDedupeKey, purchaseEventId);
            }
        } catch {
            // Non-critical
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Head title="Order Confirmed" />
            <ShopLayout>
                <div className="py-10">
                    {/* Confirmation summary — centered narrow */}
                    <div className="mx-auto max-w-lg text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h1 className="mb-2 text-2xl font-bold">{labels?.orderConfirmed ?? 'Order Confirmed!'}</h1>
                        <p className="mb-1 text-muted-foreground">
                            {(labels?.orderConfirmedSub ?? 'Thank you, {name}! Your order has been placed.').replace('{name}', order.first_name)}
                        </p>
                        <p className="mb-6 text-sm text-muted-foreground">
                            Order #{order.order_number}
                        </p>

                        <Card className="mb-6 p-4 text-left">
                            <h2 className="mb-3 text-sm font-semibold">Order Items</h2>
                            <div className="space-y-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="font-medium">{item.product_name}</span>
                                            {item.variant_label && (
                                                <span className="text-xs text-muted-foreground"> ({item.variant_label})</span>
                                            )}
                                            <span className="text-xs text-muted-foreground"> × {item.quantity}</span>
                                        </div>
                                        <span>{formatPrice(item.total)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-3" />
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{parseFloat(order.shipping) === 0 ? 'Free' : formatPrice(order.shipping)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment</span>
                                    <span className="font-medium">{paymentMethods[order.payment_method] || order.payment_method}</span>
                                </div>
                                {order.payment_phone && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Payment Number</span>
                                        <span>{order.payment_phone}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{formatPrice(order.total)}</span>
                                </div>
                                {order.payment_amount && parseFloat(order.payment_amount) > 0 && (
                                    <>
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span>Advance Paid</span>
                                            <span>−{formatPrice(order.payment_amount)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-bold">
                                            <span>Due</span>
                                            <span className={parseFloat(order.total) - parseFloat(order.payment_amount) <= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                                                {parseFloat(order.total) - parseFloat(order.payment_amount) <= 0 ? '৳0' : formatPrice(String(parseFloat(order.total) - parseFloat(order.payment_amount)))}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>

                        <Button asChild>
                            <Link href="/">{labels?.continueShopping ?? 'Continue Shopping'}</Link>
                        </Button>
                    </div>

                    {/* Related products — full width like shop page */}
                    {relatedProducts && relatedProducts.length > 0 && (
                        <div className="mt-10">
                            <h2 className="mb-4 text-lg font-semibold">{labels?.youMayAlsoLike ?? 'You May Also Like'}</h2>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                                {relatedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ShopLayout>
        </>
    );
}
