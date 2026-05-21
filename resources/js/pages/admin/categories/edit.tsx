import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';

type Category = {
    id: number;
    name: string;
    icon: string | null;
    image_path: string | null;
};

type Props = {
    category: Category;
};

const iconOptions = [
    'ShoppingBag', 'ShoppingCart', 'Package', 'Tag', 'Shirt', 'Laptop',
    'Smartphone', 'Headphones', 'Watch', 'Camera', 'Gamepad2', 'Tv',
    'Car', 'Bike', 'Home', 'Sofa', 'UtensilsCrossed', 'Coffee',
    'Apple', 'Heart', 'Star', 'Gem', 'BookOpen', 'Music',
    'Palette', 'Scissors', 'Wrench', 'Dumbbell', 'Baby', 'Dog',
    'Cat', 'Flower2', 'Sun', 'Sparkles', 'Gift', 'Zap',
];

function IconPreview({ name }: { name: string }) {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
    return Icon ? <Icon className="h-5 w-5" /> : null;
}

export default function EditCategory() {
    const { category } = usePage<Props>().props;
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: category.name,
        icon: category.icon || '',
        image: null as File | null,
        remove_image: false,
    });
    const [iconSearch, setIconSearch] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(
        category.image_path ? '/' + category.image_path : null
    );
    const [isExistingImage, setIsExistingImage] = useState(!!category.image_path);

    const filteredIcons = iconOptions.filter((icon) =>
        icon.toLowerCase().includes(iconSearch.toLowerCase()),
    );

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('image', file);
        if (imagePreview && !isExistingImage) URL.revokeObjectURL(imagePreview);
        setIsExistingImage(false);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    }

    function removeImage() {
        if (imagePreview && !isExistingImage) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setIsExistingImage(false);
        setData('image', null);
        setData('remove_image', true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/admin/categories/${category.id}`, { forceFormData: true });
    }

    return (
        <>
            <Head title={`Edit ${category.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/categories"
                        className="inline-flex items-center rounded-md p-1.5 hover:bg-accent"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Category</h2>
                        <p className="text-muted-foreground">Update details for {category.name}.</p>
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
                        <label className="text-sm font-medium">Icon</label>
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
                                        data.icon === icon
                                            ? 'bg-primary/10 ring-2 ring-primary'
                                            : ''
                                    }`}
                                    title={icon}
                                >
                                    <IconPreview name={icon} />
                                </button>
                            ))}
                            {filteredIcons.length === 0 && (
                                <p className="col-span-6 py-2 text-center text-sm text-muted-foreground">
                                    No icons found.
                                </p>
                            )}
                        </div>
                        {errors.icon && <p className="text-sm text-destructive">{errors.icon}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category Image <span className="text-muted-foreground font-normal">(optional — shown instead of icon)</span></label>
                        <div className="flex items-center gap-3">
                            {imagePreview ? (
                                <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                                    <img src={imagePreview} className="h-full w-full object-cover" alt="" />
                                    <button type="button" onClick={removeImage} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input hover:border-primary/50 hover:bg-muted/30">
                                    <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">Upload</span>
                                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                            {imagePreview && (
                                <label className="cursor-pointer text-xs text-primary hover:underline">
                                    Change
                                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>
                        {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                        <Link
                            href="/admin/categories"
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

EditCategory.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Categories', href: '/admin/categories' },
        { title: 'Edit', href: '#' },
    ],
};
