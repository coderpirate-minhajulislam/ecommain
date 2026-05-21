import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEvent } from 'react';

type Page = {
    id: number;
    title: string;
    slug: string;
    content: string | null;
    is_active: boolean;
};

type Props = { page: Page };

export default function PageEdit() {
    const { page } = usePage<Props>().props;

    const { data, setData, put, processing, errors } = useForm({
        title: page.title,
        content: page.content || '',
        is_active: page.is_active,
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        put(`/admin/pages/${page.id}`);
    }

    return (
        <>
            <Head title={`Edit: ${page.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/pages" className="rounded-md p-1 hover:bg-muted">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold">Edit: {page.title}</h1>
                </div>

                <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl space-y-6">
                    {/* Title */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
                    </div>

                    {/* Slug (read-only) */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Slug</label>
                        <input
                            type="text"
                            value={page.slug}
                            disabled
                            className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Content (HTML supported)</label>
                        <textarea
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            rows={20}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {errors.content && <p className="mt-1 text-xs text-destructive">{errors.content}</p>}
                    </div>

                    {/* Active */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium">Active</label>
                    </div>

                    {/* Preview */}
                    {data.content && (
                        <div>
                            <label className="mb-1 block text-sm font-medium">Preview</label>
                            <div
                                className="prose dark:prose-invert max-w-none rounded-md border bg-background p-4 text-sm"
                                dangerouslySetInnerHTML={{ __html: data.content }}
                            />
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                        <Link
                            href="/admin/pages"
                            className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-muted"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
