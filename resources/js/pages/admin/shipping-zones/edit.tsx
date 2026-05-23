import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { bangladeshDistricts } from '@/data/bangladesh-districts';

type ShippingZone = {
    id: number;
    name: string;
    districts: string[];
    sort_order: number;
};

type Props = {
    zone: ShippingZone;
};

function normalizeDistrictKey(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function hasDistrict(districts: string[], value: string) {
    const key = normalizeDistrictKey(value);

    return districts.some((district) => normalizeDistrictKey(district) === key);
}

function addDistrict(districts: string[], value: string) {
    const trimmed = value.trim();

    if (!trimmed || hasDistrict(districts, trimmed)) {
        return districts;
    }

    return [...districts, trimmed];
}

function removeDistrict(districts: string[], value: string) {
    const key = normalizeDistrictKey(value);

    return districts.filter((district) => normalizeDistrictKey(district) !== key);
}

export default function EditShippingZone() {
    const { zone } = usePage<Props>().props;
    const { data, setData, put, processing, errors } = useForm({
        name: zone.name,
        districts: zone.districts ?? [],
        sort_order: String(zone.sort_order),
    });
    const [customDistrict, setCustomDistrict] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/shipping-zones/${zone.id}`);
    }

    function toggleDistrict(value: string) {
        setData('districts', hasDistrict(data.districts, value)
            ? removeDistrict(data.districts, value)
            : addDistrict(data.districts, value));
    }

    function addCustomDistrict() {
        const nextDistricts = addDistrict(data.districts, customDistrict);

        if (nextDistricts.length === data.districts.length) {
            return;
        }

        setData('districts', nextDistricts);
        setCustomDistrict('');
    }

    function handleCustomDistrictKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomDistrict();
        }
    }

    return (
        <>
            <Head title="Edit Shipping Zone" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/shipping-zones" className="inline-flex items-center rounded-md p-1.5 hover:bg-accent">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Shipping Zone</h2>
                        <p className="text-muted-foreground">Update delivery area name. Charges are set per product.</p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-lg space-y-5 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border"
                >
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Zone Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Inside Dhaka, Outside Dhaka"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Districts
                        </label>
                        <p className="text-xs text-muted-foreground">Leave empty to use this shipping class for all districts. Select one or more districts to make it district-specific, or add a custom district name.</p>

                        <div className="flex flex-wrap gap-2">
                            {data.districts.map((district) => (
                                <span
                                    key={district}
                                    className="inline-flex items-center gap-1 rounded-full border border-input bg-muted px-3 py-1 text-sm"
                                >
                                    {district}
                                    <button
                                        type="button"
                                        onClick={() => setData('districts', removeDistrict(data.districts, district))}
                                        className="rounded-full p-0.5 text-muted-foreground hover:bg-background"
                                        aria-label={`Remove ${district}`}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customDistrict}
                                onChange={(e) => setCustomDistrict(e.target.value)}
                                onKeyDown={handleCustomDistrictKeyDown}
                                placeholder="Add custom district name"
                                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <button
                                type="button"
                                onClick={addCustomDistrict}
                                disabled={!customDistrict.trim()}
                                className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </button>
                        </div>

                        <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-input p-3 sm:grid-cols-2">
                            {bangladeshDistricts.map((district) => {
                                const checked = hasDistrict(data.districts, district);

                                return (
                                    <label
                                        key={district}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleDistrict(district)}
                                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                        />
                                        <span>{district}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {errors.districts && <p className="text-sm text-destructive">{errors.districts}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="sort_order" className="text-sm font-medium">
                            Sort Order
                        </label>
                        <input
                            id="sort_order"
                            type="number"
                            min="0"
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', e.target.value)}
                            placeholder="0"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">Lower numbers appear first in the list.</p>
                        {errors.sort_order && <p className="text-sm text-destructive">{errors.sort_order}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : 'Update Zone'}
                        </button>
                        <Link
                            href="/admin/shipping-zones"
                            className="inline-flex items-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
