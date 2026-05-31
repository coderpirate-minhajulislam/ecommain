import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Eye, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFlashToast } from '@/hooks/use-flash-toast';

type OrderItem = {
    id: number;
    product_name: string;
    variant_label: string | null;
    price: string;
    quantity: number;
    total: string;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    order_source: string | null;
    subtotal: string;
    shipping: string;
    total: string;
    first_name: string;
    created_at: string;
    items: OrderItem[];
    pathao_consignment_id: string | null;
    pathao_order_status: string | null;
    steadfast_consignment_id: string | null;
    steadfast_status: string | null;
    redx_tracking_id: string | null;
    redx_status: string | null;
    carrybee_consignment_id: string | null;
    carrybee_status: string | null;
};

type PaginatedOrders = {
    data: Order[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    orders: PaginatedOrders;
    filters: { search?: string; status?: string; source?: string; perPage?: string };
    statuses: string[];
    sources: string[];
};

const perPageOptions = [10, 15, 25, 50, 100];

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    hold:       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'pre-order':'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const sourceColors: Record<string, string> = {
    fb: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    tiktok: 'bg-black/10 text-gray-800 dark:bg-white/10 dark:text-gray-200',
    google_ads: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    direct: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const sourceLabels: Record<string, string> = {
    fb: 'Facebook',
    tiktok: 'TikTok',
    google_ads: 'Google Ads',
    direct: 'Direct',
    admin: 'Admin',
};

function formatPrice(price: string | null): string {
    if (!price) {
        return '';
    }

    return `৳${parseFloat(price).toFixed(0)}`;
}

function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return {
        date: d.toLocaleDateString(),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
}

function getCourierStatus(order: Order) {
    if (order.pathao_consignment_id) {
        return { courier: 'Pathao', status: order.pathao_order_status };
    }
    if (order.steadfast_consignment_id) {
        return { courier: 'Steadfast', status: order.steadfast_status };
    }
    if (order.redx_tracking_id) {
        return { courier: 'RedX', status: order.redx_status };
    }
    if (order.carrybee_consignment_id) {
        return { courier: 'Carrybee', status: order.carrybee_status };
    }
    return null;
}

export default function OrdersIndex() {
    const { orders, filters, statuses, sources } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [source, setSource] = useState(filters.source || '');
    const [perPage, setPerPage] = useState(filters.perPage || '10');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useFlashToast();

    function handleBulkSync() {
        setSyncing(true);
        setSyncResult(null);
        fetch('/admin/courier-dashboard/sync', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            },
        })
            .then((r) => r.json())
            .then((res) => {
                setSyncResult({
                    type: res.success ? 'success' : 'error',
                    text: res.message ?? (res.success ? 'Sync complete.' : 'Sync failed.'),
                });
                if (res.success) {
                    // Reload the current page so order statuses reflect the sync
                    router.reload({ only: ['orders'] });
                }
            })
            .catch(() => setSyncResult({ type: 'error', text: 'Network error. Please try again.' }))
            .finally(() => setSyncing(false));
    }

    const fetchOrders = useCallback(
        (params: Record<string, string>) => {
            router.get('/admin/orders', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [],
    );

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchOrders({ search, status, source, perPage });
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search, status, source, perPage, fetchOrders]);

    function confirmDelete() {
        if (deleteOrderId !== null) {
            router.delete(`/admin/orders/${deleteOrderId}`, {
                onFinish: () => setDeleteOrderId(null),
            });
        }
    }

    return (
        <>
            <Head title="Manage Orders" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
                        <p className="text-muted-foreground">Manage customer orders.</p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <button
                            onClick={handleBulkSync}
                            disabled={syncing}
                            title="Fetch latest courier statuses and auto-mark delivered orders"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 sm:w-auto"
                        >
                            {syncing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            {syncing ? 'Syncing…' : 'Sync Courier Status'}
                        </button>
                        <Link
                            href="/admin/orders/create"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Create Order
                        </Link>
                    </div>
                </div>

                {syncResult && (
                    <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                        syncResult.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300'
                            : 'border-destructive/30 bg-destructive/5 text-destructive'
                    }`}>
                        {syncResult.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                            <X className="h-4 w-4 shrink-0" />
                        )}
                        <span>{syncResult.text}</span>
                        <button onClick={() => setSyncResult(null)} className="ml-auto opacity-60 hover:opacity-100">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by order #, name, product..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring sm:w-auto"
                    >
                        <option value="">All Statuses</option>
                        {statuses.map((s) => (
                            <option key={s} value={s} className="capitalize">
                                {s}
                            </option>
                        ))}
                    </select>
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-auto"
                    >
                        <option value="">All Sources</option>
                        {sources.map((s) => (
                            <option key={s} value={s}>
                                {sourceLabels[s] ?? s}
                            </option>
                        ))}
                    </select>
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-auto"
                    >
                        {perPageOptions.map((n) => (
                            <option key={n} value={String(n)}>
                                {n} per page
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-full overflow-x-auto rounded-xl border border-sidebar-border/70 [-webkit-overflow-scrolling:touch] dark:border-sidebar-border">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 border-b bg-muted/50">
                            <tr>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Order #</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Customer</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Items</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Total</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Status</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Courier</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Source</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Date</th>
                                <th className="sticky right-0 whitespace-nowrap bg-muted/50 px-2 py-3 text-right font-medium sm:px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.data.map((order) => {
                                const { date, time } = formatDateTime(order.created_at);
                                return (
                                    <tr key={order.id} className="group hover:bg-muted/30">
                                        <td className="whitespace-nowrap px-2 py-3 font-medium sm:px-4">
                                            {order.order_number}
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                            <div className="font-medium">{order.first_name}</div>
                                        </td>
                                        <td className="px-2 py-3 sm:px-4">
                                            <div className="text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                                            <div className="mt-0.5 space-y-0.5">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="truncate max-w-45 text-xs text-muted-foreground/80">
                                                        {item.product_name}{item.variant_label ? ` (${item.variant_label})` : ''} ×{item.quantity}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-3 font-medium text-primary sm:px-4">{formatPrice(order.total)}</td>
                                        <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[order.status] || ''}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                            {(() => {
                                                const courierInfo = getCourierStatus(order);
                                                if (!courierInfo) {
                                                    return <span className="text-xs text-muted-foreground/50">—</span>;
                                                }
                                                return (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-medium text-foreground">{courierInfo.courier}</span>
                                                        {courierInfo.status && (
                                                            <span className="text-xs text-muted-foreground capitalize">{courierInfo.status}</span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                            {order.order_source ? (
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sourceColors[order.order_source] || 'bg-gray-100 text-gray-600'}`}>
                                                    {sourceLabels[order.order_source] ?? order.order_source}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/50">—</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4">
                                            <div>{date}</div>
                                            <div className="text-xs text-muted-foreground/70">{time}</div>
                                        </td>
                                        <td className="sticky right-0 whitespace-nowrap bg-background px-2 py-3 text-right sm:px-4 group-hover:bg-muted/30">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/orders/${order.id}/edit`}
                                                    className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteOrderId(order.id)}
                                                    className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {orders.data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {orders.from && orders.to
                            ? `Showing ${orders.from} to ${orders.to} of ${orders.total} results`
                            : `${orders.total} results`}
                    </p>

                    {orders.last_page > 1 && (
                        <div className="flex flex-wrap gap-1">
                            {orders.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`rounded-md px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : link.url
                                              ? 'hover:bg-accent'
                                              : 'cursor-not-allowed opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveState
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteOrderId !== null} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this order? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

OrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Orders', href: '/admin/orders' },
    ],
};
