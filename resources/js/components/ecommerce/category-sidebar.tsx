import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Tag, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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

function CategoryItem({ category, desktopCollapsed, onExpand }: { category: DbCategory; desktopCollapsed: boolean; onExpand: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const Icon = category.icon
        ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon] || Tag
        : Tag;
    const hasSubs = category.sub_categories && category.sub_categories.length > 0;

    const handleCategoryClick = () => {
        if (hasSubs) {
            setExpanded(!expanded);
        } else {
            router.visit(`/category/${category.slug}`);
        }
    };

    const fullItem = (
        <li className={desktopCollapsed ? 'lg:hidden' : ''}>
            <button
                onClick={handleCategoryClick}
                className={cn(
                    'flex w-full items-center gap-2 sm:gap-3 rounded-md px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    expanded && 'bg-accent/50 text-accent-foreground',
                )}
            >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left truncate">{category.name}</span>
                {hasSubs && (
                    expanded
                        ? <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
                        : <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
                )}
            </button>
            {expanded && hasSubs && (
                <ul className="ml-4 sm:ml-7 mt-1 space-y-0.5 border-l border-border pl-2 sm:pl-3">
                    <li>
                        <Link
                            href={`/category/${category.slug}`}
                            className="block rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-sm sm:text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground truncate"
                        >
                            All {category.name}
                        </Link>
                    </li>
                    {category.sub_categories.map((sub) => (
                        <li key={sub.id}>
                            <Link
                                href={`/category/${sub.slug}`}
                                className="block rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-sm sm:text-base text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground truncate"
                            >
                                {sub.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );

    if (!desktopCollapsed) {
        return fullItem;
    }

    return (
        <>
            {fullItem}
            <li className="hidden lg:block">
                <button
                    onClick={onExpand}
                    className="flex w-full items-center justify-center rounded-md p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    title={category.name}
                >
                    <Icon className="h-5 w-5 shrink-0" />
                </button>
            </li>
        </>
    );
}

export function CategorySidebar({
    open,
    onClose,
    desktopCollapsed,
    onToggleDesktop,
}: {
    open: boolean;
    onClose: () => void;
    desktopCollapsed: boolean;
    onToggleDesktop: () => void;
}) {
    const page = usePage<{ categories: DbCategory[]; topbarText?: string }>();
    const pageProps = page.props;
    const currentUrl = page.url;
    const isActive = (href: string) => href === '/' ? currentUrl === '/' : currentUrl.startsWith(href);
    const { categories } = pageProps;
    const topbarText = pageProps.topbarText;
    // header = h-14 (3.5rem) + optional topbar (py-2 + text-sm ≈ 2.25rem)
    const sidebarTop = topbarText ? 'calc(3.5rem + 2.25rem)' : '3.5rem';
    // Tailwind classes for desktop top/height aligned to actual header height
    const desktopPositionClass = topbarText
        ? 'lg:top-[5.75rem] lg:h-[calc(100vh-5.75rem)]'
        : 'lg:top-14 lg:h-[calc(100vh-3.5rem)]';

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-40 h-full transform overflow-y-auto bg-background transition-all duration-300 ease-in-out',
                    'w-64 sm:w-72 md:w-80',
                    'lg:fixed lg:z-30 lg:translate-x-0',
                    desktopPositionClass,
                    desktopCollapsed ? 'lg:w-16' : 'lg:w-60',
                    open ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {/* Mobile close button */}
                <div className="flex items-center justify-between px-3 py-3 sm:px-4 lg:hidden" style={{ marginTop: sidebarTop }}>
                    <span className="text-sm font-semibold sm:text-base">Menu</span>
                    <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                {/* Mobile nav links */}
                <div className="p-2 sm:p-3 lg:hidden">
                    <ul className="space-y-0.5">
                        <li>
                            <Link href="/" className={`block rounded-md px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base font-medium transition-colors hover:bg-accent ${isActive('/') ? 'text-primary' : ''}`}>Home</Link>
                        </li>
                        <li>
                            <Link href="/products" className={`block rounded-md px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base font-medium transition-colors hover:bg-accent ${isActive('/products') ? 'text-primary' : 'text-muted-foreground'}`}>Shop</Link>
                        </li>
                        <li>
                            <Link href="/about" className={`block rounded-md px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base font-medium transition-colors hover:bg-accent ${isActive('/about') ? 'text-primary' : 'text-muted-foreground'}`}>About</Link>
                        </li>
                        <li>
                            <Link href="/contact" className={`block rounded-md px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base font-medium transition-colors hover:bg-accent ${isActive('/contact') ? 'text-primary' : 'text-muted-foreground'}`}>Contact</Link>
                        </li>
                    </ul>
                </div>

                <div className={cn('p-2 sm:p-3 lg:p-2 lg:pt-1', desktopCollapsed && 'lg:p-2')}>
                    {!desktopCollapsed && (
                        <div className="mb-1 hidden items-center justify-between px-2 lg:flex">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Browse Categories
                            </h3>
                            <button
                                onClick={onToggleDesktop}
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <ul className="space-y-0.5">
                        {categories.map((cat) => (
                            <CategoryItem key={cat.id} category={cat} desktopCollapsed={desktopCollapsed} onExpand={onToggleDesktop} />
                        ))}
                    </ul>
                </div>
            </aside>
        </>
    );
}
