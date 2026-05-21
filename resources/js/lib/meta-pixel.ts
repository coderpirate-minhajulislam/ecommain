/**
 * Meta (Facebook) Pixel — browser-side ecommerce event helpers.
 * Each function fires with an event_id for deduplication with server-side CAPI.
 * Currency: BDT (Bangladeshi Taka)
 */

declare global {
    interface Window {
        fbq: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    }
}

function fbq(...args: unknown[]): void {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
        return;
    }
    window.fbq(...args);
}

// ─── Content builders ────────────────────────────────────────────────────────

export type PixelContent = {
    id: string | number;
    quantity: number;
    item_price?: number;
};

export function buildContent(productId: number, quantity: number, price?: number): PixelContent {
    const c: PixelContent = { id: String(productId), quantity };
    if (price !== undefined) c.item_price = price;
    return c;
}

// ─── Events (browser-side) ───────────────────────────────────────────────────

/** Track PageView — fires automatically with the pixel base code, but can be called explicitly */
export function pixelPageView(): void {
    fbq('track', 'PageView');
}

/** Fired when a product detail page is viewed */
export function pixelViewContent(
    contentIds: (string | number)[],
    contentName: string,
    value: number,
    eventId?: string,
): void {
    fbq('track', 'ViewContent', {
        content_ids: contentIds.map(String),
        content_type: 'product',
        content_name: contentName,
        value,
        currency: 'BDT',
    }, eventId ? { eventID: eventId } : undefined);
}

/** Fired when an item is added to the cart */
export function pixelAddToCart(
    contentIds: (string | number)[],
    contentName: string,
    value: number,
    contents: PixelContent[],
    eventId?: string,
): void {
    fbq('track', 'AddToCart', {
        content_ids: contentIds.map(String),
        content_type: 'product',
        content_name: contentName,
        value,
        currency: 'BDT',
        contents,
    }, eventId ? { eventID: eventId } : undefined);
}

/** Fired when checkout begins */
export function pixelInitiateCheckout(
    contentIds: (string | number)[],
    numItems: number,
    value: number,
    contents: PixelContent[],
    eventId?: string,
): void {
    fbq('track', 'InitiateCheckout', {
        content_ids: contentIds.map(String),
        content_type: 'product',
        num_items: numItems,
        value,
        currency: 'BDT',
        contents,
    }, eventId ? { eventID: eventId } : undefined);
}

/** Fired when payment info is added */
export function pixelAddPaymentInfo(
    contentIds: (string | number)[],
    value: number,
    contents: PixelContent[],
    eventId?: string,
): void {
    fbq('track', 'AddPaymentInfo', {
        content_ids: contentIds.map(String),
        content_type: 'product',
        value,
        currency: 'BDT',
        contents,
    }, eventId ? { eventID: eventId } : undefined);
}

/** Fired on order success / purchase confirmation */
export function pixelPurchase(
    contentIds: (string | number)[],
    value: number,
    contents: PixelContent[],
    orderId: string,
    numItems: number,
    eventId?: string,
    pixelId?: string,
): void {
    const payload = {
        content_ids: contentIds.map(String),
        content_type: 'product',
        value,
        currency: 'BDT',
        contents,
        order_id: orderId,
        num_items: numItems,
    };

    if (pixelId) {
        fbq('trackSingle', pixelId, 'Purchase', payload, eventId ? { eventID: eventId } : undefined);
        return;
    }

    fbq('track', 'Purchase', payload, eventId ? { eventID: eventId } : undefined);
}

/** Fired when user searches for products */
export function pixelSearch(searchString: string, eventId?: string): void {
    fbq('track', 'Search', {
        search_string: searchString,
        content_type: 'product',
    }, eventId ? { eventID: eventId } : undefined);
}

/** Fired when contact form is submitted */
export function pixelContact(eventId?: string): void {
    fbq('track', 'Contact', {}, eventId ? { eventID: eventId } : undefined);
}

/** Fired on user registration */
export function pixelCompleteRegistration(eventId?: string): void {
    fbq('track', 'CompleteRegistration', {
        status: true,
    }, eventId ? { eventID: eventId } : undefined);
}

/** Fired when a product list / category is viewed */
export function pixelViewCategory(
    contentIds: (string | number)[],
    categoryName: string,
    eventId?: string,
): void {
    fbq('trackCustom', 'ViewCategory', {
        content_ids: contentIds.map(String),
        content_type: 'product',
        content_category: categoryName,
    }, eventId ? { eventID: eventId } : undefined);
}
