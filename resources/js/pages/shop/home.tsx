import { Head, usePage } from '@inertiajs/react';
import { HomeLayout2 } from '@/components/ecommerce/home-layout-2';
import { HomeLayout3 } from '@/components/ecommerce/home-layout-3';
import {
    CategoryGrid,
    DealsSection,
    FeaturedProducts,
    HeroBanner,
    MidBanner,
    TrustBadges,
    OfferProducts,
    NewArrivalProducts,
} from '@/components/ecommerce/home-sections';
import { ShopLayout } from '@/components/ecommerce/shop-layout';

type SeoProps = {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    seoOgImage?: string;
    homeLayout?: string;
};

export default function ShopHome() {
    const { seoTitle, seoDescription, seoKeywords, seoOgImage, homeLayout } = usePage<SeoProps>().props;

    return (
        <ShopLayout>
            <Head title={seoTitle || ''}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
                {seoDescription && <meta name="description" content={seoDescription} head-key="description" />}
                {seoKeywords && <meta name="keywords" content={seoKeywords} head-key="keywords" />}
                {seoTitle && <meta property="og:title" content={seoTitle} head-key="og:title" />}
                {seoDescription && <meta property="og:description" content={seoDescription} head-key="og:description" />}
                {seoOgImage && <meta property="og:image" content={seoOgImage} head-key="og:image" />}
                <meta name="twitter:card" content="summary_large_image" head-key="twitter:card" />
                {seoTitle && <meta name="twitter:title" content={seoTitle} head-key="twitter:title" />}
                {seoDescription && <meta name="twitter:description" content={seoDescription} head-key="twitter:description" />}
                {seoOgImage && <meta name="twitter:image" content={seoOgImage} head-key="twitter:image" />}
            </Head>

            {homeLayout === '3' ? (
                <HomeLayout3 />
            ) : homeLayout === '2' ? (
                <HomeLayout2 />
            ) : (
                <>
                    <HeroBanner />
                    <CategoryGrid />
                    <OfferProducts />
                    <FeaturedProducts />
                    <MidBanner />
                    <NewArrivalProducts />
                    <DealsSection />
                    <TrustBadges />
                </>
            )}
        </ShopLayout>
    );
}
