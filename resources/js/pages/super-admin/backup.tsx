import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Database, Download, FolderArchive, Upload } from 'lucide-react';
import { useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function BackupRestore() {
    useFlashToast();

    // ─── Database restore form ────────────────────────────────────────────────
    const dbForm = useForm<{ sql_file: File | null }>({ sql_file: null });
    const dbFileRef = useRef<HTMLInputElement>(null);

    function handleDbFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        dbForm.setData('sql_file', e.target.files?.[0] ?? null);
    }

    function submitDbRestore(e: React.FormEvent) {
        e.preventDefault();
        dbForm.post('/super-admin/backup/upload-database', {
            forceFormData: true,
            onSuccess: () => {
                dbForm.reset();
                if (dbFileRef.current) dbFileRef.current.value = '';
            },
        });
    }

    // ─── Media restore form ───────────────────────────────────────────────────
    const mediaForm = useForm<{ media_file: File | null }>({ media_file: null });
    const mediaFileRef = useRef<HTMLInputElement>(null);

    function handleMediaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        mediaForm.setData('media_file', e.target.files?.[0] ?? null);
    }

    function submitMediaRestore(e: React.FormEvent) {
        e.preventDefault();
        mediaForm.post('/super-admin/backup/upload-media', {
            forceFormData: true,
            onSuccess: () => {
                mediaForm.reset();
                if (mediaFileRef.current) mediaFileRef.current.value = '';
            },
        });
    }

    return (
        <>
            <Head title="Backup & Restore" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Page header */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Backup & Restore</h2>
                    <p className="text-muted-foreground">
                        Download a full backup of your database and media files, or restore the site from a previous
                        backup.
                    </p>
                </div>

                {/* Warning */}
                <Alert className="border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 !text-amber-600" />
                    <AlertDescription>
                        <strong>Warning:</strong> Restoring a backup will overwrite all current data. This action
                        cannot be undone. Always download a fresh backup before restoring.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* ── DATABASE ─────────────────────────────────────────────── */}
                    <div className="flex flex-col gap-6">
                        {/* Download DB */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    Database Backup
                                </CardTitle>
                                <CardDescription>
                                    Download a complete SQL dump of the entire database.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <a href="/super-admin/backup/download-database">
                                    <Button className="w-full" variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Database (.sql)
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>

                        {/* Restore DB */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-destructive" />
                                    Restore Database
                                </CardTitle>
                                <CardDescription>
                                    Upload a <code>.sql</code> backup file to restore the database. All existing data
                                    will be replaced.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitDbRestore} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sql_file">SQL Backup File</Label>
                                        <input
                                            ref={dbFileRef}
                                            id="sql_file"
                                            type="file"
                                            accept=".sql,.txt"
                                            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                                            onChange={handleDbFileChange}
                                        />
                                        {dbForm.errors.sql_file && (
                                            <p className="text-sm text-destructive">{dbForm.errors.sql_file}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Accepted: .sql — max 100 MB</p>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="w-full"
                                        disabled={dbForm.processing || !dbForm.data.sql_file}
                                    >
                                        {dbForm.processing ? 'Restoring…' : 'Restore Database'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── MEDIA ────────────────────────────────────────────────── */}
                    <div className="flex flex-col gap-6">
                        {/* Download media */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FolderArchive className="h-5 w-5 text-primary" />
                                    Media Backup
                                </CardTitle>
                                <CardDescription>
                                    Download all uploaded media files (product images, site assets) as a zip archive.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <a href="/super-admin/backup/download-media">
                                    <Button className="w-full" variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Media (.zip)
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>

                        {/* Restore media */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-destructive" />
                                    Restore Media
                                </CardTitle>
                                <CardDescription>
                                    Upload a <code>.zip</code> archive to restore all media files. Existing uploads
                                    will be replaced.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitMediaRestore} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="media_file">Media Zip Archive</Label>
                                        <input
                                            ref={mediaFileRef}
                                            id="media_file"
                                            type="file"
                                            accept=".zip"
                                            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                                            onChange={handleMediaFileChange}
                                        />
                                        {mediaForm.errors.media_file && (
                                            <p className="text-sm text-destructive">{mediaForm.errors.media_file}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Accepted: .zip — max 500 MB</p>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="w-full"
                                        disabled={mediaForm.processing || !mediaForm.data.media_file}
                                    >
                                        {mediaForm.processing ? 'Restoring…' : 'Restore Media'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
