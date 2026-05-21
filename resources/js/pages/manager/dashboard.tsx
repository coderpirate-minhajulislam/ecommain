import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Mail,
    Package,
    ShoppingCart,
    Star,
    Truck,
    XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Stats = {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: string;
    todayRevenue: string;
    monthRevenue: string;
    totalProducts: number;
    pendingReviews: number;
    unreadMessages: number;
};

type OrderItem = { id: number; product_name: string; quantity: number };
type RecentOrder = {
    id: number;
    order_number: string;
    status: string;
    total: string;
    first_name: string;
    created_at: string;
    items: OrderItem[];
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    hold:       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'pre-order':'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

function fmt(val: string | number) {
    return '৳' + parseFloat(String(val) || '0').toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BdtIcon({ className }: { className?: string }) {
    return <span className={`font-bold ${className ?? ''}`}>৳</span>;
}

function StatCard({
    title, value, icon: Icon, color, href,
}: { title: string; value: string | number; icon: React.ElementType; color: string; href?: string }) {
    const inner = (
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">{value}</p>
        </CardContent>
    );
    if (href) {
        return (
            <Card className="transition-shadow hover:shadow-md">
                <Link href={href}>{inner}</Link>
            </Card>
        );
    }
    return <Card>{inner}</Card>;
}

export default function ManagerDashboard() {
    const { stats, recentOrders } = usePage<{ stats: Stats; recentOrders: RecentOrder[] }>().props;

    return (
        <>
            <Head title="Manager Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Your store at a glance.</p>
                </div>

                {/* Revenue */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Revenue</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard title="Total Revenue" value={fmt(stats.totalRevenue)} icon={BdtIcon} color="text-green-600 dark:text-green-400" />
                        <StatCard title="This Month" value={fmt(stats.monthRevenue)} icon={BdtIcon} color="text-blue-600 dark:text-blue-400" />
                        <StatCard title="Today" value={fmt(stats.todayRevenue)} icon={BdtIcon} color="text-purple-600 dark:text-purple-400" />
                    </div>
                </div>

                {/* Orders */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Orders</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <StatCard title="Total" value={stats.totalOrders} icon={ShoppingCart} color="text-blue-600" href="/admin/orders" />
                        <StatCard title="Pending" value={stats.pendingOrders} icon={ClipboardList} color="text-yellow-600" href="/admin/orders?status=pending" />
                        <StatCard title="Processing" value={stats.processingOrders} icon={ClipboardList} color="text-blue-500" href="/admin/orders?status=processing" />
                        <StatCard title="Shipped" value={stats.shippedOrders} icon={Truck} color="text-purple-600" href="/admin/orders?status=shipped" />
                        <StatCard title="Delivered" value={stats.deliveredOrders} icon={CheckCircle2} color="text-green-600" href="/admin/orders?status=delivered" />
                        <StatCard title="Cancelled" value={stats.cancelledOrders} icon={XCircle} color="text-red-600" href="/admin/orders?status=cancelled" />
                    </div>
                </div>

                {/* Engagement */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Engagement</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} color="text-purple-600" href="/admin/products" />
                        <StatCard title="Pending Reviews" value={stats.pendingReviews} icon={AlertCircle} color="text-orange-500" href="/admin/reviews" />
                        <StatCard title="Unread Messages" value={stats.unreadMessages} icon={Mail} color="text-blue-600" href="/admin/contacts" />
                    </div>
                </div>

                {/* Bottom: recent orders + quick actions */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h3 className="text-lg font-semibold">Recent Orders</h3>
                            <Link href="/admin/orders" className="text-sm text-primary hover:underline">View all</Link>
                        </div>
                        <div className="divide-y">
                            {recentOrders.length === 0 ? (
                                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
                            ) : (
                                recentOrders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/admin/orders/${order.id}`}
                                        className="flex items-center justify-between px-6 py-3 hover:bg-muted/30"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{order.order_number}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.first_name} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-primary">{fmt(order.total)}</p>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[order.status] || ''}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-4 space-y-1">
                            {[
                                { href: '/admin/orders', icon: ShoppingCart, label: 'Manage Orders' },
                                { href: '/admin/orders/create', icon: ClipboardList, label: 'Create Custom Order' },
                                { href: '/admin/products', icon: Package, label: 'Manage Products' },
                                { href: '/admin/reviews', icon: Star, label: 'Review Approvals' },
                                { href: '/admin/contacts', icon: Mail, label: 'Contact Messages' },
                            ].map(({ href, icon: Icon, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-accent"
                                >
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ManagerDashboard.layout = {
    breadcrumbs: [{ title: 'Manager Dashboard', href: '/manager/dashboard' }],
};
