import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';

const iconOptions = [
    'Wallet', 'CreditCard', 'Banknote', 'DollarSign', 'CircleDollarSign',
    'HandCoins', 'Landmark', 'Receipt', 'BadgeDollarSign', 'Coins',
    'PiggyBank', 'ArrowLeftRight', 'Send', 'QrCode', 'Smartphone',
    'Phone', 'Globe', 'ShieldCheck', 'Lock', 'CheckCircle',
    'Truck', 'Package', 'ShoppingBag', 'ShoppingCart', 'Store',
    'Heart', 'Star', 'Gift', 'Tag', 'Percent',
    'Clock', 'Zap', 'Sparkles', 'BadgeCheck', 'ThumbsUp', 'Award',
];

function IconPreview({ name }: { name: string }) {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
    return Icon ? <Icon className="h-5 w-5" /> : null;
}

type PaymentMethod = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    account_number: string | null;
    logo: string | null;
    icon: string | null;
    account_label: string | null;
    instructions_text: string | null;
    payment_number_label: string | null;
    payment_amount_label: string | null;
    requires_payment_details: boolean;
    is_active: boolean;
    sort_order: number;
};

type Props = {
    paymentMethod: PaymentMethod;
};

export default function EditPaymentMethod() {
    const { paymentMethod } = usePage<Props>().props;
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put' as const,
        name: paymentMethod.name,
        slug: paymentMethod.slug,
        description: paymentMethod.description || '',
        account_number: paymentMethod.account_number || '',
        logo: null as File | null,
        remove_logo: false,
        icon: paymentMethod.icon || '',
        account_label: paymentMethod.account_label || '',
        instructions_text: paymentMethod.instructions_text || '',
        payment_number_label: paymentMethod.payment_number_label || '',
        payment_amount_label: paymentMethod.payment_amount_label || '',
        requires_payment_details: paymentMethod.requires_payment_details,
        is_active: paymentMethod.is_active,
        sort_order: paymentMethod.sort_order,
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [iconSearch, setIconSearch] = useState('');

    const filteredIcons = iconOptions.filter((icon) =>
        icon.toLowerCase().includes(iconSearch.toLowerCase()),
    );

    function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] || null;
        setData('logo', file);
        if (file) {
            setLogoPreview(URL.createObjectURL(file));
            setData('remove_logo', false);
        } else {
            setLogoPreview(null);
        }
    }

    function removeLogo() {
        setData((prev) => ({ ...prev, logo: null, remove_logo: true }));
        setLogoPreview(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/admin/payment-methods/${paymentMethod.id}`, { forceFormData: true });
    }

    return (
        <>
            <Head title={`Edit ${paymentMethod.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/payment-methods"
                        className="inline-flex items-center rounded-md p-1.5 hover:bg-accent"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Payment Method</h2>
                        <p className="text-muted-foreground">Update details for {paymentMethod.name}.</p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-lg space-y-6 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border"
                >
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Name
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

                    <div className="space-y-2">
                        <label htmlFor="slug" className="text-sm font-medium">
                            Slug
                        </label>
                        <input
                            id="slug"
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input
                            id="description"
                            type="text"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="account_number" className="text-sm font-medium">
                            Account Number <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input
                            id="account_number"
                            type="text"
                            value={data.account_number}
                            onChange={(e) => setData('account_number', e.target.value)}
                            placeholder="e.g. 01XXXXXXXXX"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">Your receiving account number shown to customers.</p>
                        {errors.account_number && <p className="text-sm text-destructive">{errors.account_number}</p>}
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Logo / Image <span className="text-muted-foreground">(optional)</span>
                        </label>
                        {(logoPreview || (paymentMethod.logo && !data.remove_logo)) ? (
                            <div className="relative inline-block">
                                <img
                                    src={logoPreview || paymentMethod.logo!}
                                    alt="Logo preview"
                                    className="h-16 w-auto rounded-lg border"
                                />
                                <button
                                    type="button"
                                    onClick={removeLogo}
                                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-3 py-3 text-sm text-muted-foreground hover:border-primary/50">
                                <Upload className="h-4 w-4" />
                                <span>Choose logo image</span>
                                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                            </label>
                        )}
                        <p className="text-xs text-muted-foreground">Shown on checkout if no icon is selected. Recommended: square image, max 2MB.</p>
                        {errors.logo && <p className="text-sm text-destructive">{errors.logo}</p>}
                    </div>

                    {/* Icon Picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Icon <span className="text-muted-foreground font-normal">(shown if no logo image)</span></label>
                        {data.icon && (
                            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                                <IconPreview name={data.icon} />
                                <span className="text-sm font-medium">{data.icon}</span>
                                <button
                                    type="button"
                                    onClick={() => setData('icon', '')}
                                    className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Search icons..."
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto rounded-lg border border-input p-2">
                            {filteredIcons.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setData('icon', icon)}
                                    className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs hover:bg-accent ${
                                        data.icon === icon ? 'bg-primary/10 ring-2 ring-primary' : ''
                                    }`}
                                    title={icon}
                                >
                                    <IconPreview name={icon} />
                                </button>
                            ))}
                            {filteredIcons.length === 0 && (
                                <p className="col-span-6 py-2 text-center text-sm text-muted-foreground">No icons found.</p>
                            )}
                        </div>
                        {errors.icon && <p className="text-sm text-destructive">{errors.icon}</p>}
                    </div>

                    {/* Custom Labels (shown only when Require Payment Details is checked) */}
                    {data.requires_payment_details && (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="account_label" className="text-sm font-medium">
                                    Account Display Text <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <input
                                    id="account_label"
                                    type="text"
                                    value={data.account_label}
                                    onChange={(e) => setData('account_label', e.target.value)}
                                    placeholder='e.g. "Send to: 01XXXXXXXXX"'
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <p className="text-xs text-muted-foreground">Custom text shown with account number. Default: "Send to: (account number)"</p>
                                {errors.account_label && <p className="text-sm text-destructive">{errors.account_label}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="instructions_text" className="text-sm font-medium">
                                    Instructions Text <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <input
                                    id="instructions_text"
                                    type="text"
                                    value={data.instructions_text}
                                    onChange={(e) => setData('instructions_text', e.target.value)}
                                    placeholder='e.g. "Send payment and enter details below:"'
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <p className="text-xs text-muted-foreground">Custom instruction text. Default: "Send payment and enter details below:"</p>
                                {errors.instructions_text && <p className="text-sm text-destructive">{errors.instructions_text}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="payment_number_label" className="text-sm font-medium">
                                    Payment Number Label <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <input
                                    id="payment_number_label"
                                    type="text"
                                    value={data.payment_number_label}
                                    onChange={(e) => setData('payment_number_label', e.target.value)}
                                    placeholder='e.g. "Your bKash Number"'
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <p className="text-xs text-muted-foreground">Custom label for payment number field. Default: "Payment Number"</p>
                                {errors.payment_number_label && <p className="text-sm text-destructive">{errors.payment_number_label}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="payment_amount_label" className="text-sm font-medium">
                                    Payment Amount Label <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <input
                                    id="payment_amount_label"
                                    type="text"
                                    value={data.payment_amount_label}
                                    onChange={(e) => setData('payment_amount_label', e.target.value)}
                                    placeholder='e.g. "Amount Sent (৳)"'
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <p className="text-xs text-muted-foreground">Custom label for payment amount field. Default: "Payment Amount (৳)"</p>
                                {errors.payment_amount_label && <p className="text-sm text-destructive">{errors.payment_amount_label}</p>}
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="sort_order" className="text-sm font-medium">
                            Sort Order
                        </label>
                        <input
                            id="sort_order"
                            type="number"
                            min={0}
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.sort_order && <p className="text-sm text-destructive">{errors.sort_order}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            id="requires_payment_details"
                            type="checkbox"
                            checked={data.requires_payment_details}
                            onChange={(e) => setData('requires_payment_details', e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                        />
                        <label htmlFor="requires_payment_details" className="text-sm font-medium">
                            Require Payment Details
                        </label>
                        <span className="text-xs text-muted-foreground">(Show payment number & amount fields on checkout)</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium">
                            Active
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Update Payment Method'}
                        </button>
                        <Link
                            href="/admin/payment-methods"
                            className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}

EditPaymentMethod.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Payment Methods', href: '/admin/payment-methods' },
        { title: 'Edit', href: '#' },
    ],
};
