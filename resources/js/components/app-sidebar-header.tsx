import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    // Get the current page title from breadcrumbs (last item) or fallback to first breadcrumb
    const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.title || breadcrumbs[0]?.title || 'Dashboard';

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:px-6">
            <div className="flex items-center gap-2 w-full">
                <SidebarTrigger className="-ml-1 shrink-0" aria-label="Toggle sidebar menu" />

                {/* Mobile: Show page title */}
                <div className="block md:hidden truncate">
                    <h1 className="text-base font-semibold text-foreground truncate">
                        {pageTitle}
                    </h1>
                </div>

                {/* Desktop: Show breadcrumbs */}
                <div className="hidden md:block flex-1">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
        </header>
    );
}
