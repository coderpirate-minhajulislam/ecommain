import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function FreeShippingSettings() {
    useFlashToast();
    const { freeShippingAmount, freeShippingEnabled } = usePage<{ freeShippingAmount: number; freeShippingEnabled: boolean }>().props;

    const { data, setData, post, processing, errors } = useForm({
        free_shipping_enabled: freeShippingEnabled ?? true,
        free_shipping_amount: freeShippingAmount ?? 0,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/free-shipping');
    }

    const isActive = data.free_shipping_enabled && data.free_shipping_amount > 0;

    return (
        <>
            <Head title="Free Shipping Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Free Shipping</h2>
                    <p className="text-muted-foreground">
                        Set a minimum order amount to offer free shipping to customers.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Free Shipping Settings
                                </CardTitle>
                                <CardDescription>
                                    Enable and set the minimum subtotal required for free shipping on the cart and checkout pages.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Active toggle */}
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <p className="text-sm font-medium">Free Shipping Active</p>
                                            <p className="text-xs text-muted-foreground">Turn on/off the free shipping feature globally</p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={data.free_shipping_enabled}
                                            onClick={() => setData('free_shipping_enabled', !data.free_shipping_enabled)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.free_shipping_enabled ? 'bg-primary' : 'bg-input'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.free_shipping_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {/* Amount */}
                                    <div className="space-y-2">
                                        <Label htmlFor="free_shipping_amount">Minimum Order Amount (৳)</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">৳</span>
                                                <Input
                                                    id="free_shipping_amount"
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    placeholder="e.g. 500"
                                                    value={data.free_shipping_amount}
                                                    onChange={(e) => setData('free_shipping_amount', parseInt(e.target.value) || 0)}
                                                    className="pl-7"
                                                    disabled={!data.free_shipping_enabled}
                                                />
                                            </div>
                                            {isActive && (
                                                <div className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Active
                                                </div>
                                            )}
                                        </div>
                                        {errors.free_shipping_amount && (
                                            <p className="text-sm text-destructive">{errors.free_shipping_amount}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Customers spending at least this amount get free shipping.
                                        </p>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving…' : 'Save Settings'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info panel */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Package className="h-4 w-4" />
                                    How It Works
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    When enabled and the customer's cart subtotal reaches the threshold, shipping charges are automatically waived.
                                </p>
                                <p>
                                    A progress banner is shown on the <strong>Cart</strong> and <strong>Checkout</strong> pages.
                                </p>
                                <p>
                                    For <strong>Landing Pages</strong>, you can override this setting per page (Enabled / Disabled / Use Global).
                                </p>
                            </CardContent>
                        </Card>

                        {isActive && (
                            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <div>
                                            <p className="text-sm font-semibold">Free shipping is active</p>
                                            <p className="text-xs">Orders above ৳{data.free_shipping_amount} get free shipping.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

