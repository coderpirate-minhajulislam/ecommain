import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, MapPin, Plus, Trash2 } from 'lucide-react';
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

type ShippingZone = {
    id: number;
    name: string;
    districts: string[];
    sort_order: number;
    created_at: string;
};

type Props = {
    zones: ShippingZone[];
};

export default function ShippingZonesIndex() {
    const { zones } = usePage<Props>().props;
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useFlashToast();

    function confirmDelete() {
        if (deleteId !== null) {
            router.delete(`/admin/shipping-zones/${deleteId}`, {
                onFinish: () => setDeleteId(null),
            });
        }
    }

    return (
        <>
            <Head title="Shipping Zones" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Shipping Zones</h2>
                        <p className="text-muted-foreground">Manage delivery area names. Shipping charges are set per product.</p>
                    </div>
                    <Link
                        href="/admin/shipping-zones/create"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Add Zone
                    </Link>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
                    {zones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <MapPin className="h-10 w-10 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No shipping zones yet. Add your first zone.</p>
                            <Link
                                href="/admin/shipping-zones/create"
                                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Zone
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border/70 text-left dark:border-sidebar-border">
                                    <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Zone Name</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Districts</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Sort Order</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {zones.map((zone, index) => (
                                    <tr
                                        key={zone.id}
                                        className="border-b border-sidebar-border/30 last:border-0 hover:bg-muted/30 dark:border-sidebar-border/30"
                                    >
                                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium">{zone.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{zone.districts?.length ? zone.districts.join(', ') : 'All districts'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{zone.sort_order}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <Link
                                                    href={`/admin/shipping-zones/${zone.id}/edit`}
                                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteId(zone.id)}
                                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Shipping Zone?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This shipping zone will be removed. Products using this zone will keep their existing shipping data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
