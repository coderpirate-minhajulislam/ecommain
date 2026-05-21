import { Head, useForm, usePage } from '@inertiajs/react';
import { Construction, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    enabled: boolean;
    maintenanceTitle: string;
    maintenanceMessage: string;
};

export default function MaintenanceSettings() {
    useFlashToast();
    const { enabled, maintenanceTitle, maintenanceMessage } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm({
        enabled: enabled,
        maintenance_title: maintenanceTitle ?? '',
        maintenance_message: maintenanceMessage ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/settings/maintenance');
    }

    return (
        <>
            <Head title="Maintenance Mode" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Maintenance Mode</h2>
                    <p className="text-muted-foreground">
                        Enable maintenance mode to block all public pages. Only super admins can access the site while active.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Construction className="h-5 w-5" />
                                    Maintenance Settings
                                </CardTitle>
                                <CardDescription>
                                    When enabled, all visitors will see the maintenance page instead of the site.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Toggle */}
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="enabled" className="text-base font-medium">
                                                Maintenance Mode
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {data.enabled
                                                    ? 'Site is currently in maintenance mode'
                                                    : 'Site is live and accessible to everyone'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={data.enabled}
                                            onClick={() => setData('enabled', !data.enabled)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${data.enabled ? 'bg-primary' : 'bg-input'}`}
                                        >
                                            <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-2">
                                        <Label htmlFor="maintenance_title">Page Title</Label>
                                        <Input
                                            id="maintenance_title"
                                            type="text"
                                            placeholder="We'll Be Back Soon"
                                            value={data.maintenance_title}
                                            onChange={(e) => setData('maintenance_title', e.target.value)}
                                        />
                                        {errors.maintenance_title && (
                                            <p className="text-sm text-destructive">{errors.maintenance_title}</p>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <Label htmlFor="maintenance_message">Page Message</Label>
                                        <textarea
                                            id="maintenance_message"
                                            placeholder="Our site is currently undergoing scheduled maintenance..."
                                            value={data.maintenance_message}
                                            onChange={(e) => setData('maintenance_message', e.target.value)}
                                            rows={4}
                                            className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        {errors.maintenance_message && (
                                            <p className="text-sm text-destructive">{errors.maintenance_message}</p>
                                        )}
                                    </div>

                                    {/* Preview */}
                                    {(data.maintenance_title || data.maintenance_message) && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">Preview</p>
                                            <div className="rounded-lg border bg-muted/50 p-8 text-center">
                                                <Construction className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <h3 className="mt-4 text-xl font-bold">
                                                    {data.maintenance_title || "We'll Be Back Soon"}
                                                </h3>
                                                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                                                    {data.maintenance_message}
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

                    {/* Status card */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Current Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    {data.enabled ? (
                                        <>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                                <PowerOff className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-red-600 dark:text-red-400">Maintenance Active</p>
                                                <p className="text-xs text-muted-foreground">Site is offline for visitors</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                                <Power className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-green-600 dark:text-green-400">Site is Live</p>
                                                <p className="text-xs text-muted-foreground">All pages accessible</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>• Super admins can always access the site.</p>
                                <p>• All public pages (home, products, checkout, etc.) will be blocked.</p>
                                <p>• Admin and manager dashboards remain accessible via direct login.</p>
                                <p>• Landing pages are also blocked during maintenance.</p>
                                <p>• Changes take effect immediately.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
