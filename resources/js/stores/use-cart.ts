import { useSyncExternalStore } from 'react';

export type CartItem = {
    productId: number;
    variantId: number | null;
    slug: string;
    quantity: number;
    name: string;
    price: number;
    image: string | null;
    variantLabel: string | null;
    freeShipping: boolean;
    shippingZones: { zone: string; charge: number }[];
    allowedPaymentMethods?: string[];
};

const CART_KEY = 'cart_items';

function getStoredCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return [];
        const items: CartItem[] = JSON.parse(raw);
        // Coerce numeric fields — DB decimal columns may be serialised as strings
        return items.map((item) => ({
            ...item,
            price: Number(item.price),
            shippingZones: (item.shippingZones ?? []).map((z) => ({
                ...z,
                charge: Number(z.charge),
            })),
        }));
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart-changed'));
}

let listeners: (() => void)[] = [];
let snapshot = getStoredCart();

function subscribe(listener: () => void) {
    listeners = [...listeners, listener];

    const onStorage = (e: StorageEvent) => {
        if (e.key === CART_KEY) {
            snapshot = getStoredCart();
            listeners.forEach((l) => l());
        }
    };

    const onCartChanged = () => {
        snapshot = getStoredCart();
        listeners.forEach((l) => l());
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('cart-changed', onCartChanged);

    return () => {
        listeners = listeners.filter((l) => l !== listener);
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('cart-changed', onCartChanged);
    };
}

function getSnapshot() {
    return snapshot;
}

const emptyCart: CartItem[] = [];

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
    const items = getStoredCart();
    const idx = items.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId,
    );

    if (idx >= 0) {
        items[idx].quantity += quantity;
    } else {
        items.push({ ...item, quantity });
    }

    saveCart(items);
}

export function updateCartQuantity(productId: number, variantId: number | null, quantity: number) {
    let items = getStoredCart();

    if (quantity <= 0) {
        items = items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId),
        );
    } else {
        const idx = items.findIndex(
            (i) => i.productId === productId && i.variantId === variantId,
        );

        if (idx >= 0) {
            items[idx].quantity = quantity;
        }
    }

    saveCart(items);
}

export function removeFromCart(productId: number, variantId: number | null) {
    const items = getStoredCart().filter(
        (i) => !(i.productId === productId && i.variantId === variantId),
    );
    saveCart(items);
}

export function clearCart() {
    saveCart([]);
}

export function getCartItems(): CartItem[] {
    return getStoredCart();
}

export function getCartCount(): number {
    return getStoredCart().reduce((sum, i) => sum + i.quantity, 0);
}

/**
 * Refreshes shippingZones and freeShipping for all cart items using fresh server data.
 * Call on cart/checkout mount to fix stale localStorage data after a backup restore.
 */
export function refreshCartZones(itemData: { product_id: number; variant_id: number | null; free_shipping: boolean; shipping_zones: { zone: string; charge: number }[] | null }[]) {
    const items = getStoredCart();
    let changed = false;
    items.forEach((item) => {
        const fresh = itemData.find(
            (p) => p.product_id === item.productId && (p.variant_id ?? null) === (item.variantId ?? null),
        );
        if (!fresh) return;
        const newZones = (fresh.shipping_zones ?? []).map((z) => ({ ...z, charge: Number(z.charge) }));
        const zonesChanged = JSON.stringify(item.shippingZones) !== JSON.stringify(newZones);
        const freeChanged = item.freeShipping !== fresh.free_shipping;
        if (zonesChanged || freeChanged) {
            item.shippingZones = newZones;
            item.freeShipping = fresh.free_shipping;
            changed = true;
        }
    });
    if (changed) saveCart(items);
}

export function useCart(deliveryZone: string = '', freeShippingAmount: number = 0, freeShippingEnabled: boolean = true) {
    const items = useSyncExternalStore(subscribe, getSnapshot, () => emptyCart);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = (() => {
        // Free shipping threshold met
        if (freeShippingEnabled && freeShippingAmount > 0 && subtotal >= freeShippingAmount) return 0;
        if (!deliveryZone) return 0;
        let maxCharge = 0;
        items.forEach((i) => {
            if (i.freeShipping || !i.shippingZones?.length) return;
            const match = i.shippingZones.find((z) => z.zone === deliveryZone);
            if (match && match.charge > maxCharge) {
                maxCharge = match.charge;
            }
        });
        return maxCharge;
    })();

    return { items, totalItems, subtotal, shipping };
}
