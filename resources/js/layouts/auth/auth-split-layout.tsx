import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

type SiteBranding = { logo?: string; title?: string };

function SiteLogo({ className, imgClassName }: { className?: string; imgClassName?: string }) {
    const siteBranding = (usePage().props as { siteBranding?: SiteBranding }).siteBranding;
    if (siteBranding?.logo) {
        return <img src={`/${siteBranding.logo}`} alt={siteBranding.title || 'Logo'} className={imgClassName || 'h-10 max-h-10 w-auto object-contain'} />;
    }
    return <AppLogoIcon className={className || 'size-8 fill-current text-white'} />;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const props = usePage().props as { name?: string; siteBranding?: SiteBranding };
    const siteName = props.siteBranding?.title || props.name || '';

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center gap-2.5 text-lg font-medium"
                    >
                        <SiteLogo imgClassName="h-8 w-8 shrink-0 rounded-lg object-contain" className="mr-2 size-8 fill-current text-white" />
                        {siteName}
                    </Link>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <SiteLogo imgClassName="h-12 w-auto object-contain rounded-lg" className="h-10 fill-current text-black sm:h-12" />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
