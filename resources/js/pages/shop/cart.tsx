import { Head, Link, usePage } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ShopLayout } from '@/components/ecommerce/shop-layout';
import { useCart, updateCartQuantity, removeFromCart, refreshCartZones, getCartItems } from '@/stores/use-cart';
import { buildItem, gtmViewCart, gtmRemoveFromCart } from '@/lib/gtm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function formatPrice(amount: number): string {
    return `৳${amount.toFixed(0)}`;
}

export default function CartPage() {
    const { freeShippingAmount, freeShippingEnabled, labels, shippingZones: serverZones = [] } = usePage<{ freeShippingAmount: number; freeShippingEnabled: boolean; labels?: { proceedToCheckout?: string; continueShopping?: string; orderSummary?: string }; shippingZones?: string[] }>().props;
    const [deliveryZone, setDeliveryZone] = useState('');
    const { items, totalItems, subtotal, shipping } = useCart(deliveryZone, freeShippingAmount, freeShippingEnabled);
    const total = subtotal + shipping;

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

    const allZones = useMemo(() => {
        const zoneSet = new Set<string>();
        let hasNonFreeShippingItems = false;
        items.forEach((item) => {
            if (!item.freeShipping) {
                hasNonFreeShippingItems = true;
                item.shippingZones?.forEach((z) => zoneSet.add(z.zone));
            }
        });

        if (!hasNonFreeShippingItems) return [];

        if (serverZones.length > 0) {
            const intersection = serverZones.filter((z) => zoneSet.has(z));
            // Fallback: stale/missing zone data in localStorage — show all server zones
            return intersection.length > 0 ? intersection : serverZones;
        }

        return [...zoneSet];
    }, [items, serverZones]);

    // Auto-select first zone if none selected
    if (!deliveryZone && allZones.length > 0) {
        setDeliveryZone(allZones[0]);
    }

    // GTM: view_cart when cart has items
    useEffect(() => {
        if (items.length === 0) return;
        const gtmItems = items.map((item, i) =>
            buildItem(item.productId, item.name, item.price, item.quantity, {
                variant: item.variantLabel,
                index: i,
            }),
        );
        gtmViewCart(gtmItems, subtotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Head title="Shopping Cart" />
            <ShopLayout>
                <h1 className="mb-6 text-xl font-bold md:text-2xl">Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="py-16 text-center">
                        <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                        <p className="mb-1 text-lg font-medium">Your cart is empty</p>
                        <p className="mb-4 text-sm text-muted-foreground">Add some products to get started</p>
                        <Button asChild>
                            <Link href="/products">{labels?.continueShopping ?? 'Continue Shopping'}</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Cart items */}
                        <div className="space-y-3 lg:col-span-2">
                            {items.map((item) => (
                                <Card key={`${item.slug}-${item.variantId}`} className="flex gap-4 p-4">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
                                        {item.image ? (
                                            <img src={`/${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-3xl">📦</span>
                                        )}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                                        <div>
                                            <Link
                                                href={`/product/${item.slug}`}
                                                className="text-sm font-medium hover:text-primary"
                                            >
                                                {item.name}
                                            </Link>
                                            {item.variantLabel && (
                                                <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center rounded-md border">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-primary">
                                                    {formatPrice(item.price * item.quantity)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => {
                                                        gtmRemoveFromCart(
                                                            buildItem(item.productId, item.name, item.price, item.quantity, {
                                                                variant: item.variantLabel,
                                                            }),
                                                        );
                                                        removeFromCart(item.productId, item.variantId);
                                                        toast.success(`${item.name} removed from cart`);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Order summary */}
                        <Card className="h-fit p-4">
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

                            {/* Delivery Zone */}
                            {allZones.length > 0 && (
                                <div className="mb-4">
                                    <p className="mb-2 text-sm font-medium">Delivery Area</p>
                                    <div className="flex flex-wrap gap-2">
                                        {allZones.map((zone) => (
                                            <button
                                                key={zone}
                                                type="button"
                                                onClick={() => setDeliveryZone(zone)}
                                                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${deliveryZone === zone ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary/50'}`}
                                            >
                                                {zone}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-base font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{formatPrice(total)}</span>
                                </div>
                            </div>
                            <Button className="mt-4 w-full" size="lg" asChild>
                                <Link href="/checkout">{labels?.proceedToCheckout ?? 'Proceed to Checkout'}</Link>
                            </Button>
                            <Button variant="outline" className="mt-2 w-full" asChild>
                                <Link href="/products">{labels?.continueShopping ?? 'Continue Shopping'}</Link>
                            </Button>
                        </Card>
                    </div>
                )}
            </ShopLayout>
        </>
    );
}

