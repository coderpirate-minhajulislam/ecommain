import { Head, Link, usePage } from '@inertiajs/react';

const errorMessages: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Forbidden',
        description: "You don't have permission to access this page.",
    },
    404: {
        title: 'Page Not Found',
        description: "The page you're looking for doesn't exist or has been moved.",
    },
    500: {
        title: 'Server Error',
        description: 'Something went wrong on our end. Please try again later.',
    },
    503: {
        title: 'Service Unavailable',
        description: 'We are currently undergoing maintenance. Please check back soon.',
    },
};

export default function Error() {
    const { status } = usePage<{ status: number }>().props;

    const error = errorMessages[status] || {
        title: 'Error',
        description: 'An unexpected error occurred.',
    };

    return (
        <>
            <Head title={`${status} - ${error.title}`} />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
                <div className="text-center">
                    <h1 className="text-9xl font-extrabold tracking-tight text-primary">{status}</h1>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight">{error.title}</h2>
                    <p className="mt-2 text-lg text-muted-foreground">{error.description}</p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <Link
                            href="/"
                            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Go Home
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="rounded-lg border border-input px-6 py-2.5 text-sm font-medium hover:bg-accent"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
