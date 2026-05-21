import { Link, usePage } from '@inertiajs/react';
import { BarChart3, BadgeCheck, Bell, BookOpen, ClipboardList, Construction, CreditCard, FileText, FolderGit2, Globe, Image, LayoutDashboard, LayoutGrid, Mail, MapPin, Megaphone, Palette, Phone, PieChart, Rss, Search, Shield, ShieldCheck, ShieldX, Ticket, TrendingUp, Truck, Users, UserCheck, Tag, Layers, Package, MessageSquare, StickyNote, Settings, PanelTop, Star, RotateCcw, HardDriveDownload } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavGroup, NavItem } from '@/types';
import type { UserRole } from '@/types/auth';

function getNavGroups(role: UserRole): NavGroup[] {
    switch (role) {
        case 'super_admin':
            return [
                {
                    label: 'Main',
                    items: [
                        { title: 'Dashboard', href: '/super-admin/dashboard', icon: ShieldCheck },
                    ],
                },
                {
                    label: 'Users',
                    items: [
                        { title: 'Manage Users', href: '/super-admin/users', icon: Users },
                    ],
                },
                {
                    label: 'Settings',
                    items: [
                        { title: 'Maintenance Mode', href: '/super-admin/settings/maintenance', icon: Construction },
                        { title: 'Backup & Restore', href: '/super-admin/backup', icon: HardDriveDownload },
                    ],
                },
            ];
        case 'admin':
            return [
                {
                    label: 'Main',
                    items: [
                        { title: 'Dashboard', href: '/admin/dashboard', icon: Shield },
                        { title: 'Reports', href: '/admin/reports', icon: PieChart },
                    ],
                },
                {
                    label: 'Catalog',
                    items: [
                        {
                            title: 'Products',
                            href: '/admin/products',
                            icon: Package,
                            children: [
                                { title: 'Categories', href: '/admin/categories', icon: Tag },
                                { title: 'Sub Categories', href: '/admin/sub-categories', icon: Layers },
                                { title: 'All Products', href: '/admin/products', icon: Package },
                            ],
                        },
                        {
                            title: 'Shipping & Payment',
                            href: '/admin/shipping-zones',
                            icon: Truck,
                            children: [
                                { title: 'Shipping Zones', href: '/admin/shipping-zones', icon: MapPin },
                                { title: 'Payment Methods', href: '/admin/payment-methods', icon: CreditCard },
                                { title: 'Free Shipping', href: '/admin/settings/free-shipping', icon: Truck },
                            ],
                        },
                    ],
                },
                {
                    label: 'Commerce',
                    items: [
                        { title: 'Orders', href: '/admin/orders', icon: ClipboardList },
                        { title: 'Courier Dashboard', href: '/admin/courier-dashboard', icon: LayoutDashboard },
                        { title: 'Coupons', href: '/admin/coupons', icon: Ticket },
                        { title: 'Reviews', href: '/admin/reviews', icon: Star },
                        { title: 'Messages', href: '/admin/contacts', icon: Mail },
                        { title: 'Blocked IPs', href: '/admin/blocked-ips', icon: ShieldX },
                    ],
                },
                {
                    label: 'Advertising',
                    items: [
                        { title: 'Meta Ads Performance', href: '/admin/meta-ads', icon: TrendingUp },
                    ],
                },
                {
                    label: 'Content',
                    items: [
                        {
                            title: 'Marketing',
                            href: '/admin/landing-pages',
                            icon: Megaphone,
                            children: [
                                { title: 'Landing Pages', href: '/admin/landing-pages', icon: FileText },
                                { title: 'Banners', href: '/admin/banners', icon: Image },
                                { title: 'Top Bar Text', href: '/admin/settings/topbar', icon: Megaphone },
                                { title: 'Trust Badges', href: '/admin/settings/trust-badges', icon: BadgeCheck },
                            ],
                        },
                        {
                            title: 'Pages',
                            href: '/admin/pages',
                            icon: StickyNote,
                            children: [
                                { title: 'All Pages', href: '/admin/pages', icon: StickyNote },
                                { title: 'About Page', href: '/admin/settings/about-page', icon: BookOpen },
                                { title: 'Contact Page', href: '/admin/settings/contact-page', icon: Phone },
                                { title: 'Checkout Labels', href: '/admin/settings/checkout-labels', icon: Tag },
                                { title: 'Shipping & Return Policy', href: '/admin/settings/shipping-return-policy', icon: RotateCcw },
                            ],
                        },
                    ],
                },
                {
                    label: 'Users',
                    items: [
                        { title: 'Manage Users', href: '/admin/users', icon: Users },
                    ],
                },
                {
                    label: 'Settings',
                    items: [
                        {
                            title: 'Configuration',
                            href: '/admin/settings/site-branding',
                            icon: Settings,
                            children: [
                                { title: 'Site Branding', href: '/admin/settings/site-branding', icon: Globe },
                                { title: 'Theme Color', href: '/admin/settings/theme', icon: Palette },
                                { title: 'SEO Settings', href: '/admin/settings/seo', icon: Search },
                                { title: 'GTM Settings', href: '/admin/settings/gtm', icon: BarChart3 },
                                { title: 'Tracking & Pixel', href: '/admin/settings/tracking', icon: BarChart3 },
                                { title: 'Facebook Catalog', href: '/admin/settings/facebook-catalog', icon: Rss },
                                { title: 'Notifications', href: '/admin/settings/notifications', icon: Bell },
                                { title: 'Email / SMTP', href: '/admin/settings/email', icon: Mail },
                            ],
                        },
                        {
                            title: 'Courier',
                            href: '/admin/settings/pathao',
                            icon: Truck,
                            children: [
                                { title: 'Pathao Courier', href: '/admin/settings/pathao', icon: Truck },
                                { title: 'Steadfast Courier', href: '/admin/settings/steadfast', icon: Truck },
                                { title: 'RedX Courier', href: '/admin/settings/redx', icon: Truck },
                                { title: 'Carrybee Courier', href: '/admin/settings/carrybee', icon: Truck },
                                // { title: 'BD Courier Ratio', href: '/admin/settings/bdcourier', icon: Truck },
                                { title: 'Order Ratio Check', href: '/admin/settings/orderratiocheck', icon: Truck },
                            ],
                        },
                    ],
                },
            ];
        case 'manager':
            return [
                {
                    label: 'Main',
                    items: [
                        { title: 'Dashboard', href: '/manager/dashboard', icon: UserCheck },
                        { title: 'Reports', href: '/admin/reports', icon: PieChart },
                    ],
                },
                {
                    label: 'Catalog',
                    items: [
                        {
                            title: 'Products',
                            href: '/admin/products',
                            icon: Package,
                            children: [
                                { title: 'Categories', href: '/admin/categories', icon: Tag },
                                { title: 'Sub Categories', href: '/admin/sub-categories', icon: Layers },
                                { title: 'All Products', href: '/admin/products', icon: Package },
                            ],
                        },
                        {
                            title: 'Shipping & Payment',
                            href: '/admin/shipping-zones',
                            icon: Truck,
                            children: [
                                { title: 'Shipping Zones', href: '/admin/shipping-zones', icon: MapPin },
                                { title: 'Payment Methods', href: '/admin/payment-methods', icon: CreditCard },
                                { title: 'Free Shipping', href: '/admin/settings/free-shipping', icon: Truck },
                            ],
                        },
                    ],
                },
                {
                    label: 'Commerce',
                    items: [
                        { title: 'Orders', href: '/admin/orders', icon: ClipboardList },
                        { title: 'Courier Dashboard', href: '/admin/courier-dashboard', icon: LayoutDashboard },
                        { title: 'Coupons', href: '/admin/coupons', icon: Ticket },
                        { title: 'Reviews', href: '/admin/reviews', icon: Star },
                        { title: 'Messages', href: '/admin/contacts', icon: Mail },
                        { title: 'Blocked IPs', href: '/admin/blocked-ips', icon: ShieldX },
                    ],
                },
                {
                    label: 'Content',
                    items: [
                        {
                            title: 'Marketing',
                            href: '/admin/landing-pages',
                            icon: Megaphone,
                            children: [
                                { title: 'Landing Pages', href: '/admin/landing-pages', icon: FileText },
                                { title: 'Banners', href: '/admin/banners', icon: Image },
                                { title: 'Top Bar Text', href: '/admin/settings/topbar', icon: Megaphone },
                                { title: 'Trust Badges', href: '/admin/settings/trust-badges', icon: BadgeCheck },
                            ],
                        },
                        {
                            title: 'Pages',
                            href: '/admin/pages',
                            icon: StickyNote,
                            children: [
                                { title: 'All Pages', href: '/admin/pages', icon: StickyNote },
                                { title: 'About Page', href: '/admin/settings/about-page', icon: BookOpen },
                                { title: 'Contact Page', href: '/admin/settings/contact-page', icon: Phone },
                                { title: 'Checkout Labels', href: '/admin/settings/checkout-labels', icon: Tag },
                                { title: 'Shipping & Return Policy', href: '/admin/settings/shipping-return-policy', icon: RotateCcw },
                            ],
                        },
                    ],
                },
                {
                    label: 'Advertising',
                    items: [
                        { title: 'Meta Ads Performance', href: '/admin/meta-ads', icon: TrendingUp },
                    ],
                },
            ];
        default:
            return [
                {
                    label: 'Main',
                    items: [
                        { title: 'My Orders', href: '/user/dashboard', icon: Package },
                        { title: 'Track Orders', href: '/user/track-orders', icon: Search },
                    ],
                },
            ];
    }
}

function getDashboardHref(role: UserRole): string {
    switch (role) {
        case 'super_admin':
            return '/super-admin/dashboard';
        case 'admin':
            return '/admin/dashboard';
        case 'manager':
            return '/manager/dashboard';
        default:
            return '/user/dashboard';
    }
}

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: FolderGit2,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const pageProps = usePage<{ metaAdsConfigured?: boolean }>().props;
    const auth = pageProps.auth as { user?: { role?: string } } | undefined;
    const role = (auth?.user?.role as UserRole) || 'user';
    const mainNavGroups = getNavGroups(role).map((group) => {
        if (group.label !== 'Advertising') return group;
        return {
            ...group,
            items: group.items.filter(
                (item) => item.href !== '/admin/meta-ads' || pageProps.metaAdsConfigured
            ),
        };
    }).filter((group) => group.items.length > 0);
    const dashboardHref = getDashboardHref(role);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={mainNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
