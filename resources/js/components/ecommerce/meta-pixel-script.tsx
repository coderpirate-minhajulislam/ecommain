import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import clientParamBuilder from 'meta-capi-param-builder-clientjs';

interface MetaPixelScriptProps {
    pixelId?: string;
    pixelExternalId?: string;
}

/**
 * Retrieve the client's IP address from the /api/tracking/client-ip endpoint.
 * This is the getIpFn required by the param builder SDK to capture the
 * client_ip_address and save it in the _fbi cookie for server-side retrieval.
 */
async function getClientIp(): Promise<string> {
    try {
        const res = await fetch('/api/tracking/client-ip', { cache: 'no-store' });
        if (res.ok) {
            const data: { ip?: string } = await res.json();
            return data.ip ?? '';
        }
    } catch {
        // Non-critical
    }
    return '';
}

/**
 * Fires a server-side PageView (Meta CAPI + TikTok + GTM SS + GA4) and returns the event_id.
 * The browser pixel then fires fbq('track','PageView',{},{eventID}) to deduplicate.
 */
async function fireServerPageView(): Promise<string | null> {
    try {
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
        const res = await fetch('/api/tracking/page-view', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
            },
            body: JSON.stringify({ url: window.location.href }),
        });
        if (res.ok) {
            const data: { event_id?: string } = await res.json();
            return data.event_id ?? null;
        }
    } catch {
        // Non-critical — browser pixel still fires below
    }
    return null;
}

function fireBrowserPageView(eventId: string | null): void {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    if (eventId) {
        window.fbq('track', 'PageView', {}, { eventID: eventId });
    } else {
        window.fbq('track', 'PageView');
    }
}

/**
 * Injects the Meta (Facebook) Pixel base code in <head>.
 * Renders nothing when pixelId is empty.
 *
 * On mount (first page load):
 *  1. Runs the client-side param builder SDK (processAndCollectAllParams) which:
 *     - Reads/generates _fbc from fbclid in the URL or existing cookie.
 *     - Reads/generates _fbp from the existing cookie or creates a new one.
 *     - Captures the client IP (via getClientIp) and saves it to the _fbi cookie
 *       so the PHP server-side code can read it and send the best IP to Meta CAPI.
 *  2. Re-initialises fbq with advanced matching using the fbc/fbp values.
 *  3. Fires server-side PageView (Meta CAPI + TikTok + GTM SS + GA4).
 *  4. Fires browser-side fbq('track','PageView',{},{eventID}) for deduplication.
 *
 * On every subsequent Inertia SPA navigation (router 'finish' event):
 *  - Fires server-side + browser-side PageView with deduplication event_id.
 */
export function MetaPixelScript({ pixelId, pixelExternalId }: MetaPixelScriptProps) {
    const initialised = useRef(false);

    useEffect(() => {
        if (!pixelId || !/^\d+$/.test(pixelId)) return;
        if (initialised.current) return;
        initialised.current = true;

        // Run the param builder SDK: captures _fbc, _fbp, _fbi cookies early.
        // Per Meta best practices, this should happen as early as possible.
        (async () => {
            try {
                await clientParamBuilder.processAndCollectAllParams(
                    window.location.href,
                    getClientIp,
                );

                // Re-init fbq with advanced matching using the now-available fbc/fbp
                // and external_id (user ID for logged-in, session ID for guests).
                const fbc = clientParamBuilder.getFbc();
                const fbp = clientParamBuilder.getFbp();
                if (typeof window.fbq === 'function') {
                    const advancedMatching: Record<string, string> = {};
                    if (fbc) advancedMatching.fbc = fbc;
                    if (fbp) advancedMatching.fbp = fbp;
                    if (pixelExternalId) advancedMatching.external_id = pixelExternalId;
                    window.fbq('init', pixelId, advancedMatching);
                }
            } catch {
                // Param builder failure is non-critical
            }

            // Fire server-side then browser-side PageView
            const eventId = await fireServerPageView();
            fireBrowserPageView(eventId);
        })();

        // Inertia SPA navigations — fire PageView on every subsequent page change
        const removeListener = router.on('finish', () => {
            (async () => {
                const eventId = await fireServerPageView();
                fireBrowserPageView(eventId);
            })();
        });

        return () => {
            removeListener();
        };
    }, [pixelId]);

    if (!pixelId || !/^\d+$/.test(pixelId)) {
        return null;
    }

    return (
        <Head>
            <script
                id="meta-pixel-init"
                dangerouslySetInnerHTML={{
                    __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
                    `.trim(),
                }}
            />
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: 'none' }}
                    src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </Head>
    );
}
