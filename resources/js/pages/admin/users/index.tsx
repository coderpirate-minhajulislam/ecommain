import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, FileSpreadsheet, FileText, Plus, Printer, Search, Trash2 } from 'lucide-react';
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
import type { User } from '@/types/auth';

type PaginatedUsers = {
    data: User[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    users: PaginatedUsers;
    filters: { search?: string; role?: string; perPage?: string };
    roles: string[];
};

const perPageOptions = [10, 15, 25, 50, 100];

export default function UsersIndex() {
    const { users, filters, roles } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [perPage, setPerPage] = useState(filters.perPage || '10');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

    useFlashToast();

    const fetchUsers = useCallback(
        (params: Record<string, string>) => {
            router.get('/admin/users', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [],
    );

    // Live search on type with debounce
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchUsers({ search, role: roleFilter, perPage });
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search, roleFilter, perPage, fetchUsers]);

    function handleDelete(userId: number) {
        setDeleteUserId(userId);
    }

    function confirmDelete() {
        if (deleteUserId !== null) {
            router.delete(`/admin/users/${deleteUserId}`, {
                onFinish: () => setDeleteUserId(null),
            });
        }
    }

    const roleBadgeColors: Record<string, string> = {
        admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        manager: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };

    function buildExportUrl(type: 'excel' | 'pdf') {
        const params = new URLSearchParams();

        if (search) {
            params.set('search', search);
        }

        if (roleFilter) {
            params.set('role', roleFilter);
        }

        const query = params.toString();

        return `/admin/users/export/${type}${query ? `?${query}` : ''}`;
    }

    function handlePrint() {
        const tableEl = document.getElementById('users-table');

        if (!tableEl) {
            return;
        }

        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            return;
        }

        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Users Report</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
                    h1 { font-size: 18px; margin-bottom: 5px; }
                    p { color: #666; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; }
                    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
                    .no-print { display: none; }
                    .print-actions { margin-bottom: 20px; padding: 12px 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; display: flex; align-items: center; gap: 12px; }
                    .print-actions button { padding: 8px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
                    .btn-print { background: #2563eb; color: #fff; }
                    .btn-print:hover { background: #1d4ed8; }
                    .btn-save { background: #16a34a; color: #fff; }
                    .btn-save:hover { background: #15803d; }
                    .print-actions span { font-size: 13px; color: #334155; }
                    @media print { .print-actions { display: none !important; } }
                </style>
            </head>
            <body>
                <div class="print-actions">
                    <button class="btn-print" onclick="window.print()">🖨 Print</button>
                    <button class="btn-save" onclick="window.print()">💾 Save as PDF</button>
                    <span>Tip: In the print dialog, select <strong>"Save as PDF"</strong> as the destination if no printer is connected.</span>
                </div>
                <h1>Users Report</h1>
                <p>Generated on ${dateStr} — Total: ${users.total} users</p>
                ${tableEl.outerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    return (
        <>
            <Head title="Manage Users" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                        <p className="text-muted-foreground">Manage all user accounts.</p>
                    </div>
                    <Link
                        href="/admin/users/create"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Add User
                    </Link>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative min-w-50 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">All Roles</option>
                        {roles.map((r) => (
                            <option key={r} value={r}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                        ))}
                    </select>
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        {perPageOptions.map((n) => (
                            <option key={n} value={String(n)}>
                                {n} per page
                            </option>
                        ))}
                    </select>

                    <div className="flex gap-2 ml-auto">
                        <a
                            href={buildExportUrl('excel')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
                        >
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            Excel
                        </a>
                        <a
                            href={buildExportUrl('pdf')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
                        >
                            <FileText className="h-4 w-4 text-red-600" />
                            PDF
                        </a>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
                        >
                            <Printer className="h-4 w-4 text-blue-600" />
                            Print
                        </button>
                    </div>
                </div>

                <div className="w-full overflow-x-auto rounded-xl border border-sidebar-border/70 [-webkit-overflow-scrolling:touch] dark:border-sidebar-border">
                    <table id="users-table" className="w-full text-sm">
                        <thead className="sticky top-0 border-b bg-muted/50">
                            <tr>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Name</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 lg:table-cell">Email</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Role</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 xl:table-cell">Created</th>
                                <th className="no-print sticky right-0 whitespace-nowrap bg-muted/50 px-2 py-3 text-right font-medium sm:px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.data.map((user) => (
                                <tr key={user.id} className="group hover:bg-muted/30">
                                    <td className="whitespace-nowrap px-2 py-3 font-medium sm:px-4">{user.name}</td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4 lg:table-cell">{user.email}</td>
                                    <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleBadgeColors[user.role] || ''}`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4 xl:table-cell">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="no-print sticky right-0 whitespace-nowrap bg-background px-2 py-3 text-right sm:px-4 group-hover:bg-muted/30">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/users/${user.id}/edit`}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {users.from && users.to
                            ? `Showing ${users.from} to ${users.to} of ${users.total} results`
                            : `${users.total} results`}
                    </p>

                    {users.last_page > 1 && (
                        <div className="flex flex-wrap gap-1">
                            {users.links.map((link, i) => (
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

            <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
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

UsersIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Users', href: '/admin/users' },
    ],
};
