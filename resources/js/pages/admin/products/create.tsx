import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type Category = { id: number; name: string };
type SubCategory = { id: number; category_id: number; name: string };
type GlobalShippingZone = { id: number; name: string };
type PaymentMethodOption = { id: number; name: string; slug: string };
type VariantRow = { size: string; color: string; price: string; original_price: string; in_stock: boolean; stock_quantity: string; free_shipping: boolean | null; shipping_zones: { zone: string; charge: string }[] };

type Props = {
    categories: Category[];
    subCategories: SubCategory[];
    shippingZones: GlobalShippingZone[];
    paymentMethods: PaymentMethodOption[];
};

export default function CreateProduct({ categories, subCategories, shippingZones, paymentMethods }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        sub_category_id: '',
        extra_category_ids: [] as number[],
        extra_sub_category_ids: [] as number[],
        name: '',
        description: '',
        short_description: '',
        long_description: '',
        price: '',
        original_price: '',
        offer_timer: '',
        is_featured: false,
        is_new_arrival: false,
        images: [] as File[],
        in_stock: true,
        stock_quantity: '',
        free_shipping: false,
        shipping_zones: [] as { zone: string; charge: string }[],
        allowed_payment_methods: [] as string[],
        variants: [] as VariantRow[],
        variant_images: [] as (File | null)[],
        size_label: '',
        color_label: '',
        youtube_video: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
    });

    const [previews, setPreviews] = useState<string[]>([]);
    const [variantImagePreviews, setVariantImagePreviews] = useState<(string | null)[]>([]);

    const filteredSubCategories = useMemo(
        () => (data.category_id ? subCategories.filter((sc) => sc.category_id === Number(data.category_id)) : []),
        [data.category_id, subCategories],
    );

    function addVariant() {
        setData('variants', [...data.variants, { size: '', color: '', price: '', original_price: '', in_stock: true, stock_quantity: '', free_shipping: null, shipping_zones: [] }]);
        setData('variant_images', [...data.variant_images, null]);
        setVariantImagePreviews((prev) => [...prev, null]);
    }

    function updateVariant(index: number, field: keyof VariantRow, value: string | boolean | null | { zone: string; charge: string }[]) {
        const updated = [...data.variants];
        updated[index] = { ...updated[index], [field]: value };
        setData('variants', updated);
    }

    function updateVariantZone(variantIndex: number, zoneIndex: number, field: 'zone' | 'charge', value: string) {
        const updated = [...data.variants];
        const zones = [...(updated[variantIndex].shipping_zones || [])];
        zones[zoneIndex] = { ...zones[zoneIndex], [field]: value };
        updated[variantIndex] = { ...updated[variantIndex], shipping_zones: zones };
        setData('variants', updated);
    }

    function addVariantZone(variantIndex: number) {
        const updated = [...data.variants];
        updated[variantIndex] = { ...updated[variantIndex], shipping_zones: [...(updated[variantIndex].shipping_zones || []), { zone: '', charge: '' }] };
        setData('variants', updated);
    }

    function removeVariantZone(variantIndex: number, zoneIndex: number) {
        const updated = [...data.variants];
        updated[variantIndex] = { ...updated[variantIndex], shipping_zones: (updated[variantIndex].shipping_zones || []).filter((_, i) => i !== zoneIndex) };
        setData('variants', updated);
    }

    function handleVariantImageChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        const updated = [...data.variant_images];
        updated[index] = file;
        setData('variant_images', updated);
        setVariantImagePreviews((prev) => {
            const next = [...prev];
            if (next[index]) URL.revokeObjectURL(next[index]!);
            next[index] = file ? URL.createObjectURL(file) : null;
            return next;
        });
    }

    function removeVariant(index: number) {
        if (variantImagePreviews[index]) URL.revokeObjectURL(variantImagePreviews[index]!);
        setData('variants', data.variants.filter((_, i) => i !== index));
        setData('variant_images', data.variant_images.filter((_, i) => i !== index));
        setVariantImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/products', {
            forceFormData: true,
        });
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        const newFiles = [...data.images, ...files].slice(0, 10);
        setData('images', newFiles);

        const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
        setPreviews((prev) => {
            prev.forEach((url) => URL.revokeObjectURL(url));
            return newPreviews;
        });
    }

    function removeImage(index: number) {
        const newFiles = data.images.filter((_, i) => i !== index);
        setData('images', newFiles);
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    }

    return (
        <>
            <Head title="Create Product" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="inline-flex items-center rounded-md p-1.5 hover:bg-accent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Create Product</h2>
                        <p className="text-muted-foreground">Add a new product to your catalog.</p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl space-y-6 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border"
                >
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Product Name
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
                            <label htmlFor="category_id" className="text-sm font-medium">
                                Category
                            </label>
                            <select
                                id="category_id"
                                value={data.category_id}
                                onChange={(e) => {
                                    setData('category_id', e.target.value);
                                    setData('sub_category_id', '');
                                }}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Select category...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="sub_category_id" className="text-sm font-medium">
                                Sub Category
                            </label>
                            <select
                                id="sub_category_id"
                                value={data.sub_category_id}
                                onChange={(e) => setData('sub_category_id', e.target.value)}
                                disabled={!data.category_id}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                            >
                                <option value="">None</option>
                                {filteredSubCategories.map((sc) => (
                                    <option key={sc.id} value={String(sc.id)}>
                                        {sc.name}
                                    </option>
                                ))}
                            </select>
                            {errors.sub_category_id && <p className="text-sm text-destructive">{errors.sub_category_id}</p>}
                        </div>

                        {/* Extra Categories */}
                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-sm font-medium">Additional Categories <span className="text-xs text-muted-foreground">(product will also appear in these)</span></label>
                            <div className="flex flex-wrap gap-3 rounded-lg border border-input bg-background p-3">
                                {categories.filter((c) => String(c.id) !== data.category_id).map((cat) => (
                                    <label key={cat.id} className="flex items-center gap-1.5 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={data.extra_category_ids.includes(cat.id)}
                                            onChange={(e) => {
                                                const ids = e.target.checked
                                                    ? [...data.extra_category_ids, cat.id]
                                                    : data.extra_category_ids.filter((id) => id !== cat.id);
                                                setData('extra_category_ids', ids);
                                            }}
                                            className="rounded border-input"
                                        />
                                        {cat.name}
                                    </label>
                                ))}
                                {categories.filter((c) => String(c.id) !== data.category_id).length === 0 && (
                                    <p className="text-xs text-muted-foreground">Select a primary category first</p>
                                )}
                            </div>
                        </div>

                        {/* Extra Sub Categories */}
                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-sm font-medium">Additional Sub Categories <span className="text-xs text-muted-foreground">(from any category)</span></label>
                            <div className="flex flex-wrap gap-3 rounded-lg border border-input bg-background p-3">
                                {subCategories.filter((sc) => String(sc.id) !== data.sub_category_id).map((sc) => {
                                    const parentCat = categories.find((c) => c.id === sc.category_id);
                                    return (
                                        <label key={sc.id} className="flex items-center gap-1.5 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={data.extra_sub_category_ids.includes(sc.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...data.extra_sub_category_ids, sc.id]
                                                        : data.extra_sub_category_ids.filter((id) => id !== sc.id);
                                                    setData('extra_sub_category_ids', ids);
                                                }}
                                                className="rounded border-input"
                                            />
                                            {sc.name} <span className="text-xs text-muted-foreground">({parentCat?.name})</span>
                                        </label>
                                    );
                                })}
                                {subCategories.length === 0 && <p className="text-xs text-muted-foreground">No subcategories available</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="price" className="text-sm font-medium">
                                Price ($)
                            </label>
                            <input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="original_price" className="text-sm font-medium">
                                Original Price ($)
                            </label>
                            <input
                                id="original_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.original_price}
                                onChange={(e) => setData('original_price', e.target.value)}
                                placeholder="Leave empty if no discount"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.original_price && <p className="text-sm text-destructive">{errors.original_price}</p>}
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-sm font-medium">Product Images (max 10)</label>
                            <div className="flex flex-wrap gap-3">
                                {previews.map((src, i) => (
                                    <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                                        <img src={src} alt="" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {data.images.length < 10 && (
                                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input hover:border-primary/50 hover:bg-muted/30">
                                        <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground">Upload</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                            multiple
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <label htmlFor="short_description" className="text-sm font-medium">
                                Short Description (max 500 characters)
                            </label>
                            <textarea
                                id="short_description"
                                rows={2}
                                maxLength={500}
                                value={data.short_description}
                                onChange={(e) => setData('short_description', e.target.value)}
                                placeholder="Brief product summary"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground">{data.short_description.length}/500</p>
                            {errors.short_description && <p className="text-sm text-destructive">{errors.short_description}</p>}
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <label htmlFor="youtube_video" className="text-sm font-medium">
                                YouTube Video URL (optional)
                            </label>
                            <input
                                type="text"
                                id="youtube_video"
                                value={data.youtube_video}
                                onChange={(e) => setData('youtube_video', e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.youtube_video && <p className="text-sm text-destructive">{errors.youtube_video}</p>}
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <label htmlFor="long_description" className="text-sm font-medium">
                                Long Description
                            </label>
                            <textarea
                                id="long_description"
                                rows={6}
                                value={data.long_description}
                                onChange={(e) => setData('long_description', e.target.value)}
                                placeholder="Detailed product description with features, materials, care instructions, etc."
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.long_description && <p className="text-sm text-destructive">{errors.long_description}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="offer_timer" className="text-sm font-medium">
                                Offer Valid Until
                            </label>
                            <input
                                id="offer_timer"
                                type="datetime-local"
                                value={data.offer_timer}
                                onChange={(e) => setData('offer_timer', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.offer_timer && <p className="text-sm text-destructive">{errors.offer_timer}</p>}
                        </div>

                        <div className="flex items-center gap-2 sm:col-span-2">
                            <input
                                id="free_shipping"
                                type="checkbox"
                                checked={data.free_shipping}
                                onChange={(e) => setData('free_shipping', e.target.checked)}
                                className="h-4 w-4 rounded border-input"
                            />
                            <label htmlFor="free_shipping" className="text-sm font-medium">
                                Free Shipping
                            </label>
                        </div>

                        {!data.free_shipping && (
                            <div className="space-y-3 sm:col-span-2">
                                <div>
                                    <label className="text-sm font-medium">Shipping Zones</label>
                                    <p className="text-xs text-muted-foreground mt-0.5">Enter charge for each zone. Leave blank to exclude a zone.</p>
                                </div>
                                {shippingZones.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No shipping zones configured.{' '}
                                        <a href="/admin/shipping-zones/create" className="text-primary underline-offset-2 hover:underline">
                                            Add a shipping zone
                                        </a>{' '}
                                        first.
                                    </p>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {shippingZones.map((zone) => {
                                            const existing = data.shipping_zones.find((sz) => sz.zone === zone.name);
                                            return (
                                                <div key={zone.id} className="flex items-center gap-2 rounded-lg border border-input px-3 py-2">
                                                    <span className="flex-1 text-sm font-medium">{zone.name}</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-sm text-muted-foreground">৳</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={existing?.charge ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '' || val === '0') {
                                                                    setData('shipping_zones', data.shipping_zones.filter((sz) => sz.zone !== zone.name));
                                                                } else {
                                                                    const others = data.shipping_zones.filter((sz) => sz.zone !== zone.name);
                                                                    setData('shipping_zones', [...others, { zone: zone.name, charge: val }]);
                                                                }
                                                            }}
                                                            placeholder="0"
                                                            className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {errors.shipping_zones && <p className="text-sm text-destructive">{errors.shipping_zones}</p>}
                            </div>
                        )}

                        {/* Allowed Payment Methods */}
                        <div className="space-y-3 sm:col-span-2">
                            <div>
                                <label className="text-sm font-medium">Allowed Payment Methods</label>
                                <p className="text-xs text-muted-foreground mt-0.5">Select which payment methods are available for this product. Leave empty to allow all.</p>
                            </div>
                            {paymentMethods.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No payment methods configured.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {paymentMethods.map((method) => {
                                        const isSelected = data.allowed_payment_methods.includes(method.slug);
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setData('allowed_payment_methods', data.allowed_payment_methods.filter((s) => s !== method.slug));
                                                    } else {
                                                        setData('allowed_payment_methods', [...data.allowed_payment_methods, method.slug]);
                                                    }
                                                }}
                                                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-input hover:border-primary/50'
                                                }`}
                                            >
                                                {method.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {errors.allowed_payment_methods && <p className="text-sm text-destructive">{errors.allowed_payment_methods}</p>}
                        </div>

                        <div className="flex items-center gap-6 pt-2 sm:col-span-2 flex-wrap">
                            {/* In Stock & Stock Quantity */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="in_stock"
                                        type="checkbox"
                                        checked={data.in_stock}
                                        onChange={(e) => setData('in_stock', e.target.checked)}
                                        className="h-4 w-4 rounded border-input cursor-pointer"
                                    />
                                    <label htmlFor="in_stock" className="text-sm font-medium cursor-pointer">
                                        In Stock
                                    </label>
                                </div>

                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 rounded-md border border-border">
                                    <label htmlFor="stock_quantity" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        Qty:
                                    </label>
                                    <input
                                        id="stock_quantity"
                                        type="number"
                                        min="0"
                                        value={data.stock_quantity}
                                        onChange={(e) => setData('stock_quantity', e.target.value)}
                                        placeholder="∞"
                                        title="Leave empty for available stock"
                                        className="w-16 rounded-sm border border-input bg-background px-1.5 py-0.5 text-sm font-medium text-center focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    {(data.stock_quantity || data.stock_quantity === 0) && (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            ({data.stock_quantity} available)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Featured & New Arrival */}
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="is_featured"
                                        type="checkbox"
                                        checked={data.is_featured}
                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                        className="h-4 w-4 rounded border-input cursor-pointer"
                                    />
                                    <label htmlFor="is_featured" className="text-sm font-medium cursor-pointer">
                                        Featured Product
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="is_new_arrival"
                                        type="checkbox"
                                        checked={data.is_new_arrival}
                                        onChange={(e) => setData('is_new_arrival', e.target.checked)}
                                        className="h-4 w-4 rounded border-input cursor-pointer"
                                    />
                                    <label htmlFor="is_new_arrival" className="text-sm font-medium cursor-pointer">
                                        New Arrival
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Product Variants</label>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                            >
                                <Plus className="h-3 w-3" /> Add Variant
                            </button>
                        </div>
                        {data.variants.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] text-muted-foreground">Size Label (default: Size)</label>
                                    <input
                                        type="text"
                                        value={data.size_label}
                                        onChange={(e) => setData('size_label', e.target.value)}
                                        placeholder="e.g. Weight, Length, Volume"
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] text-muted-foreground">Color Label (default: Color)</label>
                                    <input
                                        type="text"
                                        value={data.color_label}
                                        onChange={(e) => setData('color_label', e.target.value)}
                                        placeholder="e.g. Flavor, Material, Style"
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                        {data.variants.length === 0 && (
                            <p className="text-xs text-muted-foreground">No variants added. Product will use the base price above.</p>
                        )}
                        {data.variants.map((variant, i) => (
                            <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-input p-3">
                                <div className="w-24 space-y-1">
                                    <label className="text-[11px] text-muted-foreground">Size</label>
                                    <input
                                        type="text"
                                        value={variant.size}
                                        onChange={(e) => updateVariant(i, 'size', e.target.value)}
                                        placeholder="e.g. M, L, XL"
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="w-24 space-y-1">
                                    <label className="text-[11px] text-muted-foreground">Color</label>
                                    <input
                                        type="text"
                                        value={variant.color}
                                        onChange={(e) => updateVariant(i, 'color', e.target.value)}
                                        placeholder="e.g. Red"
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="w-28 space-y-1">
                                    <label className="text-[11px] text-muted-foreground">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={variant.price}
                                        onChange={(e) => updateVariant(i, 'price', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                                    />
                                    {errors[`variants.${i}.price` as keyof typeof errors] && (
                                        <p className="text-[10px] text-destructive">{errors[`variants.${i}.price` as keyof typeof errors]}</p>
                                    )}
                                </div>
                                <div className="w-28 space-y-1">
                                    <label className="text-[11px] text-muted-foreground">Original ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={variant.original_price}
                                        onChange={(e) => updateVariant(i, 'original_price', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 pb-1">
                                    <input
                                        type="checkbox"
                                        checked={variant.in_stock}
                                        onChange={(e) => updateVariant(i, 'in_stock', e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-input"
                                    />
                                    <span className="text-[11px]">In Stock</span>
                                </div>
                                <div className="w-24 space-y-1">
                                    <label className="text-[11px] text-muted-foreground">Stock Qty</label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Leave blank for available stock"
                                            value={variant.stock_quantity}
                                            onChange={(e) => updateVariant(i, 'stock_quantity', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                                        />
                                        {(variant.stock_quantity || variant.stock_quantity === 0) && (
                                            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                                                ({variant.stock_quantity})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Variant Shipping */}
                                <div className="w-full mt-1 space-y-1.5 border-t border-dashed border-input pt-2">
                                    <p className="text-[11px] font-medium text-muted-foreground">Delivery (leave empty to inherit from product)</p>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`variant_shipping_${i}`}
                                                checked={variant.free_shipping === null}
                                                onChange={() => {
                                                    const u = [...data.variants];
                                                    u[i] = { ...u[i], free_shipping: null, shipping_zones: [] };
                                                    setData('variants', u);
                                                }}
                                                className="h-3 w-3"
                                            />
                                            Inherit
                                        </label>
                                        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`variant_shipping_${i}`}
                                                checked={variant.free_shipping === true}
                                                onChange={() => {
                                                    const u = [...data.variants];
                                                    u[i] = { ...u[i], free_shipping: true, shipping_zones: [] };
                                                    setData('variants', u);
                                                }}
                                                className="h-3 w-3"
                                            />
                                            Free
                                        </label>
                                        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`variant_shipping_${i}`}
                                                checked={variant.free_shipping === false}
                                                onChange={() => {
                                                    const u = [...data.variants];
                                                    const zones = u[i].shipping_zones?.length
                                                        ? u[i].shipping_zones!
                                                        : shippingZones.map((sz) => ({ zone: sz.name, charge: '' }));
                                                    u[i] = { ...u[i], free_shipping: false, shipping_zones: zones };
                                                    setData('variants', u);
                                                }}
                                                className="h-3 w-3"
                                            />
                                            Custom zones
                                        </label>
                                    </div>
                                    {variant.free_shipping === false && (
                                        <div className="space-y-1">
                                            {(variant.shipping_zones || []).map((zone, zi) => (
                                                <div key={zi} className="flex items-center gap-2">
                                                    <span className="w-28 text-[11px] font-medium truncate">{zone.zone}</span>
                                                    <input
                                                        type="number"
                                                        value={zone.charge}
                                                        onChange={(e) => updateVariantZone(i, zi, 'charge', e.target.value)}
                                                        placeholder="Charge"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-24 rounded-md border border-input bg-background px-2 py-1 text-[11px]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Variant Image */}
                                <div className="flex items-end gap-2">
                                    {variantImagePreviews[i] ? (
                                        <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                                            <img src={variantImagePreviews[i]!} className="h-full w-full object-cover" alt="" />
                                            <button
                                                type="button"
                                                onClick={() => handleVariantImageChange(i, { target: { files: null } } as any)}
                                                className="absolute right-0 top-0 rounded-bl-md bg-black/60 p-0.5 text-white"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-dashed border-input hover:bg-muted/50">
                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                            <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleVariantImageChange(i, e)} />
                                        </label>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeVariant(i)}
                                    className="mb-0.5 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {errors.variants && <p className="text-sm text-destructive">{errors.variants}</p>}
                    </div>

                    {/* SEO */}
                    <div className="space-y-3 border-t pt-4">
                        <div>
                            <p className="text-sm font-medium">SEO Settings</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Override default site SEO for this product page.</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="meta_title" className="text-sm font-medium">Meta Title</label>
                            <input
                                id="meta_title"
                                type="text"
                                value={data.meta_title}
                                onChange={(e) => setData('meta_title', e.target.value)}
                                placeholder="Leave empty to use product name"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.meta_title && <p className="text-sm text-destructive">{errors.meta_title}</p>}
                            <p className="text-xs text-muted-foreground">{data.meta_title.length}/60 characters recommended</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="meta_description" className="text-sm font-medium">Meta Description</label>
                            <textarea
                                id="meta_description"
                                value={data.meta_description}
                                onChange={(e) => setData('meta_description', e.target.value)}
                                placeholder="Leave empty to use product description"
                                rows={3}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.meta_description && <p className="text-sm text-destructive">{errors.meta_description}</p>}
                            <p className="text-xs text-muted-foreground">{data.meta_description.length}/160 characters recommended</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="meta_keywords" className="text-sm font-medium">Meta Keywords</label>
                            <input
                                id="meta_keywords"
                                type="text"
                                value={data.meta_keywords}
                                onChange={(e) => setData('meta_keywords', e.target.value)}
                                placeholder="organic, natural, product name"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.meta_keywords && <p className="text-sm text-destructive">{errors.meta_keywords}</p>}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Product'}
                        </button>
                        <Link
                            href="/admin/products"
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

CreateProduct.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Products', href: '/admin/products' },
        { title: 'Create', href: '/admin/products/create' },
    ],
};
