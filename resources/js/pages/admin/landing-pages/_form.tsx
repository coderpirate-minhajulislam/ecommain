import { ChevronDown, Plus, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { IconPicker } from '@/components/icon-picker';

type ProductOption = { id: number; name: string };

type UseCase = { label: string; icon_name?: string };
type Feature = { title: string; desc: string; icon_name?: string };
type Specification = { title: string; specs: string[]; icon_name?: string };
type WhyBuy = { title: string; desc: string; icon_name?: string };

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
    use_cases_title: string;
    use_cases_subtitle: string;
    use_cases: UseCase[];
    features_title: string;
    features_subtitle: string;
    features: Feature[];
    specifications_title: string;
    specifications_subtitle: string;
    authentic_badge_text: string;
    authentic_badge_icon: string;
    delivery_badge_text: string;
    delivery_badge_icon: string;
    specifications: Specification[];
    why_buy_title: string;
    why_buy_super_text: string;
    why_buy_subtitle: string;
    why_buy: WhyBuy[];
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
    use_cases_title: 'What Is This Product Used For?',
    use_cases_subtitle: 'Discover the many ways this product makes your life easier',
    use_cases: [
        { label: 'Track Your Keys', icon_name: 'package' },
        { label: 'Find Your Bags', icon_name: 'box' },
        { label: 'Secure Valuables', icon_name: 'shield' },
        { label: 'Remote Tracking', icon_name: 'zap' },
        { label: 'Ring to Find', icon_name: 'zap' },
        { label: 'Wide Range', icon_name: 'wifi' },
        { label: 'Long Battery Life', icon_name: 'battery' },
        { label: 'Easy Connection', icon_name: 'gift' },
    ],
    features_title: 'Amazing Features That Keep You Worry-Free',
    features_subtitle: 'Engineered with cutting-edge technology for your peace of mind',
    features: [
        { title: 'Bluetooth 5.1', desc: 'Latest Bluetooth technology for fast, stable connections', icon_name: 'zap' },
        { title: 'Long Battery', desc: 'Up to 12 months battery life on a single charge', icon_name: 'battery' },
        { title: 'Loud Speaker', desc: 'Built-in speaker rings loud so you can find things fast', icon_name: 'gift' },
        { title: 'Instant Alerts', desc: 'Get notified immediately when you leave something behind', icon_name: 'zap' },
        { title: 'Privacy First', desc: 'Encrypted communications keep your data fully secure', icon_name: 'shield' },
        { title: 'Smart Chip', desc: 'Advanced processor for accurate real-time tracking', icon_name: 'award' },
        { title: 'Replaceable Battery', desc: 'Easy to replace standard battery — no charging needed', icon_name: 'box' },
        { title: '24/7 Support', desc: 'Our support team is always ready to help you', icon_name: 'heart' },
    ],
    specifications_title: 'Detailed Specifications',
    specifications_subtitle: 'Everything you need to know about this product',
    authentic_badge_text: '100% Authentic Product',
    authentic_badge_icon: 'shield-check',
    delivery_badge_text: 'Free Shipping',
    delivery_badge_icon: 'truck',
    specifications: [
        { title: 'Connectivity', specs: ['Bluetooth 5.1', 'Compatible with iOS & Android', 'Range up to 100ft'], icon_name: 'wifi' },
        { title: 'Battery', specs: ['CR2032 Coin Cell', 'Up to 12 months', 'Easy replacement'], icon_name: 'battery' },
        { title: 'Security', specs: ['End-to-end encryption', 'Anti-stalking feature', 'Privacy certified'], icon_name: 'shield' },
        { title: 'Dimensions', specs: ['Compact & lightweight', 'Water-resistant design', 'Durable materials'], icon_name: 'box' },
        { title: 'Performance', specs: ['Ultra-low latency', 'Location accuracy', 'Real-time updates'], icon_name: 'zap' },
        { title: 'Warranty', specs: ['1 year guarantee', 'Free replacements', '30-day returns'], icon_name: 'award' },
    ],
    why_buy_title: 'Why Buy From Us?',
    why_buy_super_text: 'Customers love our store',
    why_buy_subtitle: 'We\'re committed to your satisfaction every step of the way',
    why_buy: [
        { title: '1 Year Warranty', desc: 'Full product warranty', icon_name: 'award' },
        { title: '7-Day Returns', desc: 'Easy return policy', icon_name: 'check-circle' },
        { title: 'Fast Delivery', desc: 'Nationwide shipping', icon_name: 'truck' },
        { title: '100% Genuine', desc: 'Authentic products only', icon_name: 'star' },
    ],
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
    function updateArrayItem<T>(field: string, index: number, key: keyof T, value: string) {
        const arr = [...(data[field as keyof LandingPageFormData] as T[])];
        arr[index] = { ...arr[index], [key]: value };
        setData(field, arr);
    }

    function addArrayItem<T>(field: string, template: T) {
        const arr = [...(data[field as keyof LandingPageFormData] as T[]), template];
        setData(field, arr);
    }

    function removeArrayItem<T>(field: string, index: number) {
        const arr = [...(data[field as keyof LandingPageFormData] as T[])];
        arr.splice(index, 1);
        setData(field, arr);
    }

    function updateSpecItem(specIndex: number, itemIndex: number, value: string) {
        const specs = [...data.specifications];
        const updated = { ...specs[specIndex], specs: [...specs[specIndex].specs] };
        updated.specs[itemIndex] = value;
        specs[specIndex] = updated;
        setData('specifications', specs);
    }

    function addSpecItem(specIndex: number) {
        const specs = [...data.specifications];
        specs[specIndex] = { ...specs[specIndex], specs: [...specs[specIndex].specs, ''] };
        setData('specifications', specs);
    }

    function removeSpecItem(specIndex: number, itemIndex: number) {
        const specs = [...data.specifications];
        const updatedSpecs = [...specs[specIndex].specs];
        updatedSpecs.splice(itemIndex, 1);
        specs[specIndex] = { ...specs[specIndex], specs: updatedSpecs };
        setData('specifications', specs);
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
                        <option value="v2">V2 — Light (Image-Rich)</option>
                        <option value="v3">V3 — Modern (Split Hero + Grid)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                        V2 — light background, large images, feature showcase, two-column layout and review sections.
                        V3 — modern split hero (text left, image carousel right), auto-sliding images, icon grid use-cases, feature cards, sticky mobile order bar and floating support buttons.
                    </p>
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

            {/* ── Use Cases ── */}
            <Section title="Use Cases Section">
                <div className="space-y-2">
                    <label htmlFor="use_cases_title" className={labelClass}>Section Title</label>
                    <input id="use_cases_title" type="text" value={data.use_cases_title} onChange={(e) => setData('use_cases_title', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="use_cases_subtitle" className={labelClass}>Section Subtitle</label>
                    <input id="use_cases_subtitle" type="text" value={data.use_cases_subtitle} onChange={(e) => setData('use_cases_subtitle', e.target.value)} className={inputClass} placeholder="Discover the many ways this product makes your life easier" />
                </div>
                <div className="space-y-2">
                    <label className={labelClass}>Items</label>
                    <div className="space-y-3">
                        {data.use_cases.map((item, i) => (
                            <div key={i} className="flex flex-col gap-2 rounded-lg border border-input p-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}</span>
                                    <textarea rows={2} value={item.label} onChange={(e) => updateArrayItem<UseCase>('use_cases', i, 'label', e.target.value)} className={inputClass} placeholder="Use case label" />
                                    <button type="button" onClick={() => removeArrayItem<UseCase>('use_cases', i)} className="p-1.5 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div>
                                    <label className={labelClass + ' block mb-2'}>Icon</label>
                                    <IconPicker
                                        value={item.icon_name}
                                        onChange={(val) => updateArrayItem<UseCase>('use_cases', i, 'icon_name', val)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => addArrayItem<UseCase>('use_cases', { label: '', icon_name: 'package' })} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <Plus className="h-3.5 w-3.5" /> Add Use Case
                    </button>
                </div>
            </Section>

            {/* ── Features ── */}
            <Section title="Features Section">
                <div className="space-y-2">
                    <label htmlFor="features_title" className={labelClass}>Section Title</label>
                    <input id="features_title" type="text" value={data.features_title} onChange={(e) => setData('features_title', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="features_subtitle" className={labelClass}>Section Subtitle</label>
                    <input id="features_subtitle" type="text" value={data.features_subtitle} onChange={(e) => setData('features_subtitle', e.target.value)} className={inputClass} placeholder="Engineered with cutting-edge technology for your peace of mind" />
                </div>
                <div className="space-y-3">
                    <label className={labelClass}>Feature Cards</label>
                    {data.features.map((item, i) => (
                        <div key={i} className="flex flex-col gap-2 rounded-lg border border-input p-3">
                            <div className="flex items-start gap-2">
                                <span className="mt-2 w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                                <div className="flex-1 space-y-2">
                                    <input type="text" value={item.title} onChange={(e) => updateArrayItem<Feature>('features', i, 'title', e.target.value)} className={inputClass} placeholder="Feature title" />
                                    <textarea rows={2} value={item.desc} onChange={(e) => updateArrayItem<Feature>('features', i, 'desc', e.target.value)} className={inputClass} placeholder="Feature description" />
                                    <div>
                                        <label className={labelClass + ' block mb-2'}>Icon</label>
                                        <IconPicker
                                            value={item.icon_name}
                                            onChange={(val) => updateArrayItem<Feature>('features', i, 'icon_name', val)}
                                        />
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeArrayItem<Feature>('features', i)} className="mt-2 p-1.5 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem<Feature>('features', { title: '', desc: '', icon_name: 'zap' })} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <Plus className="h-3.5 w-3.5" /> Add Feature
                    </button>
                </div>
            </Section>

            {/* ── Specifications ── */}
            <Section title="Specifications Section">
                <div className="space-y-2">
                    <label htmlFor="specifications_title" className={labelClass}>Section Title</label>
                    <input id="specifications_title" type="text" value={data.specifications_title} onChange={(e) => setData('specifications_title', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="specifications_subtitle" className={labelClass}>Section Subtitle</label>
                    <input id="specifications_subtitle" type="text" value={data.specifications_subtitle} onChange={(e) => setData('specifications_subtitle', e.target.value)} className={inputClass} placeholder="Everything you need to know about this product" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label htmlFor="authentic_badge_text" className={labelClass}>Authentic Badge Text</label>
                        <input id="authentic_badge_text" type="text" value={data.authentic_badge_text} onChange={(e) => setData('authentic_badge_text', e.target.value)} className={inputClass} placeholder="100% Authentic Product" />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="delivery_badge_text" className={labelClass}>Delivery Badge Text</label>
                        <input id="delivery_badge_text" type="text" value={data.delivery_badge_text} onChange={(e) => setData('delivery_badge_text', e.target.value)} className={inputClass} placeholder="Free Shipping" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className={labelClass}>Authentic Badge Icon</label>
                        <IconPicker value={data.authentic_badge_icon} onChange={(val) => setData('authentic_badge_icon', val)} />
                    </div>
                    <div className="space-y-2">
                        <label className={labelClass}>Delivery Badge Icon</label>
                        <IconPicker value={data.delivery_badge_icon} onChange={(val) => setData('delivery_badge_icon', val)} />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className={labelClass}>Specification Groups</label>
                    {data.specifications.map((group, gi) => (
                        <div key={gi} className="rounded-lg border border-input p-3 space-y-3">
                            <div className="flex items-start gap-2">
                                <div className="flex-1">
                                    <input type="text" value={group.title} onChange={(e) => updateArrayItem<Specification>('specifications', gi, 'title', e.target.value)} className={inputClass} placeholder="Group title (e.g. Connectivity)" />
                                </div>
                                <button type="button" onClick={() => removeArrayItem<Specification>('specifications', gi)} className="p-1.5 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div>
                                <label className={labelClass + ' block mb-2'}>Icon</label>
                                <IconPicker
                                    value={group.icon_name}
                                    onChange={(val) => updateArrayItem<Specification>('specifications', gi, 'icon_name', val)}
                                />
                            </div>
                            <div className="ml-4 space-y-1.5">
                                {group.specs.map((spec, si) => (
                                    <div key={si} className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        <textarea rows={2} value={spec} onChange={(e) => updateSpecItem(gi, si, e.target.value)} className={inputClass} placeholder="Spec detail" />
                                        <button type="button" onClick={() => removeSpecItem(gi, si)} className="p-1 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addSpecItem(gi)} className="ml-3.5 flex items-center gap-1 text-xs text-primary hover:underline">
                                    <Plus className="h-3 w-3" /> Add Spec
                                </button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem<Specification>('specifications', { title: '', specs: [''], icon_name: 'package' })} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <Plus className="h-3.5 w-3.5" /> Add Specification Group
                    </button>
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
                    <label className={labelClass}>Upload review screenshots or customer feedback images <span className="text-xs text-muted-foreground">(gallery shown below specifications on V2)</span></label>

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

            {/* ── Why Buy From Us ── */}
            <Section title="Why Buy From Us Section">
                <div className="space-y-2">
                    <label htmlFor="why_buy_title" className={labelClass}>Section Title</label>
                    <input id="why_buy_title" type="text" value={data.why_buy_title} onChange={(e) => setData('why_buy_title', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="why_buy_super_text" className={labelClass}>Pre-heading Text</label>
                    <input id="why_buy_super_text" type="text" value={data.why_buy_super_text} onChange={(e) => setData('why_buy_super_text', e.target.value)} className={inputClass} placeholder="Customers love our store" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="why_buy_subtitle" className={labelClass}>Section Subtitle</label>
                    <input id="why_buy_subtitle" type="text" value={data.why_buy_subtitle} onChange={(e) => setData('why_buy_subtitle', e.target.value)} className={inputClass} placeholder="We're committed to your satisfaction every step of the way" />
                </div>
                <div className="space-y-3">
                    <label className={labelClass}>Trust Items</label>
                    {data.why_buy.map((item, i) => (
                        <div key={i} className="flex flex-col gap-2 rounded-lg border border-input p-3">
                            <div className="flex items-start gap-2">
                                <span className="mt-2 w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                                <div className="flex-1 space-y-2">
                                    <input type="text" value={item.title} onChange={(e) => updateArrayItem<WhyBuy>('why_buy', i, 'title', e.target.value)} className={inputClass} placeholder="Title (e.g. 1 Year Warranty)" />
                                    <textarea rows={2} value={item.desc} onChange={(e) => updateArrayItem<WhyBuy>('why_buy', i, 'desc', e.target.value)} className={inputClass} placeholder="Description" />
                                </div>
                                <button type="button" onClick={() => removeArrayItem<WhyBuy>('why_buy', i)} className="mt-2 p-1.5 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div>
                                <label className={labelClass + ' block mb-2'}>Icon</label>
                                <IconPicker
                                    value={item.icon_name}
                                    onChange={(val) => updateArrayItem<WhyBuy>('why_buy', i, 'icon_name', val)}
                                />
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem<WhyBuy>('why_buy', { title: '', desc: '', icon_name: 'heart' })} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <Plus className="h-3.5 w-3.5" /> Add Trust Item
                    </button>
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
