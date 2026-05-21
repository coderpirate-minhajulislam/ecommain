import { Head, useForm, usePage } from '@inertiajs/react';
import { BarChart3, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GtmSettings() {
    const { gtmId } = usePage<{ gtmId: string }>().props;

    const { data, setData, post, processing, errors } = useForm({
        gtm_id: gtmId ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/gtm');
    }

    const isConnected = Boolean(data.gtm_id && data.gtm_id.startsWith('GTM-'));

    return (
        <>
            <Head title="GTM Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Google Tag Manager</h2>
                    <p className="text-muted-foreground">
                        Connect your store to Google Tag Manager to track ecommerce events.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    GTM Container ID
                                </CardTitle>
                                <CardDescription>
                                    Enter your GTM Container ID (e.g.{' '}
                                    <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">GTM-XXXXXXX</code>
                                    ). Leave empty to disable GTM.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gtm_id">Container ID</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="gtm_id"
                                                placeholder="GTM-XXXXXXX"
                                                value={data.gtm_id}
                                                onChange={(e) =>
                                                    setData('gtm_id', e.target.value.trim().toUpperCase())
                                                }
                                                className="font-mono"
                                            />
                                            {isConnected && (
                                                <div className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Connected
                                                </div>
                                            )}
                                        </div>
                                        {errors.gtm_id && (
                                            <p className="text-sm text-destructive">{errors.gtm_id}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Format: <code className="font-mono">GTM-</code> followed by alphanumeric characters.
                                        </p>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving…' : 'Save Settings'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Tracked Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {[
                                        'view_item_list',
                                        'select_item',
                                        'view_item',
                                        'add_to_cart',
                                        'remove_from_cart',
                                        'view_cart',
                                        'begin_checkout',
                                        'add_shipping_info',
                                        'add_payment_info',
                                        'purchase',
                                    ].map((ev) => (
                                        <li key={ev} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                                            <code className="font-mono text-xs">{ev}</code>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How to get your ID</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Go to tagmanager.google.com</p>
                                <p>2. Select your account &amp; container</p>
                                <p>3. Copy the Container ID from the top right (e.g. GTM-XXXXX)</p>
                                <a
                                    href="https://tagmanager.google.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                    Open GTM <ExternalLink className="h-3 w-3" />
                                </a>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
