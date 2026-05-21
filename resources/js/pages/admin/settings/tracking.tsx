import { Head, useForm, usePage } from '@inertiajs/react';
import { Activity, AlertCircle, CheckCircle2, ExternalLink, Loader2, Server, Share2, ShoppingBag, Target, Truck, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TrackingSettings() {
    const {
        metaPixelId, metaAccessToken, metaTestEventCode,
        metaAdAccountId, metaAdsAccessToken,
        gtmSsUrl,
        tiktokPixelId, tiktokAccessToken, tiktokTestEventCode,
        ga4MeasurementId, ga4ApiSecret,
        purchaseEventTrigger,
        gadsCustomerId, gadsDeveloperToken, gadsOauthClientId,
        gadsOauthClientSecret, gadsRefreshToken, gadsConversionActionId, gadsCurrencyCode,
    } = usePage<{
        metaPixelId: string;
        metaAccessToken: string;
        metaTestEventCode: string;
        metaAdAccountId: string;
        metaAdsAccessToken: string;
        gtmSsUrl: string;
        tiktokPixelId: string;
        tiktokAccessToken: string;
        tiktokTestEventCode: string;
        ga4MeasurementId: string;
        ga4ApiSecret: string;
        purchaseEventTrigger: string;
        gadsCustomerId: string;
        gadsDeveloperToken: string;
        gadsOauthClientId: string;
        gadsOauthClientSecret: string;
        gadsRefreshToken: string;
        gadsConversionActionId: string;
        gadsCurrencyCode: string;
    }>().props;

    const { data, setData, post, processing, errors } = useForm({
        meta_pixel_id: metaPixelId ?? '',
        meta_access_token: metaAccessToken ?? '',
        meta_test_event_code: metaTestEventCode ?? '',
        meta_ad_account_id: metaAdAccountId ?? '',
        meta_ads_access_token: metaAdsAccessToken ?? '',
        gtm_ss_url: gtmSsUrl ?? '',
        tiktok_pixel_id: tiktokPixelId ?? '',
        tiktok_access_token: tiktokAccessToken ?? '',
        tiktok_test_event_code: tiktokTestEventCode ?? '',
        ga4_measurement_id: ga4MeasurementId ?? '',
        ga4_api_secret: ga4ApiSecret ?? '',
        purchase_event_trigger: purchaseEventTrigger ?? 'on_place_order',
        gads_customer_id: gadsCustomerId ?? '',
        gads_developer_token: gadsDeveloperToken ?? '',
        gads_oauth_client_id: gadsOauthClientId ?? '',
        gads_oauth_client_secret: gadsOauthClientSecret ?? '',
        gads_refresh_token: gadsRefreshToken ?? '',
        gads_conversion_action_id: gadsConversionActionId ?? '',
        gads_currency_code: gadsCurrencyCode ?? 'BDT',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/tracking');
    }

    // Auto Campaign Attribution (Meta url_tags)
    const [autoTrackTags, setAutoTrackTags] = useState<string | null>(null);
    const [autoTrackLoading, setAutoTrackLoading] = useState(false);
    const [autoTrackError, setAutoTrackError] = useState<string | null>(null);

    useEffect(() => {
        if (!isMetaAdsConnected) return;
        fetch('/admin/meta-ads/auto-tracking', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((j) => setAutoTrackTags(j.url_tags ?? ''))
            .catch(() => setAutoTrackTags(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleEnableAutoTracking() {
        setAutoTrackLoading(true);
        setAutoTrackError(null);
        const xsrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
        try {
            const res = await fetch('/admin/meta-ads/auto-tracking', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
                },
                credentials: 'same-origin',
            });
            const json = await res.json();
            if (!res.ok) setAutoTrackError(json.error ?? 'Failed to enable auto-tracking.');
            else setAutoTrackTags(json.url_tags ?? '');
        } catch {
            setAutoTrackError('Network error — could not reach the server.');
        } finally {
            setAutoTrackLoading(false);
        }
    }

    const isMetaConnected = Boolean(data.meta_pixel_id && data.meta_access_token);
    const isMetaAdsConnected = Boolean(data.meta_ad_account_id && (data.meta_ads_access_token || data.meta_access_token));
    const isGtmSsConnected = Boolean(data.gtm_ss_url && /^https:\/\//.test(data.gtm_ss_url));
    const isTiktokConnected = Boolean(data.tiktok_pixel_id && data.tiktok_access_token);
    const isGa4Connected = Boolean(data.ga4_measurement_id && /^G-[A-Z0-9]+$/.test(data.ga4_measurement_id) && data.ga4_api_secret);
    const isGoogleAdsConnected = Boolean(
        data.gads_customer_id &&
        data.gads_developer_token &&
        data.gads_oauth_client_id &&
        data.gads_oauth_client_secret &&
        data.gads_refresh_token &&
        data.gads_conversion_action_id,
    );

    return (
        <>
            <Head title="Tracking Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Tracking & Analytics</h2>
                    <p className="text-muted-foreground">
                        Configure Meta (Facebook) Pixel, TikTok Pixel, Conversions APIs, and GTM server-side tracking.
                    </p>
                </div>

                {(data.meta_test_event_code.trim() !== '' || data.tiktok_test_event_code.trim() !== '') && (
                    <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4">
                        <p className="text-sm font-bold text-red-600">
                            ⚠️ TEST EVENT CODE ACTIVE — All CAPI events are currently tagged as test events.
                            Test events are excluded from all standard reporting and Data Freshness metrics,
                            causing "Unknown" in Events Manager. <span className="underline">Remove the test event code(s) below when you are done testing.</span>
                        </p>
                        <ul className="mt-2 list-disc pl-5 text-sm text-red-600">
                            {data.meta_test_event_code.trim() !== '' && (
                                <li>Meta CAPI test event code is set: <span className="font-mono font-bold">{data.meta_test_event_code}</span></li>
                            )}
                            {data.tiktok_test_event_code.trim() !== '' && (
                                <li>TikTok Events API test event code is set: <span className="font-mono font-bold">{data.tiktok_test_event_code}</span></li>
                            )}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Meta Pixel & CAPI */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Purchase Event Trigger */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingBag className="h-5 w-5" />
                                        Purchase Event Trigger
                                    </CardTitle>
                                    <CardDescription>
                                        Choose when to fire the Purchase event to GTM, Meta Pixel, and TikTok ad platforms.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <label
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                                            data.purchase_event_trigger === 'on_place_order'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-accent/50'
                                        }`}
                                        onClick={() => setData('purchase_event_trigger', 'on_place_order')}
                                    >
                                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-primary">
                                            {data.purchase_event_trigger === 'on_place_order' && (
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                <ShoppingBag className="h-4 w-4 text-primary" />
                                                When Order is Placed
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">Default</span>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Fire Purchase events immediately when a customer submits the order form. Standard e-commerce tracking.
                                            </p>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                                            data.purchase_event_trigger === 'on_delivered'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-accent/50'
                                        }`}
                                        onClick={() => setData('purchase_event_trigger', 'on_delivered')}
                                    >
                                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-primary">
                                            {data.purchase_event_trigger === 'on_delivered' && (
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                <Truck className="h-4 w-4 text-green-600" />
                                                When Order is Delivered
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Fire Purchase events only when an admin marks an order as <strong>Delivered</strong> in the order details page. Ideal for COD businesses to track confirmed revenue.
                                            </p>
                                        </div>
                                    </label>

                                    {data.purchase_event_trigger === 'on_delivered' && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                            <strong>Note:</strong> In this mode, no Purchase event is sent when the customer places an order. Events fire server-side when you update the status to "Delivered" on the order details page.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Share2 className="h-5 w-5" />
                                        Meta (Facebook) Pixel & Conversions API
                                    </CardTitle>
                                    <CardDescription>
                                        Server-side tracking sends events directly to Meta from your server for better accuracy and privacy compliance.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="meta_pixel_id">Pixel ID</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="meta_pixel_id"
                                                placeholder="123456789012345"
                                                value={data.meta_pixel_id}
                                                onChange={(e) => setData('meta_pixel_id', e.target.value.trim())}
                                                className="font-mono"
                                            />
                                            {isMetaConnected && (
                                                <div className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Connected
                                                </div>
                                            )}
                                        </div>
                                        {errors.meta_pixel_id && (
                                            <p className="text-sm text-destructive">{errors.meta_pixel_id}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Your Facebook Pixel ID (numeric). Found in Events Manager → Data Sources.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="meta_access_token">Conversions API Access Token</Label>
                                        <Input
                                            id="meta_access_token"
                                            type="password"
                                            placeholder="EAAxxxxxxx..."
                                            value={data.meta_access_token}
                                            onChange={(e) => setData('meta_access_token', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.meta_access_token && (
                                            <p className="text-sm text-destructive">{errors.meta_access_token}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Generate in Events Manager → Settings → Conversions API → Generate Access Token.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="meta_test_event_code">Test Event Code (Optional)</Label>
                                        <Input
                                            id="meta_test_event_code"
                                            placeholder="TEST12345"
                                            value={data.meta_test_event_code}
                                            onChange={(e) => setData('meta_test_event_code', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.meta_test_event_code && (
                                            <p className="text-sm text-destructive">{errors.meta_test_event_code}</p>
                                        )}
                                        {data.meta_test_event_code.trim() !== '' && (
                                            <p className="text-sm font-bold text-red-600">
                                                ⚠️ WARNING: A test event code is active. Every CAPI event will be tagged as a test event and excluded from all standard reporting and Data Freshness metrics — this causes "Unknown" in Facebook Events Manager. Remove this code when you are done testing.
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Found in Events Manager → Test Events tab. Remove after testing.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Meta Ads Manager */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-blue-600" />
                                        Meta Ads Manager
                                        {isMetaAdsConnected && (
                                            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle2 className="h-3 w-3" /> Connected
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        Connect your Meta Ads account to view campaign performance (spend, impressions, clicks, reach, CTR, CPC) directly on your admin dashboard.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="meta_ad_account_id">Ad Account ID</Label>
                                        <Input
                                            id="meta_ad_account_id"
                                            placeholder="act_1234567890"
                                            value={data.meta_ad_account_id}
                                            onChange={(e) => setData('meta_ad_account_id', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.meta_ad_account_id && (
                                            <p className="text-sm text-destructive">{errors.meta_ad_account_id}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Found in Meta Ads Manager → top-left account selector. Format: <code className="font-mono">act_XXXXXXXXXX</code> or just the numbers.
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                        <p className="font-semibold">⚠️ The CAPI token above cannot be used to read ad data.</p>
                                        <p className="mt-1 text-xs">
                                            The Conversions API token only has permission to <em>send</em> events. To display ads performance on your dashboard, you must generate a separate Marketing API token with <code className="rounded bg-amber-100 px-1 font-mono dark:bg-amber-900/40">ads_read</code> permission.
                                        </p>
                                        <p className="mt-2 text-xs font-medium">How to get it — System User token (recommended, never expires):</p>
                                        <ol className="ml-4 mt-1 list-decimal space-y-0.5 text-xs">
                                            <li>Open <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="underline">Business Settings → System Users</a></li>
                                            <li>Create or select a System User → click <strong>Generate New Token</strong></li>
                                            <li>Select your app, enable <strong>ads_read</strong></li>
                                            <li>Paste the token below and save</li>
                                        </ol>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="meta_ads_access_token">Ads API Access Token <span className="text-destructive">*required for dashboard</span></Label>
                                        <Input
                                            id="meta_ads_access_token"
                                            type="password"
                                            placeholder="EAAxxxxxxx… (must have ads_read permission)"
                                            value={data.meta_ads_access_token}
                                            onChange={(e) => setData('meta_ads_access_token', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.meta_ads_access_token && (
                                            <p className="text-sm text-destructive">{errors.meta_ads_access_token}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Must have <code className="font-mono">ads_read</code> permission. Use a System User token from <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="underline">Business Settings → System Users</a> for long-lived access, or a User token from <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline">Graph API Explorer</a>.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Auto Campaign Attribution */}
                            {isMetaAdsConnected && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-amber-500" />
                                            Auto Campaign Attribution
                                            {autoTrackTags === null ? (
                                                <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
                                                    <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                                                </span>
                                            ) : autoTrackTags ? (
                                                <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Enabled
                                                </span>
                                            ) : (
                                                <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                    <AlertCircle className="h-3.5 w-3.5" /> Not configured
                                                </span>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            Automatically append UTM parameters to every Meta ad click so orders are attributed to the correct campaign.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {autoTrackTags ? (
                                            <>
                                                <p className="text-sm text-muted-foreground">
                                                    UTM parameters are automatically appended to every ad click in this account. Orders placed via Meta ads will be attributed to the correct campaign.
                                                </p>
                                                <div className="rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-foreground break-all">
                                                    {autoTrackTags}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm text-muted-foreground">
                                                    Enable this to have Meta automatically append
                                                    <code className="mx-1 rounded bg-muted px-1 font-mono text-xs">{'utm_campaign={{campaign.name}}'}</code>
                                                    to every ad URL in this account — no per-campaign setup needed.
                                                </p>
                                                {autoTrackError && (
                                                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                                        <strong>Error:</strong> {autoTrackError}
                                                        {(autoTrackError.toLowerCase().includes('permission') || autoTrackError.toLowerCase().includes('#200')) && (
                                                            <p className="mt-1 text-xs">
                                                                Your token needs <code className="font-mono">ads_management</code> permission, or{' '}
                                                                <a
                                                                    href={`https://adsmanager.facebook.com/adsmanager/settings/?act=${data.meta_ad_account_id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="underline"
                                                                >
                                                                    set it manually in Meta Ads Manager
                                                                </a>.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={handleEnableAutoTracking}
                                                        disabled={autoTrackLoading}
                                                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
                                                    >
                                                        {autoTrackLoading
                                                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Enabling…</>
                                                            : <><Zap className="h-4 w-4" /> Enable Auto-Tracking</>
                                                        }
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Server className="h-5 w-5" />
                                        GTM Server-Side Container
                                    </CardTitle>
                                    <CardDescription>
                                        Load GTM from your own first-party domain and send server-side events for improved tracking accuracy.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gtm_ss_url">Server-Side Container URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="gtm_ss_url"
                                                placeholder="https://gtm.yourdomain.com"
                                                value={data.gtm_ss_url}
                                                onChange={(e) => setData('gtm_ss_url', e.target.value.trim())}
                                                className="font-mono"
                                            />
                                            {isGtmSsConnected && (
                                                <div className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Connected
                                                </div>
                                            )}
                                        </div>
                                        {errors.gtm_ss_url && (
                                            <p className="text-sm text-destructive">{errors.gtm_ss_url}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Your GTM server-side container URL (must be HTTPS). Leave empty to use standard GTM.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Share2 className="h-5 w-5" />
                                        TikTok Pixel & Events API
                                    </CardTitle>
                                    <CardDescription>
                                        Server-side tracking sends events directly to TikTok from your server for better accuracy and attribution.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tiktok_pixel_id">Pixel ID</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="tiktok_pixel_id"
                                                placeholder="CXXXXXXXXXXXXXXXXX"
                                                value={data.tiktok_pixel_id}
                                                onChange={(e) => setData('tiktok_pixel_id', e.target.value.trim())}
                                                className="font-mono"
                                            />
                                            {isTiktokConnected && (
                                                <div className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Connected
                                                </div>
                                            )}
                                        </div>
                                        {errors.tiktok_pixel_id && (
                                            <p className="text-sm text-destructive">{errors.tiktok_pixel_id}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Your TikTok Pixel ID. Found in TikTok Events Manager → Web Events → Manage.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tiktok_access_token">Events API Access Token</Label>
                                        <Input
                                            id="tiktok_access_token"
                                            type="password"
                                            placeholder="Server-side access token..."
                                            value={data.tiktok_access_token}
                                            onChange={(e) => setData('tiktok_access_token', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.tiktok_access_token && (
                                            <p className="text-sm text-destructive">{errors.tiktok_access_token}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Generate in TikTok Events Manager → Settings → Generate Access Token.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tiktok_test_event_code">Test Event Code (Optional)</Label>
                                        <Input
                                            id="tiktok_test_event_code"
                                            placeholder="TEST12345"
                                            value={data.tiktok_test_event_code}
                                            onChange={(e) => setData('tiktok_test_event_code', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.tiktok_test_event_code && (
                                            <p className="text-sm text-destructive">{errors.tiktok_test_event_code}</p>
                                        )}
                                        {data.tiktok_test_event_code.trim() !== '' && (
                                            <p className="text-sm font-bold text-red-600">
                                                ⚠️ WARNING: A test event code is active. Every TikTok Events API event will be tagged as a test event and excluded from all standard reporting — this causes "Unknown" data freshness. Remove this code when you are done testing.
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Found in TikTok Events Manager → Test Events. Remove after testing.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        GA4 Measurement Protocol (Direct)
                                    </CardTitle>
                                    <CardDescription>
                                        Send purchase events directly to Google Analytics 4 from your server — bypasses GTM for highest accuracy and deduplication.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ga4_measurement_id">Measurement ID</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="ga4_measurement_id"
                                                placeholder="G-XXXXXXXXXX"
                                                value={data.ga4_measurement_id}
                                                onChange={(e) => setData('ga4_measurement_id', e.target.value.trim())}
                                                className="font-mono"
                                            />
                                            {isGa4Connected && (
                                                <div className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Connected
                                                </div>
                                            )}
                                        </div>
                                        {errors.ga4_measurement_id && (
                                            <p className="text-sm text-destructive">{errors.ga4_measurement_id}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Format: G-XXXXXXXXXX. Found in GA4 Admin → Data Streams → your stream.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ga4_api_secret">Measurement Protocol API Secret</Label>
                                        <Input
                                            id="ga4_api_secret"
                                            type="password"
                                            placeholder="API secret..."
                                            value={data.ga4_api_secret}
                                            onChange={(e) => setData('ga4_api_secret', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.ga4_api_secret && (
                                            <p className="text-sm text-destructive">{errors.ga4_api_secret}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Create in GA4 Admin → Data Streams → your stream → Measurement Protocol API secrets.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Google Ads Conversion API
                                    </CardTitle>
                                    <CardDescription>
                                        Send purchase conversions server-side directly to Google Ads — no third-party proxy required. Requires OAuth2 credentials.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gads_customer_id">Customer ID</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="gads_customer_id"
                                                placeholder="1234567890"
                                                value={data.gads_customer_id}
                                                onChange={(e) => setData('gads_customer_id', e.target.value.trim())}
                                                className="font-mono"
                                            />
                                            {isGoogleAdsConnected && (
                                                <div className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Connected
                                                </div>
                                            )}
                                        </div>
                                        {errors.gads_customer_id && (
                                            <p className="text-sm text-destructive">{errors.gads_customer_id}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Your Google Ads Customer ID (digits only, no dashes). Found in Google Ads top-right corner.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gads_conversion_action_id">Conversion Action ID</Label>
                                        <Input
                                            id="gads_conversion_action_id"
                                            placeholder="123456789"
                                            value={data.gads_conversion_action_id}
                                            onChange={(e) => setData('gads_conversion_action_id', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.gads_conversion_action_id && (
                                            <p className="text-sm text-destructive">{errors.gads_conversion_action_id}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Numeric ID of your Purchase conversion action. Found in Goals → Conversions → edit action → URL contains the ID.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gads_developer_token">Developer Token</Label>
                                        <Input
                                            id="gads_developer_token"
                                            type="password"
                                            placeholder="Developer token..."
                                            value={data.gads_developer_token}
                                            onChange={(e) => setData('gads_developer_token', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.gads_developer_token && (
                                            <p className="text-sm text-destructive">{errors.gads_developer_token}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Found in Google Ads API Center → Tools → API Center.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gads_oauth_client_id">OAuth2 Client ID</Label>
                                        <Input
                                            id="gads_oauth_client_id"
                                            placeholder="xxxx.apps.googleusercontent.com"
                                            value={data.gads_oauth_client_id}
                                            onChange={(e) => setData('gads_oauth_client_id', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.gads_oauth_client_id && (
                                            <p className="text-sm text-destructive">{errors.gads_oauth_client_id}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            From Google Cloud Console → APIs &amp; Services → Credentials → OAuth 2.0 Client.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gads_oauth_client_secret">OAuth2 Client Secret</Label>
                                        <Input
                                            id="gads_oauth_client_secret"
                                            type="password"
                                            placeholder="Client secret..."
                                            value={data.gads_oauth_client_secret}
                                            onChange={(e) => setData('gads_oauth_client_secret', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.gads_oauth_client_secret && (
                                            <p className="text-sm text-destructive">{errors.gads_oauth_client_secret}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gads_refresh_token">OAuth2 Refresh Token</Label>
                                        <Input
                                            id="gads_refresh_token"
                                            type="password"
                                            placeholder="Refresh token..."
                                            value={data.gads_refresh_token}
                                            onChange={(e) => setData('gads_refresh_token', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.gads_refresh_token && (
                                            <p className="text-sm text-destructive">{errors.gads_refresh_token}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Long-lived refresh token. Generate using Google OAuth2 Playground or the Ads API client library auth flow.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gads_currency_code">Currency Code</Label>
                                        <Input
                                            id="gads_currency_code"
                                            placeholder="BDT"
                                            value={data.gads_currency_code}
                                            onChange={(e) => setData('gads_currency_code', e.target.value.trim().toUpperCase())}
                                            className="font-mono"
                                            maxLength={3}
                                        />
                                        {errors.gads_currency_code && (
                                            <p className="text-sm text-destructive">{errors.gads_currency_code}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            ISO 4217 currency code (e.g. BDT, USD). Must match your Google Ads account currency.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Info sidebar */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Tracked Events</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Meta Pixel (Browser + Server)</p>
                                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                                                {[
                                                    'PageView',
                                                    'ViewContent',
                                                    'AddToCart',
                                                    'InitiateCheckout',
                                                    'AddPaymentInfo',
                                                    'Purchase',
                                                    'Search',
                                                    'Contact',
                                                ].map((ev) => (
                                                    <li key={ev} className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                                        <code className="font-mono text-xs">{ev}</code>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">GTM Server-Side + GA4 Direct</p>
                                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                                                {[
                                                    'view_item',
                                                    'add_to_cart',
                                                    'begin_checkout',
                                                    'purchase',
                                                ].map((ev) => (
                                                    <li key={ev} className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                                                        <code className="font-mono text-xs">{ev}</code>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">TikTok Pixel (Browser + Server)</p>
                                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                                                {[
                                                    'ViewContent',
                                                    'AddToCart',
                                                    'InitiateCheckout',
                                                    'AddPaymentInfo',
                                                    'CompletePayment',
                                                    'PlaceAnOrder',
                                                ].map((ev) => (
                                                    <li key={ev} className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-pink-500" />
                                                        <code className="font-mono text-xs">{ev}</code>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Google Ads (Server)</p>
                                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                    <code className="font-mono text-xs">Purchase (click conversion)</code>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">How It Works</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    <p><strong>Browser-side:</strong> Meta & TikTok Pixels fire on every page for standard events.</p>
                                    <p><strong>Server-side:</strong> Your server sends events directly to Meta, TikTok & GTM for better accuracy.</p>
                                    <p><strong>Deduplication:</strong> Event IDs prevent counting events twice.</p>
                                    <a
                                        href="https://developers.facebook.com/docs/marketing-api/conversions-api"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                        Meta CAPI Docs <ExternalLink className="h-3 w-3" />
                                    </a>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Server-Side Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Meta CAPI</span>
                                        <span className={isMetaConnected ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                            {isMetaConnected ? '● Active' : '○ Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">GTM Server-Side</span>
                                        <span className={isGtmSsConnected ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                            {isGtmSsConnected ? '● Active' : '○ Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">TikTok Events API</span>
                                        <span className={isTiktokConnected ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                            {isTiktokConnected ? '● Active' : '○ Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">GA4 Measurement Protocol</span>
                                        <span className={isGa4Connected ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                            {isGa4Connected ? '● Active' : '○ Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Google Ads CAPI</span>
                                        <span className={isGoogleAdsConnected ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                            {isGoogleAdsConnected ? '● Active' : '○ Inactive'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Button type="submit" disabled={processing} className="w-auto">
                        {processing ? 'Saving…' : 'Save Tracking Settings'}
                    </Button>
                </form>
            </div>
        </>
    );
}
