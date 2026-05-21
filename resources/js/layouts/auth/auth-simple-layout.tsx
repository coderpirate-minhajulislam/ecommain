import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

type SiteBranding = { logo?: string; title?: string };

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const siteBranding = (usePage().props as { siteBranding?: SiteBranding }).siteBranding;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex items-center gap-2.5 font-medium"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                                {siteBranding?.logo
                                    ? <img src={`/${siteBranding.logo}`} alt={siteBranding.title || 'Logo'} className="size-full object-contain" />
                                    : <AppLogoIcon className="size-9 fill-current text-(--foreground) dark:text-white" />
                                }
                            </div>
                            {siteBranding?.title && (
                                <span className="text-base font-semibold">{siteBranding.title}</span>
                            )}
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
