import { useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReviewSubmissionFormProps {
    productId: number;
    labels?: {
        reviewHeading?: string;
        reviewSubheading?: string;
        reviewNote?: string;
        reviewName?: string;
        reviewEmail?: string;
        reviewRating?: string;
        reviewBody?: string;
        reviewSubmit?: string;
    };
}

export function ReviewSubmissionForm({ productId, labels }: ReviewSubmissionFormProps) {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: productId,
        name: '',
        email: '',
        rating: 5,
        comment: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/reviews', {
            onSuccess: () => {
                toast.success('Your review has been submitted and is waiting for approval!');
                reset();
                setRating(5);
            },
            onError: (errors: any) => {
                if (errors.error) {
                    toast.error(errors.error);
                }
            },
        });
    };

    return (
        <Card className="mt-12">
            <CardHeader>
                <CardTitle>{labels?.reviewHeading ?? 'Submit a Review'}</CardTitle>
                <CardDescription>{labels?.reviewSubheading ?? 'Share your thoughts about this product.'} {labels?.reviewNote ?? 'Anyone can submit a review!'}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">{labels?.reviewName ?? 'Your Name'}</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">{labels?.reviewEmail ?? 'Email Address'}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    {/* Rating */}
                    <div className="grid gap-3">
                        <Label>{labels?.reviewRating ?? 'Rating'}</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => {
                                        setRating(star);
                                        setData('rating', star);
                                    }}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-6 w-6 ${
                                            star <= (hoverRating || rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-xs text-muted-foreground">
                                {hoverRating || rating} out of 5
                            </span>
                        </div>
                        {errors.rating && <p className="text-xs text-red-500">{errors.rating}</p>}
                    </div>

                    {/* Comment */}
                    <div className="grid gap-2">
                        <Label htmlFor="comment">{labels?.reviewBody ?? 'Your Review (Minimum 10 characters)'}</Label>
                        <textarea
                            id="comment"
                            placeholder="Share your experience with this product..."
                            value={data.comment}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('comment', e.target.value)}
                            disabled={processing}
                            rows={5}
                             className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.comment && <p className="text-xs text-red-500">{errors.comment}</p>}
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" disabled={processing} size="sm" className="w-auto">
                        {processing ? 'Submitting...' : (labels?.reviewSubmit ?? 'Submit Review')}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        ℹ️ Your review will be moderated by our admin team before appearing on the product page.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
