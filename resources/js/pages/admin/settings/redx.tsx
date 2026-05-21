import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Package, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    accessToken: string;
    isSandbox: boolean;
    isConnected: boolean;
};

export default function RedxSettings() {
    const { accessToken, isSandbox, isConnected } = usePage<Props>().props;

    useFlashToast();

    const { data, setData, post, processing, errors } = useForm({
        access_token: accessToken ?? '',
        is_sandbox: isSandbox ?? false,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/redx');
    }

    return (
        <>
            <Head title="RedX Courier Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">RedX Courier</h2>
                    <p className="text-muted-foreground">
                        Connect your store to RedX Courier for seamless parcel operations.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    API Credentials
                                </CardTitle>
                                <CardDescription>
                                    Enter your RedX OpenAPI access token. You can find it in your RedX merchant portal under OpenAPI Documentation.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="access_token">API Access Token</Label>
                                        <Input
                                            id="access_token"
                                            type="password"
                                            placeholder="Your RedX API Access Token"
                                            value={data.access_token}
                                            onChange={(e) => setData('access_token', e.target.value.trim())}
                                            autoComplete="new-password"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Use the Production token for live operations. Use the Sandbox token for testing.
                                        </p>
                                        {errors.access_token && (
                                            <p className="text-sm text-destructive">{errors.access_token}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 rounded-lg border border-input p-3">
                                        <input
                                            type="checkbox"
                                            id="is_sandbox"
                                            checked={data.is_sandbox}
                                            onChange={(e) => setData('is_sandbox', e.target.checked)}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        <div>
                                            <Label htmlFor="is_sandbox" className="cursor-pointer font-medium">Use Sandbox Environment</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Enable this when testing. Disable for live (production) operations.
                                            </p>
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
                                        Connected {isSandbox && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">Sandbox</span>}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 font-medium text-muted-foreground">
                                        <XCircle className="h-5 w-5" />
                                        Not Connected
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {isConnected
                                        ? 'Your store is connected to RedX Courier. You can send orders from the order details page.'
                                        : 'Enter your API access token and click "Save & Connect" to link your RedX account.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Environments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Environments</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div>
                                    <p className="font-medium text-foreground">Sandbox</p>
                                    <p className="text-xs">sandbox.redx.com.bd/v1.0.0-beta</p>
                                    <p className="text-xs">For testing — transactions are simulated.</p>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Production</p>
                                    <p className="text-xs">openapi.redx.com.bd/v1.0.0-beta</p>
                                    <p className="text-xs">For live operations with real data.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* How to get token */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How to get your token</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Log in to your RedX Merchant Portal</p>
                                <p>2. Navigate to <strong>OpenAPI Documentation</strong></p>
                                <p>3. Find the <strong>Production</strong> section</p>
                                <p>4. Copy your <strong>API Access Token</strong></p>
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
                                        'Send orders to RedX from order details',
                                        'Select pickup store',
                                        'Search areas by district',
                                        'Track with RedX tracking ID',
                                        'Sandbox & production environments',
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

RedxSettings.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Settings', href: '#' },
        { title: 'RedX Courier', href: '/admin/settings/redx' },
    ],
};
