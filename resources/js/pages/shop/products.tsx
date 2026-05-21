import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useEffect } from 'react';
import { ProductCard } from '@/components/ecommerce/product-card';
import { ShopLayout } from '@/components/ecommerce/shop-layout';
import { Button } from '@/components/ui/button';
import { buildItem, gtmViewItemList, gtmSelectItem } from '@/lib/gtm';
import { pixelSearch, pixelViewCategory } from '@/lib/meta-pixel';
import { tiktokSearch } from '@/lib/tiktok-pixel';
import type { SharedCategory, Product } from '@/types/global';

type PaginatedProducts = {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};


export default function ShopProducts({
    search = '',
    sort = 'newest',
    categories,
    products,
    defaultCategorySlug = null,
    defaultSubCategorySlug = null,
    viewCategoryEventId = null,
    searchEventId = null,
}: {
    search?: string;
    sort?: string;
    categories: SharedCategory[];
    products: PaginatedProducts;
    defaultCategorySlug?: string | null;
    defaultSubCategorySlug?: string | null;
    viewCategoryEventId?: string | null;
    searchEventId?: string | null;
}) {
    const selectedCategorySlug = defaultCategorySlug ?? null;
    const selectedSubCategorySlug = defaultSubCategorySlug ?? null;

    const selectedCategoryObj = selectedCategorySlug
        ? categories.find((cat) => cat.slug === selectedCategorySlug) ?? null
        : null;

    function visitProducts(params: Record<string, string>) {
        router.get(
            '/products',
            { search, sort, ...params },
            {
                preserveState: true,
                preserveScroll: false,
            },
        );
    }

    function handleCategorySelect(slug: string | null) {
        if (slug) {
            router.visit(`/category/${slug}`);

            return;
        }

        router.visit('/products');
    }

    function handleSubCategorySelect(slug: string | null) {
        if (slug) {
            router.visit(`/category/${slug}`);

            return;
        }

        if (selectedCategorySlug) {
            router.visit(`/category/${selectedCategorySlug}`);
        }
    }

    function handleSortChange(value: string) {
        visitProducts({ sort: value, page: '1' });
    }

    function goToPage(page: number) {
        visitProducts({ page: String(page) });
    }


    useEffect(() => {
        if (!products.data || products.data.length === 0) {
            return;
        }

        const listName = selectedCategoryObj ? selectedCategoryObj.name : 'All Products';
        const items = products.data.slice(0, 20).map((p, i) =>
            buildItem(p.id, p.name, parseFloat(p.price), 1, {
                category: p.category?.name,
                originalPrice: p.original_price ? parseFloat(p.original_price) : null,
                index: i,
            }),
        );
        gtmViewItemList(items, listName);

        // Meta Pixel: Search or ViewCategory
        if (search) {
            pixelSearch(search, searchEventId ?? undefined);
            tiktokSearch(search);
        } else {
            pixelViewCategory(
                products.data.slice(0, 20).map((p) => p.id),
                listName,
                viewCategoryEventId ?? undefined,
            );
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products.current_page, selectedCategorySlug, sort]);

    function buildPageNumbers(): (number | '...')[] {
        const total = products.last_page;
        const cur   = products.current_page;

        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        const pages: (number | '...')[] = [1];

        if (cur > 3) {
            pages.push('...');
        }

        for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) {
            pages.push(p);
        }

        if (cur < total - 2) {
            pages.push('...');
        }

        pages.push(total);

        return pages;
    }

    return (
        <>
            <Head title="Shop All Products" />
            <ShopLayout>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold md:text-2xl">All Products</h1>
                        <p className="text-sm text-muted-foreground">
                            {products.total} products
                            {products.from && products.to && products.last_page > 1 && (
                                <> &mdash; showing {products.from}&#8211;{products.to}</>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="newest">Newest</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    <Button variant={selectedCategorySlug === null ? 'default' : 'outline'} size="sm" onClick={() => handleCategorySelect(null)}>
                        All
                    </Button>
                    {categories.map((cat) => (
                        <Button key={cat.id} variant={selectedCategorySlug === cat.slug ? 'default' : 'outline'} size="sm" onClick={() => handleCategorySelect(cat.slug)}>
                            {cat.name}
                        </Button>
                    ))}
                </div>

                {selectedCategoryObj?.sub_categories && selectedCategoryObj.sub_categories.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        <Button variant={selectedSubCategorySlug === null ? 'secondary' : 'outline'} size="sm" onClick={() => handleSubCategorySelect(null)} className="text-xs">
                            All {selectedCategoryObj.name}
                        </Button>
                        {selectedCategoryObj.sub_categories.map((sub) => (
                            <Button key={sub.id} variant={selectedSubCategorySlug === sub.slug ? 'secondary' : 'outline'} size="sm" onClick={() => handleSubCategorySelect(sub.slug)} className="text-xs">
                                {sub.name}
                            </Button>
                        ))}
                    </div>
                )}

                {products.data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                            {products.data.map((product, index) => (
                                      <ProductCard
                                          key={product.id}
                                          product={product}
                                          onCardClick={() => {
                                              const listName = selectedCategoryObj ? selectedCategoryObj.name : 'All Products';
                                              gtmSelectItem(
                                                  buildItem(product.id, product.name, parseFloat(product.price), 1, {
                                                      category: product.category?.name,
                                                      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                                                      index,
                                                  }),
                                                  listName,
                                              );
                                          }}
                                      />
                                  ))}
                        </div>

                        {products.last_page > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-1">
                                <button
                                    onClick={() => goToPage(products.current_page - 1)}
                                    disabled={products.current_page === 1}
                                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {buildPageNumbers().map((p, i) =>
                                    p === '...' ? (
                                        <span key={`e${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p as number)}
                                            className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors ${
                                                p === products.current_page
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-input bg-background hover:bg-accent'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ),
                                )}

                                <button
                                    onClick={() => goToPage(products.current_page + 1)}
                                    disabled={products.current_page === products.last_page}
                                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <Filter className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h2 className="mb-2 text-2xl font-bold">No Products Found</h2>
                        <p className="mb-6 text-muted-foreground">
                            {search ? `No products match "${search}"` : 'No products available'}
                        </p>
                        {search && (
                            <Button variant="outline" onClick={() => router.visit('/products')}>
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}
            </ShopLayout>
        </>
    );
}
