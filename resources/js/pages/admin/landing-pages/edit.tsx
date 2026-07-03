import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { LandingPageForm, defaultFormData } from './_form';
import type { LandingPageFormData } from './_form';

type ProductOption = { id: number; name: string };
type LandingPageRecord = {
    id: number;
    product_id: number;
    extra_product_ids: number[] | null;
    hero_images: string[] | null;
    title: string;
    slug: string;
    subtitle: string | null;
    hero_text: string | null;
    badge_text: string | null;
    icon_name: string | null;
    authentic_badge_text: string | null;
    authentic_badge_icon: string | null;
    delivery_badge_text: string | null;
    delivery_badge_icon: string | null;
    price_banner_original_label: string | null;
    price_banner_original_price: string | null;
    price_banner_current_label: string | null;
    price_banner_current_price: string | null;
    mid_order_button_text: string | null;
    mid_order_button_icon: string | null;
    benefits_sections: { title: string; items: string[] }[] | null;
    checkout_banner_text: string | null;
    checkout_title: string | null;
    review_images_title: string | null;
    order_now_text: string | null;
    footer_text: string | null;
    is_active: boolean;
    free_shipping_enabled: boolean | null;
    free_shipping_amount: number | null;
    countdown_enabled: boolean;
    countdown_end_time: string | null;
    hero_video: string | null;
    review_images: string[] | null;
    template: string;
};
type Props = { landingPage: LandingPageRecord; products: ProductOption[] };

export default function EditLandingPage() {
    const { landingPage, products } = usePage<Props>().props;
    const { data, setData, put, processing, errors } = useForm<LandingPageFormData>({
        product_id: String(landingPage.product_id),
        extra_product_ids: landingPage.extra_product_ids || [],
        title: landingPage.title,
        slug: landingPage.slug,
        subtitle: landingPage.subtitle || '',
        hero_text: landingPage.hero_text || '',
        hero_images: [],
        existing_hero_images: landingPage.hero_images || [],
        badge_text: landingPage.badge_text || defaultFormData.badge_text,
        icon_name: landingPage.icon_name || defaultFormData.icon_name,
        price_banner_original_label: landingPage.price_banner_original_label || '',
        price_banner_original_price: landingPage.price_banner_original_price || '',
        price_banner_current_label: landingPage.price_banner_current_label || '',
        price_banner_current_price: landingPage.price_banner_current_price || '',
        mid_order_button_text: landingPage.mid_order_button_text || '',
        mid_order_button_icon: landingPage.mid_order_button_icon || '',
        benefits_sections: landingPage.benefits_sections || [],
        authentic_badge_text: landingPage.authentic_badge_text || defaultFormData.authentic_badge_text,
        authentic_badge_icon: landingPage.authentic_badge_icon || defaultFormData.authentic_badge_icon,
        delivery_badge_text: landingPage.delivery_badge_text || defaultFormData.delivery_badge_text,
        delivery_badge_icon: landingPage.delivery_badge_icon || defaultFormData.delivery_badge_icon,
        checkout_banner_text: landingPage.checkout_banner_text || defaultFormData.checkout_banner_text,
        checkout_title: landingPage.checkout_title || defaultFormData.checkout_title,
        review_images_title: landingPage.review_images_title || defaultFormData.review_images_title,
        order_now_text: landingPage.order_now_text || defaultFormData.order_now_text,
        footer_text: landingPage.footer_text || defaultFormData.footer_text,
        is_active: landingPage.is_active,
        free_shipping_enabled: landingPage.free_shipping_enabled ?? null,
        free_shipping_amount: landingPage.free_shipping_amount ?? null,
        countdown_enabled: landingPage.countdown_enabled,
        countdown_end_time: landingPage.countdown_end_time ? new Date(landingPage.countdown_end_time).toISOString().slice(0, 16) : '',
        hero_video: landingPage.hero_video || '',
        review_images: [],
        existing_review_images: landingPage.review_images || [],
        template: landingPage.template || 'v1',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/landing-pages/${landingPage.id}`);
    }

    return (
        <>
            <Head title={`Edit — ${landingPage.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/landing-pages" className="inline-flex items-center rounded-md p-1.5 hover:bg-accent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Landing Page</h2>
                        <p className="text-muted-foreground">Update all content for {landingPage.title}.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <LandingPageForm
                        data={data}
                        setData={setData as (key: string, value: unknown) => void}
                        errors={errors}
                        products={products}
                    />

                    <div className="mt-6 flex max-w-3xl gap-3">
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            {processing ? 'Saving...' : 'Save Changes'}
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

EditLandingPage.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Landing Pages', href: '/admin/landing-pages' },
        { title: 'Edit', href: '#' },
    ],
};
