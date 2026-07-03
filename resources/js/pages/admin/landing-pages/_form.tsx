import { ChevronDown, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { IconPicker } from '@/components/icon-picker';

type ProductOption = { id: number; name: string };


export type LandingPageFormData = {
    product_id: string;
    extra_product_ids: number[];
    title: string;
    slug: string;
    subtitle: string;
    hero_text: string;
    hero_images: File[];
    existing_hero_images: string[];
    badge_text: string;
    icon_name: string;
    phone: string;
    authentic_badge_text: string;
    authentic_badge_icon: string;
    delivery_badge_text: string;
    delivery_badge_icon: string;
    price_banner_original_label: string;
    price_banner_original_price: string;
    price_banner_current_label: string;
    price_banner_current_price: string;
    mid_order_button_text: string;
    mid_order_button_icon: string;
    benefits_items: string[];
    benefits_title: string;
    checkout_banner_text: string;
    checkout_title: string;
    review_images_title: string;
    order_now_text: string;
    footer_text: string;
    is_active: boolean;
    free_shipping_enabled: boolean | null;
    free_shipping_amount: number | null;
    countdown_enabled: boolean;
    countdown_end_time: string;
    hero_video: string;
    review_images: File[];
    existing_review_images: string[];
    template: string;
};

export const defaultFormData: LandingPageFormData = {
    product_id: '',
    extra_product_ids: [],
    title: '',
    slug: '',
    subtitle: '',
    hero_text: '',
    hero_images: [],
    existing_hero_images: [],
    badge_text: 'Limited Offer',
    icon_name: 'package',
    phone: '+1 (234) 567-890',
    authentic_badge_text: '100% Authentic Product',
    authentic_badge_icon: 'shield-check',
    delivery_badge_text: 'Free Shipping',
    delivery_badge_icon: 'truck',
    price_banner_original_label: 'Regular Price',
    price_banner_original_price: '2,500',
    price_banner_current_label: 'Current Offer Price',
    price_banner_current_price: '1,500',
    mid_order_button_text: 'Order Now',
    mid_order_button_icon: 'shopping-cart',
    benefits_items: [
        'Everything included in one package',
        'Premium quality materials and craftsmanship',
        'Perfect gift for yourself or loved ones',
        'Great value — save more when you buy together',
        'Cash on delivery available',
        '7-day return guarantee for peace of mind',
    ],
    benefits_title: 'Why Buy This Package?',
    checkout_banner_text: 'Order now and get free shipping on orders over $50!',
    checkout_title: 'Order Now',
    review_images_title: 'Customer Reviews',
    order_now_text: 'Order Now',
    footer_text: 'All rights reserved. Secure checkout powered by our platform.',
    is_active: true,
    free_shipping_enabled: null,
    free_shipping_amount: null,
    countdown_enabled: false,
    countdown_end_time: '',
    hero_video: '',
    review_images: [],
    existing_review_images: [],
    template: 'v1',
};

const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'text-sm font-medium';

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold hover:bg-muted/50"
            >
                {title}
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="space-y-4 border-t px-4 pb-4 pt-4">{children}</div>}
        </div>
    );
}

