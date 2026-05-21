import { Head, useForm, usePage } from '@inertiajs/react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function ShippingReturnPolicy() {
    useFlashToast();
    const { shippingReturnPolicy } = usePage<{ shippingReturnPolicy: string }>().props;

    const { data, setData, post, processing, errors } = useForm({
        shipping_return_policy: shippingReturnPolicy ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/shipping-return-policy');
    }

    return (
        <>
            <Head title="Shipping & Return Policy" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Shipping & Return Policy</h2>
                    <p className="text-muted-foreground">
                        Set the shipping and return policy text displayed on all product pages.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RotateCcw className="h-5 w-5" />
                                    Policy Content
                                </CardTitle>
                                <CardDescription>
                                    This text will appear under the "Shipping & Return Policy" tab on every product detail page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="shipping_return_policy">Policy Text</Label>
                                        <textarea
                                            id="shipping_return_policy"
                                            rows={12}
                                            maxLength={10000}
                                            placeholder={"e.g.\nShipping Policy:\n- We deliver within 3-5 business days inside Dhaka.\n- Outside Dhaka delivery takes 5-7 business days.\n\nReturn Policy:\n- Returns accepted within 7 days of delivery.\n- Items must be unused and in original packaging."}
                                            value={data.shipping_return_policy}
                                            onChange={e => setData('shipping_return_policy', e.target.value)}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        {errors.shipping_return_policy && (
                                            <p className="text-sm text-destructive">{errors.shipping_return_policy}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {data.shipping_return_policy.length}/10000 — Line breaks will be preserved on the product page.
                                        </p>
                                    </div>

                                    {/* Live preview */}
                                    {data.shipping_return_policy && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">Preview</p>
                                            <div className="rounded-lg border border-border bg-muted/30 p-4">
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                                    {data.shipping_return_policy}
                                                </p>
                                            </div>
                                        </div>
                                    )}

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
                                <CardTitle className="text-sm">Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>• This policy applies to all products globally.</p>
                                <p>• Use line breaks to organize sections clearly.</p>
                                <p>• Include both shipping timelines and return conditions.</p>
                                <p>• Leave empty to hide the tab on product pages.</p>
                                <p>• Changes take effect immediately.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
