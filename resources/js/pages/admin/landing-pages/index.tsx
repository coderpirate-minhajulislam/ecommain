import { Head, Link, router, usePage } from '@inertiajs/react';
import { Copy, Edit, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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

type LandingPage = {
    id: number;
    product_id: number;
    title: string;
    slug: string;
    subtitle: string | null;
    hero_text: string | null;
    is_active: boolean;
    created_at: string;
    product: { id: number; name: string } | null;
};

type PaginatedLandingPages = {
    data: LandingPage[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    landingPages: PaginatedLandingPages;
    filters: { search?: string; perPage?: string };
};

const perPageOptions = [10, 15, 25, 50, 100];

export default function LandingPagesIndex() {
    const { landingPages, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.perPage || '10');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useFlashToast();

    const fetchData = useCallback(
        (params: Record<string, string>) => {
            router.get('/admin/landing-pages', params, {
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
            fetchData({ search, perPage });
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search, perPage, fetchData]);

    function confirmDelete() {
        if (deleteId !== null) {
            router.delete(`/admin/landing-pages/${deleteId}`, {
                onFinish: () => setDeleteId(null),
            });
        }
    }

    function copyUrl(slug: string) {
        const url = `${window.location.origin}/lp/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Landing page URL copied!');
    }

    return (
        <>
            <Head title="Landing Pages" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Landing Pages</h2>
                        <p className="text-muted-foreground">Create and manage product landing pages.</p>
                    </div>
                    <Link
                        href="/admin/landing-pages/create"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Create Landing Page
                    </Link>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative min-w-50 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by title or slug..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
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
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Title</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 lg:table-cell">Slug</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 xl:table-cell">Product</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Status</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 xl:table-cell">Created</th>
                                <th className="sticky right-0 whitespace-nowrap bg-muted/50 px-2 py-3 text-right font-medium sm:px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {landingPages.data.map((page) => (
                                <tr key={page.id} className="group hover:bg-muted/30">
                                    <td className="whitespace-nowrap px-2 py-3 font-medium sm:px-4">{page.title}</td>
                                    <td className="hidden px-2 py-3 sm:px-4 lg:table-cell">
                                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs whitespace-nowrap">/lp/{page.slug}</code>
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4 xl:table-cell">{page.product?.name ?? '—'}</td>
                                    <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                page.is_active
                                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {page.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4 xl:table-cell">
                                        {new Date(page.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="sticky right-0 whitespace-nowrap bg-background px-2 py-3 text-right sm:px-4 group-hover:bg-muted/30">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => copyUrl(page.slug)}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                title="Copy URL"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <a
                                                href={`/lp/${page.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                title="Preview"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                            <Link
                                                href={`/admin/landing-pages/${page.id}/edit`}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(page.id)}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {landingPages.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No landing pages found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {landingPages.from && landingPages.to
                            ? `Showing ${landingPages.from} to ${landingPages.to} of ${landingPages.total} results`
                            : `${landingPages.total} results`}
                    </p>

                    {landingPages.last_page > 1 && (
                        <div className="flex flex-wrap gap-1">
                            {landingPages.links.map((link, i) => (
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
                        <AlertDialogTitle>Delete Landing Page</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this landing page? This action cannot be undone.
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

LandingPagesIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Landing Pages', href: '/admin/landing-pages' },
    ],
};
