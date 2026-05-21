import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Copy, Eye, EyeOff, Package, RefreshCw, Webhook, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { toast } from 'sonner';

type Props = {
    apiKey: string;
    isConnected: boolean;
    callbackUrl: string;
    webhookToken: string;
};

export default function SteadfastSettings() {
    const { apiKey, isConnected, callbackUrl, webhookToken } = usePage<Props>().props;

    useFlashToast();

    const { data, setData, post, processing, errors } = useForm({
        api_key: apiKey ?? '',
        secret_key: '',
        webhook_token: webhookToken ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/steadfast');
    }

    const [showToken, setShowToken] = useState(false);

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Copied to clipboard!');
        });
    }

    function generateToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const token = Array.from(array)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        setData('webhook_token', token);
        setShowToken(true);
        toast.success('New token generated! Save your settings to apply it.');
    }

    return (
        <>
            <Head title="Steadfast Courier Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Steadfast Courier</h2>
                    <p className="text-muted-foreground">
                        Connect your store to Steadfast Courier for order delivery management.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2 space-y-6">
                        {/* API Credentials */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    API Credentials
                                </CardTitle>
                                <CardDescription>
                                    Enter your Steadfast API credentials. These can be found in your Steadfast merchant portal (portal.packzy.com).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="api_key">API Key</Label>
                                        <Input
                                            id="api_key"
                                            placeholder="Your Steadfast API Key"
                                            value={data.api_key}
                                            onChange={(e) => setData('api_key', e.target.value.trim())}
                                            autoComplete="off"
                                        />
                                        {errors.api_key && (
                                            <p className="text-sm text-destructive">{errors.api_key}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="secret_key">Secret Key</Label>
                                        <Input
                                            id="secret_key"
                                            type="password"
                                            placeholder="Your Steadfast Secret Key"
                                            value={data.secret_key}
                                            onChange={(e) => setData('secret_key', e.target.value.trim())}
                                            autoComplete="new-password"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter your secret key to verify and update credentials. Leave blank to keep existing secret key.
                                        </p>
                                        {errors.secret_key && (
                                            <p className="text-sm text-destructive">{errors.secret_key}</p>
                                        )}
                                    </div>

                                    {/* Webhook Integration */}
                                    <div className="border-t pt-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Webhook className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">Webhook Integration</span>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="callback_url">Callback URL</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="callback_url"
                                                    readOnly
                                                    value={callbackUrl}
                                                    className="bg-muted font-mono text-xs"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => copyToClipboard(callbackUrl)}
                                                    title="Copy Callback URL"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Copy this URL and paste it in your Steadfast webhook settings at portal.packzy.com.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="webhook_token">Auth Token (Bearer)</Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={generateToken}
                                                    className="h-7 gap-1.5 text-xs"
                                                >
                                                    <RefreshCw className="h-3 w-3" />
                                                    Generate
                                                </Button>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="webhook_token"
                                                    type={showToken ? 'text' : 'password'}
                                                    placeholder="Type Auth Token here"
                                                    value={data.webhook_token}
                                                    onChange={(e) => setData('webhook_token', e.target.value.trim())}
                                                    autoComplete="new-password"
                                                    className="font-mono text-xs"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setShowToken((v) => !v)}
                                                    title={showToken ? 'Hide token' : 'Show token'}
                                                >
                                                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => copyToClipboard(data.webhook_token)}
                                                    disabled={!data.webhook_token}
                                                    title="Copy token"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Click <strong>Generate</strong> to create a random token, or type your own. Enter the same token in Steadfast's webhook Auth Token field. Leave blank to keep existing token.
                                            </p>
                                            {errors.webhook_token && (
                                                <p className="text-sm text-destructive">{errors.webhook_token}</p>
                                            )}
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving & Connecting…' : 'Save & Connect'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info sidebar */}
                    <div className="space-y-4">
                        {/* Connection status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Connection Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isConnected ? (
                                    <div className="flex items-center gap-2 font-medium text-green-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Connected
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 font-medium text-muted-foreground">
                                        <XCircle className="h-5 w-5" />
                                        Not Connected
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {isConnected
                                        ? 'Your store is connected to Steadfast Courier. You can send orders from the order details page.'
                                        : 'Enter your credentials and click "Save & Connect" to link your Steadfast account.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How to get credentials</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Log in to <strong>portal.packzy.com</strong></p>
                                <p>2. Navigate to your API credentials section</p>
                                <p>3. Copy your <strong>API Key</strong> and <strong>Secret Key</strong></p>
                            </CardContent>
                        </Card>

                        {/* Webhook Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How to set up webhook</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Create a random secret token (e.g. a strong password) and enter it in the <strong>Auth Token</strong> field above</p>
                                <p>2. Save the settings</p>
                                <p>3. Log in to <strong>portal.packzy.com</strong></p>
                                <p>4. Go to <strong>Webhook Settings</strong></p>
                                <p>5. Paste your <strong>Callback URL</strong></p>
                                <p>6. Enter the same token in Steadfast's <strong>Auth Token</strong> field</p>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Features</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {[
                                        'Send orders to Steadfast from order details',
                                        'Automatic COD amount from order total',
                                        'Track consignment ID and tracking code',
                                        'Home delivery or hub pick-up options',
                                        'Auto-update order status from webhook',
                                    ].map((f) => (
                                        <li key={f} className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

SteadfastSettings.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Settings', href: '#' },
        { title: 'Steadfast Courier', href: '/admin/settings/steadfast' },
    ],
};
