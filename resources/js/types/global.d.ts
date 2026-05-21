import type { Auth } from '@/types/auth';

export type Banner = {
    id: number;
    title: string | null;
    subtitle: string | null;
    button_text: string | null;
    button_link: string | null;
    image_path: string;
    sort_order: number;
    is_active: boolean;
    position: 'hero' | 'mid';
};

export type SharedCategory = {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    image_path: string | null;
    products_count?: number;
    sub_categories?: SharedSubCategory[];
};

export type ProductImage = {
    id: number;
    product_id: number;
    image_path: string;
    sort_order: number;
};

export type ProductVariant = {
    id: number;
    product_id: number;
    size: string | null;
    color: string | null;
    price: string;
    original_price: string | null;
    in_stock: boolean;
    free_shipping: boolean | null;
    shipping_zones: { zone: string; charge: number }[] | null;
    image_path: string | null;
};

export type SharedSubCategory = {
    id: number;
    name: string;
    slug: string;
};

export type Product = {
    id: number;
    slug: string;
    category_id: number;
    sub_category_id: number | null;
    extra_category_ids: number[] | null;
    extra_sub_category_ids: number[] | null;
    name: string;
    description: string | null;
    short_description: string | null;
    long_description: string | null;
    price: string;
    original_price: string | null;
    offer_timer: string | null;
    is_featured: boolean;
    is_new_arrival: boolean;
    in_stock: boolean;
    free_shipping: boolean;
    shipping_zones: { zone: string; charge: number }[] | null;
    allowed_payment_methods: string[] | null;
    size_label: string | null;
    color_label: string | null;
    youtube_video: string | null;
    created_at: string;
    updated_at: string;
    images?: ProductImage[];
    variants?: ProductVariant[];
    category?: SharedCategory;
    sub_category?: SharedSubCategory | null;
};

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            gtmId: string;
            gtmSsUrl: string;
            metaPixelId: string;
            flash: {
                success: string | null;
                error: string | null;
            };
            [key: string]: unknown;
        };
    }
}
