import { Head, usePage } from '@inertiajs/react';
import { Construction } from 'lucide-react';

type Props = {
    title: string;
    message: string;
};

export default function Maintenance() {
    const { title, message } = usePage<Props>().props;

    return (
        <>
            <Head title={title || 'Maintenance'} />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
                <div className="text-center max-w-lg">
                    <Construction className="mx-auto h-20 w-20 text-primary" />
                    <h1 className="mt-6 text-4xl font-bold tracking-tight">{title || "We'll Be Back Soon"}</h1>
                    {message && (
                        <p className="mt-4 text-lg text-muted-foreground whitespace-pre-line">{message}</p>
                    )}
                    <div className="mt-8">
                        <p className="text-sm text-muted-foreground">Please check back later.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
