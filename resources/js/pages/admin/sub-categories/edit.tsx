import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

type Category = {
    id: number;
    name: string;
};

type SubCategory = {
    id: number;
    category_id: number;
    name: string;
};

type Props = {
    subCategory: SubCategory;
    categories: Category[];
};

export default function EditSubCategory() {
    const { subCategory, categories } = usePage<Props>().props;
    const { data, setData, put, processing, errors } = useForm({
        category_id: String(subCategory.category_id),
        name: subCategory.name,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/sub-categories/${subCategory.id}`);
    }

    return (
        <>
            <Head title={`Edit ${subCategory.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/sub-categories"
                        className="inline-flex items-center rounded-md p-1.5 hover:bg-accent"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Sub Category</h2>
                        <p className="text-muted-foreground">Update details for {subCategory.name}.</p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-lg space-y-6 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border"
                >
                    <div className="space-y-2">
                        <label htmlFor="category_id" className="text-sm font-medium">
                            Parent Category
                        </label>
                        <select
                            id="category_id"
                            value={data.category_id}
                            onChange={(e) => setData('category_id', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select a category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
                    </div>

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

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                        <Link
                            href="/admin/sub-categories"
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

EditSubCategory.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Sub Categories', href: '/admin/sub-categories' },
        { title: 'Edit', href: '#' },
    ],
};
