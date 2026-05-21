import { Head, useForm, usePage } from '@inertiajs/react';
import * as LucideIcons from 'lucide-react';
import { BadgeCheck, GripVertical, Plus, Trash2 } from 'lucide-react';
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Badge = { icon: string; title: string; desc: string };

const ICON_OPTIONS = [
    'Truck', 'Shield', 'RotateCcw', 'Star', 'Zap', 'Heart', 'Award',
    'CheckCircle', 'Clock', 'Gift', 'Tag', 'Headphones', 'Lock', 'Package',
    'ThumbsUp', 'CreditCard', 'RefreshCw', 'ShieldCheck',
];

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const SelectedIcon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[value];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
            >
                {SelectedIcon && <SelectedIcon className="h-4 w-4 shrink-0 text-primary" />}
                <span className="flex-1 text-left text-xs text-muted-foreground">{value}</span>
            </button>
            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 grid grid-cols-6 gap-1 rounded-md border border-border bg-background p-2 shadow-lg">
                    {ICON_OPTIONS.map(iconName => {
                        const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];

                        return (
                            <button
                                key={iconName}
                                type="button"
                                title={iconName}
                                onClick={() => {
                                    onChange(iconName);
                                    setOpen(false);
                                }}
                                className={`flex h-8 w-8 items-center justify-center rounded hover:bg-accent ${value === iconName ? 'bg-primary/10 text-primary ring-1 ring-primary' : 'text-foreground'}`}
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function TrustBadgesSettings() {
    useFlashToast();
    const { badges: initialBadges } = usePage<{ badges: Badge[] }>().props;

    const { data, setData, post, processing } = useForm<{ badges: Badge[] }>({
        badges: initialBadges ?? [],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/trust-badges');
    }

    function addBadge() {
        setData('badges', [...data.badges, { icon: 'Star', title: '', desc: '' }]);
    }

    function removeBadge(index: number) {
        setData('badges', data.badges.filter((_, i) => i !== index));
    }

    function updateBadge(index: number, field: keyof Badge, value: string) {
        const updated = data.badges.map((b, i) => i === index ? { ...b, [field]: value } : b);
        setData('badges', updated);
    }

    return (
        <>
            <Head title="Trust Badges" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Trust Badges</h2>
                    <p className="text-muted-foreground">
                        Manage the feature highlight cards displayed on the home page (e.g. Free Shipping, Secure Payment).
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BadgeCheck className="h-5 w-5" />
                                    Badge Cards
                                </CardTitle>
                                <CardDescription>
                                    Add, edit, or remove the trust badge cards. Up to 10 cards supported.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {data.badges.map((badge, index) => {
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
                                            >
                                                <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />

                                                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                                                    {/* Icon picker */}
                                                    <div className="w-full sm:w-44 space-y-1">
                                                        <Label className="text-xs">Icon</Label>
                                                        <IconPicker
                                                            value={badge.icon}
                                                            onChange={v => updateBadge(index, 'icon', v)}
                                                        />
                                                    </div>

                                                    {/* Title */}
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs">Title</Label>
                                                        <Input
                                                            value={badge.title}
                                                            onChange={e => updateBadge(index, 'title', e.target.value)}
                                                            placeholder="e.g. Free Shipping"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>

                                                    {/* Description */}
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs">Description</Label>
                                                        <Input
                                                            value={badge.desc}
                                                            onChange={e => updateBadge(index, 'desc', e.target.value)}
                                                            placeholder="e.g. On orders over ৳500"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="mt-1 rounded p-1 text-destructive hover:bg-destructive/10"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Badge?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete <strong>{badge.title || 'this badge'}</strong>? This cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => removeBadge(index)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        );
                                    })}

                                    {data.badges.length < 10 && (
                                        <Button type="button" variant="outline" size="sm" onClick={addBadge} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add Badge
                                        </Button>
                                    )}

                                    <div className="pt-2">
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Saving…' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Live preview */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium">Preview</p>
                        {data.badges.map((badge, i) => {
                            const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[badge.icon];

                            return (
                                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        {Icon ? <Icon className="h-5 w-5" /> : null}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{badge.title || 'Title'}</p>
                                        <p className="text-xs text-muted-foreground">{badge.desc || 'Description'}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {data.badges.length === 0 && (
                            <p className="text-sm text-muted-foreground">No badges added yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
