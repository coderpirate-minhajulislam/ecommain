import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, LayoutGrid, LayoutTemplate, Palette } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    primaryHue: number;
    primaryHex: string;
    secondaryHue: number;
    secondaryHex: string;
    outlineHue: number;
    outlineHex: string;
    homeLayout: string;
    productCardLayout: string;
};

type TabKey = 'primary' | 'secondary' | 'outline';

type ColorFamily = {
    name: string;
    colors: string[];
};

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const CHROMATIC: ColorFamily[] = [
    { name: 'Red',     colors: ['#fef2f2','#fee2e2','#fecaca','#fca5a5','#f87171','#ef4444','#dc2626','#b91c1c','#991b1b','#7f1d1d','#450a0a'] },
    { name: 'Orange',  colors: ['#fff7ed','#ffedd5','#fed7aa','#fdba74','#fb923c','#f97316','#ea580c','#c2410c','#9a3412','#7c2d12','#431407'] },
    { name: 'Amber',   colors: ['#fffbeb','#fef3c7','#fde68a','#fcd34d','#fbbf24','#f59e0b','#d97706','#b45309','#92400e','#78350f','#451a03'] },
    { name: 'Yellow',  colors: ['#fefce8','#fef9c3','#fef08a','#fde047','#facc15','#eab308','#ca8a04','#a16207','#854d0e','#713f12','#422006'] },
    { name: 'Lime',    colors: ['#f7fee7','#ecfccb','#d9f99d','#bef264','#a3e635','#84cc16','#65a30d','#4d7c0f','#3f6212','#365314','#1a2e05'] },
    { name: 'Green',   colors: ['#f0fdf4','#dcfce7','#bbf7d0','#86efac','#4ade80','#22c55e','#16a34a','#15803d','#166534','#14532d','#052e16'] },
    { name: 'Emerald', colors: ['#ecfdf5','#d1fae5','#a7f3d0','#6ee7b7','#34d399','#10b981','#059669','#047857','#065f46','#064e3b','#022c22'] },
    { name: 'Teal',    colors: ['#f0fdfa','#ccfbf1','#99f6e4','#5eead4','#2dd4bf','#14b8a6','#0d9488','#0f766e','#115e59','#134e4a','#042f2e'] },
    { name: 'Cyan',    colors: ['#ecfeff','#cffafe','#a5f3fc','#67e8f9','#22d3ee','#06b6d4','#0891b2','#0e7490','#155e75','#164e63','#083344'] },
    { name: 'Sky',     colors: ['#f0f9ff','#e0f2fe','#bae6fd','#7dd3fc','#38bdf8','#0ea5e9','#0284c7','#0369a1','#075985','#0c4a6e','#082f49'] },
    { name: 'Blue',    colors: ['#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a','#172554'] },
    { name: 'Indigo',  colors: ['#eef2ff','#e0e7ff','#c7d2fe','#a5b4fc','#818cf8','#6366f1','#4f46e5','#4338ca','#3730a3','#312e81','#1e1b4b'] },
    { name: 'Violet',  colors: ['#f5f3ff','#ede9fe','#ddd6fe','#c4b5fd','#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#2e1065'] },
    { name: 'Purple',  colors: ['#faf5ff','#f3e8ff','#e9d5ff','#d8b4fe','#c084fc','#a855f7','#9333ea','#7e22ce','#6b21a8','#581c87','#3b0764'] },
    { name: 'Fuchsia', colors: ['#fdf4ff','#fae8ff','#f5d0fe','#f0abfc','#e879f9','#d946ef','#c026d3','#a21caf','#86198f','#701a75','#4a044e'] },
    { name: 'Pink',    colors: ['#fdf2f8','#fce7f3','#fbcfe8','#f9a8d4','#f472b6','#ec4899','#db2777','#be185d','#9d174d','#831843','#500724'] },
    { name: 'Rose',    colors: ['#fff1f2','#ffe4e6','#fecdd3','#fda4af','#fb7185','#f43f5e','#e11d48','#be123c','#9f1239','#881337','#4c0519'] },
];

