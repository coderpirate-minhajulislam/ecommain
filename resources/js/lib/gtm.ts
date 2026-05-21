/**
 * Google Tag Manager / GA4 ecommerce event helpers.
 * Currency: BDT (Bangladeshi Taka)
 */

declare global {
    interface Window {
        dataLayer: Record<string, unknown>[];
    }
}

export const CURRENCY = 'BDT';

function push(data: Record<string, unknown>): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
}

// ─── Item builders ───────────────────────────────────────────────────────────

export type GtmItem = {
    item_id: string | number;
    item_name: string;
    item_category?: string;
    item_variant?: string | null;
    price: number;
    quantity: number;
    index?: number;
    discount?: number;
};

export function buildItem(
    productId: number,
    name: string,
    price: number,
    quantity: number,
    opts?: {
        category?: string;
        variant?: string | null;
        originalPrice?: number | null;
        index?: number;
    },
): GtmItem {
    const item: GtmItem = {
        item_id: productId,
        item_name: name,
        price,
        quantity,
    };

    if (opts?.category) {
        item.item_category = opts.category;
    }

    if (opts?.variant) {
        item.item_variant = opts.variant;
    }

    if (opts?.originalPrice && opts.originalPrice > price) {
        item.discount = parseFloat((opts.originalPrice - price).toFixed(2));
    }

    if (opts?.index !== undefined) {
        item.index = opts.index;
    }

    return item;
}

// ─── Events ──────────────────────────────────────────────────────────────────

/** Fired when a list of products is displayed (e.g. /products, home sections) */
export function gtmViewItemList(items: GtmItem[], listName = 'Product List'): void {
    push({ ecommerce: null });
    push({
        event: 'view_item_list',
        ecommerce: {
            item_list_name: listName,
            currency: CURRENCY,
            items,
        },
    });
}

/** Fired when a user clicks on a product in a list */
export function gtmSelectItem(item: GtmItem, listName = 'Product List'): void {
    push({ ecommerce: null }); // clear previous
    push({
        event: 'select_item',
        ecommerce: {
            item_list_name: listName,
            currency: CURRENCY,
            items: [item],
        },
    });
}

/** Fired when a product detail page is viewed */
export function gtmViewItem(item: GtmItem, eventId?: string): void {
    push({ ecommerce: null });
    const ecommerce: Record<string, unknown> = {
        currency: CURRENCY,
        value: item.price * item.quantity,
        items: [item],
    };
    if (eventId) {
        ecommerce.event_id = eventId;
    }
    push({ event: 'view_item', ecommerce });
}

/** Fired when an item is added to the cart */
export function gtmAddToCart(item: GtmItem, eventId?: string): void {
    push({ ecommerce: null });
    const ecommerce: Record<string, unknown> = {
        currency: CURRENCY,
        value: item.price * item.quantity,
        items: [item],
    };
    if (eventId) {
        ecommerce.event_id = eventId;
    }
    push({
        event: 'add_to_cart',
        ecommerce,
    });
}

/** Fired when an item is removed from the cart */
export function gtmRemoveFromCart(item: GtmItem): void {
    push({ ecommerce: null });
    push({
        event: 'remove_from_cart',
        ecommerce: {
            currency: CURRENCY,
            value: item.price * item.quantity,
            items: [item],
        },
    });
}

/** Fired when the cart page is viewed */
export function gtmViewCart(items: GtmItem[], value: number): void {
    push({ ecommerce: null });
    push({
        event: 'view_cart',
        ecommerce: {
            currency: CURRENCY,
            value,
            items,
        },
    });
}

/** Fired when the checkout page is first loaded */
export function gtmBeginCheckout(items: GtmItem[], value: number, eventId?: string): void {
    push({ ecommerce: null });
    const ecommerce: Record<string, unknown> = {
        currency: CURRENCY,
        value,
        items,
    };
    if (eventId) {
        ecommerce.event_id = eventId;
    }
    push({ event: 'begin_checkout', ecommerce });
}

/** Fired when user selects a delivery zone (shipping step) */
export function gtmAddShippingInfo(
    items: GtmItem[],
    value: number,
    shippingTier: string,
): void {
    push({ ecommerce: null });
    push({
        event: 'add_shipping_info',
        ecommerce: {
            currency: CURRENCY,
            value,
            shipping_tier: shippingTier,
            items,
        },
    });
}

/** Fired when user selects a payment method */
export function gtmAddPaymentInfo(
    items: GtmItem[],
    value: number,
    paymentType: string,
    eventId?: string,
): void {
    push({ ecommerce: null });
    const ecommerce: Record<string, unknown> = {
        currency: CURRENCY,
        value,
        payment_type: paymentType,
        items,
    };
    if (eventId) {
        ecommerce.event_id = eventId;
    }
    push({
        event: 'add_payment_info',
        ecommerce,
    });
}

/** Fired on the order success page */
export function gtmPurchase(
    transactionId: string,
    value: number,
    shipping: number,
    items: GtmItem[],
    opts?: { coupon?: string; discount?: number; eventId?: string },
): void {
    push({ ecommerce: null });
    const ecommerce: Record<string, unknown> = {
        transaction_id: transactionId,
        currency: CURRENCY,
        value,
        shipping,
        items,
    };

    if (opts?.coupon) {
        ecommerce.coupon = opts.coupon;
    }

    if (opts?.discount && opts.discount > 0) {
        ecommerce.discount = opts.discount;
    }

    // event_id enables deduplication with GA4 Measurement Protocol server-side events
    if (opts?.eventId) {
        ecommerce.event_id = opts.eventId;
    }

    push({ event: 'purchase', ecommerce });
}
