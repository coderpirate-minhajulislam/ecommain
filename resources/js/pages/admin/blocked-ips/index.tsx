import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Ban, Plus, Search, ShieldX, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type BlockedEntry = {
    id: number;
    ip_address: string | null;
    phone: string | null;
    reason: string | null;
    blocked_by: string | null;
    created_at: string;
};

type PaginatedData = {
    data: BlockedEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function BlockedIpsIndex() {
    useFlashToast();
    const { blocked, filters } = usePage<{
        blocked: PaginatedData;
        filters: { search?: string };
    }>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [showForm, setShowForm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const form = useForm({
        ip_address: '',
        phone: '',
        reason: '',
    });

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/blocked-ips', { search: search || undefined }, { preserveState: true });
    }

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/blocked-ips', {
            onSuccess: () => {
                form.reset();
                setShowForm(false);
            },
        });
    }

    function handleDelete(id: number) {
        router.delete(`/admin/blocked-ips/${id}`, {
            onSuccess: () => setDeleteId(null),
        });
    }

    return (
        <>
            <Head title="Blocked IPs & Phones" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Blocked IPs & Phones</h2>
                        <p className="text-muted-foreground text-sm">
                            Block customers by IP address or phone number to prevent fake orders.
                        </p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
                        <Plus className="mr-2 h-4 w-4" />
                        {showForm ? 'Cancel' : 'Add Block'}
                    </Button>
                </div>

                {/* Add new block form */}
                {showForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Ban className="h-5 w-5" />
                                Block IP or Phone
                            </CardTitle>
                            <CardDescription>Enter at least an IP address or phone number to block.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="ip_address">IP Address</Label>
                                        <Input
                                            id="ip_address"
                                            value={form.data.ip_address}
                                            onChange={(e) => form.setData('ip_address', e.target.value)}
                                            placeholder="e.g. 103.45.67.89"
                                        />
                                        {form.errors.ip_address && (
                                            <p className="text-xs text-destructive">{form.errors.ip_address}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={form.data.phone}
                                            onChange={(e) => form.setData('phone', e.target.value)}
                                            placeholder="e.g. 01700000000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reason">Reason</Label>
                                        <Input
                                            id="reason"
                                            value={form.data.reason}
                                            onChange={(e) => form.setData('reason', e.target.value)}
                                            placeholder="e.g. Fake order"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Blocking…' : 'Block'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search IP, phone, or reason…"
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit" variant="outline">Search</Button>
                </form>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">IP Address</th>
                                <th className="px-4 py-3 text-left font-medium">Phone</th>
                                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Reason</th>
                                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Blocked By</th>
                                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Date</th>
                                <th className="px-4 py-3 text-right font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blocked.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        <ShieldX className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                        No blocked entries found.
                                    </td>
                                </tr>
                            ) : (
                                blocked.data.map((entry) => (
                                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {entry.ip_address || <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {entry.phone || <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                                            {entry.reason || '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                            {entry.blocked_by || '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                            {new Date(entry.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {deleteId === entry.id ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="text-xs font-medium text-destructive hover:underline"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(null)}
                                                        className="text-xs text-muted-foreground hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteId(entry.id)}
                                                    className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Unblock
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {blocked.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {blocked.data.length} of {blocked.total} entries
                        </p>
                        <div className="flex gap-1">
                            {blocked.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveState
                                    className={`rounded px-3 py-1.5 text-xs ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : link.url
                                              ? 'hover:bg-muted'
                                              : 'pointer-events-none opacity-40'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
