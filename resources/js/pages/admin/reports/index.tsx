import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileSpreadsheet, FileText, Filter, Printer } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFlashToast } from '@/hooks/use-flash-toast';

type OrderItem = { id: number; product_name: string; variant_label: string | null; quantity: number };

type Order = {
    id: number;
    order_number: string;
    first_name: string;
    phone: string;
    status: string;
    payment_method: string | null;
    subtotal: string;
    shipping: string;
    total: string;
    created_at: string;
    items: OrderItem[];
};

type Paginated = {
    data: Order[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Summary = {
    total: number;
    revenue: string | number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
};

type Props = {
    orders: Paginated;
    summary: Summary;
    statuses: string[];
    paymentMethods: string[];
    filters: { status?: string; date_range?: string; date_from?: string; date_to?: string; payment_method?: string; product?: string };
};

const statusColors: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    shipped:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delivered:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    hold:       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'pre-order':'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const dateRangeOptions = [
    { value: '',           label: 'All Time' },
    { value: 'today',      label: 'Today' },
    { value: 'this_week',  label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year',  label: 'This Year' },
];

function fmt(val: string | number) {
    return '৳' + parseFloat(String(val) || '0').toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const selectCls = 'rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function ReportsIndex() {
    useFlashToast();
    const { orders, summary, statuses, paymentMethods, filters } = usePage<Props>().props;

    const [status,        setStatus]        = useState(filters.status         || '');
    const [dateRange,     setDateRange]     = useState(filters.date_range     || '');
    const [dateFrom,      setDateFrom]      = useState(filters.date_from      || '');
    const [dateTo,        setDateTo]        = useState(filters.date_to        || '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');
    const [product,       setProduct]       = useState(filters.product        || '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // When a preset is chosen, clear custom dates; when custom dates are set, clear preset
    function handleDateRangeChange(val: string) {
        setDateRange(val);

        if (val) {
            setDateFrom('');
            setDateTo('');
        }
    }

    function handleDateFromChange(val: string) {
        setDateFrom(val);

        if (val) {
            setDateRange('');
        }
    }

    function handleDateToChange(val: string) {
        setDateTo(val);

        if (val) {
            setDateRange('');
        }
    }

    const isFirst = useRef(true);

    const fetch = useCallback((params: Record<string, string>) => {
        router.get('/admin/reports', params, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetch({ status, date_range: dateRange, date_from: dateFrom, date_to: dateTo, payment_method: paymentMethod, product });
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [status, dateRange, dateFrom, dateTo, paymentMethod, product, fetch]);

    function buildExportUrl(type: 'excel' | 'pdf') {
        const p = new URLSearchParams();

        if (status) {
            p.set('status', status);
        }

        if (dateRange) {
            p.set('date_range', dateRange);
        }

        if (dateFrom) {
            p.set('date_from', dateFrom);
        }

        if (dateTo) {
            p.set('date_to', dateTo);
        }

        if (paymentMethod) {
            p.set('payment_method', paymentMethod);
        }

        if (product) {
            p.set('product', product);
        }

        const q = p.toString();

        return `/admin/reports/export/${type}${q ? `?${q}` : ''}`;
    }

    function handlePrint() {
        const tableEl = document.getElementById('orders-report-table');

        if (!tableEl) {
            return;
        }

        const win = window.open('', '_blank');

        if (!win) {
            return;
        }

        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const rangeLabel = dateRange
            ? (dateRangeOptions.find(o => o.value === dateRange)?.label || 'All Time')
            : (dateFrom || dateTo)
                ? `${dateFrom || '...'} to ${dateTo || '...'}`
                : 'All Time';
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Orders Report</title>
        <style>
            body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
            h1{font-size:18px;margin-bottom:4px}p{color:#666;margin-bottom:14px;font-size:11px}
            table{width:100%;border-collapse:collapse}
            th{background:#f3f4f6;padding:7px 10px;text-align:left;font-weight:600;border-bottom:2px solid #d1d5db;font-size:11px}
            td{padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px}
            tr:nth-child(even) td{background:#f9fafb}
            .print-bar{margin-bottom:16px;padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;display:flex;align-items:center;gap:10px}
            .print-bar button{padding:7px 18px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;border:none}
            .btn-p{background:#2563eb;color:#fff}.btn-s{background:#16a34a;color:#fff}
            .print-bar span{font-size:12px;color:#334155}
            @media print{.print-bar{display:none!important}}
        </style></head><body>
        <div class="print-bar">
            <button class="btn-p" onclick="window.print()">&#128424; Print</button>
            <button class="btn-s" onclick="window.print()">&#128190; Save as PDF</button>
            <span>Tip: In print dialog, choose <strong>Save as PDF</strong> for PDF output.</span>
        </div>
        <h1>Orders Report</h1>
        <p>Generated on ${dateStr} &mdash; Period: ${rangeLabel} &mdash; ${statusLabel(status)} &mdash; Total: ${orders.total} orders</p>
        ${tableEl.outerHTML}
        </body></html>`);
        win.document.close();
    }

    function statusLabel(s: string) {
        return s ? `Status: ${s.charAt(0).toUpperCase() + s.slice(1)}` : 'All statuses';
    }

    return (
        <>
            <Head title="Reports" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Orders Report</h2>
                    <p className="text-muted-foreground">Filter, analyse, and export your order data.</p>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {[
                        { label: 'Filtered Orders', value: summary.total,      color: 'text-blue-600' },
                        { label: 'Revenue',         value: fmt(summary.revenue), color: 'text-green-600' },
                        { label: 'Pending',         value: summary.pending,    color: 'text-yellow-600' },
                        { label: 'Processing',      value: summary.processing, color: 'text-blue-500' },
                        { label: 'Delivered',       value: summary.delivered,  color: 'text-green-700' },
                        { label: 'Cancelled',       value: summary.cancelled,  color: 'text-red-600' },
                    ].map(s => (
                        <Card key={s.label}>
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">{s.label}</p>
                                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Filter className="h-4 w-4 text-muted-foreground" /> Filter Orders
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select value={dateRange} onChange={e => handleDateRangeChange(e.target.value)} className={selectCls}>
                            {dateRangeOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-1.5">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => handleDateFromChange(e.target.value)}
                                className={selectCls}
                                title="From date"
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => handleDateToChange(e.target.value)}
                                className={selectCls}
                                title="To date"
                            />
                        </div>

                        <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
                            <option value="">All Statuses</option>
                            {statuses.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>

                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={selectCls}>
                            <option value="">All Payments</option>
                            {paymentMethods.map(p => (
                                <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                            ))}
                        </select>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Filter by product name..."
                                value={product}
                                onChange={e => setProduct(e.target.value)}
                                className={`${selectCls} pl-3 pr-8 min-w-52`}
                            />
                            {product && (
                                <button onClick={() => setProduct('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">×</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Export / Download section */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border">
                    <div className="mb-3 text-sm font-semibold">Download / Export Orders</div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* All Orders Excel */}
                        <a
                            href="/admin/reports/export/excel"
                            className="flex items-center gap-3 rounded-lg border-2 border-green-400 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 shadow-sm transition hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
                        >
                            <FileSpreadsheet className="h-5 w-5 shrink-0" />
                            <div>
                                <div>All Orders (Excel)</div>
                                <div className="text-xs font-normal text-green-600 dark:text-green-400">Every order in database</div>
                            </div>
                        </a>

                        {/* Filtered Excel */}
                        <a
                            href={buildExportUrl('excel')}
                            className="flex items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-accent"
                        >
                            <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />
                            <div>
                                <div>Filtered (Excel)</div>
                                <div className="text-xs font-normal text-muted-foreground">Current filters applied</div>
                            </div>
                        </a>

                        {/* Filtered PDF */}
                        <a
                            href={buildExportUrl('pdf')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-accent"
                        >
                            <FileText className="h-5 w-5 shrink-0 text-red-600" />
                            <div>
                                <div>Filtered (PDF)</div>
                                <div className="text-xs font-normal text-muted-foreground">Current filters applied</div>
                            </div>
                        </a>

                        {/* Print */}
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-accent"
                        >
                            <Printer className="h-5 w-5 shrink-0 text-blue-600" />
                            <div className="text-left">
                                <div>Print / Save PDF</div>
                                <div className="text-xs font-normal text-muted-foreground">Open print preview</div>
                            </div>
                        </button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Excel includes: Date, Order #, Customer Name, Phone, Email, Address, Products, Status, Payment, Amount.
                        Compatible with Google Sheets — File → Import → Upload.
                    </p>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto rounded-xl border border-sidebar-border/70 [-webkit-overflow-scrolling:touch] dark:border-sidebar-border">
                    <table id="orders-report-table" className="w-full text-sm">
                        <thead className="sticky top-0 border-b bg-muted/50">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Order #</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Customer</th>
                                <th className="hidden whitespace-nowrap px-4 py-3 text-left font-medium md:table-cell">Phone</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Status</th>
                                <th className="hidden whitespace-nowrap px-4 py-3 text-left font-medium lg:table-cell">Payment</th>
                                <th className="hidden whitespace-nowrap px-4 py-3 text-left font-medium sm:table-cell">Items</th>
                                <th className="hidden whitespace-nowrap px-4 py-3 text-right font-medium lg:table-cell">Subtotal</th>
                                <th className="hidden whitespace-nowrap px-4 py-3 text-right font-medium lg:table-cell">Shipping</th>
                                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Total</th>
                                <th className="hidden whitespace-nowrap px-4 py-3 text-left font-medium xl:table-cell">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                                        No orders found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map(order => (
                                    <tr key={order.id} className="hover:bg-muted/30">
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                                                {order.order_number}
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">{order.first_name}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">{order.phone}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[order.status] || ''}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                                            {order.payment_method?.replace(/_/g, ' ') ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 sm:table-cell">
                                            <div className="space-y-0.5">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="text-xs text-muted-foreground/70">
                                                        <span className="font-medium text-muted-foreground">{item.quantity} item{item.quantity !== 1 ? 's' : ''}</span>
                                                        <div className="truncate max-w-40">{item.product_name}{item.variant_label ? ` (${item.variant_label})` : ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="hidden whitespace-nowrap px-4 py-3 text-right text-muted-foreground lg:table-cell">{fmt(order.subtotal)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3 text-right text-muted-foreground lg:table-cell">{fmt(order.shipping)}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-primary">{fmt(order.total)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground xl:table-cell">
                                            {new Date(order.created_at).toLocaleDateString('en-BD', { dateStyle: 'medium' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {orders.from && orders.to
                            ? `Showing ${orders.from}–${orders.to} of ${orders.total} orders`
                            : `${orders.total} orders`}
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
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Reports', href: '/admin/reports' },
    ],
};
