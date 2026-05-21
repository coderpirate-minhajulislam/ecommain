import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Package, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    clientId: string;
    clientSecret: string;
    clientContext: string;
    isSandbox: boolean;
    isConnected: boolean;
};

export default function CarrybeeSettings() {
    const { clientId, clientSecret, clientContext, isSandbox, isConnected } = usePage<Props>().props;

    useFlashToast();

    const { data, setData, post, processing, errors } = useForm({
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        client_context: clientContext ?? '',
        is_sandbox: isSandbox ?? false,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/carrybee');
    }

    return (
        <>
            <Head title="Carrybee Courier Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Carrybee Courier</h2>
                    <p className="text-muted-foreground">
                        Connect your store to Carrybee for seamless parcel delivery.
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
                                    Enter your Carrybee Client ID, Client Secret, and Client Context. You can find these in your Carrybee merchant portal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="client_id">Client ID</Label>
                                        <Input
                                            id="client_id"
                                            type="text"
                                            placeholder="Your Carrybee Client ID"
                                            value={data.client_id}
                                            onChange={(e) => setData('client_id', e.target.value.trim())}
                                            autoComplete="off"
                                        />
                                        {errors.client_id && (
                                            <p className="text-sm text-destructive">{errors.client_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="client_secret">Client Secret</Label>
                                        <Input
                                            id="client_secret"
                                            type="password"
                                            placeholder="Your Carrybee Client Secret"
                                            value={data.client_secret}
                                            onChange={(e) => setData('client_secret', e.target.value.trim())}
                                            autoComplete="new-password"
                                        />
                                        {errors.client_secret && (
                                            <p className="text-sm text-destructive">{errors.client_secret}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="client_context">Client Context</Label>
                                        <Input
                                            id="client_context"
                                            type="password"
                                            placeholder="Your Carrybee Client Context"
                                            value={data.client_context}
                                            onChange={(e) => setData('client_context', e.target.value.trim())}
                                            autoComplete="new-password"
                                        />
                                        {errors.client_context && (
                                            <p className="text-sm text-destructive">{errors.client_context}</p>
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
                                        ? 'Your store is connected to Carrybee. You can send orders from the order details page.'
                                        : 'Enter your credentials and click "Save & Connect" to link your Carrybee account.'}
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
                                    <p className="text-xs">sandbox.carrybee.com</p>
                                    <p className="text-xs">For testing — transactions are simulated.</p>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Production</p>
                                    <p className="text-xs">developers.carrybee.com</p>
                                    <p className="text-xs">For live operations with real data.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* How to get credentials */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How to get your credentials</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Log in to your Carrybee merchant portal</p>
                                <p>2. Navigate to <strong>API Settings</strong> or <strong>Developers</strong></p>
                                <p>3. Copy your <strong>Client ID</strong>, <strong>Client Secret</strong>, and <strong>Client Context</strong></p>
                                <p>4. Use sandbox credentials for testing</p>
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
                                        'Send orders to Carrybee from order details',
                                        'Search delivery area by name',
                                        'Select pickup store',
                                        'Normal & Express delivery types',
                                        'Track with consignment ID',
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

CarrybeeSettings.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Settings', href: '#' },
        { title: 'Carrybee Courier', href: '/admin/settings/carrybee' },
    ],
};