export function LandingPageForm({
    data,
    setData,
    errors,
    products,
    slugEditable = true,
    onSlugChange,
}: {
    data: LandingPageFormData;
    setData: (key: string, value: unknown) => void;
    errors: Partial<Record<string, string>>;
    products: ProductOption[];
    slugEditable?: boolean;
    onSlugChange?: (value: string) => void;
}) {
    const heroImageInputRef = useRef<HTMLInputElement>(null);
    const [heroImagePreviews, setHeroImagePreviews] = useState<string[]>([]);

    function handleHeroImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const current = (data.hero_images as File[]) || [];
        const existingCount = (data.existing_hero_images as string[]).length;
        const remaining = 10 - existingCount - current.length;
        const allowed = files.slice(0, Math.max(0, remaining));
        if (!allowed.length) return;
        setData('hero_images', [...current, ...allowed]);
        setHeroImagePreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))]);
        // Reset input so same file can be re-selected
        if (heroImageInputRef.current) heroImageInputRef.current.value = '';
    }

    function removeNewHeroImage(index: number) {
        const updated = [...(data.hero_images as File[])];
        updated.splice(index, 1);
        setData('hero_images', updated);
        setHeroImagePreviews((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }

    function removeExistingHeroImage(path: string) {
        setData('existing_hero_images', (data.existing_hero_images as string[]).filter((p) => p !== path));
    }

    const reviewImageInputRef = useRef<HTMLInputElement>(null);
    const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);

    function handleReviewImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const current = (data.review_images as File[]) || [];
        const existingCount = (data.existing_review_images as string[]).length;
        const remaining = 10 - existingCount - current.length;
        const allowed = files.slice(0, Math.max(0, remaining));
        if (!allowed.length) return;
        setData('review_images', [...current, ...allowed]);
        setReviewImagePreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))]);
        if (reviewImageInputRef.current) reviewImageInputRef.current.value = '';
    }

    function removeNewReviewImage(index: number) {
        const updated = [...(data.review_images as File[])];
        updated.splice(index, 1);
        setData('review_images', updated);
        setReviewImagePreviews((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }

    function removeExistingReviewImage(path: string) {
        setData('existing_review_images', (data.existing_review_images as string[]).filter((p) => p !== path));
    }

    function toggleExtraProduct(id: number) {
        const current = ((data.extra_product_ids as (number | string)[]) || []).map(Number);
        if (current.includes(id)) {
            setData('extra_product_ids', current.filter((pid) => pid !== id));
        } else {
            setData('extra_product_ids', [...current, id]);
        }
    }
    return (
        <div className="max-w-3xl space-y-5">
            {/* ── General Settings ── */}
            <Section title="General Settings" defaultOpen>
                <div className="space-y-2">
                    <label htmlFor="product_id" className={labelClass}>Product <span className="text-destructive">*</span></label>
                    <select id="product_id" value={data.product_id} onChange={(e) => setData('product_id', e.target.value)} className={inputClass}>
                        <option value="">Select a product...</option>
                        {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    {errors.product_id && <p className="text-sm text-destructive">{errors.product_id}</p>}
                </div>

                {/* Additional products */}
                {data.product_id && (
                <div className="space-y-2">
                    <label className={labelClass}>Additional Products <span className="text-xs text-muted-foreground">(optional)</span></label>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-input bg-background p-2 space-y-1">
                        {products.filter((p) => String(p.id) !== String(data.product_id)).map((p) => {
                            const isChecked = ((data.extra_product_ids as (number | string)[]) || []).map(Number).includes(p.id);
                            return (
                                <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleExtraProduct(p.id)}
                                        className="h-4 w-4 rounded border-input accent-primary"
                                    />
                                    <span className="text-sm">{p.name}</span>
                                </label>
                            );
                        })}
                        {products.filter((p) => String(p.id) !== String(data.product_id)).length === 0 && (
                            <p className="px-2 py-1 text-xs text-muted-foreground">No other products available</p>
                        )}
                    </div>
                    {(data.extra_product_ids as number[]).length > 0 && (
                        <p className="text-xs text-muted-foreground">{(data.extra_product_ids as number[]).length} additional product(s) selected</p>
                    )}
                </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="title" className={labelClass}>Title <span className="text-destructive">*</span></label>
                    <input id="title" type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Smart Tracker Pro — Limited Offer" className={inputClass} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                    <label htmlFor="slug" className={labelClass}>Slug <span className="text-destructive">*</span></label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">/lp/</span>
                        <input id="slug" type="text" value={data.slug} onChange={(e) => onSlugChange ? onSlugChange(e.target.value) : setData('slug', e.target.value)} placeholder="smart-tracker-pro" className={'flex-1 ' + inputClass.replace('w-full ', '')} />
                    </div>
                    {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" role="switch" aria-checked={data.is_active} onClick={() => setData('is_active', !data.is_active)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.is_active ? 'bg-primary' : 'bg-input'}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <label className={labelClass}>Active</label>
                </div>

                <div className="space-y-2">
                    <label htmlFor="template" className={labelClass}>Template</label>
                    <select id="template" value={data.template || 'v1'} onChange={(e) => setData('template', e.target.value)} className={inputClass}>
                        <option value="v1">V1 — Dark (Original)</option>
                    </select>
                </div>

                {/* ── Free Shipping Override ── */}
                <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-muted-foreground mb-3">Free Shipping Override — overrides the global free shipping setting for this landing page only. Leave as <strong>Use Global</strong> to follow the global setting.</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {([['null', 'Use Global'], ['true', 'Enabled'], ['false', 'Disabled']] as const).map(([val, label]) => {
                            const current = data.free_shipping_enabled === null ? 'null' : data.free_shipping_enabled ? 'true' : 'false';
                            return (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setData('free_shipping_enabled', val === 'null' ? null : val === 'true')}
                                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${current === val ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary/50'}`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    {data.free_shipping_enabled !== false && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Specific Free Shipping Amount (৳) — leave blank to use global amount</label>
                            <div className="relative max-w-xs">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">৳</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    placeholder="e.g. 500 (blank = use global)"
                                    value={data.free_shipping_amount ?? ''}
                                    onChange={(e) => setData('free_shipping_amount', e.target.value === '' ? null : parseInt(e.target.value) || 0)}
                                    className={`pl-7 ${inputClass}`}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Countdown Timer ── */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-3 mb-4">
                        <button type="button" role="switch" aria-checked={data.countdown_enabled} onClick={() => setData('countdown_enabled', !data.countdown_enabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.countdown_enabled ? 'bg-primary' : 'bg-input'}`}>
                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.countdown_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <label className={labelClass}>Enable Countdown Timer</label>
                    </div>

                    {data.countdown_enabled && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="countdown_end_time" className={labelClass}>Countdown End Time <span className="text-destructive">*</span></label>
                                <input id="countdown_end_time" type="datetime-local" value={data.countdown_end_time || ''} onChange={(e) => setData('countdown_end_time', e.target.value || null)} className={inputClass} />
                                {errors.countdown_end_time && <p className="text-sm text-destructive">{errors.countdown_end_time}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </Section>

            {/* ── Top Bar ── */}
            <Section title="Top Bar">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="badge_text" className={labelClass}>Badge Text</label>
                        <input id="badge_text" type="text" value={data.badge_text} onChange={(e) => setData('badge_text', e.target.value)} placeholder="Limited Offer" className={inputClass} />
                        {errors.badge_text && <p className="text-sm text-destructive">{errors.badge_text}</p>}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="icon_name" className={labelClass}>Badge Icon</label>
                        <IconPicker
                            value={data.icon_name}
                            onChange={(val) => setData('icon_name', val)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="phone" className={labelClass}>Phone Number</label>
                    <input id="phone" type="text" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+1 (234) 567-890" className={inputClass} />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
            </Section>

            {/* ── Hero Section ── */}
            <Section title="Hero Section">
                <div className="space-y-2">
                    <label htmlFor="subtitle" className={labelClass}>Subtitle</label>
                    <input id="subtitle" type="text" value={data.subtitle} onChange={(e) => setData('subtitle', e.target.value)} placeholder="Keep your valuables safe" className={inputClass} />
                    {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle}</p>}
                </div>
                <div className="space-y-2">
                    <label htmlFor="hero_text" className={labelClass}>Hero Description</label>
                    <textarea id="hero_text" value={data.hero_text} onChange={(e) => setData('hero_text', e.target.value)} placeholder="Describe the product benefits for the hero section..." rows={3} className={inputClass} />
                    {errors.hero_text && <p className="text-sm text-destructive">{errors.hero_text}</p>}
                </div>
                <div className="space-y-2">
                    <label htmlFor="hero_video" className={labelClass}>Hero YouTube Video URL <span className="text-xs text-muted-foreground">(optional — shows play button on hero image)</span></label>
                    <input id="hero_video" type="text" value={data.hero_video} onChange={(e) => setData('hero_video', e.target.value)} placeholder="https://youtube.com/watch?v=... or https://youtu.be/..." className={inputClass} />
                    {errors.hero_video && <p className="text-sm text-destructive">{errors.hero_video}</p>}
                </div>

                {/* Hero Images */}
                <div className="space-y-3">
                    <label className={labelClass}>Hero Images <span className="text-xs text-muted-foreground">(replaces product images in the hero section)</span></label>

                    {/* Existing images */}
                    {(data.existing_hero_images as string[]).length > 0 && (
                        <div>
                            <p className="mb-2 text-xs text-muted-foreground">Saved images</p>
                            <div className="flex flex-wrap gap-2">
                                {(data.existing_hero_images as string[]).map((path) => (
                                    <div key={path} className="relative group h-20 w-20 overflow-hidden rounded-lg border border-input">
                                        <img src={`/${path}`} alt="Hero" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingHeroImage(path)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-5 w-5 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New image previews */}
                    {heroImagePreviews.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs text-muted-foreground">New uploads (not saved yet)</p>
                            <div className="flex flex-wrap gap-2">
                                {heroImagePreviews.map((preview, i) => (
                                    <div key={i} className="relative group h-20 w-20 overflow-hidden rounded-lg border border-primary">
                                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewHeroImage(i)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-5 w-5 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <input
                            ref={heroImageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleHeroImageChange}
                        />
                        {(() => {
                            const totalCount = (data.existing_hero_images as string[]).length + (data.hero_images as File[]).length;
                            const atLimit = totalCount >= 10;
                            return (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => !atLimit && heroImageInputRef.current?.click()}
                                        disabled={atLimit}
                                        className={`flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm transition-colors ${
                                            atLimit ? 'cursor-not-allowed border-input text-muted-foreground/50' : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
                                        }`}
                                    >
                                        <Upload className="h-4 w-4" />
                                        {atLimit ? 'Maximum 10 images reached' : 'Upload Hero Images'}
                                    </button>
                                    {errors.hero_images && <p className="mt-1 text-sm text-destructive">{errors.hero_images}</p>}
                                    <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, GIF, WebP — max 2MB each, up to 10 images total.</p>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Hero Delivery Badge */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label htmlFor="hero_delivery_badge_text" className={labelClass}>Delivery Badge Text</label>
                        <input id="hero_delivery_badge_text" type="text" value={data.delivery_badge_text} onChange={(e) => setData('delivery_badge_text', e.target.value)} className={inputClass} placeholder="Free Shipping" />
                    </div>
                    <div className="space-y-2">
                        <label className={labelClass}>Delivery Badge Icon</label>
                        <IconPicker value={data.delivery_badge_icon} onChange={(val) => setData('delivery_badge_icon', val)} />
                    </div>
                </div>
            </Section>

            {/* ── Mid-Page Order Button ── */}
            <Section title="Mid-Page Order Button">
                <p className="text-xs text-muted-foreground mb-3">Adds an "Order Now" button and checklist section after the price banner.</p>
                <div className="space-y-2">
                    <label htmlFor="mid_order_button_text" className={labelClass}>Button Text</label>
                    <input id="mid_order_button_text" type="text" value={data.mid_order_button_text} onChange={(e) => setData('mid_order_button_text', e.target.value)} className={inputClass} placeholder="Order Now" />
                </div>
                <div className="space-y-2">
                    <label className={labelClass}>Button Icon</label>
                    <IconPicker value={data.mid_order_button_icon} onChange={(val) => setData('mid_order_button_icon', val)} />
                </div>
            </Section>

            {/* ── Benefits Checklist ── */}
            <Section title="Benefits Checklist">
                <div className="space-y-2">
                    <label htmlFor="benefits_title" className={labelClass}>Section Title</label>
                    <input id="benefits_title" type="text" value={data.benefits_title} onChange={(e) => setData('benefits_title', e.target.value)} className={inputClass} placeholder="Why Buy This Package?" />
                </div>
                <div className="space-y-2">
                    <label className={labelClass}>Benefit Items (one per line)</label>
                    <textarea
                        value={(data.benefits_items || []).join('\n')}
                        onChange={(e) => setData('benefits_items', e.target.value.split('\n').filter((s: string) => s.trim()))}
                        rows={6}
                        className={inputClass}
                        placeholder="Everything included in one package&#10;Premium quality materials&#10;Great value"
                    />
                    <p className="text-xs text-muted-foreground">Enter each benefit on a new line.</p>
                </div>
            </Section>

            {/* ── Price Banner ── */}
            <Section title="Price Banner">
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">Displays a pricing banner after the hero section. Leave all fields empty to hide it.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className={labelClass}>Original Price Label</label>
                                <input type="text" value={data.price_banner_original_label} onChange={(e) => setData('price_banner_original_label', e.target.value)} className={inputClass} placeholder="Regular Price" />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Original Price</label>
                                <input type="text" value={data.price_banner_original_price} onChange={(e) => setData('price_banner_original_price', e.target.value)} className={inputClass} placeholder="2,500" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className={labelClass}>Current Price Label</label>
                                <input type="text" value={data.price_banner_current_label} onChange={(e) => setData('price_banner_current_label', e.target.value)} className={inputClass} placeholder="Current Offer Price" />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Current Price</label>
                                <input type="text" value={data.price_banner_current_price} onChange={(e) => setData('price_banner_current_price', e.target.value)} className={inputClass} placeholder="1,500" />
                            </div>
                        </div>
                    </div>
            </Section>

            {/* ── Review Images ── */}
            <Section title="Review / Customer Images">
                <div className="space-y-2">
                    <label htmlFor="review_images_title" className={labelClass}>Section Title</label>
                    <input id="review_images_title" type="text" value={data.review_images_title} onChange={(e) => setData('review_images_title', e.target.value)} className={inputClass} placeholder="Customer Reviews" />
                    {errors.review_images_title && <p className="text-sm text-destructive">{errors.review_images_title}</p>}
                </div>
                <div className="space-y-3">
                    <label className={labelClass}>Upload review screenshots or customer feedback images</label>

                    {/* Existing images */}
                    {(data.existing_review_images as string[]).length > 0 && (
                        <div>
                            <p className="mb-2 text-xs text-muted-foreground">Saved images</p>
                            <div className="flex flex-wrap gap-2">
                                {(data.existing_review_images as string[]).map((path) => (
                                    <div key={path} className="relative group h-20 w-20 overflow-hidden rounded-lg border border-input">
                                        <img src={`/${path}`} alt="Review" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingReviewImage(path)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-5 w-5 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New image previews */}
                    {reviewImagePreviews.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs text-muted-foreground">New uploads (not saved yet)</p>
                            <div className="flex flex-wrap gap-2">
                                {reviewImagePreviews.map((preview, i) => (
                                    <div key={i} className="relative group h-20 w-20 overflow-hidden rounded-lg border border-primary">
                                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewReviewImage(i)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-5 w-5 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <input
                            ref={reviewImageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleReviewImageChange}
                        />
                        {(() => {
                            const totalCount = (data.existing_review_images as string[]).length + (data.review_images as File[]).length;
                            const atLimit = totalCount >= 10;
                            return (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => !atLimit && reviewImageInputRef.current?.click()}
                                        disabled={atLimit}
                                        className={`flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm transition-colors ${
                                            atLimit ? 'cursor-not-allowed border-input text-muted-foreground/50' : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
                                        }`}
                                    >
                                        <Upload className="h-4 w-4" />
                                        {atLimit ? 'Maximum 10 images reached' : 'Upload Review Images'}
                                    </button>
                                    {errors.review_images && <p className="mt-1 text-sm text-destructive">{errors.review_images}</p>}
                                    <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, GIF, WebP — max 2MB each, up to 10 images total.</p>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </Section>

            {/* ── Checkout Banner ── */}
            <Section title="Checkout Banner">
                <div className="space-y-2">
                    <label htmlFor="checkout_banner_text" className={labelClass}>Checkout Banner Text</label>
                    <input id="checkout_banner_text" type="text" value={data.checkout_banner_text} onChange={(e) => setData('checkout_banner_text', e.target.value)} className={inputClass} />
                    {errors.checkout_banner_text && <p className="text-sm text-destructive">{errors.checkout_banner_text}</p>}
                </div>
                <div className="space-y-2">
                    <label htmlFor="checkout_title" className={labelClass}>Checkout Section Title</label>
                    <input id="checkout_title" type="text" value={data.checkout_title} onChange={(e) => setData('checkout_title', e.target.value)} className={inputClass} placeholder="Order Now" />
                    {errors.checkout_title && <p className="text-sm text-destructive">{errors.checkout_title}</p>}
                </div>
                <div className="space-y-2">
                    <label htmlFor="order_now_text" className={labelClass}>"Order Now" Button Text</label>
                    <input id="order_now_text" type="text" value={data.order_now_text} onChange={(e) => setData('order_now_text', e.target.value)} className={inputClass} placeholder="Order Now" />
                    {errors.order_now_text && <p className="text-sm text-destructive">{errors.order_now_text}</p>}
                </div>
            </Section>
        </div>
    );
}
