import { Head, useForm, usePage } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function TopbarSettings() {
    useFlashToast();
    const { topbarText } = usePage<{ topbarText: string }>().props;

    const { data, setData, post, processing, errors } = useForm({
        topbar_text: topbarText ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/topbar');
    }

    return (
        <>
            <Head title="Top Bar Text" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Top Bar Text</h2>
                    <p className="text-muted-foreground">
                        Set the scrolling marquee text displayed in the shop top bar. Leave empty to hide the bar.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Megaphone className="h-5 w-5" />
                                    Top Bar Announcement
                                </CardTitle>
                                <CardDescription>
                                    This text scrolls across the top of every shop page. Leave blank to hide the bar entirely.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="topbar_text">Announcement Text</Label>
                                        <Input
                                            id="topbar_text"
                                            type="text"
                                            placeholder="e.g. Free shipping on orders over ৳500 — Shop now!"
                                            value={data.topbar_text}
                                            onChange={e => setData('topbar_text', e.target.value)}
                                        />
                                        {errors.topbar_text && (
                                            <p className="text-sm text-destructive">{errors.topbar_text}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            The text will scroll from right to left across the top bar as a marquee.
                                        </p>
                                    </div>

                                    {/* Live preview */}
                                    {data.topbar_text && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">Preview</p>
                                            <div className="bg-primary overflow-hidden rounded py-1.5 text-xs text-primary-foreground">
                                                <span className="inline-block whitespace-nowrap animate-marquee">
                                                    {data.topbar_text}
                                                </span>
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
                                <p>• Use short, impactful messages for best results.</p>
                                <p>• Emojis work great in the top bar.</p>
                                <p>• Leave the field empty to completely hide the top bar.</p>
                                <p>• Changes take effect immediately for all visitors.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
