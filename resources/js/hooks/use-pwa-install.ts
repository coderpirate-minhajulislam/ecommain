import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
    interface Window {
        __pwaInstallPrompt: BeforeInstallPromptEvent | null;
    }
}

function detectInAppBrowser(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /FBAN|FBAV|Instagram|TikTok|BytedanceWebview|FB_IAB|FBIOS|musical_ly|LinkedInApp|Twitter|Snapchat/i.test(ua);
}

function detectIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
        // Pick up the event if it was captured before React mounted
        () => (typeof window !== 'undefined' ? (window.__pwaInstallPrompt ?? null) : null),
    );
    const [isInstalled, setIsInstalled] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
    );
    const [isInAppBrowser] = useState(() => detectInAppBrowser());
    const [isIOS] = useState(() => detectIOS());

    useEffect(() => {
        if (isInstalled) return;

        const handleReady = () => {
            if (window.__pwaInstallPrompt) {
                setDeferredPrompt(window.__pwaInstallPrompt);
            }
        };

        const handleInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            window.__pwaInstallPrompt = null;
        };

        window.addEventListener('pwa-install-ready', handleReady);
        window.addEventListener('appinstalled', handleInstalled);

        return () => {
            window.removeEventListener('pwa-install-ready', handleReady);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, [isInstalled]);

    const promptInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            window.__pwaInstallPrompt = null;
        }
    }, [deferredPrompt]);

    /** Opens the current page in the device's real browser (for Android in-app browsers) */
    const openInBrowser = useCallback(() => {
        const url = window.location.href;
        const urlWithoutScheme = url.replace(/^https?:\/\//, '');
        // Android: use Chrome intent with fallback to the URL
        window.location.href =
            `intent://${urlWithoutScheme}#Intent;scheme=https;package=com.android.chrome;` +
            `S.browser_fallback_url=${encodeURIComponent(url)};end`;
    }, []);

    return {
        /** True when the native install prompt is ready to be shown */
        canNativeInstall: !isInstalled && deferredPrompt !== null,
        /** True when running in standalone (already installed) */
        isInstalled,
        /** True when inside a Facebook / TikTok / Instagram in-app browser */
        isInAppBrowser,
        /** True when on an iOS device */
        isIOS,
        promptInstall,
        /** Android only: opens the page in Chrome so the user can install the PWA */
        openInBrowser,
    };
}
