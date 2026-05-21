import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Pencil, Search, Star, Trash2, XCircle } from 'lucide-react';
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

type Review = {
    id: number;
    product_id: number;
    product: {
        id: number;
        name: string;
    };
    user_id: number | null;
    name: string;
    email: string;
    rating: number;
    comment: string;
    is_approved: boolean;
    created_at: string;
};

type PaginatedReviews = {
    data: Review[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    reviews: PaginatedReviews;
    filter: string;
    search: string;
};

const perPageOptions = [10, 15, 25, 50];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-3 w-3 ${
                        star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                    }`}
                />
            ))}
        </div>
    );
}

export default function ReviewsIndex() {
    const { reviews, filter, search: initialSearch } = usePage<Props>().props;
    const [search, setSearch] = useState(initialSearch || '');
    const [filterStatus, setFilterStatus] = useState(filter || 'all');
    const [perPage, setPerPage] = useState('15');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);

    useFlashToast();

    const fetchReviews = useCallback(
        (params: Record<string, string>) => {
            router.get('/admin/reviews', params, {
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
            fetchReviews({ search, filter: filterStatus, per_page: perPage });
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search, filterStatus, perPage, fetchReviews]);

    function confirmDelete() {
        if (deleteReviewId !== null) {
            router.delete(`/admin/reviews/${deleteReviewId}`, {
                onFinish: () => setDeleteReviewId(null),
            });
        }
    }

    function toggleApproval(review: Review) {
        const url = review.is_approved
            ? `/admin/reviews/${review.id}/reject`
            : `/admin/reviews/${review.id}/approve`;
        router.patch(url, {});
    }

    return (
        <>
            <Head title="Manage Reviews" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Product Reviews</h2>
                        <p className="text-muted-foreground">Manage and approve customer reviews.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative min-w-50 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by product, reviewer name, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All Reviews</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
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
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Product</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 lg:table-cell">Reviewer</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Rating</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 xl:table-cell">Status</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 xl:table-cell">Date</th>
                                <th className="sticky right-0 whitespace-nowrap bg-muted/50 px-2 py-3 text-right font-medium sm:px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {reviews.data.map((review) => (
                                <tr key={review.id} className="group hover:bg-muted/30">
                                    <td className="whitespace-nowrap px-2 py-3 font-medium sm:px-4 truncate max-w-xs">
                                        <Link
                                            href={`/product/${review.product.slug}`}
                                            className="text-primary hover:underline"
                                        >
                                            {review.product.name}
                                        </Link>
                                    </td>
                                    <td className="hidden px-2 py-3 sm:px-4 lg:table-cell">
                                        <div className="whitespace-nowrap font-medium">{review.name}</div>
                                        <div className="text-xs text-muted-foreground">{review.email}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                        <StarRating rating={review.rating} />
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 sm:px-4 xl:table-cell">
                                        {review.is_approved ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Approved
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                <XCircle className="h-3 w-3" />
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4 xl:table-cell">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="sticky right-0 whitespace-nowrap bg-background px-2 py-3 text-right sm:px-4 group-hover:bg-muted/30">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleApproval(review)}
                                                className={`inline-flex items-center rounded-md p-1.5 ${
                                                    review.is_approved
                                                        ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                                }`}
                                                title={review.is_approved ? 'Reject review' : 'Approve review'}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                            </button>
                                            <Link
                                                href={`/admin/reviews/${review.id}/edit`}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteReviewId(review.id)}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {reviews.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No reviews found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {reviews.from && reviews.to
                            ? `Showing ${reviews.from} to ${reviews.to} of ${reviews.total} results`
                            : `${reviews.total} results`}
                    </p>

                    {reviews.last_page > 1 && (
                        <div className="flex flex-wrap gap-1">
                            {reviews.links.map((link, i) => (
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

            <AlertDialog open={deleteReviewId !== null} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this review? This action cannot be undone.
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

ReviewsIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Reviews', href: '/admin/reviews' },
    ],
};
