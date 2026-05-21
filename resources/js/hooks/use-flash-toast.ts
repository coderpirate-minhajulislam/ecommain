import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useFlashToast() {
    const { flash } = usePage().props;
    const shownRef = useRef<string | null>(null);

    useEffect(() => {
        const key = `${flash.success || ''}|${flash.error || ''}`;
        if (key === '|' || shownRef.current === key) return;
        shownRef.current = key;

        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash.success, flash.error]);
}
