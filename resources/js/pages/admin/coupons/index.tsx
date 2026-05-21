import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Coupon = {
    id: number;
    code: string;
    type: 'fixed' | 'percentage';
    value: string;
    min_order_amount: string | null;
    max_discount: string | null;
    usage_limit: number | null;
    used_count: number;
    starts_at: string | null;
    expires_at: string | null;
    is_global: boolean;
    is_active: boolean;
    products_count: number;
    created_at: string;
};

type PaginatedCoupons = {
    data: Coupon[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    coupons: PaginatedCoupons;
    filters: { search?: string; perPage?: string; status?: string };
};

export default function CouponsIndex() {
    useFlashToast();
    const { coupons, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.perPage || '10');
    const [status, setStatus] = useState(filters.status || '');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get('/admin/coupons', { search: search || undefined, perPage, status: status || undefined }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, perPage, status]);

    function handleDelete() {
        if (!deleteId) return;
        router.delete(`/admin/coupons/${deleteId}`, { preserveScroll: true });
        setDeleteId(null);
    }

    return (
        <>
            <Head title="Coupons" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Coupons</h2>
                    <Link
                        href="/admin/coupons/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" /> Add Coupon
                    </Link>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        type="text"
                        placeholder="Search by code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
                    />
                    <div className="flex gap-3">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(e.target.value)}
                            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {[10, 15, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>{n} per page</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Code</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Type</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Value</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium hidden sm:table-cell">Scope</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium hidden md:table-cell">Used</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium hidden md:table-cell">Expires</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Status</th>
                                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {coupons.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No coupons found.</td>
                                </tr>
                            )}
                            {coupons.data.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-muted/30">
                                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold">{coupon.code}</td>
                                    <td className="whitespace-nowrap px-4 py-3 capitalize">{coupon.type}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {coupon.type === 'percentage' ? `${coupon.value}%` : `৳${coupon.value}`}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 hidden sm:table-cell">
                                        {coupon.is_global ? (
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">Global</span>
                                        ) : (
                                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">{coupon.products_count} products</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 hidden md:table-cell">
                                        {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 hidden md:table-cell">
                                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${coupon.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/admin/coupons/${coupon.id}/edit`}
                                                className="rounded-md p-1.5 hover:bg-accent"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(coupon.id)}
                                                className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {coupons.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {coupons.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-md px-3 py-1.5 text-sm ${link.active ? 'bg-primary text-primary-foreground' : link.url ? 'hover:bg-accent' : 'pointer-events-none text-muted-foreground'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveState
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirmation */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
                    <div className="mx-4 w-full max-w-sm rounded-xl bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-2 text-lg font-semibold">Delete Coupon</h3>
                        <p className="mb-4 text-sm text-muted-foreground">Are you sure? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteId(null)} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
                            <button onClick={handleDelete} className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

CouponsIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Coupons', href: '/admin/coupons' },
    ],
};
