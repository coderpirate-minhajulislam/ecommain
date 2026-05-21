import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, Send, Server, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function EmailSettings() {
    useFlashToast();
    const props = usePage<{
        mailMailer: string;
        mailHost: string;
        mailPort: string;
        mailUsername: string;
        mailPassword: string;
        mailEncryption: string;
        mailFromAddress: string;
        mailFromName: string;
    }>().props;

    const { data, setData, post, processing, errors } = useForm({
        mail_mailer: props.mailMailer ?? 'smtp',
        mail_host: props.mailHost ?? '',
        mail_port: props.mailPort ?? '587',
        mail_username: props.mailUsername ?? '',
        mail_password: props.mailPassword ?? '',
        mail_encryption: props.mailEncryption ?? 'tls',
        mail_from_address: props.mailFromAddress ?? '',
        mail_from_name: props.mailFromName ?? '',
    });

    const [testEmail, setTestEmail] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [sendingTest, setSendingTest] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/email');
    }

    async function handleTestEmail() {
        if (!testEmail) return;
        setSendingTest(true);
        setTestResult(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch('/admin/settings/email/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ to: testEmail }),
            });
            const result = await res.json();
            setTestResult(result);
        } catch (e) {
            setTestResult({ success: false, message: e instanceof Error ? e.message : 'Network error' });
        } finally {
            setSendingTest(false);
        }
    }

    const isSmtp = data.mail_mailer === 'smtp';

    return (
        <>
            <Head title="Email Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Email Configuration</h2>
                    <p className="text-muted-foreground">
                        Configure SMTP settings for password reset emails and other notifications.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-6 md:col-span-2">
                            {/* SMTP Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Server className="h-5 w-5" />
                                        Mail Server
                                    </CardTitle>
                                    <CardDescription>
                                        SMTP credentials for sending emails (password reset, order confirmations, etc.)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mail_mailer">Mail Driver</Label>
                                        <select
                                            id="mail_mailer"
                                            value={data.mail_mailer}
                                            onChange={(e) => setData('mail_mailer', e.target.value)}
                                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                                        >
                                            <option value="smtp">SMTP</option>
                                            <option value="sendmail">Sendmail</option>
                                            <option value="log">Log (Testing)</option>
                                        </select>
                                        {errors.mail_mailer && (
                                            <p className="text-sm text-destructive">{errors.mail_mailer}</p>
                                        )}
                                    </div>

                                    {isSmtp && (
                                        <>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="mail_host">SMTP Host</Label>
                                                    <Input
                                                        id="mail_host"
                                                        value={data.mail_host}
                                                        onChange={(e) => setData('mail_host', e.target.value)}
                                                        placeholder="smtp.gmail.com"
                                                    />
                                                    {errors.mail_host && (
                                                        <p className="text-sm text-destructive">{errors.mail_host}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="mail_port">SMTP Port</Label>
                                                    <Input
                                                        id="mail_port"
                                                        type="number"
                                                        value={data.mail_port}
                                                        onChange={(e) => setData('mail_port', e.target.value)}
                                                        placeholder="587"
                                                    />
                                                    {errors.mail_port && (
                                                        <p className="text-sm text-destructive">{errors.mail_port}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="mail_username">Username</Label>
                                                    <Input
                                                        id="mail_username"
                                                        value={data.mail_username}
                                                        onChange={(e) => setData('mail_username', e.target.value)}
                                                        placeholder="your@email.com"
                                                    />
                                                    {errors.mail_username && (
                                                        <p className="text-sm text-destructive">{errors.mail_username}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="mail_password">Password</Label>
                                                    <Input
                                                        id="mail_password"
                                                        type="password"
                                                        value={data.mail_password}
                                                        onChange={(e) => setData('mail_password', e.target.value)}
                                                        placeholder="App password or SMTP password"
                                                    />
                                                    {errors.mail_password && (
                                                        <p className="text-sm text-destructive">{errors.mail_password}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="mail_encryption">Encryption</Label>
                                                <select
                                                    id="mail_encryption"
                                                    value={data.mail_encryption}
                                                    onChange={(e) => setData('mail_encryption', e.target.value)}
                                                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                                                >
                                                    <option value="tls">TLS (Recommended)</option>
                                                    <option value="ssl">SSL</option>
                                                    <option value="none">None</option>
                                                </select>
                                                {errors.mail_encryption && (
                                                    <p className="text-sm text-destructive">{errors.mail_encryption}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* From Address */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Sender Information
                                    </CardTitle>
                                    <CardDescription>
                                        The &quot;From&quot; name and email address for all outgoing emails.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="mail_from_name">From Name</Label>
                                            <Input
                                                id="mail_from_name"
                                                value={data.mail_from_name}
                                                onChange={(e) => setData('mail_from_name', e.target.value)}
                                                placeholder="My Store"
                                            />
                                            {errors.mail_from_name && (
                                                <p className="text-sm text-destructive">{errors.mail_from_name}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mail_from_address">From Email</Label>
                                            <Input
                                                id="mail_from_address"
                                                type="email"
                                                value={data.mail_from_address}
                                                onChange={(e) => setData('mail_from_address', e.target.value)}
                                                placeholder="noreply@mystore.com"
                                            />
                                            {errors.mail_from_address && (
                                                <p className="text-sm text-destructive">{errors.mail_from_address}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : 'Save Email Settings'}
                            </Button>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Test Email */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Send Test Email</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        Save settings first, then send a test email to verify your configuration.
                                    </p>
                                    <Input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="test@example.com"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={handleTestEmail}
                                        disabled={sendingTest || !testEmail}
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        {sendingTest ? 'Sending…' : 'Send Test'}
                                    </Button>
                                    {testResult && (
                                        <div className={`flex items-start gap-2 rounded-md p-2 text-xs ${testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                                            {testResult.success ? (
                                                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
                                            ) : (
                                                <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                            )}
                                            <span>{testResult.message}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Gmail Guide */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Gmail SMTP Guide</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-xs text-muted-foreground">
                                    <p><strong>Host:</strong> smtp.gmail.com</p>
                                    <p><strong>Port:</strong> 587</p>
                                    <p><strong>Encryption:</strong> TLS</p>
                                    <p><strong>Username:</strong> your@gmail.com</p>
                                    <p><strong>Password:</strong> Use an App Password (not your Gmail password)</p>
                                    <p className="pt-1">
                                        Go to Google Account → Security → 2-Step Verification → App passwords to generate one.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Common Providers */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Other Providers</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-xs text-muted-foreground">
                                    <p><strong>Outlook/Hotmail:</strong> smtp.office365.com:587 (TLS)</p>
                                    <p><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS)</p>
                                    <p><strong>Zoho:</strong> smtp.zoho.com:587 (TLS)</p>
                                    <p><strong>SendGrid:</strong> smtp.sendgrid.net:587 (TLS)</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
