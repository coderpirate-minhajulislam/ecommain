import { ArrowUp, Headset, MessageCircle, Phone, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { CategorySidebar } from '@/components/ecommerce/category-sidebar';
import { EcommerceHeader } from '@/components/ecommerce/ecommerce-header';
import { MobileBottomMenu } from '@/components/ecommerce/mobile-bottom-menu';
import { ShopFooter } from '@/components/ecommerce/shop-footer';
import { GtmScript } from '@/components/ecommerce/gtm-script';
import { GtmSsScript } from '@/components/ecommerce/gtm-ss-script';
import { MetaPixelScript } from '@/components/ecommerce/meta-pixel-script';
import { TikTokPixelScript } from '@/components/ecommerce/tiktok-pixel-script';

function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function onScroll() {
            setVisible(window.scrollY > 300);
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (!visible) {
        return null;
    }

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:bg-primary/90 lg:bottom-6"
        >
            <ArrowUp className="h-5 w-5" />
        </button>
    );
}

type SiteBranding = { logo?: string; title?: string; subtitle?: string; phone?: string; whatsapp?: string };

function FloatingSupportButton({ siteBranding }: { siteBranding?: SiteBranding }) {
    const [open, setOpen] = useState(false);
    const phone    = siteBranding?.phone?.trim();
    const whatsapp = siteBranding?.whatsapp?.trim()?.replace(/\D/g, '');
    const hasContact = phone || whatsapp;

    if (!hasContact) return null;

    return (
        <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2 lg:bottom-6">
            {open && (
                <div className="flex flex-col gap-2 mb-1">
                    {whatsapp && (
                        <a
                            href={`https://wa.me/${whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
                            title="WhatsApp"
                        >
                            <MessageCircle className="h-4 w-4" />
                        </a>
                    )}
                    {phone && (
                        <a
                            href={`tel:${phone}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform hover:scale-110"
                            title="Call Us"
                        >
                            <Phone className="h-4 w-4" />
                        </a>
                    )}
                </div>
            )}
            <button
                onClick={() => setOpen(!open)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
                title="Support"
            >
                {open ? <X className="h-4 w-4" /> : <Headset className="h-5 w-5" />}
            </button>
        </div>
    );
}

export function ShopLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const { gtmId, gtmSsUrl, metaPixelId, pixelExternalId, tiktokPixelId, siteBranding } = usePage<{ gtmId?: string; gtmSsUrl?: string; metaPixelId?: string; pixelExternalId?: string; tiktokPixelId?: string; siteBranding?: SiteBranding }>().props;

    // Capture UTM params from the landing URL and persist to sessionStorage.
    // Inertia SPA navigations won't have UTMs in the URL, so we only update when
    // present — preserving the original landing-page UTMs for the whole session.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
        keys.forEach((key) => {
            const val = params.get(key);
            if (val) sessionStorage.setItem(key, val);
        });
    }, []);

    const sidebarMargin = desktopCollapsed ? 'lg:ml-16' : 'lg:ml-60';

    // Use GTM SS script if server URL is configured, otherwise standard GTM
    const useServerSide = Boolean(gtmSsUrl);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {useServerSide ? <GtmSsScript gtmId={gtmId} gtmSsUrl={gtmSsUrl} /> : <GtmScript gtmId={gtmId} />}
            <MetaPixelScript pixelId={metaPixelId} pixelExternalId={pixelExternalId} />
            <TikTokPixelScript pixelId={tiktokPixelId} />
            <EcommerceHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <CategorySidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                desktopCollapsed={desktopCollapsed}
                onToggleDesktop={() => setDesktopCollapsed(!desktopCollapsed)}
            />

            <div className="flex w-full flex-1 py-6">
                <main className={`flex min-w-0 flex-1 flex-col gap-6 overflow-hidden px-4 pb-16 transition-[margin] duration-300 lg:pb-0 ${sidebarMargin}`}>
                    {children}
                </main>
            </div>

            <ShopFooter className={`mb-14 transition-[margin] duration-300 lg:mb-0 ${sidebarMargin}`} />

            <FloatingSupportButton siteBranding={siteBranding} />
            <MobileBottomMenu />
            <ScrollToTopButton />

        </div>
    );
}
