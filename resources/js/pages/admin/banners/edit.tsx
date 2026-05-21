import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'text-sm font-medium';

type Banner = {
    id: number;
    title: string | null;
    subtitle: string | null;
    button_text: string | null;
    button_link: string | null;
    image_path: string;
    sort_order: number;
    is_active: boolean;
    position: string;
};

type Props = { banner: Banner };

export default function EditBanner() {
    const { banner } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        button_text: banner.button_text || '',
        button_link: banner.button_link || '',
        sort_order: String(banner.sort_order),
        is_active: banner.is_active,
        position: banner.position || 'hero',
        image: null as File | null,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('image', file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(null);
        }
    }

    function removeNewImage() {
        setData('image', null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/admin/banners/${banner.id}`);
    }

    return (
        <>
            <Head title="Edit Banner" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/banners" className="inline-flex items-center rounded-md p-1.5 hover:bg-accent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Banner</h2>
                        <p className="text-muted-foreground">Update banner content and image.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                    {/* Image */}
                    <div className="space-y-2">
                        <label className={labelClass}>Banner Image</label>
                        {/* Current or new preview */}
                        <div className="relative w-full">
                            <img
                                src={preview ?? `/${banner.image_path}`}
                                alt="Banner"
                                className="h-48 w-full rounded-lg object-cover"
                            />
                            {preview ? (
                                <button
                                    type="button"
                                    onClick={removeNewImage}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs text-white hover:bg-black/80"
                                >
                                    <Upload className="h-3.5 w-3.5" /> Replace
                                </button>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label htmlFor="title" className={labelClass}>Title <span className="text-xs text-muted-foreground">(optional)</span></label>
                        <input id="title" type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Summer Sale — Up to 50% Off" className={inputClass} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                    </div>

                    {/* Subtitle */}
                    <div className="space-y-2">
                        <label htmlFor="subtitle" className={labelClass}>Subtitle <span className="text-xs text-muted-foreground">(optional)</span></label>
                        <input id="subtitle" type="text" value={data.subtitle} onChange={(e) => setData('subtitle', e.target.value)} placeholder="Discover amazing deals across all categories." className={inputClass} />
                        {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle}</p>}
                    </div>

                    {/* Button */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="button_text" className={labelClass}>Button Text <span className="text-xs text-muted-foreground">(optional)</span></label>
                            <input id="button_text" type="text" value={data.button_text} onChange={(e) => setData('button_text', e.target.value)} placeholder="Shop Now" className={inputClass} />
                            {errors.button_text && <p className="text-sm text-destructive">{errors.button_text}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="button_link" className={labelClass}>Button Link <span className="text-xs text-muted-foreground">(optional)</span></label>
                            <input id="button_link" type="text" value={data.button_link} onChange={(e) => setData('button_link', e.target.value)} placeholder="/products" className={inputClass} />
                            {errors.button_link && <p className="text-sm text-destructive">{errors.button_link}</p>}
                        </div>
                    </div>

                    {/* Sort Order + Active */}
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <label htmlFor="sort_order" className={labelClass}>Sort Order</label>
                            <input id="sort_order" type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} className={inputClass} />
                            {errors.sort_order && <p className="text-sm text-destructive">{errors.sort_order}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="position" className={labelClass}>Position</label>
                            <select id="position" value={data.position} onChange={(e) => setData('position', e.target.value)} className={inputClass}>
                                <option value="hero">Hero (Top)</option>
                                <option value="mid">Mid (After Featured)</option>
                            </select>
                            {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
                        </div>
                        <div className="flex items-center gap-3 pb-2">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={data.is_active}
                                onClick={() => setData('is_active', !data.is_active)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.is_active ? 'bg-primary' : 'bg-input'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <label className={labelClass}>Active</label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            {processing ? 'Saving...' : 'Update Banner'}
                        </button>
                        <Link href="/admin/banners" className="rounded-lg border border-input px-5 py-2 text-sm font-medium hover:bg-accent">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
