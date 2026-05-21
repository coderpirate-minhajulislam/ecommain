import { Head } from '@inertiajs/react';

interface GtmScriptProps {
    gtmId?: string;
}

/**
 * Injects the GTM <script> tag in <head> and the <noscript> fallback.
 * Renders nothing when gtmId is empty or not set.
 */
export function GtmScript({ gtmId }: GtmScriptProps) {
    if (!gtmId || !gtmId.startsWith('GTM-')) {
        return null;
    }

    return (
        <>
            <Head>
                <script
                    id="gtm-init"
                    dangerouslySetInnerHTML={{
                        __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');
                        `.trim(),
                    }}
                />
            </Head>
            {/* GTM noscript fallback */}
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                    height="0"
                    width="0"
                    style={{ display: 'none', visibility: 'hidden' }}
                    title="GTM noscript"
                />
            </noscript>
        </>
    );
}
