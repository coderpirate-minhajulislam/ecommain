import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'text-sm font-medium';

export default function CreateBanner() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        subtitle: '',
        button_text: '',
        button_link: '',
        sort_order: '0',
        is_active: true as boolean,
        position: 'hero' as string,
        popup_timer: '5' as string,
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

    function removeImage() {
        setData('image', null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/banners');
    }

    return (
        <>
            <Head title="Add Banner" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/banners" className="inline-flex items-center rounded-md p-1.5 hover:bg-accent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Add Banner</h2>
                        <p className="text-muted-foreground">Create a new homepage hero banner.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className={labelClass}>Banner Image <span className="text-destructive">*</span></label>
                        {preview ? (
                            <div className="relative w-full">
                                <img src={preview} alt="Preview" className="h-48 w-full rounded-lg object-cover" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input hover:border-primary/50 hover:bg-muted/30"
                            >
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload banner image</span>
                                <span className="text-xs text-muted-foreground">JPEG, PNG, WebP — max 4 MB</span>
                            </button>
                        )}
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
                                <option value="popup">Popup (Modal)</option>
                            </select>
                            {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="popup_timer" className={labelClass}>Popup Timer (seconds)</label>
                            <input id="popup_timer" type="number" min="1" max="60" value={data.popup_timer} onChange={(e) => setData('popup_timer', e.target.value)} className={inputClass} />
                           
                            {errors.popup_timer && <p className="text-sm text-destructive">{errors.popup_timer}</p>}
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
                            {processing ? 'Saving...' : 'Create Banner'}
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
