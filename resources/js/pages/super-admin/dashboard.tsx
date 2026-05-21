import { Head, Link, usePage } from '@inertiajs/react';
import { ClipboardList, DollarSign, Package, ShieldCheck, Users, UserCheck, UserX, Activity } from 'lucide-react';

type Stats = {
    totalUsers: number;
    totalSuperAdmins: number;
    totalAdmins: number;
    totalManagers: number;
    totalRegularUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalOrders: number;
    totalRevenue: string;
    totalProducts: number;
};

type RecentUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
};

const roleBadgeColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    manager: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

function formatRole(role: string) {
    return role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SuperAdminDashboard() {
    const { stats, recentUsers } = usePage<{ stats: Stats; recentUsers: RecentUser[] }>().props;

    const cards = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 dark:text-blue-400' },
        { title: 'Active Users', value: stats.activeUsers, icon: Activity, color: 'text-green-600 dark:text-green-400' },
        { title: 'Inactive Users', value: stats.inactiveUsers, icon: UserX, color: 'text-red-600 dark:text-red-400' },
        { title: 'Super Admins', value: stats.totalSuperAdmins, icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400' },
        { title: 'Admins', value: stats.totalAdmins, icon: ShieldCheck, color: 'text-red-600 dark:text-red-400' },
        { title: 'Managers', value: stats.totalManagers, icon: UserCheck, color: 'text-amber-600 dark:text-amber-400' },
        { title: 'Total Orders', value: stats.totalOrders, icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400' },
        { title: 'Revenue', value: `৳${parseFloat(stats.totalRevenue || '0').toFixed(2)}`, icon: DollarSign, color: 'text-green-600 dark:text-green-400' },
        { title: 'Products', value: stats.totalProducts, icon: Package, color: 'text-purple-600 dark:text-purple-400' },
    ];

    return (
        <>
            <Head title="Super Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h2>
                    <p className="text-muted-foreground">Full system overview and user management.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <div
                            key={card.title}
                            className="rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                            <p className="mt-2 text-3xl font-bold">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent users */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h3 className="text-lg font-semibold">Recent Users</h3>
                            <Link href="/super-admin/users" className="text-sm text-primary hover:underline">
                                View all
                            </Link>
                        </div>
                        <div className="divide-y">
                            {recentUsers.length === 0 ? (
                                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No users yet.</p>
                            ) : (
                                recentUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between px-6 py-3">
                                        <div>
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${roleBadgeColors[user.role] || ''}`}
                                            >
                                                {formatRole(user.role)}
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                                            >
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-4 space-y-2">
                            <Link
                                href="/super-admin/users"
                                className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-accent"
                            >
                                <Users className="h-4 w-4" />
                                Manage All Users
                            </Link>
                            <Link
                                href="/super-admin/users/create"
                                className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-accent"
                            >
                                <UserCheck className="h-4 w-4" />
                                Create New User
                            </Link>
                            <Link
                                href="/super-admin/users?status=inactive"
                                className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-accent"
                            >
                                <UserX className="h-4 w-4" />
                                View Inactive Users
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

SuperAdminDashboard.layout = {
    breadcrumbs: [{ title: 'Super Admin Dashboard', href: '/super-admin/dashboard' }],
};
