import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useOrderNotifications } from '@/hooks/use-order-notifications';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    useOrderNotifications();

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
                <footer className="mt-auto border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
                    Develop & Maintain by{' '}
                    <a
                        href="https://wa.me/8801518401677"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium hover:underline"
                    >
                        Grow Ever
                    </a>
                </footer>
            </AppContent>
        </AppShell>
    );
}
