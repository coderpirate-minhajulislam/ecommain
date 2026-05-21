import { Link, usePage, router } from '@inertiajs/react';
import { Home, Info, Mail, Menu, Search, ShoppingBag, ShoppingCart, User, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import AppLogo from '@/components/app-logo';
import { useCart } from '@/stores/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Product } from '@/types/global';

function formatPrice(price: string | null): string {
    if (!price) return '';
    return `৳${parseFloat(price).toFixed(0)}`;
}

type SiteBranding = { logo?: string; title?: string; subtitle?: string; phone?: string; whatsapp?: string };

export function EcommerceHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    const page = usePage<{ searchProducts?: Product[]; topbarText?: string; siteBranding?: SiteBranding; cartPageEnabled?: boolean }>();
    const pageProps = page.props;
    const currentUrl = page.url;
    const isActive = (href: string) => href === '/' ? currentUrl === '/' : currentUrl.startsWith(href);
    const topbarText = pageProps.topbarText;
    const siteBranding = pageProps.siteBranding;
    const auth = pageProps.auth as { user?: { id: number; name: string; email: string } } | undefined;
    const allProducts = Array.isArray(pageProps.searchProducts) ? pageProps.searchProducts : [];
    const cartHref = pageProps.cartPageEnabled === false ? '/checkout' : '/cart';
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const mobileSearchRef = useRef<HTMLInputElement>(null);
    const desktopSearchRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const { totalItems } = useCart();
    const cartIconRef = useRef<HTMLSpanElement>(null);
    const prevCartTotalRef = useRef(totalItems);

    useEffect(() => {
        if (cartIconRef.current && totalItems > 0) {
            cartIconRef.current.classList.add('animate-cart-bump');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        prevCartTotalRef.current = totalItems;

        if (!cartIconRef.current) {
            return;
        }

        const el = cartIconRef.current;

        if (totalItems > 0) {
            el.classList.remove('animate-cart-bump');
            void el.offsetWidth;
            el.classList.add('animate-cart-bump');
        } else {
            el.classList.remove('animate-cart-bump');
        }
    }, [totalItems]);

    // Get suggestions based on search query
    const suggestions = useMemo(() => {
        if (!searchQuery || searchQuery.length < 1 || !allProducts) return [];
        return allProducts
            .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 5);
    }, [searchQuery, allProducts]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (query: string) => {
        if (query.trim()) {
            router.get('/products', { search: query });
            setSearchQuery('');
            setShowSuggestions(false);
            setSearchOpen(false);
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, query: string) => {
        if (e.key === 'Enter') {
            handleSearch(query);
        }
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background">
            {/* Top bar */}
            {topbarText && (
                <div className="bg-primary overflow-hidden py-2 text-sm font-medium text-primary-foreground">
                    <span className="inline-block whitespace-nowrap animate-marquee">{topbarText}</span>
                </div>
            )}

            {/* Main header */}
            <div className="flex h-14 items-center gap-3 px-4">
                {/* Mobile menu toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 lg:hidden"
                    onClick={onToggleSidebar}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Logo */}
                <Link href="/" className="flex shrink-0 items-center gap-2">
                    {siteBranding?.logo
                        ? <img src={`/${siteBranding.logo}`} alt={siteBranding.title || 'Logo'} className="h-10 max-w-[150px] rounded-lg object-contain" />
                        : <AppLogo />
                    }
                    {siteBranding?.title && (
                        <span className="text-base font-semibold truncate max-w-[150px]">{siteBranding.title}</span>
                    )}
                </Link>

                <div className="flex-1" />

                {/* Mobile search toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 lg:hidden"
                    onClick={() => setSearchOpen(!searchOpen)}
                >
                    {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>

                {/* Right side: nav + search + actions */}
                <div className="hidden items-center gap-2 lg:flex">
                    <nav className="flex items-center gap-5 mr-4">
                        <Link href="/" className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}><Home className="h-4 w-4" />Home</Link>
                        <Link href="/products" className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${isActive('/products') ? 'text-primary' : 'text-muted-foreground'}`}><ShoppingBag className="h-4 w-4" />Shop</Link>
                        <Link href="/about" className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${isActive('/about') ? 'text-primary' : 'text-muted-foreground'}`}><Info className="h-4 w-4" />About</Link>
                        <Link href="/contact" className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${isActive('/contact') ? 'text-primary' : 'text-muted-foreground'}`}><Mail className="h-4 w-4" />Contact</Link>
                    </nav>
                    <div className="relative w-64" ref={searchContainerRef}>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            ref={desktopSearchRef}
                            type="text"
                            placeholder="Search products..."
                            className="h-9 pl-9"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={(e) => handleSearchKeyDown(e, searchQuery)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}

                        {/* Desktop suggestions dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-md shadow-lg z-50">
                                {suggestions.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/product/${product.slug}`}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted border-b last:border-b-0"
                                    >
                                        <div className="h-10 w-10 rounded bg-muted/50 shrink-0 overflow-hidden">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={`/${product.images[0].image_path}`}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex items-center justify-center h-full text-lg">📦</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="relative" asChild>
                        <Link href={cartHref}>
                            <span ref={cartIconRef} className="inline-flex">
                                <ShoppingCart className="h-5 w-5" />
                            </span>
                            {totalItems > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {totalItems > 99 ? '99+' : totalItems}
                                </span>
                            )}
                        </Link>
                    </Button>
                    {auth.user ? (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard">
                                <User className="mr-1.5 h-4 w-4" />
                                {auth.user.name}
                            </Link>
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/register">Register</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile search bar */}
            {searchOpen && (
                <div className="border-t px-4 py-2 lg:hidden">
                    <div className="relative" ref={searchContainerRef}>
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                ref={mobileSearchRef}
                                type="text"
                                placeholder="Search products..."
                                className="pl-9 w-full"
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={(e) => handleSearchKeyDown(e, searchQuery)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 p-1 hover:bg-muted rounded"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        {/* Mobile suggestions dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-md shadow-lg z-50">
                                {suggestions.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/product/${product.slug}`}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted border-b last:border-b-0"
                                    >
                                        <div className="h-10 w-10 rounded bg-muted/50 shrink-0 overflow-hidden">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={`/${product.images[0].image_path}`}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex items-center justify-center h-full text-lg">📦</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

