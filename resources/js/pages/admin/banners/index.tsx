import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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

type Banner = {
    id: number;
    title: string | null;
    subtitle: string | null;
    button_text: string | null;
    button_link: string | null;
    image_path: string;
    sort_order: number;
    is_active: boolean;
    position: string;
};

type Props = { banners: Banner[] };

export default function BannersIndex() {
    const { banners } = usePage<Props>().props;
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useFlashToast();

    function handleDelete() {
        if (!deleteId) return;
        router.delete(`/admin/banners/${deleteId}`, { preserveScroll: true });
        setDeleteId(null);
    }

    return (
        <>
            <Head title="Banners" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Hero Banners</h2>
                        <p className="text-muted-foreground">Manage homepage hero slider banners.</p>
                    </div>
                    <Link
                        href="/admin/banners/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" /> Add Banner
                    </Link>
                </div>

                {banners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                        <p className="text-muted-foreground">No banners yet.</p>
                        <Link href="/admin/banners/create" className="mt-3 text-sm text-primary hover:underline">
                            Add your first banner
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <table className="w-full text-sm">
                            <thead className="border-b border-border bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Image</th>
                                    <th className="px-4 py-3 text-left font-medium">Title / Subtitle</th>
                                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Button</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Order</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Position</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {banners.map((banner) => (
                                    <tr key={banner.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <img
                                                src={`/${banner.image_path}`}
                                                alt={banner.title || 'Banner'}
                                                className="h-14 w-24 rounded-md object-cover"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{banner.title || <span className="text-muted-foreground italic">No title</span>}</p>
                                            {banner.subtitle && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">{banner.subtitle}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            {banner.button_text ? (
                                                <div>
                                                    <span className="font-medium">{banner.button_text}</span>
                                                    {banner.button_link && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{banner.button_link}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                                            {banner.sort_order}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${banner.position === 'mid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                {banner.position === 'mid' ? 'Mid' : 'Hero'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${banner.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                                {banner.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/banners/${banner.id}/edit`}
                                                    className="inline-flex items-center rounded-md p-1.5 hover:bg-accent"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteId(banner.id)}
                                                    className="inline-flex items-center rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the banner and its image. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
