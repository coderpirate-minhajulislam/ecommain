import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Smartphone, X } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';

type SiteBranding = { logo?: string; title?: string; subtitle?: string; phone?: string; whatsapp?: string };

export function ShopFooter({ className = '' }: { className?: string }) {
    const { siteBranding } = usePage<{ siteBranding?: SiteBranding }>().props;
    const { canNativeInstall, isInstalled, isInAppBrowser, isIOS, promptInstall, openInBrowser } = usePwaInstall();
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    const showInstallButton = !isInstalled && (canNativeInstall || isInAppBrowser);

    return (
        <footer className={`border-t border-border bg-muted/30 ${className}`}>
            <div className="px-4 py-8">
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                    <div>
                        <h4 className="mb-3 text-sm font-semibold">Shop</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/products?filter=new-arrivals" className="hover:text-foreground">New Arrivals</a></li>
                            <li><a href="/products?filter=featured" className="hover:text-foreground">Featured Products</a></li>
                            <li><a href="/products?filter=deals" className="hover:text-foreground">Deals of the Day</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-3 text-sm font-semibold">Support</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/page/help-center" className="hover:text-foreground">Help Center</a></li>
                            <li><a href="/track-order" className="hover:text-foreground">Track Order</a></li>
                            <li><a href="/page/returns" className="hover:text-foreground">Returns</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-3 text-sm font-semibold">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/about" className="hover:text-foreground">About Us</a></li>
                            <li><a href="/page/careers" className="hover:text-foreground">Careers</a></li>
                            <li><a href="/contact" className="hover:text-foreground">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-3 text-sm font-semibold">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/page/privacy-policy" className="hover:text-foreground">Privacy Policy</a></li>
                            <li><a href="/page/terms-of-service" className="hover:text-foreground">Terms of Service</a></li>
                            <li><a href="/page/cookie-policy" className="hover:text-foreground">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                {showInstallButton && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <button
                            onClick={() => {
                                if (canNativeInstall) {
                                    promptInstall();
                                } else if (isInAppBrowser) {
                                    if (isIOS) {
                                        setShowIOSGuide(true);
                                    } else {
                                        openInBrowser();
                                    }
                                }
                            }}
                            className="inline-flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary shadow-sm transition hover:bg-primary/20 active:scale-95"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-white">
                                {siteBranding?.logo
                                    ? <img src={`/${siteBranding.logo}`} alt={siteBranding.title ?? 'App'} className="size-full object-contain" />
                                    : <Smartphone className="size-5 text-primary" />
                                }
                            </span>
                            <span className="flex flex-col items-start leading-tight">
                                <span className="text-xs text-muted-foreground">
                                    {isInAppBrowser && !canNativeInstall
                                        ? (isIOS ? 'Tap to see how to install' : 'Open in browser to install')
                                        : 'Install on your device'
                                    }
                                </span>
                                <span className="font-semibold">Get App</span>
                            </span>
                        </button>

                        {/* iOS in-app browser instructions overlay */}
                        {showIOSGuide && (
                            <div className="relative mt-2 w-full max-w-xs rounded-xl border border-primary/30 bg-background p-4 text-sm shadow-lg">
                                <button
                                    onClick={() => setShowIOSGuide(false)}
                                    className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground"
                                    aria-label="Close"
                                >
                                    <X className="size-4" />
                                </button>
                                <p className="mb-2 font-semibold text-foreground">Install on iPhone / iPad</p>
                                <ol className="space-y-1 text-muted-foreground">
                                    <li>1. Tap the <strong>···</strong> or <strong>Share</strong> button in your browser menu.</li>
                                    <li>2. Select <strong>Open in Safari</strong>.</li>
                                    <li>3. In Safari, tap <strong>Share ↑</strong> then <strong>Add to Home Screen</strong>.</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} {siteBranding?.title || 'Our Store'}. All rights reserved. <br />
                    Develop & Maintain by{' '}
                    <a
                        href="https://wa.me/8801518401677"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                    >
                        Grow Ever
                    </a>
                </div>
            </div>
        </footer>
    );
}

