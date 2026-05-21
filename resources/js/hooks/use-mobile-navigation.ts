import { useCallback } from 'react';

export type CleanupFn = () => void;

export function useMobileNavigation(): CleanupFn {
    return useCallback(() => {
        // Remove pointer-events style from body
        document.body.style.removeProperty('pointer-events');

        // Close mobile sidebar if it's open
        try {
            const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement;
            const sidebar = document.querySelector('[data-mobile="true"]');

            // If sidebar is visible on mobile, close it
            if (sidebar && window.matchMedia('(max-width: 768px)').matches) {
                // Check if sidebar is currently open by looking for the Sheet's open state
                const sheetContent = document.querySelector('[data-sidebar="sidebar"][data-mobile="true"]');
                if (sheetContent) {
                    // Trigger the sidebar trigger button to close it
                    sidebarTrigger?.click();
                }
            }
        } catch (e) {
            // Silently fail if sidebar elements don't exist
        }
    }, []);
}
