import { Head, useForm, usePage } from '@inertiajs/react';
import * as LucideIcons from 'lucide-react';
import { FileText, ImagePlus, Plus, Trash2, User } from 'lucide-react';
import { useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Stat   = { value: string; label: string };
type Value  = { icon: string; title: string; description: string };
type Member = { name: string; role: string; avatar: string };

type Props = {
    heroTitle: string; heroSubtitle: string;
    storyHeading: string; storyPara1: string; storyPara2: string;
    missionTitle: string; missionText: string;
    stats: Stat[]; values: Value[]; team: Member[];
};

const VALUE_ICONS = ['Heart', 'Shield', 'Truck', 'Zap', 'Star', 'Award', 'CheckCircle', 'Users', 'Gift', 'ThumbsUp', 'Lock', 'Clock'];

function ValueIconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const SelectedIcon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[value];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-2 text-xs hover:bg-accent"
            >
                {SelectedIcon && <SelectedIcon className="h-4 w-4 shrink-0 text-primary" />}
                <span className="flex-1 text-left text-muted-foreground">{value}</span>
            </button>
            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 grid grid-cols-6 gap-1 rounded-md border border-border bg-background p-2 shadow-lg">
                    {VALUE_ICONS.map(iconName => {
                        const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];

                        return (
                            <button
                                key={iconName}
                                type="button"
                                title={iconName}
                                onClick={() => { onChange(iconName); setOpen(false); }}
                                className={`flex h-8 w-8 items-center justify-center rounded hover:bg-accent ${value === iconName ? 'bg-primary/10 text-primary ring-1 ring-primary' : 'text-foreground'}`}
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const taClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

type TeamMemberRowProps = {
    member: Member;
    i: number;
    uploading: boolean;
    onUpload: (i: number, file: File) => void;
    onUpdate: (i: number, field: keyof Member, val: string) => void;
    onRemove: (i: number) => void;
};

function TeamMemberRow({ member, i, uploading, onUpload, onUpdate, onRemove }: TeamMemberRowProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const isImage = member.avatar.startsWith('/');

    return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex shrink-0 flex-col items-center gap-1">
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-primary hover:bg-primary/5"
                    title="Click to upload photo"
                >
                    {uploading ? (
                        <span className="text-xs text-primary">…</span>
                    ) : isImage ? (
                        <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <ImagePlus className="h-3 w-3" />
                    </span>
                </button>
                <span className="text-[10px] text-muted-foreground">Photo</span>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(i, file);
                        e.target.value = '';
                    }}
                />
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <Input className="flex-1" placeholder="Full Name" value={member.name} onChange={e => onUpdate(i, 'name', e.target.value)} />
                <Input className="flex-1" placeholder="Role / Title" value={member.role} onChange={e => onUpdate(i, 'role', e.target.value)} />
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <button type="button" className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Member?</AlertDialogTitle>
                        <AlertDialogDescription>Remove <strong>{member.name || 'this member'}</strong>?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onRemove(i)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default function AboutPageSettings() {
    useFlashToast();
    const props = usePage<Props>().props;

    const { data, setData, post, processing } = useForm({
        hero_title:     props.heroTitle     ?? '',
        hero_subtitle:  props.heroSubtitle  ?? '',
        story_heading:  props.storyHeading  ?? '',
        story_para1:    props.storyPara1    ?? '',
        story_para2:    props.storyPara2    ?? '',
        mission_title:  props.missionTitle  ?? '',
        mission_text:   props.missionText   ?? '',
        stats:   (props.stats   ?? []) as Stat[],
        values:  (props.values  ?? []) as Value[],
        team:    (props.team    ?? []) as Member[],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/about-page');
    }

    function addStat() {
        setData('stats', [...data.stats, { value: '', label: '' }]);
    }

    function removeStat(i: number) {
        setData('stats', data.stats.filter((_, idx) => idx !== i));
    }

    function updateStat(i: number, field: keyof Stat, val: string) {
        setData('stats', data.stats.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    }

    function addValue() {
        setData('values', [...data.values, { icon: 'Star', title: '', description: '' }]);
    }

    function removeValue(i: number) {
        setData('values', data.values.filter((_, idx) => idx !== i));
    }

    function updateValue(i: number, field: keyof Value, val: string) {
        setData('values', data.values.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
    }

    function addMember() {
        setData('team', [...data.team, { name: '', role: '', avatar: '' }]);
    }

    function removeMember(i: number) {
        setData('team', data.team.filter((_, idx) => idx !== i));
    }

    function updateMember(i: number, field: keyof Member, val: string) {
        setData('team', data.team.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
    }

    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

    async function handleTeamImageUpload(i: number, file: File) {
        setUploadingIdx(i);
        const formData = new FormData();
        formData.append('image', file);

        // Pass existing avatar so the server can delete the old file
        const existing = data.team[i]?.avatar;
        if (existing && existing.startsWith('/')) {
            formData.append('old_image', existing);
        }

        const csrfToken = (document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '').replace(/%3D/g, '=');

        try {
            const res = await fetch('/admin/settings/upload-team-image', {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': csrfToken, Accept: 'application/json' },
                body: formData,
            });
            const json = await res.json() as { url?: string };
            if (json.url) {
                updateMember(i, 'avatar', '/' + json.url);
            }
        } finally {
            setUploadingIdx(null);
        }
    }

    return (
        <>
            <Head title="About Page" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">About Page</h2>
                    <p className="text-muted-foreground">Edit all content shown on the public About Us page.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Hero */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Hero Section</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label>Title</Label>
                                <Input value={data.hero_title} onChange={e => setData('hero_title', e.target.value)} placeholder="About Us" />
                            </div>
                            <div className="space-y-1">
                                <Label>Subtitle</Label>
                                <textarea rows={2} className={taClass} value={data.hero_subtitle} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('hero_subtitle', e.target.value)} placeholder="Short intro text..." />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Our Story */}
                    <Card>
                        <CardHeader><CardTitle>Our Story Section</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label>Heading</Label>
                                <Input value={data.story_heading} onChange={e => setData('story_heading', e.target.value)} placeholder="Our Story" />
                            </div>
                            <div className="space-y-1">
                                <Label>Paragraph 1</Label>
                                <textarea rows={3} className={taClass} value={data.story_para1} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('story_para1', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>Paragraph 2</Label>
                                <textarea rows={3} className={taClass} value={data.story_para2} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('story_para2', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card>
                        <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {data.stats.map((stat, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input className="w-28" placeholder="50K+" value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)} />
                                    <Input className="flex-1" placeholder="Happy Customers" value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button type="button" className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Stat?</AlertDialogTitle>
                                                <AlertDialogDescription>Remove <strong>{stat.label || 'this stat'}</strong>?</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => removeStat(i)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                            {data.stats.length < 8 && (
                                <Button type="button" variant="outline" size="sm" onClick={addStat} className="gap-2">
                                    <Plus className="h-4 w-4" />Add Stat
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Values */}
                    <Card>
                        <CardHeader><CardTitle>Our Values</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {data.values.map((val, i) => {
                                return (
                                    <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                                        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                            <div className="w-full sm:w-36 space-y-1">
                                                <Label className="text-xs">Icon</Label>
                                                <ValueIconPicker value={val.icon} onChange={v => updateValue(i, 'icon', v)} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs">Title</Label>
                                                <Input className="h-8 text-sm" value={val.title} onChange={e => updateValue(i, 'title', e.target.value)} placeholder="Customer First" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs">Description</Label>
                                                <Input className="h-8 text-sm" value={val.description} onChange={e => updateValue(i, 'description', e.target.value)} placeholder="Short description..." />
                                            </div>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button type="button" className="mt-1 rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Value?</AlertDialogTitle>
                                                    <AlertDialogDescription>Remove <strong>{val.title || 'this value'}</strong>?</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => removeValue(i)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                );
                            })}
                            {data.values.length < 8 && (
                                <Button type="button" variant="outline" size="sm" onClick={addValue} className="gap-2">
                                    <Plus className="h-4 w-4" />Add Value
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team */}
                    <Card>
                        <CardHeader><CardTitle>Meet the Team</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {data.team.map((member, i) => (
                                <TeamMemberRow
                                    key={i}
                                    member={member}
                                    i={i}
                                    uploading={uploadingIdx === i}
                                    onUpload={handleTeamImageUpload}
                                    onUpdate={updateMember}
                                    onRemove={removeMember}
                                />
                            ))}
                            {data.team.length < 12 && (
                                <Button type="button" variant="outline" size="sm" onClick={addMember} className="gap-2">
                                    <Plus className="h-4 w-4" />Add Member
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mission */}
                    <Card>
                        <CardHeader><CardTitle>Mission Section</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label>Title</Label>
                                <Input value={data.mission_title} onChange={e => setData('mission_title', e.target.value)} placeholder="Our Mission" />
                            </div>
                            <div className="space-y-1">
                                <Label>Text</Label>
                                <textarea rows={3} className={taClass} value={data.mission_text} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('mission_text', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save Changes'}
                    </Button>
                </form>
            </div>
        </>
    );
}
