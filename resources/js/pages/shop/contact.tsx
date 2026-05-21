import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { ShopLayout } from '@/components/ecommerce/shop-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
    flash?: { success?: string };
};

export default function Contact() {
    const { pageTitle, pageSubtitle, address, phone, phoneHref, email, emailHref, hours, mapEmbed, faqs, flash } = usePage<Props>().props;

    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/contact', { onSuccess: () => reset() });
    }

    const contactInfo = [
        address && { icon: MapPin, title: 'Address', detail: address, href: undefined },
        phone && { icon: Phone, title: 'Phone', detail: phone, href: phoneHref || undefined },
        email && { icon: Mail, title: 'Email', detail: email, href: emailHref || undefined },
        hours && { icon: Clock, title: 'Working Hours', detail: hours, href: undefined },
    ].filter(Boolean) as { icon: React.ElementType; title: string; detail: string; href?: string }[];

    return (
        <>
            <Head title="Contact Us" />
            <ShopLayout>
                {/* Hero */}
                <div className="mb-10 text-center">
                    <h1 className="mb-3 text-3xl font-bold md:text-4xl">{pageTitle || 'Contact Us'}</h1>
                    {pageSubtitle && (
                        <p className="mx-auto max-w-2xl text-muted-foreground">{pageSubtitle}</p>
                    )}
                </div>

                {/* Contact Cards */}
                {contactInfo.length > 0 && (
                    <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {contactInfo.map((item) => {
                            const Icon = item.icon;
                            const content = (
                                <CardContent className="p-6 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-1 font-semibold">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                                </CardContent>
                            );

                            if (item.href) {
                                return (
                                    <a key={item.title} href={item.href}>
                                        <Card className="h-full transition-shadow hover:shadow-md">{content}</Card>
                                    </a>
                                );
                            }

                            return <Card key={item.title}>{content}</Card>;
                        })}
                    </div>
                )}

                {/* Form + Map */}
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Contact Form */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-4 text-xl font-bold">Send us a Message</h2>
                            {(wasSuccessful || flash?.success) ? (
                                <div className="py-10 text-center">
                                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <CheckCircle2 className="h-7 w-7" />
                                    </div>
                                    <h3 className="mb-1 text-lg font-semibold">Message Sent!</h3>
                                    <p className="mb-4 text-sm text-muted-foreground">{flash?.success || "We'll get back to you soon."}</p>
                                    <Button variant="outline" onClick={() => reset()}>Send Another</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Name <span className="text-destructive">*</span></label>
                                            <Input placeholder="Your name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Email <span className="text-destructive">*</span></label>
                                            <Input type="email" placeholder="you@example.com" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Phone</label>
                                        <Input
                                            type="tel"
                                            inputMode="numeric"
                                            placeholder="Your phone number"
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Subject</label>
                                        <Input placeholder="How can we help?" value={data.subject} onChange={e => setData('subject', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Message <span className="text-destructive">*</span></label>
                                        <textarea
                                            rows={5}
                                            placeholder="Tell us more..."
                                            required
                                            value={data.message}
                                            onChange={e => setData('message', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                                    </div>
                                    <Button type="submit" className="w-full" disabled={processing}>
                                        {processing ? 'Sending…' : 'Send Message'}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Map */}
                    <Card>
                        <CardContent className="flex h-full min-h-100 flex-col p-0 overflow-hidden rounded-xl">
                            {mapEmbed ? (
                                <iframe
                                    src={mapEmbed}
                                    className="h-full min-h-100 w-full border-0"
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            ) : (
                                <div className="flex h-full min-h-100 flex-col items-center justify-center p-6">
                                    <MapPin className="mb-3 h-12 w-12 text-muted-foreground" />
                                    <h3 className="mb-1 text-lg font-semibold">Find Us</h3>
                                    {address && <p className="text-center text-sm text-muted-foreground">{address}</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ */}
                {faqs && faqs.length > 0 && (
                    <div className="mt-10 rounded-xl bg-muted/30 p-6 text-center md:p-10">
                        <h2 className="mb-3 text-2xl font-bold">Frequently Asked Questions</h2>
                        <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
                            Find quick answers to common questions about orders, shipping, returns, and more.
                        </p>
                        <div className="mx-auto max-w-2xl space-y-3 text-left">
                            {faqs.map((faq, i) => (
                                <Card key={i}>
                                    <CardContent className="p-4">
                                        <h4 className="mb-1 font-medium">{faq.q}</h4>
                                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </ShopLayout>
        </>
    );
}
