import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Grid3x3, Home, ShoppingBag, ShoppingCart, Tag, User } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useCart } from '@/stores/use-cart';

type SubCategory = {
    id: number;
    category_id: number;
    name: string;
    slug: string;
};

type DbCategory = {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    image_path: string | null;
    sub_categories: SubCategory[];
};

function MobileCategorySheet({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { categories } = usePage<{ categories: DbCategory[] }>().props;
    const [expandedId, setExpandedId] = useState<number | null>(null);

    if (!open) {
        return null;
    }

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-72 overflow-y-auto bg-background border-l border-border shadow-xl animate-in slide-in-from-right duration-300 pb-14">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Browse Categories</h2>
                    <button onClick={onClose} className="text-sm font-medium text-primary">
                        Close
                    </button>
                </div>
                <div className="p-3">
                    <ul className="space-y-0.5">
                        {categories.map((cat) => {
                            const Icon = cat.icon
                                ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[cat.icon] || Tag
                                : Tag;
                            const hasSubs = cat.sub_categories && cat.sub_categories.length > 0;
                            const isExpanded = expandedId === cat.id;

                            return (
                                <li key={cat.id}>
                                    <button
                                        onClick={() => {
                                            if (hasSubs) {
                                                setExpandedId(isExpanded ? null : cat.id);
                                            } else {
                                                onClose();
                                                router.visit(`/category/${cat.slug}`);
                                            }
                                        }}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                                            isExpanded && 'bg-accent/50 text-accent-foreground',
                                        )}
                                    >
                                        <span className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden',
                                            isExpanded ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="flex-1 text-left truncate">{cat.name}</span>
                                        {hasSubs && (
                                            isExpanded
                                                ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        )}
                                    </button>
                                    {isExpanded && hasSubs && (
                                        <ul className="ml-7 mt-1 space-y-0.5 border-l border-border pl-3">
                                            <li>
                                                <Link
                                                    href={`/category/${cat.slug}`}
                                                    onClick={onClose}
                                                    className="block rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground truncate"
                                                >
                                                    All {cat.name}
                                                </Link>
                                            </li>
                                            {cat.sub_categories.map((sub) => (
                                                <li key={sub.id}>
                                                    <Link
                                                        href={`/category/${sub.slug}`}
                                                        onClick={onClose}
                                                        className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground truncate"
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                        {categories.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">No categories yet.</p>
                        )}
                    </ul>
                </div>
            </div>
        </>
    );
}

export function MobileBottomMenu() {
    const page = usePage<{ cartPageEnabled?: boolean }>();
    const pageProps = page.props;
    const currentUrl = page.url;
    const isActive = (href: string) => href === '/' ? currentUrl === '/' : currentUrl.startsWith(href);
    const auth = pageProps.auth as { user?: { id: number; name: string; email: string } } | undefined;
    const cartHref = pageProps.cartPageEnabled === false ? '/checkout' : '/cart';
    const [categoriesOpen, setCategoriesOpen] = useState(false);
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

    const menuItems = [
        { name: 'Home', icon: Home, href: '/' },
        { name: 'Category', icon: Grid3x3, href: '#', onClick: () => setCategoriesOpen(true) },
        { name: 'Shop', icon: ShoppingBag, href: '/products' },
        { name: 'Cart', icon: ShoppingCart, href: cartHref, badge: totalItems },
        { name: 'Account', icon: User, href: auth?.user ? '/dashboard' : '/login' },
    ];

    return (
        <>
            <MobileCategorySheet open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
                <div className="flex h-14 items-center justify-around">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        if (item.onClick) {
                            return (
                                <button
                                    key={item.name}
                                    onClick={item.onClick}
                                    className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-[10px] font-medium">{item.name}</span>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href!}
                                className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors hover:text-primary ${isActive(item.href!) ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                <span
                                    ref={item.name === 'Cart' ? cartIconRef : undefined}
                                    className="inline-flex"
                                >
                                    <Icon className="h-5 w-5" />
                                </span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute right-1/4 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                                        {item.badge}
                                    </span>
                                )}
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
