import { Head, useForm, usePage } from '@inertiajs/react';
import { Bell, BellOff, BellRing, CheckCircle2, RefreshCw, Send, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function NotificationSettings() {
    useFlashToast();
    const pageProps = usePage().props as unknown as {
        enabled: boolean;
        soundEnabled: boolean;
        pollingInterval: number;
        notificationSettings?: { vapidPublicKey: string };
        siteBranding?: { logo?: string };
    };
    const { enabled, soundEnabled, pollingInterval } = pageProps;
    const vapidPublicKey = pageProps.notificationSettings?.vapidPublicKey ?? '';
    const siteIcon = pageProps.siteBranding?.logo ? `/${pageProps.siteBranding.logo}` : '/favicon.ico';

    const { data, setData, post, processing, errors } = useForm({
        enabled: enabled ?? true,
        sound_enabled: soundEnabled ?? true,
        polling_interval: pollingInterval ?? 30,
    });

    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
        typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
    );
    const [swStatus, setSwStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
    const [testPushResult, setTestPushResult] = useState<string | null>(null);
    const [sendingTestPush, setSendingTestPush] = useState(false);

    const playTestSound = useCallback(() => {
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
            playNote(523.25, t, 0.18, 0.7);
            playNote(1046.5, t, 0.18, 0.2, 'triangle');
            playNote(659.25, t + 0.18, 0.18, 0.8);
            playNote(1318.5, t + 0.18, 0.18, 0.25, 'triangle');
            playNote(783.99, t + 0.36, 0.5, 0.7);
            playNote(1567.98, t + 0.36, 0.5, 0.2, 'triangle');
        } catch {
            // Audio not available
        }
    }, []);

    useEffect(() => {
        async function checkSw() {
            if (!('serviceWorker' in navigator)) {
                setSwStatus('inactive');

                return;
            }

            const registration = await navigator.serviceWorker.getRegistration('/sw.js');

            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                setSwStatus(subscription ? 'active' : 'inactive');
            } else {
                setSwStatus('inactive');
            }
        }

        checkSw();
    }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/notifications');
    }

    async function requestPermission() {
        if (!('Notification' in window)) {
            setPermissionStatus('unsupported');

            return;
        }

        const result = await Notification.requestPermission();
        setPermissionStatus(result);
    }

    async function sendTestNotification() {
        if (permissionStatus !== 'granted') {
            return;
        }

        // When a service worker is registered, use SW showNotification instead of new Notification()
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration('/sw.js');

            if (registration) {
                await registration.showNotification('🛒 Test Order Notification', {
                    body: 'New order #ORD-TEST1234 from Test Customer — ৳1,500.00',
                    icon: siteIcon,
                    tag: 'order-test',
                });

                return;
            }
        }

        new Notification('🛒 Test Order Notification', {
            body: 'New order #ORD-TEST1234 from Test Customer — ৳1,500.00',
            icon: siteIcon,
            tag: 'order-test',
        });
    }

    async function sendTestPush() {
        setSendingTestPush(true);
        setTestPushResult(null);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

            const response = await fetch('/admin/push-subscriptions/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
            });

            const result = await response.json();
            setTestPushResult(result.message);
        } catch (e) {
            setTestPushResult('Failed to send test push: ' + (e instanceof Error ? e.message : 'Unknown error'));
        } finally {
            setSendingTestPush(false);
        }
    }

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

    async function resetAndResubscribe() {
        setSendingTestPush(true);
        setTestPushResult('Resetting push subscription...');

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

            // 1. Unsubscribe existing push subscription
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration('/sw.js');

                if (registration) {
                    const sub = await registration.pushManager.getSubscription();

                    if (sub) {
                        await sub.unsubscribe();
                        console.log('[Reset] Old subscription unsubscribed');
                    }

                    await registration.unregister();
                    console.log('[Reset] Service worker unregistered');
                }
            }

            // 2. Delete server-side subscriptions
            await fetch('/admin/push-subscriptions/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ endpoint: 'all' }),
            });

            // 3. Re-register service worker
            if (!vapidPublicKey) {
                setTestPushResult('No VAPID key available. Save settings first.');
                setSendingTestPush(false);

                return;
            }

            const newReg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            console.log('[Reset] New SW registered');

            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setTestPushResult('Notification permission denied.');
                setSendingTestPush(false);

                return;
            }

            const newSub = await newReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
            });
            console.log('[Reset] New subscription created');

            // 4. Send new subscription to server
            await fetch('/admin/push-subscriptions/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    endpoint: newSub.endpoint,
                    keys: {
                        p256dh: arrayBufferToBase64url(newSub.getKey('p256dh')),
                        auth: arrayBufferToBase64url(newSub.getKey('auth')),
                    },
                }),
            });

            setSwStatus('active');
            setTestPushResult('Push subscription reset successfully! Try "Test Server Push" now.');
        } catch (e) {
            console.error('[Reset] Failed:', e);
            setTestPushResult('Reset failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
        } finally {
            setSendingTestPush(false);
        }
    }

    return (
        <>
            <Head title="Notification Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Order Notifications</h2>
                    <p className="text-muted-foreground">
                        Get browser push notifications when new orders are placed.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notification Settings
                                </CardTitle>
                                <CardDescription>
                                    Configure browser push notifications for incoming orders.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Enable toggle */}
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <p className="text-sm font-medium">Enable Notifications</p>
                                            <p className="text-xs text-muted-foreground">
                                                Receive browser push notifications for new orders
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={data.enabled}
                                            onClick={() => setData('enabled', !data.enabled)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.enabled ? 'bg-primary' : 'bg-input'}`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>

                                    {/* Sound toggle */}
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-sm font-medium">Notification Sound</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Play a sound when a new order arrives
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={playTestSound}
                                            >
                                                <Volume2 className="mr-1 h-4 w-4" />
                                                Test
                                            </Button>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={data.sound_enabled}
                                            onClick={() => setData('sound_enabled', !data.sound_enabled)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.sound_enabled ? 'bg-primary' : 'bg-input'}`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.sound_enabled ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>

                                    {/* Polling interval */}
                                    <div className="space-y-2">
                                        <Label htmlFor="polling_interval">Check Interval (seconds)</Label>
                                        <Input
                                            id="polling_interval"
                                            type="number"
                                            min={10}
                                            max={300}
                                            step={5}
                                            value={data.polling_interval}
                                            onChange={(e) =>
                                                setData('polling_interval', parseInt(e.target.value) || 30)
                                            }
                                        />
                                        {errors.polling_interval && (
                                            <p className="text-sm text-destructive">{errors.polling_interval}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            How often to check for new orders (10–300 seconds). Lower values mean
                                            faster alerts but more server requests.
                                        </p>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving…' : 'Save Settings'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar info */}
                    <div className="space-y-4">
                        {/* Browser permission card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Browser Permission</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {permissionStatus === 'granted' ? (
                                        <>
                                            <BellRing className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-600 font-medium">
                                                Notifications allowed
                                            </span>
                                        </>
                                    ) : permissionStatus === 'denied' ? (
                                        <>
                                            <BellOff className="h-4 w-4 text-red-600" />
                                            <span className="text-sm text-red-600 font-medium">
                                                Notifications blocked
                                            </span>
                                        </>
                                    ) : permissionStatus === 'unsupported' ? (
                                        <>
                                            <BellOff className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground font-medium">
                                                Not supported
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="h-4 w-4 text-yellow-600" />
                                            <span className="text-sm text-yellow-600 font-medium">
                                                Permission not requested
                                            </span>
                                        </>
                                    )}
                                </div>

                                {permissionStatus === 'default' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={requestPermission}
                                    >
                                        <Bell className="mr-2 h-4 w-4" />
                                        Allow Notifications
                                    </Button>
                                )}

                                {permissionStatus === 'denied' && (
                                    <p className="text-xs text-muted-foreground">
                                        Notifications are blocked. Please enable them in your browser settings
                                        for this site.
                                    </p>
                                )}

                                {permissionStatus === 'granted' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={sendTestNotification}
                                    >
                                        <BellRing className="mr-2 h-4 w-4" />
                                        Test Browser Notification
                                    </Button>
                                )}

                                {permissionStatus === 'granted' && swStatus === 'active' && (
                                    <div className="space-y-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={sendTestPush}
                                            disabled={sendingTestPush}
                                        >
                                            <Send className="mr-2 h-4 w-4" />
                                            {sendingTestPush ? 'Sending...' : 'Test Server Push'}
                                        </Button>
                                        {testPushResult && (
                                            <p className="text-xs text-muted-foreground">{testPushResult}</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* How it works */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How It Works</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    1. Enable notifications and allow browser permission above.
                                </p>
                                <p>
                                    2. A service worker registers in the background to receive push
                                    messages.
                                </p>
                                <p>
                                    3. When a new order is placed, a push notification is sent
                                    directly to your browser — <strong>even if the tab or browser is
                                    closed</strong>.
                                </p>
                                <p>
                                    4. Click the notification to go directly to the order.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Push subscription status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Push Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {swStatus === 'active' ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-600 font-medium">
                                                Push subscription active
                                            </span>
                                        </>
                                    ) : swStatus === 'inactive' ? (
                                        <>
                                            <BellOff className="h-4 w-4 text-yellow-600" />
                                            <span className="text-sm text-yellow-600 font-medium">
                                                Not subscribed yet
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground font-medium">
                                                Checking...
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {swStatus === 'active'
                                        ? 'You will receive notifications even when this tab or browser is closed.'
                                        : 'Enable notifications and allow browser permission to activate push. Reload the page after saving.'}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={resetAndResubscribe}
                                    disabled={sendingTestPush}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reset & Resubscribe
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
