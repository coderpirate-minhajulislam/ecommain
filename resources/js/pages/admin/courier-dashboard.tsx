import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    BadgeDollarSign,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    HelpCircle,
    Loader2,
    Package,
    RefreshCw,
    RotateCcw,
    Search,
    TrendingDown,
    TrendingUp,
    Truck,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type CourierStats = {
    name: string;
    total: number;
    delivered: number;
    cancelled: number;
    pending: number;
    in_transit: number;
    returned: number;
    not_synced: number;
    statuses: Record<string, number>;
    delivered_amount: number;
    cancelled_amount: number;
    returned_amount: number;
    net_amount: number;
};

type Filters = { date_from: string | null; date_to: string | null };

type PageProps = {
    couriers: Record<string, CourierStats>;
    lastSyncedAt: string | null;
    filters: Filters;
};

type OrderRow = {
    id: number;
    order_number: string;
    first_name: string;
    phone: string;
    created_at: string;
    [key: string]: string | number;
};

type OrderMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

type OrdersResult = {
    data: OrderRow[];
    meta: OrderMeta;
    id_col: string;
    status_col: string;
} | null;

const COURIER_COLORS: Record<string, string> = {
    steadfast: '#3b82f6',
    pathao:    '#f59e0b',
    redx:      '#ef4444',
    carrybee:  '#22c55e',
};

function pct(part: number, total: number): string {
    if (!total) return '0%';
    return (Math.round((part / total) * 1000) / 10).toFixed(1) + '%';
}

function fmt(amount: number): string {
    return '৳' + Math.round(amount).toLocaleString('en-BD');
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: number; sub?: string; icon: React.ElementType; color: string }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: color + '20' }}>
                <Icon className="h-4 w-4" style={{ color }} />
            </span>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold leading-none">{value.toLocaleString()}</p>
                {sub && <p className="mt-0.5 text-xs font-medium" style={{ color }}>{sub}</p>}
            </div>
        </div>
    );
}

function RatioBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const ratio = total ? (value / total) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold" style={{ color }}>
                    {value.toLocaleString()} <span className="text-muted-foreground font-normal">({pct(value, total)})</span>
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${ratio.toFixed(1)}%`, background: color }} />
            </div>
        </div>
    );
}

function StatusBreakdown({ statuses, total, selectedStatus, onStatusClick }: {
    statuses: Record<string, number>;
    total: number;
    selectedStatus: string | null;
    onStatusClick: (status: string | null) => void;
}) {
    const rows = Object.entries(statuses).filter(([, cnt]) => cnt > 0);
    if (rows.length === 0) return <p className="text-sm text-muted-foreground">No orders found.</p>;
    return (
        <div className="space-y-1">
            {selectedStatus && (
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                        Showing orders for: <span className="font-semibold capitalize">{selectedStatus}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => onStatusClick(null)}
                        className="text-xs text-primary hover:underline">
                        Clear filter
                    </button>
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Ratio</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map(([status, count]) => {
                        const isSelected = selectedStatus === status;
                        return (
                            <TableRow
                                key={status}
                                className={`cursor-pointer transition-colors ${
                                    isSelected
                                        ? 'bg-primary/10 hover:bg-primary/15'
                                        : 'hover:bg-muted/60'
                                }`}
                                onClick={() => onStatusClick(isSelected ? null : status)}
                            >
                                <TableCell>
                                    <Badge
                                        variant={isSelected ? 'default' : 'outline'}
                                        className="font-normal capitalize">
                                        {status || '(unset)'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">{count}</TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">{pct(count, total)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function CourierPanel({ slug, stats, dateFrom, dateTo }: { slug: string; stats: CourierStats; dateFrom: string; dateTo: string }) {
    const color = COURIER_COLORS[slug] ?? '#6366f1';
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: color }}>
                    <Truck className="h-4 w-4" />
                </span>
                <CardTitle className="text-base">{stats.name}</CardTitle>
                <Badge className="ml-auto" variant="secondary">{stats.total} total</Badge>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    <StatCard label="Total Sent"    value={stats.total}      icon={Package}      color={color} />
                    <StatCard label="Delivered"     value={stats.delivered}  icon={CheckCircle2} color="#22c55e"  sub={pct(stats.delivered, stats.total)} />
                    <StatCard label="In Transit"    value={stats.in_transit} icon={Truck}        color="#3b82f6"  sub={pct(stats.in_transit, stats.total)} />
                    <StatCard label="Pending"       value={stats.pending}    icon={Clock}        color="#f59e0b"  sub={pct(stats.pending, stats.total)} />
                    <StatCard label="Cancelled"     value={stats.cancelled}  icon={XCircle}      color="#ef4444"  sub={pct(stats.cancelled, stats.total)} />
                    {stats.returned > 0 && <StatCard label="Returned"       value={stats.returned}  icon={RotateCcw} color="#a855f7" sub={pct(stats.returned, stats.total)} />}
                    {stats.not_synced > 0 && <StatCard label="Not Synced Yet" value={stats.not_synced} icon={HelpCircle} color="#94a3b8" />}
                </div>
                {stats.total > 0 && (
                    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cancel & Return Ratio</p>
                        <RatioBar label="Cancellation Rate"     value={stats.cancelled} total={stats.total} color="#ef4444" />
                        {stats.returned > 0 && <RatioBar label="Return Rate" value={stats.returned} total={stats.total} color="#a855f7" />}
                        <RatioBar label="Delivery Success Rate" value={stats.delivered} total={stats.total} color="#22c55e" />
                    </div>
                )}
                <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">All Status Breakdown</p>
                    <StatusBreakdown
                        statuses={stats.statuses}
                        total={stats.total}
                        selectedStatus={selectedStatus}
                        onStatusClick={setSelectedStatus}
                    />
                </div>
                <div className="border-t border-border pt-4">
                    <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Sent Orders List</p>
                    <OrderTable slug={slug} courierName={stats.name} dateFrom={dateFrom} dateTo={dateTo} statusFilter={selectedStatus} />
                </div>
            </CardContent>
        </Card>
    );
}

const STATUS_COLOR: Record<string, string> = {
    delivered: 'bg-green-100 text-green-700 border-green-200',
    Delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    Cancelled: 'bg-red-100 text-red-700 border-red-200',
    pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    Pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    in_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    unknown:   'bg-gray-100 text-gray-600 border-gray-200',
    returned:  'bg-purple-100 text-purple-700 border-purple-200',
    Returned:  'bg-purple-100 text-purple-700 border-purple-200',
    in_transit:'bg-blue-100 text-blue-700 border-blue-200',
    In_transit:  'bg-blue-100 text-blue-700 border-blue-200',
    hold:        'bg-teal-100 text-teal-700 border-teal-200',
    Hold:        'bg-teal-100 text-teal-700 border-teal-200',
    'pre-order': 'bg-pink-100 text-pink-700 border-pink-200',
    'Pre-Order': 'bg-pink-100 text-pink-700 border-pink-200',
};

function statusClass(status: string | null | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-500 border-gray-200';
    return STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

function OrderTable({ slug, courierName, dateFrom, dateTo, statusFilter }: { slug: string; courierName: string; dateFrom: string; dateTo: string; statusFilter?: string | null }) {
    const [search,  setSearch]  = useState('');
    const [input,   setInput]   = useState('');
    const [page,    setPage]    = useState(1);
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState<OrdersResult>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchOrders = useCallback(async (q: string, pg: number, status?: string | null) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ courier: slug, page: String(pg) });
            if (q)        params.set('search',    q);
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo)   params.set('date_to',   dateTo);
            if (status)   params.set('status',    status);
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res  = await fetch(`/admin/courier-dashboard/orders?${params}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf },
            });
            const json = await res.json();
            setResult(json);
        } catch {
            toast.error('Failed to load orders.');
        } finally {
            setLoading(false);
        }
    }, [slug, dateFrom, dateTo]);

    // Load on mount and when date filter or status filter changes
    useEffect(() => {
        setPage(1);
        fetchOrders(search, 1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFrom, dateTo, slug, statusFilter]);

    const handleSearch = (val: string) => {
        setInput(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(val);
            setPage(1);
            fetchOrders(val, 1, statusFilter);
        }, 400);
    };

    const goPage = (pg: number) => {
        setPage(pg);
        fetchOrders(search, pg, statusFilter);
    };

    const meta = result?.meta;
    const rows = result?.data ?? [];
    const idCol     = result?.id_col     ?? '';
    const statusCol = result?.status_col ?? '';

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        className="pl-8 h-8 text-xs"
                        placeholder="Search name, phone, order #, consignment…"
                        value={input}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {meta && (
                    <span className="text-xs text-muted-foreground ml-auto">
                        {meta.total.toLocaleString()} order{meta.total !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="rounded-md border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40">
                            <TableHead className="text-xs">Courier</TableHead>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Phone</TableHead>
                            <TableHead className="text-xs">Order #</TableHead>
                            <TableHead className="text-xs">Consignment ID</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((row) => (
                            <TableRow key={row.id} className="text-xs">
                                <TableCell>
                                    <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium" style={{ background: (COURIER_COLORS[slug] ?? '#6366f1') + '18', borderColor: (COURIER_COLORS[slug] ?? '#6366f1') + '50', color: COURIER_COLORS[slug] ?? '#6366f1' }}>
                                        {courierName}
                                    </span>
                                </TableCell>
                                <TableCell className="font-medium capitalize">{row.first_name || '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{row.phone || '—'}</TableCell>
                                <TableCell className="font-mono text-xs">
                                    <a href={`/admin/orders/${row.id}`} className="text-primary hover:underline font-medium">
                                        {row.order_number}
                                    </a>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{String(row[idCol] ?? '—')}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium capitalize ${statusClass(String(row[statusCol] ?? ''))}`}>
                                        {String(row[statusCol] ?? 'not synced') || 'not synced'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground whitespace-nowrap">
                                    {row.created_at ? new Date(row.created_at).toLocaleDateString('en-BD') : '—'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        Page {meta.current_page} of {meta.last_page}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={meta.current_page <= 1} onClick={() => goPage(meta.current_page - 1)}>
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: Math.min(meta.last_page, 7) }, (_, i) => {
                            const pg = meta.last_page <= 7 ? i + 1 : (() => {
                                const start = Math.max(1, Math.min(meta.current_page - 3, meta.last_page - 6));
                                return start + i;
                            })();
                            return (
                                <Button key={pg} variant={pg === meta.current_page ? 'default' : 'outline'} size="icon"
                                    className="h-7 w-7 text-xs" onClick={() => goPage(pg)}>
                                    {pg}
                                </Button>
                            );
                        })}
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={meta.current_page >= meta.last_page} onClick={() => goPage(meta.current_page + 1)}>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

const PRESETS = [
    { label: 'Today',        days: 0  },
    { label: 'Last 7 days',  days: 7  },
    { label: 'This month',   days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'All time',     days: -1 },
] as const;

function toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function DateFilter({ dateFrom, dateTo, onChange }: { dateFrom: string; dateTo: string; onChange: (from: string, to: string) => void }) {
    const today = toDateStr(new Date());

    const applyPreset = (days: number) => {
        if (days === -1) { onChange('', ''); return; }
        if (days === 0)  { onChange(today, today); return; }
        const from = new Date();
        from.setDate(from.getDate() - days + 1);
        onChange(toDateStr(from), today);
    };

    const isPresetActive = (days: number) => {
        if (days === -1) return !dateFrom && !dateTo;
        if (days === 0)  return dateFrom === today && dateTo === today;
        const from = new Date();
        from.setDate(from.getDate() - days + 1);
        return dateFrom === toDateStr(from) && dateTo === today;
    };

    return (
        <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-2">
            <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filter by date</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => (
                    <button key={p.label} type="button" onClick={() => applyPreset(p.days)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            isPresetActive(p.days)
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}>
                        {p.label}
                    </button>
                ))}
                <span className="h-5 w-px bg-border mx-1 hidden sm:block" />
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground">From</Label>
                        <Input type="date" className="h-7 text-xs w-36" value={dateFrom} max={dateTo || today} onChange={(e) => onChange(e.target.value, dateTo)} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground">To</Label>
                        <Input type="date" className="h-7 text-xs w-36" value={dateTo} min={dateFrom} max={today} onChange={(e) => onChange(dateFrom, e.target.value)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CourierDashboard() {
    const { couriers, lastSyncedAt, filters } = usePage<PageProps>().props;
    const [syncing, setSyncing] = useState(false);
    const [dateFrom, setDateFrom] = useState(filters?.date_from ?? '');
    const [dateTo,   setDateTo]   = useState(filters?.date_to   ?? '');

    const configuredCouriers = Object.entries(couriers ?? {});
    const noCouriersConfigured = configuredCouriers.length === 0;

    const applyFilter = (from: string, to: string) => {
        setDateFrom(from);
        setDateTo(to);
        router.get('/admin/courier-dashboard', { date_from: from || undefined, date_to: to || undefined }, { preserveScroll: true, preserveState: true, replace: true });
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch('/admin/courier-dashboard/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message ?? 'Courier statuses synced successfully.');
                router.reload({ only: ['couriers', 'lastSyncedAt'] });
            } else {
                toast.error(data.message ?? 'Sync failed. Please try again.');
            }
        } catch {
            toast.error('Sync failed. Please try again.');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <>
            <Head title="Courier Dashboard" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Courier Dashboard</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Track order statuses across all configured couriers.
                            {lastSyncedAt && <> Last synced: <span className="font-medium">{lastSyncedAt}</span></>}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || noCouriersConfigured} className="gap-2 shrink-0">
                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing…' : 'Sync Now'}
                    </Button>
                </div>

                <DateFilter dateFrom={dateFrom} dateTo={dateTo} onChange={applyFilter} />

                {!noCouriersConfigured && configuredCouriers.length > 0 && (() => {
                    const allStats = configuredCouriers.map(([, s]) => s);
                    const totalDelivered  = allStats.reduce((a, s) => a + s.delivered, 0);
                    const totalCancelled  = allStats.reduce((a, s) => a + s.cancelled, 0);
                    const totalReturned   = allStats.reduce((a, s) => a + s.returned, 0);
                    const totalOrders     = allStats.reduce((a, s) => a + s.total, 0);
                    const sumDeliveredAmt = allStats.reduce((a, s) => a + (s.delivered_amount ?? 0), 0);
                    const sumCancelledAmt = allStats.reduce((a, s) => a + (s.cancelled_amount ?? 0), 0);
                    const sumReturnedAmt  = allStats.reduce((a, s) => a + (s.returned_amount  ?? 0), 0);
                    const sumNet          = sumDeliveredAmt - sumCancelledAmt - sumReturnedAmt;
                    return (
                        <Card className="border-2 border-primary/20 bg-primary/5">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base">All Couriers — Combined Overview</CardTitle>
                                    <Badge variant="secondary" className="ml-auto">{totalOrders.toLocaleString()} total orders</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 px-4 py-3 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">Total Delivered</p>
                                        <p className="text-2xl font-bold text-green-600">{totalDelivered.toLocaleString()}</p>
                                        <p className="text-sm font-semibold text-green-600 mt-1">{fmt(sumDeliveredAmt)}</p>
                                    </div>
                                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">Total Cancelled</p>
                                        <p className="text-2xl font-bold text-red-500">{totalCancelled.toLocaleString()}</p>
                                        <p className="text-sm font-semibold text-red-500 mt-1">{fmt(sumCancelledAmt)}</p>
                                    </div>
                                    <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800 px-4 py-3 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">Total Returned</p>
                                        <p className="text-2xl font-bold text-purple-500">{totalReturned.toLocaleString()}</p>
                                        <p className="text-sm font-semibold text-purple-500 mt-1">{fmt(sumReturnedAmt)}</p>
                                    </div>
                                    <div className={`rounded-lg border px-4 py-3 text-center ${
                                        sumNet >= 0
                                            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700'
                                            : 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700'
                                    }`}>
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            {sumNet >= 0
                                                ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                                : <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                                            <p className="text-xs text-muted-foreground">Total Collected Amount</p>
                                        </div>
                                        <p className={`text-2xl font-bold ${sumNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {fmt(sumNet)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">delivered − cancel − return</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center text-xs">
                                    {configuredCouriers.map(([slug, s]) => (
                                        <div key={slug} className="rounded-md border border-border bg-card px-3 py-2">
                                            <p className="font-semibold" style={{ color: COURIER_COLORS[slug] ?? '#6366f1' }}>{s.name}</p>
                                            <p className="text-muted-foreground">{s.total} orders</p>
                                            <p className="font-medium text-emerald-600">{fmt(s.net_amount ?? 0)}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })()}

                {noCouriersConfigured && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <Truck className="h-7 w-7 text-muted-foreground" />
                            </span>
                            <div className="text-center space-y-1">
                                <p className="text-base font-semibold">No couriers configured yet</p>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Go to <strong>Settings → Courier</strong> and configure at least one courier
                                    (Pathao, Steadfast, RedX, or Carrybee) to see tracking data here.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {configuredCouriers.map(([slug, stats]) => (
                    <CourierPanel key={slug} slug={slug} stats={stats} dateFrom={dateFrom} dateTo={dateTo} />
                ))}
            </div>
        </>
    );
}

CourierDashboard.layout = {
    breadcrumbs: [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Courier Dashboard', href: '/admin/courier-dashboard' },
    ],
};
