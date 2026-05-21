import { Head, useForm, usePage } from '@inertiajs/react';
import { Globe, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    siteTitle: string;
    siteSubtitle: string;
    siteLogo: string;
    sitePhone: string;
    siteWhatsapp: string;
};

export default function SiteBrandingSettings() {
    useFlashToast();
    const { siteTitle, siteSubtitle, siteLogo, sitePhone, siteWhatsapp } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm<{
        site_title: string;
        site_subtitle: string;
        site_phone: string;
        site_whatsapp: string;
        site_logo: File | null;
    }>({
        site_title: siteTitle ?? '',
        site_subtitle: siteSubtitle ?? '',
        site_phone: sitePhone ?? '',
        site_whatsapp: siteWhatsapp ?? '',
        site_logo: null,
    });

    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('site_logo', file);

        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(null);
        }
    }

    function clearLogo() {
        setData('site_logo', null);
        setPreview(null);

        if (fileRef.current) {
            fileRef.current.value = '';
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/site-branding');
    }

    const currentLogoUrl = preview ?? (siteLogo ? `/${siteLogo}` : null);

    return (
        <>
            <Head title="Site Branding" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Site Branding</h2>
                    <p className="text-muted-foreground">
                        Set your site logo, name, contact numbers displayed to customers.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" />
                                    Branding Settings
                                </CardTitle>
                                <CardDescription>
                                    These details appear in the shop header, footer, and floating contact buttons.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Logo upload */}
                                    <div className="space-y-2">
                                        <Label>Site Logo</Label>
                                        <div className="flex items-start gap-4">
                                            {currentLogoUrl ? (
                                                <div className="relative flex h-16 w-40 items-center justify-center rounded border bg-muted/30 p-1">
                                                    <img
                                                        src={currentLogoUrl}
                                                        alt="Logo preview"
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={clearLogo}
                                                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex h-16 w-40 items-center justify-center rounded border border-dashed bg-muted/30">
                                                    <span className="text-xs text-muted-foreground">No logo</span>
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-1">
                                                <input
                                                    ref={fileRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileRef.current?.click()}
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    {currentLogoUrl ? 'Replace Logo' : 'Upload Logo'}
                                                </Button>
                                                <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP — max 2 MB</p>
                                                {errors.site_logo && (
                                                    <p className="text-sm text-destructive">{errors.site_logo}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Site title */}
                                    <div className="space-y-2">
                                        <Label htmlFor="site_title">Site Title</Label>
                                        <Input
                                            id="site_title"
                                            type="text"
                                            placeholder="e.g. My Awesome Store"
                                            value={data.site_title}
                                            onChange={e => setData('site_title', e.target.value)}
                                        />
                                        {errors.site_title && (
                                            <p className="text-sm text-destructive">{errors.site_title}</p>
                                        )}
                                    </div>

                                    {/* Site subtitle */}
                                    <div className="space-y-2">
                                        <Label htmlFor="site_subtitle">Site Subtitle / Tagline</Label>
                                        <Input
                                            id="site_subtitle"
                                            type="text"
                                            placeholder="e.g. Best deals, fastest delivery"
                                            value={data.site_subtitle}
                                            onChange={e => setData('site_subtitle', e.target.value)}
                                        />
                                        {errors.site_subtitle && (
                                            <p className="text-sm text-destructive">{errors.site_subtitle}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <Label htmlFor="site_phone">Phone Number</Label>
                                        <Input
                                            id="site_phone"
                                            type="text"
                                            placeholder="e.g. +8801XXXXXXXXX"
                                            value={data.site_phone}
                                            onChange={e => setData('site_phone', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Shown on the floating call button.</p>
                                        {errors.site_phone && (
                                            <p className="text-sm text-destructive">{errors.site_phone}</p>
                                        )}
                                    </div>

                                    {/* WhatsApp */}
                                    <div className="space-y-2">
                                        <Label htmlFor="site_whatsapp">WhatsApp Number</Label>
                                        <Input
                                            id="site_whatsapp"
                                            type="text"
                                            placeholder="e.g. 8801XXXXXXXXX (digits only for wa.me link)"
                                            value={data.site_whatsapp}
                                            onChange={e => setData('site_whatsapp', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Used for the floating WhatsApp button. Enter digits only (no + or spaces) for a direct wa.me link.</p>
                                        {errors.site_whatsapp && (
                                            <p className="text-sm text-destructive">{errors.site_whatsapp}</p>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving…' : 'Save Changes'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info card */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Where it appears</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>• <strong>Logo</strong> — shown in the shop header and admin sidebar.</p>
                                <p>• <strong>Title</strong> — shown in the header beside the logo and in the footer copyright.</p>
                                <p>• <strong>Subtitle</strong> — shown in the footer.</p>
                                <p>• <strong>Phone</strong> — powers the floating call button.</p>
                                <p>• <strong>WhatsApp</strong> — powers the floating WhatsApp button.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
