import { Head, useForm, usePage } from '@inertiajs/react';
import { Globe, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    siteMetaTitle: string;
    siteMetaDescription: string;
    siteMetaKeywords: string;
    ogImage: string;
    robotsTxt: string;
    seoMetaTags: string[];
};

export default function SeoSettings() {
    useFlashToast();

    const { siteMetaTitle, siteMetaDescription, siteMetaKeywords, ogImage, robotsTxt, seoMetaTags } =
        usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm<{
        site_meta_title: string;
        site_meta_description: string;
        site_meta_keywords: string;
        robots_txt: string;
        og_image: File | null;
        meta_tags: string[];
    }>({
        site_meta_title: siteMetaTitle ?? '',
        site_meta_description: siteMetaDescription ?? '',
        site_meta_keywords: siteMetaKeywords ?? '',
        robots_txt: robotsTxt ?? "User-agent: *\nAllow: /",
        og_image: null,
        meta_tags: seoMetaTags ?? [],
    });

    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;

        setData('og_image', file);

        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(null);
        }
    }

    function clearOgImage() {
        setData('og_image', null);
        setPreview(null);

        if (fileRef.current) {
            fileRef.current.value = '';
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/seo');
    }

    const currentOgImageUrl = preview ?? (ogImage ? `/${ogImage}` : null);
    const titleLength = data.site_meta_title.length;
    const descLength = data.site_meta_description.length;

    return (
        <>
            <Head title="SEO Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">SEO Settings</h2>
                    <p className="text-muted-foreground">
                        Manage site-wide meta tags, Open Graph image and robots.txt for search engines.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-5 w-5" />
                                    Default Meta Tags
                                </CardTitle>
                                <CardDescription>
                                    These are used as fallback values for all pages that don't have their own SEO settings.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="site_meta_title">
                                            Meta Title{' '}
                                            <span
                                                className={`text-xs font-normal ${titleLength > 60 ? 'text-destructive' : 'text-muted-foreground'}`}
                                            >
                                                ({titleLength}/60)
                                            </span>
                                        </Label>
                                        <Input
                                            id="site_meta_title"
                                            placeholder="My Organic Shop – Fresh & Natural Products"
                                            value={data.site_meta_title}
                                            onChange={(e) => setData('site_meta_title', e.target.value)}
                                        />
                                        {errors.site_meta_title && (
                                            <p className="text-sm text-destructive">{errors.site_meta_title}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Recommended: 50–60 characters.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="site_meta_description">
                                            Meta Description{' '}
                                            <span
                                                className={`text-xs font-normal ${descLength > 160 ? 'text-destructive' : 'text-muted-foreground'}`}
                                            >
                                                ({descLength}/160)
                                            </span>
                                        </Label>
                                        <Textarea
                                            id="site_meta_description"
                                            placeholder="Shop 100% organic, fresh and natural products delivered to your door."
                                            value={data.site_meta_description}
                                            onChange={(e) => setData('site_meta_description', e.target.value)}
                                            rows={3}
                                        />
                                        {errors.site_meta_description && (
                                            <p className="text-sm text-destructive">{errors.site_meta_description}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Recommended: 120–160 characters. Shown in search results.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="site_meta_keywords">Meta Keywords</Label>
                                        <Input
                                            id="site_meta_keywords"
                                            placeholder="organic, natural, fresh produce, healthy food"
                                            value={data.site_meta_keywords}
                                            onChange={(e) => setData('site_meta_keywords', e.target.value)}
                                        />
                                        {errors.site_meta_keywords && (
                                            <p className="text-sm text-destructive">{errors.site_meta_keywords}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Comma-separated keywords. Less important for modern SEO but still useful.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <Label>Additional Meta Tags</Label>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                                                onClick={() => setData('meta_tags', [...data.meta_tags, ''])}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Tag
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Add any site-wide &lt;meta&gt; tags such as Google site verification, search console domain verification, or other verification tags. Enter the full tag markup.
                                        </p>
                                        <div className="space-y-3">
                                            {data.meta_tags.map((tag, index) => (
                                                <div key={index} className="rounded-lg border border-border bg-surface p-3">
                                                    <div className="mb-2 flex items-center justify-between gap-3">
                                                        <p className="text-sm font-medium">Meta Tag {index + 1}</p>
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-2 text-sm text-destructive hover:text-destructive/80"
                                                            onClick={() => {
                                                                const nextTags = [...data.meta_tags];
                                                                nextTags.splice(index, 1);
                                                                setData('meta_tags', nextTags);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <Textarea
                                                        id={`meta_tags[${index}]`}
                                                        placeholder='<meta name="google-site-verification" content="..." />'
                                                        value={tag}
                                                        onChange={(e) => {
                                                            const nextTags = [...data.meta_tags];
                                                            nextTags[index] = e.target.value;
                                                            setData('meta_tags', nextTags);
                                                        }}
                                                        rows={3}
                                                        className="font-mono text-xs"
                                                    />
                                                    {errors[`meta_tags.${index}`] && (
                                                        <p className="mt-1 text-sm text-destructive">{errors[`meta_tags.${index}`]}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* OG Image */}
                                    <div className="space-y-2">
                                        <Label>Default Open Graph Image</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Shown when your site is shared on Facebook, Twitter, WhatsApp, etc.
                                            Recommended size: 1200×630px.
                                        </p>
                                        <div className="flex items-start gap-4">
                                            {currentOgImageUrl ? (
                                                <div className="relative w-48 overflow-hidden rounded-md border bg-muted/30">
                                                    <img
                                                        src={currentOgImageUrl}
                                                        alt="OG image preview"
                                                        className="w-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={clearOgImage}
                                                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex h-24 w-48 items-center justify-center rounded-md border border-dashed bg-muted/30">
                                                    <span className="text-xs text-muted-foreground">No image</span>
                                                </div>
                                            )}
                                            <div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileRef.current?.click()}
                                                    className="gap-2"
                                                >
                                                    <Upload className="h-4 w-4" />
                                                    {currentOgImageUrl ? 'Change Image' : 'Upload Image'}
                                                </Button>
                                                <input
                                                    ref={fileRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                                {errors.og_image && (
                                                    <p className="mt-1 text-sm text-destructive">{errors.og_image}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Robots.txt */}
                                    <div className="space-y-2">
                                        <Label htmlFor="robots_txt">robots.txt Content</Label>
                                        <Textarea
                                            id="robots_txt"
                                            value={data.robots_txt}
                                            onChange={(e) => setData('robots_txt', e.target.value)}
                                            rows={5}
                                            className="font-mono text-xs"
                                        />
                                        {errors.robots_txt && (
                                            <p className="text-sm text-destructive">{errors.robots_txt}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Controls which pages search engine crawlers can access. The file is served at{' '}
                                            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">/robots.txt</code>.
                                        </p>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save SEO Settings'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar tips */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Globe className="h-4 w-4" />
                                    SEO Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    <strong className="text-foreground">Meta Title</strong> — Use your main keyword
                                    near the start. Keep it under 60 characters.
                                </p>
                                <p>
                                    <strong className="text-foreground">Meta Description</strong> — Write a compelling
                                    summary with a call-to-action. Appears in Google search snippets.
                                </p>
                                <p>
                                    <strong className="text-foreground">OG Image</strong> — Used by social platforms
                                    when your URL is shared. 1200×630 px, under 1 MB.
                                </p>
                                <p>
                                    <strong className="text-foreground">Per-product SEO</strong> — Override these
                                    defaults on each product's edit page.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Google Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
                                    <p className="text-xs text-green-700 dark:text-green-400 truncate">
                                        {window.location.origin}
                                    </p>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 leading-snug line-clamp-1">
                                        {data.site_meta_title || 'Your Site Title'}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {data.site_meta_description || 'Your meta description will appear here in search results.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

SeoSettings.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Settings', href: '#' },
        { title: 'SEO', href: '/admin/settings/seo' },
    ],
};
