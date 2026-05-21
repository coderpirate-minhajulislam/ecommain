import { Head, useForm, usePage } from '@inertiajs/react';
import { Phone, Mail, MapPin, Clock, HelpCircle, MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Props = {
    pageTitle: string;
    pageSubtitle: string;
    address: string;
    phone: string;
    phoneHref: string;
    email: string;
    emailHref: string;
    hours: string;
    mapEmbed: string;
    faqs: Array<{ q: string; a: string }>;
};

const taClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function ContactPageSettings() {
    useFlashToast();
    const props = usePage<Props>().props;

    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const { data, setData, post, processing } = useForm({
        page_title:    props.pageTitle    ?? '',
        page_subtitle: props.pageSubtitle ?? '',
        address:       props.address      ?? '',
        phone:         props.phone        ?? '',
        phone_href:    props.phoneHref    ?? '',
        email:         props.email        ?? '',
        email_href:    props.emailHref    ?? '',
        hours:         props.hours        ?? '',
        map_embed:     props.mapEmbed     ?? '',
        faqs:          props.faqs         ?? [] as Array<{ q: string; a: string }>,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/contact-page');
    }

    return (
        <>
            <Head title="Contact Page" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Contact Page</h2>
                    <p className="text-muted-foreground">Edit the content shown on the public Contact Us page.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Hero */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Page Header</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label>Title</Label>
                                <Input value={data.page_title} onChange={e => setData('page_title', e.target.value)} placeholder="Contact Us" />
                            </div>
                            <div className="space-y-1">
                                <Label>Subtitle</Label>
                                <textarea rows={2} className={taClass} value={data.page_subtitle} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('page_subtitle', e.target.value)} placeholder="Short intro text..." />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card>
                        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Address</Label>
                                    <textarea rows={2} className={taClass} value={data.address} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('address', e.target.value)} placeholder="123 Commerce Street..." />
                                </div>
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Working Hours</Label>
                                    <textarea rows={2} className={taClass} value={data.hours} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('hours', e.target.value)} placeholder="Mon - Fri: 9AM - 6PM" />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Phone Display</Label>
                                    <Input value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+1 (234) 567-890" />
                                </div>
                                <div className="space-y-1">
                                    <Label>Phone Link (href)</Label>
                                    <Input value={data.phone_href} onChange={e => setData('phone_href', e.target.value)} placeholder="tel:+1234567890" />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Email Display</Label>
                                    <Input value={data.email} onChange={e => setData('email', e.target.value)} placeholder="support@yourstore.com" />
                                </div>
                                <div className="space-y-1">
                                    <Label>Email Link (href)</Label>
                                    <Input value={data.email_href} onChange={e => setData('email_href', e.target.value)} placeholder="mailto:support@yourstore.com" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Map Embed */}
                    <Card>
                        <CardHeader><CardTitle>Map Embed (optional)</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-xs text-muted-foreground">Paste a Google Maps embed URL (the <code>src</code> value from an iframe embed code).</p>
                            <Input value={data.map_embed} onChange={e => setData('map_embed', e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
                            {data.map_embed && (
                                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                                    <iframe src={data.map_embed} className="h-48 w-full" loading="lazy" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* FAQ Items */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="h-4 w-4" />Frequently Asked Questions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {data.faqs.map((faq, i) => (
                                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground">FAQ #{i + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteIndex(i)}
                                            className="rounded p-1 text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Question</Label>
                                        <Input
                                            value={faq.q}
                                            onChange={e => {
                                                const updated = [...data.faqs];
                                                updated[i] = { ...updated[i], q: e.target.value };
                                                setData('faqs', updated);
                                            }}
                                            placeholder="Question..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Answer</Label>
                                        <textarea
                                            rows={2}
                                            className={taClass}
                                            value={faq.a}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                                const updated = [...data.faqs];
                                                updated[i] = { ...updated[i], a: e.target.value };
                                                setData('faqs', updated);
                                            }}
                                            placeholder="Answer..."
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setData('faqs', [...data.faqs, { q: '', a: '' }])}
                            >
                                + Add FAQ
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</Button>
                    </div>
                </form>
            </div>

            <AlertDialog
                open={deleteIndex !== null}
                onOpenChange={open => {
                    if (!open) {
                        setDeleteIndex(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
                        <AlertDialogDescription>This FAQ item will be removed. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteIndex !== null) {
                                    setData('faqs', data.faqs.filter((_, j) => j !== deleteIndex));
                                    setDeleteIndex(null);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
