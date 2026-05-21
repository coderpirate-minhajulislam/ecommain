import { Head, Link, usePage } from '@inertiajs/react';
import { ShopLayout } from '@/components/ecommerce/shop-layout';

type Props = {
    page: { title: string; slug: string; content: string | null };
};

export default function PageShow() {
    const { page } = usePage<Props>().props;

    return (
        <>
            <Head title={page.title} />
            <ShopLayout>
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    <span>/</span>
                    <span className="text-foreground">{page.title}</span>
                </div>

                <div className="mx-auto max-w-3xl">
                    <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>

                    {page.content ? (
                        <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: page.content }}
                        />
                    ) : (
                        <p className="text-muted-foreground">This page has no content yet.</p>
                    )}
                </div>
            </ShopLayout>
        </>
    );
}
