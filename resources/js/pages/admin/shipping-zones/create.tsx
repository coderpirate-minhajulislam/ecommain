import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function CreateShippingZone() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        sort_order: '0',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/shipping-zones');
    }

    return (
        <>
            <Head title="Add Shipping Zone" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/shipping-zones" className="inline-flex items-center rounded-md p-1.5 hover:bg-accent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Add Shipping Zone</h2>
                        <p className="text-muted-foreground">Create a new delivery area. Charges are set per product.</p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-lg space-y-5 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border"
                >
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Zone Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Inside Dhaka, Outside Dhaka"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="sort_order" className="text-sm font-medium">
                            Sort Order
                        </label>
                        <input
                            id="sort_order"
                            type="number"
                            min="0"
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', e.target.value)}
                            placeholder="0"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">Lower numbers appear first in the list.</p>
                        {errors.sort_order && <p className="text-sm text-destructive">{errors.sort_order}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : 'Save Zone'}
                        </button>
                        <Link
                            href="/admin/shipping-zones"
                            className="inline-flex items-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
