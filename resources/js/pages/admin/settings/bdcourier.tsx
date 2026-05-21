import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Link2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    apiKey: string;
    isConnected: boolean;
    minSuccessRatio: number;
    blockZeroRatio: boolean;
    codRestrictedMessage: string;
};

export default function BdcourierSettings() {
    const { apiKey, isConnected, minSuccessRatio, blockZeroRatio, codRestrictedMessage } = usePage<Props>().props;

    useFlashToast();

    const { data, setData, post, processing, errors } = useForm({
        api_key: apiKey ?? '',
        min_success_ratio: minSuccessRatio ?? 0,
        block_zero_ratio: blockZeroRatio ?? false,
        cod_restricted_message: codRestrictedMessage ?? 'Based on your phone number history, Cash on Delivery is not available. Please select a payment method below.',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/bdcourier');
    }

    return (
        <>
            <Head title="BD Courier Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">BD Courier</h2>
                    <p className="text-muted-foreground">
                        Connect your store to BD Courier to check customer order success ratios.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="h-5 w-5" />
                                    API Key
                                </CardTitle>
                                <CardDescription>
                                    Enter your BD Courier API key from{' '}
                                    <span className="font-medium">api.bdcourier.com</span>. This is used to
                                    check courier order ratio by customer phone number.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="api_key">API Key</Label>
                                        <Input
                                            id="api_key"
                                            type="password"
                                            placeholder="Your BD Courier API key"
                                            value={data.api_key}
                                            onChange={(e) => setData('api_key', e.target.value.trim())}
                                            autoComplete="new-password"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Your API key is stored securely and used to authenticate requests to{' '}
                                            <span className="font-medium">api.bdcourier.com</span>.
                                        </p>
                                        {errors.api_key && (
                                            <p className="text-sm text-destructive">{errors.api_key}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="min_success_ratio">Minimum Success Ratio (%)</Label>
                                        <Input
                                            id="min_success_ratio"
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder="0"
                                            value={data.min_success_ratio}
                                            onChange={(e) => setData('min_success_ratio', parseInt(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            If a customer's success ratio is below this percentage, they will be blocked from using Cash on Delivery and must use a payment method that requires payment details. Set to 0 to disable.
                                        </p>
                                        {errors.min_success_ratio && (
                                            <p className="text-sm text-destructive">{errors.min_success_ratio}</p>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="block_zero_ratio"
                                            checked={data.block_zero_ratio}
                                            onCheckedChange={(checked) => setData('block_zero_ratio', !!checked)}
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="block_zero_ratio" className="cursor-pointer">
                                                Block customers with 0% success ratio
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                When enabled, customers whose success ratio is exactly 0% will always be blocked from using Cash on Delivery, regardless of the minimum ratio setting above.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cod_restricted_message">COD Restricted Message</Label>
                                        <Input
                                            id="cod_restricted_message"
                                            type="text"
                                            placeholder="Based on your phone number history, Cash on Delivery is not available."
                                            value={data.cod_restricted_message}
                                            onChange={(e) => setData('cod_restricted_message', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This message is shown to customers when Cash on Delivery is blocked due to low success ratio.
                                        </p>
                                        {errors.cod_restricted_message && (
                                            <p className="text-sm text-destructive">{errors.cod_restricted_message}</p>
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
                                        ? 'Your API key is configured. You can check courier ratios from order detail pages.'
                                        : 'Enter your API key and click "Save & Connect" to enable courier checks.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">How to get your API key</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Visit <strong>api.bdcourier.com</strong></p>
                                <p>2. Sign in to your BD Courier account</p>
                                <p>3. Navigate to <strong>API Settings</strong></p>
                                <p>4. Copy your <strong>API Key</strong> and paste it above</p>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">What this enables</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {[
                                        'Check order success ratio per customer phone',
                                        'View data across Pathao, Steadfast, Redx, PaperFly & more',
                                        'Identify fraud-reported numbers',
                                        'See total, success and cancelled parcel counts',
                                    ].map((f) => (
                                        <li key={f} className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
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

BdcourierSettings.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Settings', href: '#' },
        { title: 'BD Courier', href: '/admin/settings/bdcourier' },
    ],
};
