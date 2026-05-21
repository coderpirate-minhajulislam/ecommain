/**
 * TikTok Pixel — browser-side ecommerce event helpers.
 * Each function fires with an event_id for deduplication with server-side Events API.
 * Currency: BDT (Bangladeshi Taka)
 */

declare global {
    interface Window {
        ttq: {
            track: (...args: unknown[]) => void;
            identify: (data: Record<string, unknown>) => void;
            page: () => void;
            instance: (pixelId: string) => unknown;
            [key: string]: unknown;
        };
    }
}

function ttq(...args: unknown[]): void {
    if (typeof window === 'undefined' || !window.ttq || typeof window.ttq.track !== 'function') {
        return;
    }
    window.ttq.track(...args);
}

// ─── Content builders ────────────────────────────────────────────────────────

export type TikTokContent = {
    content_id: string;
    content_type: string;
    content_name?: string;
    quantity: number;
    price: number;
};

export function buildTikTokContent(
    productId: number,
    quantity: number,
    price: number,
    name?: string,
): TikTokContent {
    const c: TikTokContent = {
        content_id: String(productId),
        content_type: 'product',
        quantity,
        price,
    };
    if (name) c.content_name = name;
    return c;
}

// ─── Events (browser-side) ───────────────────────────────────────────────────

/** Fired when a product detail page is viewed */
export function tiktokViewContent(
    contents: TikTokContent[],
    value: number,
    eventId?: string,
): void {
    ttq('ViewContent', {
        contents,
        value,
        currency: 'BDT',
    }, { event_id: eventId });
}

/** Fired when an item is added to the cart */
export function tiktokAddToCart(
    contents: TikTokContent[],
    value: number,
    eventId?: string,
): void {
    ttq('AddToCart', {
        contents,
        value,
        currency: 'BDT',
    }, { event_id: eventId });
}

/** Fired when checkout begins */
export function tiktokInitiateCheckout(
    contents: TikTokContent[],
    value: number,
    eventId?: string,
): void {
    ttq('InitiateCheckout', {
        contents,
        value,
        currency: 'BDT',
    }, { event_id: eventId });
}

/** Fired when payment info is added */
export function tiktokAddPaymentInfo(
    contents: TikTokContent[],
    value: number,
    eventId?: string,
): void {
    ttq('AddPaymentInfo', {
        contents,
        value,
        currency: 'BDT',
    }, { event_id: eventId });
}

/** Fired on order completion — TikTok's "CompletePayment" standard event */
export function tiktokCompletePayment(
    contents: TikTokContent[],
    value: number,
    eventId?: string,
): void {
    ttq('CompletePayment', {
        contents,
        value,
        currency: 'BDT',
    }, { event_id: eventId });
}

/** Fired on order placed — TikTok's "PlaceAnOrder" standard event */
export function tiktokPlaceAnOrder(
    contents: TikTokContent[],
    value: number,
    orderId: string,
    eventId?: string,
): void {
    ttq('PlaceAnOrder', {
        contents,
        value,
        currency: 'BDT',
        order_id: orderId,
    }, { event_id: eventId });
}

/** Fired when user searches for products */
export function tiktokSearch(searchString: string, eventId?: string): void {
    ttq('Search', {
        query: searchString,
    }, { event_id: eventId });
}
