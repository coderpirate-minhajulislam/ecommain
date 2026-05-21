import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Category = {
    id: number;
    name: string;
};

type Product = {
    id: number;
    name: string;
    price: string;
    original_price: string | null;
    in_stock: boolean;
    created_at: string;
    category: Category | null;
    sub_category: { id: number; name: string } | null;
    images: { id: number; image_path: string; sort_order: number }[];
    variants: { id: number; size: string | null; color: string | null; price: string }[];
};

type PaginatedProducts = {
    data: Product[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    products: PaginatedProducts;
    filters: { search?: string; category_id?: string; perPage?: string };
    categories: Category[];
};

const perPageOptions = [10, 15, 25, 50, 100];

function formatPrice(price: string | null): string {
    if (!price) return '';
    return `$${parseFloat(price).toFixed(2)}`;
}

export default function ProductsIndex() {
    const { products, filters, categories } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [perPage, setPerPage] = useState(filters.perPage || '10');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

    useFlashToast();

    const fetchProducts = useCallback(
        (params: Record<string, string>) => {
            router.get('/admin/products', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [],
    );

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchProducts({ search, category_id: categoryId, perPage });
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search, categoryId, perPage, fetchProducts]);

    function handleDelete(productId: number) {
        setDeleteProductId(productId);
    }

    function confirmDelete() {
        if (deleteProductId !== null) {
            router.delete(`/admin/products/${deleteProductId}`, {
                onFinish: () => setDeleteProductId(null),
            });
        }
    }

    return (
        <>
            <Head title="Manage Products" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Products</h2>
                        <p className="text-xs text-muted-foreground sm:text-sm">Manage your product catalog.</p>
                    </div>
                    <Link
                        href="/admin/products/create"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Add Product
                    </Link>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative flex-1 sm:min-w-50">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={String(cat.id)}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        {perPageOptions.map((n) => (
                            <option key={n} value={String(n)}>
                                {n} per page
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-full overflow-x-auto rounded-xl border border-sidebar-border/70 [-webkit-overflow-scrolling:touch] dark:border-sidebar-border">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 border-b bg-muted/50">
                            <tr>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Image</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Name</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 lg:table-cell">Category</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Price</th>
                                <th className="hidden whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4 xl:table-cell">Variants</th>
                                <th className="whitespace-nowrap px-2 py-3 text-left font-medium sm:px-4">Stock</th>
                                <th className="sticky right-0 whitespace-nowrap bg-muted/50 px-2 py-3 text-right font-medium sm:px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {products.data.map((product) => (
                                <tr key={product.id} className="group hover:bg-muted/30">
                                    <td className="px-2 py-3 sm:px-4">
                                        {product.images?.[0] ? (
                                            <img src={`/${product.images[0].image_path}`} alt="" className="h-8 w-8 rounded object-cover sm:h-10 sm:w-10" />
                                        ) : (
                                            <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm sm:h-10 sm:w-10 sm:text-lg">📦</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-2 py-3 font-medium sm:px-4">
                                        {product.name}
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4 lg:table-cell">
                                        {product.category?.name}
                                        {product.sub_category && (
                                            <span className="text-xs"> / {product.sub_category.name}</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                        <div>
                                            <span className="font-medium text-primary">{formatPrice(product.price)}</span>
                                            {product.original_price && (
                                                <div className="text-xs text-muted-foreground line-through">
                                                    {formatPrice(product.original_price)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-3 text-muted-foreground sm:px-4 xl:table-cell">
                                        {product.variants.length > 0 ? (
                                            <span className="text-xs">{product.variants.length} variant{product.variants.length > 1 ? 's' : ''}</span>
                                        ) : (
                                            <span className="text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-2 py-3 sm:px-4">
                                        {product.in_stock ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                In Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                Out of Stock
                                            </span>
                                        )}
                                    </td>
                                    <td className="sticky right-0 whitespace-nowrap bg-background px-2 py-3 text-right sm:px-4 group-hover:bg-muted/30">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/admin/products/${product.id}/edit`}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        No products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {products.from && products.to
                            ? `Showing ${products.from} to ${products.to} of ${products.total} results`
                            : `${products.total} results`}
                    </p>

                    {products.last_page > 1 && (
                        <div className="flex flex-wrap gap-1">
                            {products.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`rounded-md px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : link.url
                                              ? 'hover:bg-accent'
                                              : 'cursor-not-allowed opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveState
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => !open && setDeleteProductId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this product? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Products', href: '/admin/products' },
    ],
};
