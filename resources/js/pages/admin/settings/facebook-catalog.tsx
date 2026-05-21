import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Copy, ExternalLink, Rss, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    catalogEnabled: boolean;
    fbBusinessId: string;
    fbCatalogId: string;
    fbCatalogCurrency: string;
    fbCatalogBrand: string;
    feedUrl: string;
};

export default function FacebookCatalogSettings() {
    useFlashToast();
    const { catalogEnabled, fbBusinessId, fbCatalogId, fbCatalogCurrency, fbCatalogBrand, feedUrl } =
        usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm({
        fb_catalog_enabled: catalogEnabled ?? false,
        fb_business_id: fbBusinessId ?? '',
        fb_catalog_id: fbCatalogId ?? '',
        fb_catalog_currency: fbCatalogCurrency ?? 'BDT',
        fb_catalog_brand: fbCatalogBrand ?? '',
    });

    const [copied, setCopied] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/facebook-catalog');
    }

    function copyFeedUrl() {
        navigator.clipboard.writeText(feedUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <>
            <Head title="Facebook Catalog Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Facebook Catalog</h2>
                    <p className="text-muted-foreground">
                        Configure your Facebook Product Catalog feed for dynamic ads and shop integration.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Enable/Disable */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Rss className="h-5 w-5" />
                                        Catalog Feed
                                    </CardTitle>
                                    <CardDescription>
                                        Enable the product catalog XML feed for Facebook. When enabled, all in-stock
                                        products will be available at the feed URL below.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="fb_catalog_enabled"
                                            checked={data.fb_catalog_enabled}
                                            onCheckedChange={(checked) => setData('fb_catalog_enabled', checked === true)}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="fb_catalog_enabled">Enable Catalog Feed</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Turn on to make your product feed accessible to Facebook.
                                            </p>
                                        </div>
                                    </div>

                                    {data.fb_catalog_enabled && (
                                        <div className="space-y-2">
                                            <Label>Feed URL</Label>
                                            <div className="flex gap-2">
                                                <Input value={feedUrl} readOnly className="font-mono text-sm" />
                                                <Button type="button" variant="outline" size="icon" onClick={copyFeedUrl}>
                                                    {copied ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Use this URL in Facebook Commerce Manager as a Data Feed source.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Facebook IDs */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingBag className="h-5 w-5" />
                                        Facebook Business Details
                                    </CardTitle>
                                    <CardDescription>
                                        Optional — enter your Facebook Business and Catalog IDs for reference. These are
                                        not required for the feed to work but help keep your configuration organized.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fb_business_id">Business ID</Label>
                                        <Input
                                            id="fb_business_id"
                                            placeholder="e.g. 123456789012345"
                                            value={data.fb_business_id}
                                            onChange={(e) => setData('fb_business_id', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.fb_business_id && (
                                            <p className="text-sm text-destructive">{errors.fb_business_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fb_catalog_id">Catalog ID</Label>
                                        <Input
                                            id="fb_catalog_id"
                                            placeholder="e.g. 987654321098765"
                                            value={data.fb_catalog_id}
                                            onChange={(e) => setData('fb_catalog_id', e.target.value.trim())}
                                            className="font-mono"
                                        />
                                        {errors.fb_catalog_id && (
                                            <p className="text-sm text-destructive">{errors.fb_catalog_id}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="fb_catalog_currency">Currency Code</Label>
                                            <Input
                                                id="fb_catalog_currency"
                                                placeholder="BDT"
                                                value={data.fb_catalog_currency}
                                                onChange={(e) =>
                                                    setData('fb_catalog_currency', e.target.value.trim().toUpperCase())
                                                }
                                                maxLength={5}
                                            />
                                            {errors.fb_catalog_currency && (
                                                <p className="text-sm text-destructive">{errors.fb_catalog_currency}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                ISO 4217 currency code (e.g. BDT, USD, EUR).
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="fb_catalog_brand">Brand Name</Label>
                                            <Input
                                                id="fb_catalog_brand"
                                                placeholder="Your Brand Name"
                                                value={data.fb_catalog_brand}
                                                onChange={(e) => setData('fb_catalog_brand', e.target.value)}
                                            />
                                            {errors.fb_catalog_brand && (
                                                <p className="text-sm text-destructive">{errors.fb_catalog_brand}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Falls back to your site title if left empty.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : 'Save Settings'}
                            </Button>
                        </form>
                    </div>

                    {/* Info sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Feed Includes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {[
                                        'Product ID & Title',
                                        'Description (cleaned)',
                                        'Price & Sale Price',
                                        'Availability Status',
                                        'Product Images',
                                        'Product Link (SEO slug)',
                                        'Brand Name',
                                        'Category / Product Type',
                                        'Variant Size & Color',
                                        'Item Group ID (variants)',
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How to Connect</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Go to Facebook Commerce Manager</p>
                                <p>2. Create or select a Catalog</p>
                                <p>3. Go to Data Sources → Data Feed</p>
                                <p>4. Choose &quot;Scheduled Feed&quot;</p>
                                <p>5. Paste your Feed URL and set schedule</p>
                                <p>6. Facebook will fetch products automatically</p>
                                <a
                                    href="https://business.facebook.com/commerce"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                    Open Commerce Manager <ExternalLink className="h-3 w-3" />
                                </a>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Feed Format</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    The feed is generated as an <strong>XML RSS 2.0</strong> file compatible with
                                    Facebook&apos;s product catalog specifications.
                                </p>
                                <p>
                                    Products with variants (size/color) are listed as separate items with a shared{' '}
                                    <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">item_group_id</code>.
                                </p>
                                <p>The feed is cached for 15 minutes for performance.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
