import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const siteBranding = (usePage().props as { siteBranding?: { title?: string; logo?: string } }).siteBranding;
    const title = siteBranding?.title || 'My Store';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden">
                {siteBranding?.logo
                    ? <img src={`/${siteBranding.logo}`} alt={title} className="size-full rounded-lg object-contain" />
                    : <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                }
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {title}
                </span>
            </div>
        </>
    );
}
