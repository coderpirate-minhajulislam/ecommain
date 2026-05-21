import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

declare const window: Window & typeof globalThis & { __SITE_TITLE__?: string; __SITE_SUBTITLE__?: string };
const _siteTitle    = (typeof window !== 'undefined' && window.__SITE_TITLE__)    || import.meta.env.VITE_APP_NAME || 'Shop';
const _siteSubtitle = (typeof window !== 'undefined' && window.__SITE_SUBTITLE__) || '';
// Full brand string e.g. "Prime Haat BD - Fast Delivery" or just "Prime Haat BD"
const _brandFull = _siteSubtitle ? `${_siteTitle} - ${_siteSubtitle}` : _siteTitle;

createInertiaApp({
    title: (title) => (title ? `${title} - ${_siteTitle}` : _brandFull),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.startsWith('shop/'):
            case name === 'home':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster richColors position="top-right" />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4ade80',
    },
});

// This will set light / dark mode on load...
initializeTheme();
