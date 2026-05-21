import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Mail,
    Package,
    PackageCheck,
    PackageX,
    RotateCcw,
    ShoppingCart,
    Star,
    Truck,
    XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

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
    inStockProducts: number;
    outOfStock: number;
    featuredProducts: number;
    totalReviews: number;
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

type DailyRevenue = { date: string; revenue: number; orders: number };

const STATUS_COLORS: Record<string, string> = {
    pending:    '#eab308',
    processing: '#3b82f6',
    shipped:    '#a855f7',
    delivered:  '#22c55e',
    cancelled:  '#ef4444',
    hold:       '#14b8a6',
    'pre-order':'#ec4899',
};

const PAYMENT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
            {label && <p className="mb-1 text-sm font-semibold text-card-foreground">{label}</p>}
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-card-foreground">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
                    <span>{entry.name === 'revenue' ? 'Revenue' : entry.name === 'orders' ? 'Orders' : entry.name}:</span>
                    <span className="font-medium">{entry.name === 'revenue' ? `৳${entry.value.toLocaleString()}` : entry.value}</span>
                </div>
            ))}
        </div>
    );
}

const statusColors: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    shipped:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delivered:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
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

function MetaAdsPanel({ connected }: { connected: boolean }) {
    const [period, setPeriod] = useState<MetaPeriod>('last_7d');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insights, setInsights] = useState<MetaInsight | null>(null);
    const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);

    const fetchData = useCallback(async (p: string) => {
        if (!connected) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/admin/meta-ads/insights?period=${p}`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin',
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? 'Failed to load Meta Ads data.');
                return;
            }
            setInsights(json.insights ?? {});
            setCampaigns(json.campaigns ?? []);
        } catch {
            setError('Network error — could not load Meta Ads data.');
        } finally {
            setLoading(false);
        }
    }, [connected]);

    useEffect(() => { fetchData(period); }, [period, fetchData]);

    const purchases = insights?.actions?.find((a) => a.action_type === 'purchase')?.value;

    const campaignStatusColor: Record<string, string> = {
        ACTIVE:           'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        PAUSED:           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        CAMPAIGN_PAUSED:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        ARCHIVED:         'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
    };

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Meta Ads Performance
                </h3>
                <a
                    href="https://adsmanager.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Ads Manager
                </a>
            </div>

            {!connected ? (
                <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/20">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Meta Ads not connected</p>
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Go to{' '}
                        <Link href="/admin/settings/tracking" className="underline">
                            Tracking Settings
                        </Link>{' '}
                        and enter your Ad Account ID to see your campaign performance here.
                    </p>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-4">
                        {/* Period tabs */}
                        <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
                            {META_PERIODS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setPeriod(key)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                        period === key
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center py-10 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <span className="text-sm">Loading Meta Ads data…</span>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                                {error.includes('#200') || error.toLowerCase().includes('ads_read') || error.toLowerCase().includes('ads_management') ? (
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                            ⚠️ The Conversions API (CAPI) token does not have permission to read ad data.
                                        </p>
                                        <p className="text-sm text-red-700 dark:text-red-400">
                                            The CAPI token is for <em>sending</em> events only. You need a separate <strong>Marketing API token</strong> with <code className="rounded bg-red-100 px-1 font-mono text-xs dark:bg-red-900/40">ads_read</code> permission.
                                        </p>
                                        <div className="rounded-md bg-white/70 p-3 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                            <p className="mb-1 font-semibold">How to get the token (2 options):</p>
                                            <p className="mb-2 font-medium">Option A — System User token (recommended, never expires):</p>
                                            <ol className="ml-4 list-decimal space-y-1">
                                                <li>Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="underline">Meta Business Settings → System Users</a></li>
                                                <li>Create or select a System User → click <strong>Generate New Token</strong></li>
                                                <li>Select your app, enable <strong>ads_read</strong> (and optionally <strong>ads_management</strong>)</li>
                                                <li>Copy the token and paste it in <strong>Ads API Access Token</strong> in <a href="/admin/settings/tracking" className="underline">Tracking Settings</a></li>
                                            </ol>
                                            <p className="mb-1 mt-3 font-medium">Option B — User token via Graph API Explorer (expires in ~60 days):</p>
                                            <ol className="ml-4 list-decimal space-y-1">
                                                <li>Open <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline">Graph API Explorer</a></li>
                                                <li>Select your app → click <strong>Generate Access Token</strong></li>
                                                <li>Grant <strong>ads_read</strong> permission when prompted</li>
                                                <li>Copy the token and paste it in <a href="/admin/settings/tracking" className="underline">Tracking Settings → Ads API Access Token</a></li>
                                            </ol>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-700 dark:text-red-400"><strong>Error:</strong> {error}</p>
                                )}
                            </div>
                        )}

                        {!loading && !error && insights && (
                            <>
                                {/* Key metrics */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                    {[
                                        { label: 'Spend',        value: fmtMoney(insights.spend),       color: 'text-blue-600' },
                                        { label: 'Impressions',  value: fmtNum(insights.impressions),   color: 'text-indigo-600' },
                                        { label: 'Clicks',       value: fmtNum(insights.clicks),        color: 'text-purple-600' },
                                        { label: 'Reach',        value: fmtNum(insights.reach),         color: 'text-teal-600' },
                                        { label: 'CTR',          value: insights.ctr ? parseFloat(insights.ctr).toFixed(2) + '%' : '—', color: 'text-amber-600' },
                                        { label: 'CPC',          value: fmtMoney(insights.cpc),         color: 'text-green-600' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="rounded-lg border border-border bg-card p-3">
                                            <p className="text-[11px] text-muted-foreground">{label}</p>
                                            <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {purchases !== undefined && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Purchases (from ads): <span className="font-semibold text-foreground">{fmtNum(purchases)}</span>
                                    </p>
                                )}

                                {Object.keys(insights).length === 0 && (
                                    <p className="mt-4 text-center text-sm text-muted-foreground">No ad data for this period.</p>
                                )}

                                {/* Campaigns */}
                                {campaigns.length > 0 && (
                                    <div className="mt-4">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Campaigns</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                                        <th className="pb-2 pr-4 font-medium">Campaign</th>
                                                        <th className="pb-2 pr-4 font-medium">Status</th>
                                                        <th className="pb-2 pr-4 font-medium text-right">Spend</th>
                                                        <th className="pb-2 pr-4 font-medium text-right">Clicks</th>
                                                        <th className="pb-2 font-medium text-right">CTR</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {campaigns.map((c) => {
                                                        const ci = c.insights?.data?.[0];
                                                        return (
                                                            <tr key={c.id} className="text-xs">
                                                                <td className="py-2 pr-4 max-w-45 truncate font-medium">{c.name}</td>
                                                                <td className="py-2 pr-4">
                                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${campaignStatusColor[c.effective_status] ?? ''}`}>
                                                                        {c.effective_status.replace('_', ' ').toLowerCase()}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 pr-4 text-right">{ci ? fmtMoney(ci.spend) : '—'}</td>
                                                                <td className="py-2 pr-4 text-right">{ci ? fmtNum(ci.clicks) : '—'}</td>
                                                                <td className="py-2 text-right">{ci ? parseFloat(ci.ctr).toFixed(2) + '%' : '—'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
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

export default function AdminDashboard() {
    const { stats, recentOrders, ordersByStatus, dailyRevenue, ordersByPayment } = usePage<{
        stats: Stats;
        recentOrders: RecentOrder[];
        ordersByStatus: Record<string, number>;
        dailyRevenue: DailyRevenue[];
        ordersByPayment: Record<string, number>;
    }>().props;
    const [clearing, setClearing] = useState(false);

    async function handleClearCache(e: React.FormEvent) {
        e.preventDefault();
        if (clearing) return;
        setClearing(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch('/admin/cache/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' },
            });
            if (!res.ok) {
                toast.error(`Failed to clear cache. (${res.status})`);
                return;
            }
            const data = await res.json();
            if (data.status === 'cleared') toast.success(data.message);
            else if (data.status === 'no_cache') toast.info(data.message);
            else toast.info(data.message);
        } catch (err) {
            toast.error('Failed to clear cache.');
            console.error(err);
        } finally {
            setClearing(false);
        }
    }

    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                        <p className="text-muted-foreground">Your store at a glance.</p>
                    </div>
                    <form onSubmit={handleClearCache}>
                        <button
                            type="submit"
                            disabled={clearing}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent disabled:opacity-60"
                        >
                            <RotateCcw className={`h-4 w-4 ${clearing ? 'animate-spin' : ''}`} />
                            {clearing ? 'Clearing…' : 'Clear Cache'}
                        </button>
                    </form>
                </div>

                {/* Charts — 3 side by side */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Daily Revenue Bar Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Revenue (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dailyRevenue.length === 0 ? (
                                <p className="py-12 text-center text-sm text-muted-foreground">No revenue data yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                                        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="revenue" />
                                        <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} name="orders" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Orders by Status Pie Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Orders by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(ordersByStatus).length === 0 ? (
                                <p className="py-12 text-center text-sm text-muted-foreground">No orders yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {Object.keys(ordersByStatus).map((status) => (
                                                <Cell key={status} fill={STATUS_COLORS[status] || '#94a3b8'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend
                                            formatter={(value: string, entry: { payload?: { percent?: number } }) => {
                                                const pct = entry.payload?.percent ? `${(entry.payload.percent * 100).toFixed(0)}%` : '';
                                                return `${value} ${pct}`;
                                            }}
                                            wrapperStyle={{ fontSize: 12 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Orders by Payment Method Pie Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(ordersByPayment).length === 0 ? (
                                <p className="py-12 text-center text-sm text-muted-foreground">No payment data yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(ordersByPayment).map(([name, value]) => ({ name: name || 'Unknown', value }))}
                                            cx="50%"
                                            cy="45%"
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {Object.entries(ordersByPayment).map(([, ], i) => (
                                                <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend
                                            formatter={(value: string, entry: { payload?: { percent?: number } }) => {
                                                const pct = entry.payload?.percent ? `${(entry.payload.percent * 100).toFixed(0)}%` : '';
                                                return `${value} ${pct}`;
                                            }}
                                            wrapperStyle={{ fontSize: 12 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Revenue</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard title="Total Revenue"      value={fmt(stats.totalRevenue)}  icon={BdtIcon} color="text-green-600 dark:text-green-400" />
                        <StatCard title="This Month"         value={fmt(stats.monthRevenue)}  icon={BdtIcon} color="text-blue-600 dark:text-blue-400" />
                        <StatCard title="Today"              value={fmt(stats.todayRevenue)}  icon={BdtIcon} color="text-purple-600 dark:text-purple-400" />
                    </div>
                </div>

                {/* Orders */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Orders</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <StatCard title="Total"      value={stats.totalOrders}      icon={ShoppingCart}  color="text-blue-600"   href="/admin/orders" />
                        <StatCard title="Pending"    value={stats.pendingOrders}    icon={ClipboardList} color="text-yellow-600" href="/admin/orders?status=pending" />
                        <StatCard title="Processing" value={stats.processingOrders} icon={ClipboardList} color="text-blue-500"   href="/admin/orders?status=processing" />
                        <StatCard title="Shipped"    value={stats.shippedOrders}    icon={Truck}         color="text-purple-600" href="/admin/orders?status=shipped" />
                        <StatCard title="Delivered"  value={stats.deliveredOrders}  icon={CheckCircle2}  color="text-green-600"  href="/admin/orders?status=delivered" />
                        <StatCard title="Cancelled"  value={stats.cancelledOrders}  icon={XCircle}       color="text-red-600"    href="/admin/orders?status=cancelled" />
                    </div>
                </div>

                {/* Products */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Products</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Products" value={stats.totalProducts}    icon={Package}      color="text-purple-600" href="/admin/products" />
                        <StatCard title="In Stock"        value={stats.inStockProducts}  icon={PackageCheck} color="text-green-600" />
                        <StatCard title="Out of Stock"    value={stats.outOfStock}       icon={PackageX}     color="text-red-600" />
                        <StatCard title="Featured"        value={stats.featuredProducts} icon={Star}         color="text-amber-500" />
                    </div>
                </div>

                {/* Engagement */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Engagement</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard title="Total Reviews"    value={stats.totalReviews}   icon={Star}         color="text-amber-500"  href="/admin/reviews" />
                        <StatCard title="Pending Approval" value={stats.pendingReviews} icon={AlertCircle}  color="text-orange-500" href="/admin/reviews" />
                        <StatCard title="Unread Messages"  value={stats.unreadMessages} icon={Mail}         color="text-blue-600"   href="/admin/contacts" />
                    </div>
                </div>

                {/* Bottom: recent orders + quick actions */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Recent orders */}
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
                                            <div className="mt-0.5 space-y-0.5">
                                                {order.items.map((item) => (
                                                    <p key={item.id} className="truncate max-w-48 text-xs text-muted-foreground/70">
                                                        {item.product_name} ×{item.quantity}
                                                    </p>
                                                ))}
                                            </div>
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

                    {/* Quick actions */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-4 space-y-1">
                            {[
                                { href: '/admin/orders',        icon: ShoppingCart,  label: 'Manage Orders' },
                                { href: '/admin/orders/create', icon: ClipboardList, label: 'Create Custom Order' },
                                { href: '/admin/products',      icon: Package,       label: 'Manage Products' },
                                { href: '/admin/reviews',       icon: Star,          label: 'Review Approvals' },
                                { href: '/admin/contacts',      icon: Mail,          label: 'Contact Messages' },
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

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Admin Dashboard', href: '/admin/dashboard' }],
};
