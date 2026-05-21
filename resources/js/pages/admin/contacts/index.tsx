import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, Pencil, Phone, Trash2, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFlashToast } from '@/hooks/use-flash-toast';

type ContactMessage = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string | null;
    message: string;
    is_read: boolean;
    admin_note: string | null;
    created_at: string;
};

type Props = {
    messages: ContactMessage[];
    unreadCount: number;
};

const taClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function EditForm({ msg, onClose }: { msg: ContactMessage; onClose: () => void }) {
    const { data, setData, patch, processing } = useForm({
        name: msg.name,
        email: msg.email,
        phone: msg.phone ?? '',
        subject: msg.subject ?? '',
        message: msg.message,
        admin_note: msg.admin_note ?? '',
        is_read: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/admin/contacts/${msg.id}`, { onSuccess: onClose });
    }

    return (
        <form onSubmit={submit} className="mt-3 space-y-3 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Edit Message</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-xs font-medium">Name</label>
                    <Input size={1} className="h-8 text-sm" value={data.name} onChange={e => setData('name', e.target.value)} required />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium">Email</label>
                    <Input size={1} type="email" className="h-8 text-sm" value={data.email} onChange={e => setData('email', e.target.value)} required />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium">Phone</label>
                    <Input size={1} type="tel" inputMode="numeric" className="h-8 text-sm" value={data.phone} onChange={e => setData('phone', e.target.value.replace(/\D/g, ''))} />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium">Subject</label>
                    <Input size={1} className="h-8 text-sm" value={data.subject} onChange={e => setData('subject', e.target.value)} />
                </div>
            </div>
            <div>
                <label className="mb-1 block text-xs font-medium">Message</label>
                <textarea
                    rows={4}
                    className={taClass}
                    value={data.message}
                    onChange={e => setData('message', e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="mb-1 block text-xs font-medium">Admin Note <span className="text-muted-foreground font-normal">(private)</span></label>
                <textarea
                    rows={2}
                    className={taClass}
                    value={data.admin_note}
                    onChange={e => setData('admin_note', e.target.value)}
                    placeholder="Add a private note..."
                />
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>{processing ? 'Saving…' : 'Save'}</Button>
                <Button type="button" size="sm" variant="ghost" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
            </div>
        </form>
    );
}

export default function ContactMessagesIndex() {
    useFlashToast();
    const { messages, unreadCount } = usePage<Props>().props;

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    function markRead(id: number) {
        router.patch(`/admin/contacts/${id}/mark-read`, {}, { preserveScroll: true });
    }

    function handleDelete() {
        if (deleteId === null) {
            return;
        }

        router.delete(`/admin/contacts/${deleteId}`, { preserveScroll: true });
        setDeleteId(null);
    }

    return (
        <>
            <Head title="Contact Messages" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Contact Messages</h2>
                        <p className="text-muted-foreground">
                            {messages.length} message{messages.length !== 1 ? 's' : ''}
                            {unreadCount > 0 && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                                    {unreadCount} unread
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {messages.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Mail className="mb-3 h-12 w-12 text-muted-foreground/40" />
                            <p className="font-medium">No messages yet</p>
                            <p className="text-sm text-muted-foreground">Contact form submissions will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {messages.map(msg => (
                            <Card key={msg.id} className={msg.is_read ? '' : 'border-primary/40 bg-primary/5'}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                            {msg.name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Main content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold">{msg.name}</span>
                                                {!msg.is_read && <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>}
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(msg.created_at).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            </div>

                                            <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                <a href={`mailto:${msg.email}`} className="flex items-center gap-1 hover:text-primary">
                                                    <Mail className="h-3 w-3" />{msg.email}
                                                </a>
                                                {msg.phone && (
                                                    <a href={`tel:${msg.phone}`} className="flex items-center gap-1 hover:text-primary">
                                                        <Phone className="h-3 w-3" />{msg.phone}
                                                    </a>
                                                )}
                                            </div>

                                            {msg.subject && (
                                                <p className="mt-1 text-sm font-medium">{msg.subject}</p>
                                            )}

                                            <p className={`mt-1 text-sm text-muted-foreground ${expandedId === msg.id ? '' : 'line-clamp-2'}`}>
                                                {msg.message}
                                            </p>
                                            {msg.message.length > 150 && (
                                                <button
                                                    type="button"
                                                    className="mt-0.5 text-xs text-primary hover:underline"
                                                    onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                                                >
                                                    {expandedId === msg.id ? 'Show less' : 'Read more'}
                                                </button>
                                            )}

                                            {msg.admin_note && editingId !== msg.id && (
                                                <p className="mt-2 rounded-md bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                                                    <strong>Note:</strong> {msg.admin_note}
                                                </p>
                                            )}

                                            {editingId === msg.id && (
                                                <EditForm msg={msg} onClose={() => setEditingId(null)} />
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex shrink-0 items-center gap-1">
                                            {!msg.is_read && (
                                                <button
                                                    type="button"
                                                    title="Mark as read"
                                                    onClick={() => markRead(msg.id)}
                                                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                title="Add/edit note"
                                                onClick={() => setEditingId(editingId === msg.id ? null : msg.id)}
                                                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Delete"
                                                onClick={() => setDeleteId(msg.id)}
                                                className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirmation */}
            <AlertDialog
                open={deleteId !== null}
                onOpenChange={open => {
                    if (!open) {
                        setDeleteId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
