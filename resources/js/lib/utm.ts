export const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export type UtmKey = (typeof utmKeys)[number];

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export function readUtmCookie(key: UtmKey): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)'));

    return match ? decodeURIComponent(match[1]) : null;
}

export function persistUtmValue(key: UtmKey, value: string): void {
    if (typeof window === 'undefined' || !value) {
        return;
    }

    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
    }

    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

export function readUtmValue(key: UtmKey): string {
    if (typeof window === 'undefined') {
        return '';
    }

    const sessionValue = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;

    if (sessionValue) {
        return sessionValue;
    }

    return readUtmCookie(key) ?? '';
}
