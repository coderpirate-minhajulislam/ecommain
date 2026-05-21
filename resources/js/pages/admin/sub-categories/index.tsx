import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
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

type Category = {
    id: number;
    name: string;
};

type SubCategory = {
    id: number;
    category_id: number;
    name: string;
    created_at: string;
    category: Category;
};

type PaginatedSubCategories = {
    data: SubCategory[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    subCategories: PaginatedSubCategories;
    filters: { search?: string; category_id?: string; perPage?: string };
    categories: Category[];
};

const perPageOptions = [10, 15, 25, 50, 100];

export default function SubCategoriesIndex() {
    const { subCategories, filters, categories } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category_id || '');
    const [perPage, setPerPage] = useState(filters.perPage || '10');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useFlashToast();

    const fetchData = useCallback(
        (params: Record<string, string>) => {
            router.get('/admin/sub-categories', params, {
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
            fetchData({ search, category_id: categoryFilter, perPage });
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search, categoryFilter, perPage, fetchData]);

    function handleDelete(id: number) {
        setDeleteId(id);
    }

    function confirmDelete() {
        if (deleteId !== null) {
            router.delete(`/admin/sub-categories/${deleteId}`, {
                onFinish: () => setDeleteId(null),
            });
        }
    }

    return (
        <>
            <Head title="Manage Sub Categories" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Sub Categories</h2>
                        <p className="text-muted-foreground">Manage product sub categories.</p>
                    </div>
                    <Link
                        href="/admin/sub-categories/create"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Add Sub Category
                    </Link>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative min-w-50 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                                {c.name}
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
                </div>

                <div className="w-full overflow-x-auto rounded-xl border border-sidebar-border/70 [-webkit-overflow-scrolling:touch] dark:border-sidebar-border">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 border-b bg-muted/50">
                            <tr>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Name</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Category</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 lg:table-cell">Created</th>
                                <th className="sticky right-0 whitespace-nowrap bg-muted/50 px-2 py-3 text-right font-medium sm:px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {subCategories.data.map((sub) => (
                                <tr key={sub.id} className="group hover:bg-muted/30">
                                    <td className="whitespace-nowrap px-2 py-3 font-medium sm:px-4">{sub.name}</td>
                                    <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                            {sub.category?.name}
                                        </span>
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4 lg:table-cell">
                                        {new Date(sub.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="sticky right-0 whitespace-nowrap bg-background px-2 py-3 text-right sm:px-4 group-hover:bg-muted/30">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/sub-categories/${sub.id}/edit`}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(sub.id)}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {subCategories.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        No sub categories found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {subCategories.from && subCategories.to
                            ? `Showing ${subCategories.from} to ${subCategories.to} of ${subCategories.total} results`
                            : `${subCategories.total} results`}
                    </p>

                    {subCategories.last_page > 1 && (
                        <div className="flex flex-wrap gap-1">
                            {subCategories.links.map((link, i) => (
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

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sub Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this sub category? This action cannot be undone.
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

SubCategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Sub Categories', href: '/admin/sub-categories' },
    ],
};
