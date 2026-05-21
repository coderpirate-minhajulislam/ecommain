import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Review {
    id: number;
    name: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface ReviewsListProps {
    reviews: Review[];
    customerReviewsLabel?: string;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${
                        star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                    }`}
                />
            ))}
        </div>
    );
}

export function ReviewsList({ reviews, customerReviewsLabel }: ReviewsListProps) {
    const heading = customerReviewsLabel ?? 'Customer Reviews';

    if (reviews.length === 0) {
        return (
            <Card className="mt-12">
                <CardHeader>
                    <CardTitle>{heading}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        No reviews yet. Be the first to review this product!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-12">
            <CardHeader>
                <CardTitle>{heading} ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-b-0">
                            <div className="mb-2 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <StarRating rating={review.rating} />
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {review.rating} out of 5
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    By {review.name} on {formatDate(review.created_at)}
                                </p>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                {review.comment}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
