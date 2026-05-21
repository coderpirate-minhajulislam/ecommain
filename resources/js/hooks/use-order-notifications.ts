import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useCallback } from 'react';

type NewOrderResponse = {
    new_count: number;
    latest_id: number;
    latest: {
        order_number: string;
        customer: string;
        total: string;
    } | null;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

function arrayBufferToBase64url(buffer: ArrayBuffer | null): string {
    if (!buffer) {
        return '';
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function useOrderNotifications() {
    const pageProps = usePage().props;
    const auth = pageProps.auth as { user?: { role?: string } } | undefined;
    const role = auth?.user?.role;

    const notificationSettings = pageProps.notificationSettings as
        | { enabled: boolean; soundEnabled: boolean; pollingInterval: number; vapidPublicKey: string }
        | undefined;

    const lastIdRef = useRef<number>(0);
    const initializedRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const swRegisteredRef = useRef(false);

    const isAdmin = role === 'admin' || role === 'super_admin';
    const enabled = isAdmin && (notificationSettings?.enabled ?? false);
    const soundEnabled = notificationSettings?.soundEnabled ?? true;
    const pollingInterval = (notificationSettings?.pollingInterval ?? 30) * 1000;
    const vapidPublicKey = notificationSettings?.vapidPublicKey ?? '';

    const playSound = useCallback(() => {
        if (!soundEnabled) {
            return;
        }

        try {
            const ctx = new AudioContext();

            const playNote = (freq: number, startTime: number, duration: number, vol: number, type: OscillatorType = 'sine') => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = type;
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
                gain.gain.setValueAtTime(vol, startTime + duration * 0.5);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            const t = ctx.currentTime;
            // Loud 3-note ascending chime: C5 → E5 → G5 with harmonics
            playNote(523.25, t, 0.18, 0.7);
            playNote(1046.5, t, 0.18, 0.2, 'triangle');
            playNote(659.25, t + 0.18, 0.18, 0.8);
            playNote(1318.5, t + 0.18, 0.18, 0.25, 'triangle');
            playNote(783.99, t + 0.36, 0.5, 0.7);
            playNote(1567.98, t + 0.36, 0.5, 0.2, 'triangle');
        } catch {
            // Audio not available
        }
    }, [soundEnabled]);

    // Register Service Worker and subscribe to Web Push
    useEffect(() => {
        if (!enabled || !vapidPublicKey || swRegisteredRef.current) {
            return;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('[Push] Service Worker or PushManager not supported');
            return;
        }

        async function setupPush() {
            try {
                console.log('[Push] Registering service worker...');
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('[Push] SW registered, scope:', registration.scope);
                await navigator.serviceWorker.ready;
                console.log('[Push] SW ready, active:', registration.active?.state);

                let subscription = await registration.pushManager.getSubscription();
                console.log('[Push] Existing subscription:', subscription ? 'YES' : 'NO');

                if (!subscription) {
                    // Request notification permission
                    const permission = await Notification.requestPermission();
                    console.log('[Push] Permission:', permission);

                    if (permission !== 'granted') {
                        return;
                    }

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
                    });
                    console.log('[Push] New subscription created');
                }

                // Send subscription to server
                const csrfToken =
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

                const response = await fetch('/admin/push-subscriptions/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: arrayBufferToBase64url(subscription.getKey('p256dh')),
                            auth: arrayBufferToBase64url(subscription.getKey('auth')),
                        },
                    }),
                });
                console.log('[Push] Subscription sent to server, status:', response.status);

                swRegisteredRef.current = true;
            } catch (err) {
                console.error('[Push] Setup failed:', err);
                // Service worker or push subscription failed — fall back to polling
            }
        }

        setupPush();
    }, [enabled, vapidPublicKey]);

    // Polling fallback (also works when SW push is active for sound + tab focus)
    const checkNewOrders = useCallback(async () => {
        if (!enabled) {
            return;
        }

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch(
                `/admin/notifications/check-new-orders?last_id=${lastIdRef.current}`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                },
            );

            if (!res.ok) {
                return;
            }

            const data: NewOrderResponse = await res.json();

            // On first check, just record the latest ID without notifying
            if (!initializedRef.current) {
                lastIdRef.current = data.latest_id;
                initializedRef.current = true;

                return;
            }

            if (data.new_count > 0 && data.latest) {
                lastIdRef.current = data.latest_id;

                playSound();
            }
        } catch {
            // Silently fail on network errors
        }
    }, [enabled, playSound]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Initial check
        checkNewOrders();

        // Set up polling (for sound alerts when tab is open)
        intervalRef.current = setInterval(checkNewOrders, pollingInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, pollingInterval, checkNewOrders]);
}