const NEUTRALS: ColorFamily[] = [
    { name: 'Slate',   colors: ['#f8fafc','#f1f5f9','#e2e8f0','#cbd5e1','#94a3b8','#64748b','#475569','#334155','#1e293b','#0f172a','#020617'] },
    { name: 'Gray',    colors: ['#f9fafb','#f3f4f6','#e5e7eb','#d1d5db','#9ca3af','#6b7280','#4b5563','#374151','#1f2937','#111827','#030712'] },
    { name: 'Zinc',    colors: ['#fafafa','#f4f4f5','#e4e4e7','#d4d4d8','#a1a1aa','#71717a','#52525b','#3f3f46','#27272a','#18181b','#09090b'] },
    { name: 'Neutral', colors: ['#fafafa','#f5f5f5','#e5e5e5','#d4d4d4','#a3a3a3','#737373','#525252','#404040','#262626','#171717','#0a0a0a'] },
    { name: 'Stone',   colors: ['#fafaf9','#f5f5f4','#e7e5e4','#d6d3d1','#a8a29e','#78716c','#57534e','#44403c','#292524','#1c1917','#0c0a09'] },
];

function isLightHex(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.55;
}

function hexToHue(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) {
        return 0;
    }

    let h = 0;

    if (max === r) {
        h = ((g - b) / delta) % 6;
    } else if (max === g) {
        h = (b - r) / delta + 2;
    } else {
        h = (r - g) / delta + 4;
    }

    h = Math.round(h * 60);

    return h < 0 ? h + 360 : h;
}

type PaletteGridProps = {
    activeHex: string;
    onSelect: (hex: string) => void;
};

