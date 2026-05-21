import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { LandingPageForm, defaultFormData } from './_form';
import type { LandingPageFormData } from './_form';

type ProductOption = { id: number; name: string };
type Props = { products: ProductOption[] };

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function CreateLandingPage() {
    const { products } = usePage<Props>().props;
    const { data, setData, post, processing, errors } = useForm<LandingPageFormData>({ ...defaultFormData });
    const slugManuallyEdited = useRef(false);

    useEffect(() => {
        if (!slugManuallyEdited.current) {
            setData('slug', slugify(data.title));
        }
    }, [data.title, setData]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/landing-pages');
    }

    return (
        <>
            <Head title="Create Landing Page" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/landing-pages" className="inline-flex items-center rounded-md p-1.5 hover:bg-accent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Create Landing Page</h2>
                        <p className="text-muted-foreground">Set up a new product landing page with full content.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <LandingPageForm
                        data={data}
                        setData={setData as (key: string, value: unknown) => void}
                        errors={errors}
                        products={products}
                        onSlugChange={(val) => {
                            slugManuallyEdited.current = true;
                            setData('slug', val);
                        }}
                    />

                    <div className="mt-6 flex max-w-3xl gap-3">
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            {processing ? 'Creating...' : 'Create Landing Page'}
                        </button>
                        <Link href="/admin/landing-pages" className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateLandingPage.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Landing Pages', href: '/admin/landing-pages' },
        { title: 'Create', href: '/admin/landing-pages/create' },
    ],
};
