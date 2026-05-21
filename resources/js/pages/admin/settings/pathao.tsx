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
    username: string;
    isConnected: boolean;
};

export default function PathaoSettings() {
    const { clientId, clientSecret, username, isConnected } = usePage<Props>().props;

    useFlashToast();

    const { data, setData, post, processing, errors } = useForm({
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        username: username ?? '',
        password: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/pathao');
    }

    return (
        <>
            <Head title="Pathao Courier Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pathao Courier</h2>
                    <p className="text-muted-foreground">
                        Connect your store to Pathao Courier for order delivery management.
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
                                    Enter your Pathao Merchant API credentials. These can be found in the merchant portal under API Credentials.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="client_id">Client ID</Label>
                                        <Input
                                            id="client_id"
                                            placeholder="Your Pathao Client ID"
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
                                            placeholder="Your Pathao Client Secret"
                                            value={data.client_secret}
                                            onChange={(e) => setData('client_secret', e.target.value.trim())}
                                            autoComplete="new-password"
                                        />
                                        {errors.client_secret && (
                                            <p className="text-sm text-destructive">{errors.client_secret}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username">Login Email</Label>
                                        <Input
                                            id="username"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value.trim())}
                                            autoComplete="email"
                                        />
                                        {errors.username && (
                                            <p className="text-sm text-destructive">{errors.username}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Login Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Your Pathao account password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter your password to verify and update credentials. Leave blank to keep existing password.
                                        </p>
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password}</p>
                                        )}
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
                                    <div className="flex items-center gap-2 text-green-600 font-medium">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Connected
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                        <XCircle className="h-5 w-5" />
                                        Not Connected
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {isConnected
                                        ? 'Your store is connected to Pathao Courier. You can send orders from the order details page.'
                                        : 'Enter your credentials and click "Save & Connect" to link your Pathao account.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How to get credentials</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Log in to your Pathao Merchant Portal</p>
                                <p>2. Navigate to <strong>API Credentials</strong> section</p>
                                <p>3. Copy your <strong>Client ID</strong> and <strong>Client Secret</strong></p>
                                <p>4. Use your merchant account email and password</p>
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
                                        'Send orders to Pathao from order details',
                                        'Select your pickup store',
                                        'Automatic token refresh',
                                        'Track consignment ID',
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

PathaoSettings.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Settings', href: '#' },
        { title: 'Pathao Courier', href: '/admin/settings/pathao' },
    ],
};
