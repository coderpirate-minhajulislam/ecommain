import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEvent } from 'react';

type Product = { id: number; name: string };
type Props = { products: Product[] };

export default function CouponCreate() {
    const { products } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        type: 'fixed' as 'fixed' | 'percentage',
        value: '',
        min_order_amount: '',
        max_discount: '',
        usage_limit: '',
        starts_at: '',
        expires_at: '',
        is_global: true,
        is_active: true,
        product_ids: [] as number[],
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/admin/coupons');
    }

    function toggleProduct(id: number) {
        setData('product_ids', data.product_ids.includes(id)
            ? data.product_ids.filter((pid) => pid !== id)
            : [...data.product_ids, id]
        );
    }

    return (
        <>
            <Head title="Create Coupon" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/coupons" className="rounded-md p-1.5 hover:bg-accent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h2 className="text-2xl font-bold tracking-tight">Create Coupon</h2>
                </div>

                <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-6">
                    {/* Code */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Coupon Code <span className="text-destructive">*</span></label>
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            placeholder="e.g. SAVE20"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                    </div>

                    {/* Type & Value */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Type <span className="text-destructive">*</span></label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value as 'fixed' | 'percentage')}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="fixed">Fixed Amount (৳)</option>
                                <option value="percentage">Percentage (%)</option>
                            </select>
                            {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Value <span className="text-destructive">*</span></label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.value}
                                onChange={(e) => setData('value', e.target.value)}
                                placeholder={data.type === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
                        </div>
                    </div>

                    {/* Min Order & Max Discount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Min Order Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.min_order_amount}
                                onChange={(e) => setData('min_order_amount', e.target.value)}
                                placeholder="Optional"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.min_order_amount && <p className="text-xs text-destructive">{errors.min_order_amount}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Max Discount</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.max_discount}
                                onChange={(e) => setData('max_discount', e.target.value)}
                                placeholder="Optional"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.max_discount && <p className="text-xs text-destructive">{errors.max_discount}</p>}
                        </div>
                    </div>

                    {/* Usage Limit */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Usage Limit</label>
                        <input
                            type="number"
                            min="1"
                            value={data.usage_limit}
                            onChange={(e) => setData('usage_limit', e.target.value)}
                            placeholder="Unlimited if empty"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.usage_limit && <p className="text-xs text-destructive">{errors.usage_limit}</p>}
                    </div>

                    {/* Start & Expiry Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Starts At</label>
                            <input
                                type="datetime-local"
                                value={data.starts_at}
                                onChange={(e) => setData('starts_at', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.starts_at && <p className="text-xs text-destructive">{errors.starts_at}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Expires At</label>
                            <input
                                type="datetime-local"
                                value={data.expires_at}
                                onChange={(e) => setData('expires_at', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.expires_at && <p className="text-xs text-destructive">{errors.expires_at}</p>}
                        </div>
                    </div>

                    {/* Scope: Global / Product-specific */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_global}
                                onChange={(e) => setData('is_global', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">Global (applies to all products)</span>
                        </label>

                        {!data.is_global && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Products <span className="text-destructive">*</span></label>
                                <div className="max-h-48 overflow-y-auto rounded-lg border border-input p-2">
                                    {products.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No products available.</p>
                                    ) : (
                                        products.map((product) => (
                                            <label key={product.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                                                <input
                                                    type="checkbox"
                                                    checked={data.product_ids.includes(product.id)}
                                                    onChange={() => toggleProduct(product.id)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <span className="text-sm">{product.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {errors.product_ids && <p className="text-xs text-destructive">{errors.product_ids}</p>}
                            </div>
                        )}
                    </div>

                    {/* Active toggle */}
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm font-medium">Active</span>
                    </label>

                    {/* Submit */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Coupon'}
                        </button>
                        <Link href="/admin/coupons" className="rounded-lg border border-input px-6 py-2 text-sm font-medium hover:bg-accent">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}

CouponCreate.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Coupons', href: '/admin/coupons' },
        { title: 'Create', href: '/admin/coupons/create' },
    ],
};