function PaletteGrid({ activeHex, onSelect }: PaletteGridProps) {
    return (
        <div className="w-full">
            {/* Shade number header — hidden on small screens */}
            <div className="mb-1 hidden items-center sm:flex">
                <div className="w-12 shrink-0 sm:w-16" />
                {SHADES.map((s) => (
                    <div key={s} className="flex-1 text-center text-[10px] font-medium text-muted-foreground">
                        {s}
                    </div>
                ))}
            </div>

            <div className="space-y-px">
                {CHROMATIC.map(({ name, colors }) => (
                    <div key={name} className="flex items-center">
                        <div className="w-12 shrink-0 pr-1 text-right text-[10px] font-medium text-muted-foreground sm:w-16 sm:pr-2 sm:text-xs">
                            {name}
                        </div>
                        {colors.map((hex, i) => {
                            const isSelected = activeHex.toLowerCase() === hex.toLowerCase();

                            return (
                                <button
                                    key={SHADES[i]}
                                    type="button"
                                    title={`${name}-${SHADES[i]}: ${hex}`}
                                    onClick={() => onSelect(hex)}
                                    className={`h-5 flex-1 transition-all first:rounded-l-sm last:rounded-r-sm hover:z-10 hover:scale-110 hover:shadow-md sm:h-7 ${
                                        isSelected
                                            ? 'z-10 scale-110 shadow-md ring-2 ring-foreground ring-offset-1'
                                            : ''
                                    }`}
                                    style={{ background: hex }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="my-2 border-t" />

            <div className="space-y-px">
                {NEUTRALS.map(({ name, colors }) => (
                    <div key={name} className="flex items-center">
                        <div className="w-12 shrink-0 pr-1 text-right text-[10px] font-medium text-muted-foreground sm:w-16 sm:pr-2 sm:text-xs">
                            {name}
                        </div>
                        {colors.map((hex, i) => {
                            const isSelected = activeHex.toLowerCase() === hex.toLowerCase();

                            return (
                                <button
                                    key={SHADES[i]}
                                    type="button"
                                    title={`${name}-${SHADES[i]}: ${hex}`}
                                    onClick={() => onSelect(hex)}
                                    className={`h-5 flex-1 transition-all first:rounded-l-sm last:rounded-r-sm hover:z-10 hover:scale-110 hover:shadow-md sm:h-7 ${
                                        isSelected
                                            ? 'z-10 scale-110 shadow-md ring-2 ring-foreground ring-offset-1'
                                            : ''
                                    }`}
                                    style={{ background: hex }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ThemeSettings() {
    const { primaryHue, primaryHex, secondaryHue, secondaryHex, outlineHue, outlineHex, homeLayout, productCardLayout } =
        usePage<Props>().props;

    useFlashToast();

    const { data, setData, post, processing } = useForm({
        primary_hue:   primaryHue   ?? 152,
        primary_hex:   primaryHex   ?? '#16a34a',
        secondary_hue: secondaryHue ?? 143,
        secondary_hex: secondaryHex ?? '#dcfce7',
        outline_hue:   outlineHue   ?? 143,
        outline_hex:   outlineHex   ?? '#bbf7d0',
        home_layout:         homeLayout        ?? '1',
        product_card_layout: productCardLayout  ?? '1',
    });

    const [activeTab, setActiveTab] = useState<TabKey>('primary');

    function handleSelectColor(hex: string) {
        const hue = hexToHue(hex);

        if (activeTab === 'primary') {
            setData({ ...data, primary_hex: hex, primary_hue: hue });
        } else if (activeTab === 'secondary') {
            setData({ ...data, secondary_hex: hex, secondary_hue: hue });
        } else {
            setData({ ...data, outline_hex: hex, outline_hue: hue });
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/theme');
    }

    const activeHex =
        activeTab === 'primary'
            ? data.primary_hex
            : activeTab === 'secondary'
              ? data.secondary_hex
              : data.outline_hex;

    const primaryOff = ((data.primary_hue - 9) % 360 + 360) % 360;
    const primaryIsLight = isLightHex(data.primary_hex);
    const secondaryIsLight = isLightHex(data.secondary_hex);

    const TABS: { key: TabKey; label: string; desc: string }[] = [
        { key: 'primary',   label: 'Primary Button',   desc: 'Main CTA buttons, links, sidebar active state & focus rings' },
        { key: 'secondary', label: 'Secondary Button',  desc: 'Secondary buttons, muted tones, sidebar accent background' },
        { key: 'outline',   label: 'Outline Button',    desc: 'Borders, input outlines, dividers & sidebar borders' },
    ];

    return (
        <>
            <Head title="Theme Color Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Theme Color</h2>
                    <p className="text-muted-foreground">
                        Set independent colors for each button type. Changes apply across admin and storefront.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5" />
                                    Color Palette
                                </CardTitle>
                                <CardDescription>
                                    Select a button type tab, then click a color swatch to assign it.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Tab selector */}
                                    <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1">
                                        {TABS.map(({ key, label }) => {
                                            const hex =
                                                key === 'primary'
                                                    ? data.primary_hex
                                                    : key === 'secondary'
                                                      ? data.secondary_hex
                                                      : data.outline_hex;
                                            const isActive = activeTab === key;

                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setActiveTab(key)}
                                                    className={`flex w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-xs font-medium transition-all sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${
                                                        isActive
                                                            ? 'bg-background text-foreground shadow'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    <div
                                                        className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                                                        style={{ background: hex }}
                                                    />
                                                    <span className="text-center leading-tight">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Active tab description */}
                                    <p className="text-xs text-muted-foreground">
                                        {TABS.find((t) => t.key === activeTab)?.desc}
                                    </p>

                                    {/* Palette */}
                                    <PaletteGrid activeHex={activeHex} onSelect={handleSelectColor} />

                                    {/* Preview */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Preview</p>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                            <div
                                                className="flex h-10 flex-1 items-center justify-center rounded-md text-sm font-medium shadow-sm"
                                                style={{
                                                    background: data.primary_hex,
                                                    color: primaryIsLight ? '#111827' : '#ffffff',
                                                }}
                                            >
                                                Primary Button
                                            </div>
                                            <div
                                                className="flex h-10 flex-1 items-center justify-center rounded-md text-sm font-medium shadow-sm"
                                                style={{
                                                    background: data.secondary_hex,
                                                    color: secondaryIsLight ? '#374151' : '#f9fafb',
                                                }}
                                            >
                                                Secondary Button
                                            </div>
                                            <div
                                                className="flex h-10 flex-1 items-center justify-center rounded-md border-2 text-sm font-medium shadow-sm"
                                                style={{
                                                    borderColor: data.outline_hex,
                                                    color: data.primary_hex,
                                                }}
                                            >
                                                Outline Button
                                            </div>
                                        </div>
                                        <div
                                            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium"
                                            style={{
                                                background: `oklch(0.96 0.025 ${primaryOff})`,
                                                color: `oklch(0.16 0.025 ${data.primary_hue})`,
                                            }}
                                        >
                                            <div
                                                className="h-2 w-2 rounded-full"
                                                style={{ background: data.primary_hex }}
                                            />
                                            Sidebar Navigation Item
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Applying...' : 'Apply Theme'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Home Layout Selector */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LayoutTemplate className="h-5 w-5" />
                                    Home Page Layout
                                </CardTitle>
                                <CardDescription>
                                    Choose the layout style for the store home page. Click a layout to select, then save above.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                                    {/* Layout 1 */}
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, home_layout: '1' })}
                                        className={`group relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                                            data.home_layout === '1'
                                                ? 'border-primary bg-primary/5 shadow-md'
                                                : 'border-border hover:border-primary/40 hover:shadow'
                                        }`}
                                    >
                                        {data.home_layout === '1' && (
                                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">✓</span>
                                        )}
                                        {/* Mini wireframe preview */}
                                        <div className="w-full rounded-lg overflow-hidden border border-border bg-muted/30 p-1.5 space-y-1">
                                            <div className="h-8 w-full rounded bg-primary/30" />
                                            <div className="grid grid-cols-4 gap-0.5">
                                                {[...Array(4)].map((_, i) => <div key={i} className="h-4 rounded bg-muted-foreground/20" />)}
                                            </div>
                                            <div className="grid grid-cols-3 gap-0.5">
                                                {[...Array(3)].map((_, i) => <div key={i} className="h-6 rounded bg-muted-foreground/15" />)}
                                            </div>
                                            <div className="h-5 w-full rounded bg-primary/20" />
                                            <div className="grid grid-cols-3 gap-0.5">
                                                {[...Array(3)].map((_, i) => <div key={i} className="h-6 rounded bg-muted-foreground/15" />)}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Layout 1</p>
                                            <p className="text-xs text-muted-foreground">Grid categories · Standard sections</p>
                                        </div>
                                    </button>

                                    {/* Layout 2 */}
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, home_layout: '2' })}
                                        className={`group relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                                            data.home_layout === '2'
                                                ? 'border-primary bg-primary/5 shadow-md'
                                                : 'border-border hover:border-primary/40 hover:shadow'
                                        }`}
                                    >
                                        {data.home_layout === '2' && (
                                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">✓</span>
                                        )}
                                        {/* Mini wireframe preview */}
                                        <div className="w-full rounded-lg overflow-hidden border border-border bg-muted/30 p-1.5 space-y-1">
                                            <div className="h-8 w-full rounded bg-primary/30" />
                                            <div className="flex gap-0.5 overflow-hidden">
                                                {[...Array(5)].map((_, i) => <div key={i} className="h-5 w-10 shrink-0 rounded-full bg-muted-foreground/20" />)}
                                            </div>
                                            <div className="rounded bg-primary/10 p-1 space-y-0.5">
                                                <div className="h-2 w-16 rounded bg-primary/40" />
                                                <div className="grid grid-cols-3 gap-0.5">
                                                    {[...Array(3)].map((_, i) => <div key={i} className="h-6 rounded bg-muted-foreground/15" />)}
                                                </div>
                                            </div>
                                            <div className="h-5 w-full rounded bg-primary/20" />
                                            <div className="grid grid-cols-3 gap-0.5">
                                                {[...Array(3)].map((_, i) => <div key={i} className="h-6 rounded bg-muted-foreground/15" />)}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Layout 2</p>
                                            <p className="text-xs text-muted-foreground">Scroll categories · Accent sections</p>
                                        </div>
                                    </button>

                                    {/* Layout 3 */}
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, home_layout: '3' })}
                                        className={`group relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                                            data.home_layout === '3'
                                                ? 'border-primary bg-primary/5 shadow-md'
                                                : 'border-border hover:border-primary/40 hover:shadow'
                                        }`}
                                    >
                                        {data.home_layout === '3' && (
                                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">✓</span>
                                        )}
                                        {/* Mini wireframe preview */}
                                        <div className="w-full rounded-lg overflow-hidden border border-border bg-muted/30 p-1.5 space-y-1">
                                            <div className="flex gap-0.5">
                                                <div className="h-8 grow-3 rounded bg-primary/30" />
                                                <div className="flex grow-2 flex-col gap-0.5">
                                                    <div className="h-3.5 rounded bg-primary/20" />
                                                    <div className="h-3.5 rounded bg-primary/20" />
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5 overflow-hidden rounded border border-border">
                                                {[...Array(5)].map((_, i) => <div key={i} className="h-6 flex-1 bg-muted-foreground/10" />)}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="h-2 w-14 rounded bg-primary/40" />
                                                <div className="grid grid-cols-3 gap-0.5">
                                                    {[...Array(3)].map((_, i) => <div key={i} className="h-6 rounded bg-muted-foreground/15" />)}
                                                </div>
                                            </div>
                                            <div className="h-4 w-full rounded bg-primary/20" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Layout 3</p>
                                            <p className="text-xs text-muted-foreground">Split hero · Badge categories · Two-tone titles</p>
                                        </div>
                                    </button>
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground">
                                    After selecting a layout, click <strong>Apply Theme Colors</strong> above to save.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Product Card Layout Selector */}
                        <Card className="mt-6">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <LayoutGrid className="h-4 w-4" />
                                    Product Card Style
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Choose how product cards look. Save with Apply Theme Colors.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Card Layout 1 */}
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, product_card_layout: '1' })}
                                        className={`group relative flex flex-col gap-1.5 rounded-lg border-2 p-2 text-left transition-all ${
                                            data.product_card_layout === '1'
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-border hover:border-primary/40'
                                        }`}
                                    >
                                        {data.product_card_layout === '1' && (
                                            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">✓</span>
                                        )}
                                        {/* Mini wireframe */}
                                        <div className="w-full rounded overflow-hidden border border-border bg-muted/30 p-1 space-y-1">
                                            <div className="aspect-[4/3] w-full rounded-sm bg-muted-foreground/20" />
                                            <div className="h-1.5 w-8 rounded bg-muted-foreground/30" />
                                            <div className="h-2 w-full rounded bg-muted-foreground/20" />
                                            <div className="flex gap-0.5">
                                                <div className="h-3 flex-1 rounded-sm bg-primary/30" />
                                                <div className="h-3 flex-1 rounded-sm bg-primary/60" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">Style 1</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">Stacked buttons</p>
                                        </div>
                                    </button>

                                    {/* Card Layout 2 */}
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, product_card_layout: '2' })}
                                        className={`group relative flex flex-col gap-1.5 rounded-lg border-2 p-2 text-left transition-all ${
                                            data.product_card_layout === '2'
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-border hover:border-primary/40'
                                        }`}
                                    >
                                        {data.product_card_layout === '2' && (
                                            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">✓</span>
                                        )}
                                        {/* Mini wireframe */}
                                        <div className="w-full rounded overflow-hidden border border-border bg-muted/30 p-1 space-y-1">
                                            <div className="aspect-[4/3] w-full rounded-sm bg-muted-foreground/30" />
                                            <div className="flex items-center justify-between gap-1">
                                                <div className="h-2 w-10 rounded-sm bg-muted-foreground/20" />
                                                <div className="h-2 w-5 rounded-sm bg-primary/50" />
                                            </div>
                                            <div className="flex gap-0.5">
                                                <div className="h-3 w-4 rounded-sm bg-muted-foreground/30" />
                                                <div className="h-3 flex-1 rounded-sm bg-primary/50" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">Style 2</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">Inline name+price</p>
                                        </div>
                                    </button>
                                </div>
                                <p className="mt-2 text-[10px] text-muted-foreground">
                                    Click <strong>Apply Theme Colors</strong> to save.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Active Theme
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { label: 'Primary',   hex: primaryHex,   hue: primaryHue },
                                    { label: 'Secondary', hex: secondaryHex, hue: secondaryHue },
                                    { label: 'Outline',   hex: outlineHex,   hue: outlineHue },
                                ].map(({ label, hex, hue }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <div
                                            className="h-8 w-8 shrink-0 rounded-full border border-border shadow"
                                            style={{ background: hex }}
                                        />
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                                            <p className="font-mono text-sm font-medium uppercase">{hex}</p>
                                            <p className="text-xs text-muted-foreground">Hue: {hue}&deg;</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">What changes?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-1.5 text-sm text-muted-foreground">
                                    <li>&bull; Primary: buttons, links, rings</li>
                                    <li>&bull; Secondary: soft backgrounds, muted</li>
                                    <li>&bull; Outline: borders &amp; inputs</li>
                                    <li>&bull; Sidebar accent colors</li>
                                    <li>&bull; Both light &amp; dark mode</li>
                                    <li>&bull; Admin &amp; storefront</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
