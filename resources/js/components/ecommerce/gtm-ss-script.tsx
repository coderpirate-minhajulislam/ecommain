import { Head } from '@inertiajs/react';

interface GtmSsScriptProps {
    gtmId?: string;
    gtmSsUrl?: string;
}

/**
 * Injects the GTM script tag that loads from a first-party GTM server-side container.
 * Falls back to standard GTM if no server-side URL is set.
 * Renders nothing when gtmId is empty.
 */
export function GtmSsScript({ gtmId, gtmSsUrl }: GtmSsScriptProps) {
    if (!gtmId || !gtmId.startsWith('GTM-')) {
        return null;
    }

    // If we have a server-side URL, load gtm.js from there instead of googletagmanager.com
    const origin = gtmSsUrl && /^https:\/\//.test(gtmSsUrl) ? gtmSsUrl.replace(/\/$/, '') : null;
    const scriptSrc = origin
        ? `${origin}/gtm.js?id=${gtmId}`
        : `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;

    const noscriptSrc = origin
        ? `${origin}/ns.html?id=${gtmId}`
        : `https://www.googletagmanager.com/ns.html?id=${gtmId}`;

    return (
        <>
            <Head>
                <script
                    id="gtm-ss-init"
                    dangerouslySetInnerHTML={{
                        __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'${scriptSrc}'+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');
                        `.trim(),
                    }}
                />
            </Head>
            <noscript>
                <iframe
                    src={noscriptSrc}
                    height="0"
                    width="0"
                    style={{ display: 'none', visibility: 'hidden' }}
                    title="GTM SS noscript"
                />
            </noscript>
        </>
    );
}
