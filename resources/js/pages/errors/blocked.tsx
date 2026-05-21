import { Head } from '@inertiajs/react';
import { ShieldX } from 'lucide-react';

export default function Blocked({ reason }: { reason?: string }) {
    return (
        <>
            <Head title="Access Blocked" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
                <div className="text-center max-w-md">
                    <ShieldX className="mx-auto h-20 w-20 text-destructive opacity-80" />
                    <h1 className="mt-6 text-3xl font-bold tracking-tight">Access Blocked</h1>
                    <p className="mt-3 text-lg text-muted-foreground">
                        Your access to this website has been restricted due to suspicious activity.
                    </p>
                    {reason && (
                        <p className="mt-2 text-sm text-muted-foreground/80">
                            Reason: {reason}
                        </p>
                    )}
                    <p className="mt-6 text-sm text-muted-foreground">
                        If you believe this is a mistake, please contact our support team.
                    </p>
                </div>
            </div>
        </>
    );
}
