import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

type Banner = {
    id: number;
    title?: string | null;
    subtitle?: string | null;
    button_text?: string | null;
    button_link?: string | null;
    image_path: string;
    popup_timer?: number | null;
};

export function PopupBanner() {
    const { popupBanners } = usePage<{ popupBanners?: Banner[] }>().props;
    const banners = popupBanners ?? [];
    const [open, setOpen] = useState(banners.length > 0);
    const [index, setIndex] = useState(0);
    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef(false);
    const seenRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!banners || banners.length === 0) return;
        setOpen(true);
    }, [banners]);

    useEffect(() => {
        if (!banners || banners.length === 0) return;

        // reset seen when banners list changes or popup reopened
        seenRef.current = new Set();
        seenRef.current.add(0);
        setIndex(0);
    }, [banners]);

    useEffect(() => {
        if (!banners || banners.length === 0) return;

        // mark current slide as seen
        seenRef.current.add(index);

        const current = banners[index];
        const delay = (current?.popup_timer && Number(current.popup_timer) > 0) ? Number(current.popup_timer) * 1000 : 5000;

        const t = setTimeout(() => {
            // if all slides have been seen at least once, close popup
            if (seenRef.current.size >= banners.length) {
                setOpen(false);
                return;
            }

            // advance to next slide
            setIndex((c) => (c + 1) % banners.length);
        }, delay);

        return () => clearTimeout(t);
    }, [banners, index]);

    if (!open || banners.length === 0) return null;

    const b = banners[index];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

            <div
                className="group relative overflow-hidden rounded-xl select-none"
                style={{ width: 'min(700px, 95vw)', height: 'min(700px, 95vw)' }}
                onTouchStart={(e) => { dragStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                    if (dragStartX.current === null) return;
                    const diff = dragStartX.current - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 40) {
                        if (diff > 0) setIndex((c) => (c + 1) % banners.length);
                        else setIndex((c) => (c - 1 + banners.length) % banners.length);
                    }
                    dragStartX.current = null;
                }}
                onMouseDown={(e) => { dragStartX.current = e.clientX; isDragging.current = false; }}
                onMouseMove={() => { if (dragStartX.current !== null) isDragging.current = true; }}
                onMouseUp={(e) => {
                    if (dragStartX.current === null) return;
                    const diff = dragStartX.current - e.clientX;
                    if (Math.abs(diff) > 40) {
                        if (diff > 0) setIndex((c) => (c + 1) % banners.length);
                        else setIndex((c) => (c - 1 + banners.length) % banners.length);
                    }
                    dragStartX.current = null; isDragging.current = false;
                }}
                onMouseLeave={() => { dragStartX.current = null; isDragging.current = false; }}
            >
                <button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-30 rounded-full bg-white/90 p-1 text-black">
                    <X className="h-4 w-4" />
                </button>

                {/* Slides */}
                {banners.map((s, i) => (
                    <div key={s.id} className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <img src={`/${s.image_path}`} alt={s.title || 'Popup'} className="h-full w-full object-cover" style={{ position: 'absolute', inset: 0 }} />

                        {(s.title || s.subtitle || s.button_text) && (
                            <div className="absolute inset-0 z-10 flex h-full flex-col justify-center px-6 py-8 md:px-12 md:py-12">
                                <div className="max-w-lg mx-auto text-center">
                                    {s.title && <h1 className="mb-2 text-2xl font-bold text-white md:text-4xl">{s.title}</h1>}
                                    {s.subtitle && <p className="mb-5 text-sm text-white/90 md:text-base">{s.subtitle}</p>}
                                    {s.button_text && s.button_link && (
                                        <a href={s.button_link} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                                            {s.button_text} <ChevronRight className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Spacer to set height */}
                <div className="relative invisible" style={{ paddingBottom: '100%' }} />

                {/* Arrows */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={() => setIndex((c) => (c - 1 + banners.length) % banners.length)}
                            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setIndex((c) => (c + 1) % banners.length)}
                            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>

                        {/* Dots */}
                        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                            {banners.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                                    aria-label={`Go to slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default PopupBanner;
