import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Review = {
    id: number;
    product_id: number;
    product: {
        id: number;
        name: string;
    };
    name: string;
    email: string;
    rating: number;
    comment: string;
    is_approved: boolean;
};

type Props = {
    review: Review;
};

export default function EditReview() {
    const { review } = usePage<Props>().props;
    const { data, setData, put, processing, errors } = useForm({
        name: review.name,
        email: review.email,
        rating: review.rating,
        comment: review.comment,
        is_approved: review.is_approved,
    });
    const [hoverRating, setHoverRating] = useState(0);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/reviews/${review.id}`, {
            onSuccess: () => {
                toast.success('Review updated successfully!');
            },
            onError: () => {
                toast.error('Failed to update review.');
            },
        });
    }

    return (
        <>
            <Head title={`Edit Review`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/reviews"
                        className="inline-flex items-center rounded-md p-1.5 hover:bg-accent"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Review</h2>
                        <p className="text-muted-foreground">Update review for <span className="font-semibold">{review.product.name}</span></p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl space-y-6 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border"
                >
                    {/* Product Info (Read-only) */}
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Product</p>
                        <p className="text-sm text-muted-foreground">{review.product.name}</p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Reviewer Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    {/* Rating */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-2 items-center">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setData('rating', star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`h-6 w-6 ${
                                                star <= (hoverRating || data.rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {hoverRating || data.rating} out of 5 stars
                            </span>
                        </div>
                        {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <label htmlFor="comment" className="text-sm font-medium">
                            Review Comment
                        </label>
                        <textarea
                            id="comment"
                            rows={6}
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.comment && <p className="text-sm text-destructive">{errors.comment}</p>}
                    </div>

                    {/* Approval Status */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Status</label>
                        <div className="flex items-center gap-3">
                            <input
                                id="is_approved"
                                type="checkbox"
                                checked={data.is_approved}
                                onChange={(e) => setData('is_approved', e.target.checked)}
                                className="h-4 w-4 rounded border-input"
                            />
                            <label htmlFor="is_approved" className="text-sm">
                                Approve this review
                            </label>
                        </div>
                        {errors.is_approved && <p className="text-sm text-destructive">{errors.is_approved}</p>}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Updating...' : 'Update Review'}
                        </button>
                        <Link
                            href="/admin/reviews"
                            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}

EditReview.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Reviews', href: '/admin/reviews' },
        { title: 'Edit Review', href: '#' },
    ],
};
