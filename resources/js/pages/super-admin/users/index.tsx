import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Key, Plus, Search, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
    filters: { search?: string; role?: string; perPage?: string; status?: string };
    roles: string[];
};

const perPageOptions = [10, 15, 25, 50, 100];

const roleBadgeColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    manager: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

function formatRole(role: string) {
    return role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SuperAdminUsersIndex() {
    const { users, filters, roles } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [perPage, setPerPage] = useState(filters.perPage || '10');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

    useFlashToast();

    const fetchUsers = useCallback((params: Record<string, string>) => {
        router.get('/super-admin/users', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            fetchUsers({ search, role: roleFilter, status: statusFilter, perPage });
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search, roleFilter, statusFilter, perPage, fetchUsers]);

    function confirmDelete() {
        if (deleteUserId !== null) {
            router.delete(`/super-admin/users/${deleteUserId}`, {
                onFinish: () => setDeleteUserId(null),
            });
        }
    }

    function handleToggleStatus(userId: number) {
        router.patch(`/super-admin/users/${userId}/toggle-status`, {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Super Admin – Manage Users" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">All Users</h2>
                        <p className="text-muted-foreground">Manage every user account on the platform.</p>
                    </div>
                    <Link
                        href="/super-admin/users/create"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Add User
                    </Link>
                </div>

                {/* Filters */}
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
                                {formatRole(r)}
                            </option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
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
                        {perPageOptions.map((n) => (
                            <option key={n} value={String(n)}>
                                {n} per page
                            </option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto rounded-xl border border-sidebar-border/70 [-webkit-overflow-scrolling:touch] dark:border-sidebar-border">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 border-b bg-muted/50">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Name</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Email</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Role</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Status</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Joined</th>
                                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium">{user.name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{user.email}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[user.role] || ''}`}
                                            >
                                                {formatRole(user.role)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${(user as User & { is_active: boolean }).is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
                                            >
                                                {(user as User & { is_active: boolean }).is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Toggle active/inactive (not for super_admin) */}
                                                {user.role !== 'super_admin' && (
                                                    <button
                                                        onClick={() => handleToggleStatus(user.id)}
                                                        title={(user as User & { is_active: boolean }).is_active ? 'Deactivate' : 'Activate'}
                                                        className={`rounded p-1.5 hover:bg-accent ${(user as User & { is_active: boolean }).is_active ? 'text-green-600' : 'text-red-500'}`}
                                                    >
                                                        {(user as User & { is_active: boolean }).is_active ? (
                                                            <ToggleRight className="h-4 w-4" />
                                                        ) : (
                                                            <ToggleLeft className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}
                                                {/* Change password */}
                                                <Link
                                                    href={`/super-admin/users/${user.id}/change-password`}
                                                    title="Change Password"
                                                    className="rounded p-1.5 text-blue-600 hover:bg-accent"
                                                >
                                                    <Key className="h-4 w-4" />
                                                </Link>
                                                {/* Edit */}
                                                <Link
                                                    href={`/super-admin/users/${user.id}/edit`}
                                                    title="Edit"
                                                    className="rounded p-1.5 hover:bg-accent"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                {/* Delete (not for super_admin) */}
                                                {user.role !== 'super_admin' && (
                                                    <button
                                                        onClick={() => setDeleteUserId(user.id)}
                                                        title="Delete"
                                                        className="rounded p-1.5 text-destructive hover:bg-accent"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground">
                            Showing {users.from ?? 0}–{users.to ?? 0} of {users.total}
                        </p>
                        <div className="flex gap-1">
                            {users.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    className={`min-w-[2rem] rounded px-2 py-1 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'border border-input hover:bg-accent'} disabled:opacity-50`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

SuperAdminUsersIndex.layout = {
    breadcrumbs: [
        { title: 'Super Admin Dashboard', href: '/super-admin/dashboard' },
        { title: 'Users', href: '/super-admin/users' },
    ],
};
