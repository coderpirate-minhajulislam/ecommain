import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

type SiteBranding = { logo?: string; title?: string };

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    const siteBranding = (usePage().props as { siteBranding?: SiteBranding }).siteBranding;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2.5 self-center font-medium"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                        {siteBranding?.logo
                            ? <img src={`/${siteBranding.logo}`} alt={siteBranding.title || 'Logo'} className="size-full object-contain" />
                            : <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                        }
                    </div>
                    {siteBranding?.title && (
                        <span className="text-base font-semibold">{siteBranding.title}</span>
                    )}
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
