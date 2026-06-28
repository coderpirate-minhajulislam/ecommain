import { PlayCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ImageGalleryProps {
    images: { src: string }[];
    alt: string;
    onVideoClick?: () => void;
    hasVideo?: boolean;
    autoCycleMs?: number;
}

/**
 * Shared image gallery used by all landing page templates.
 * Supports touch swipe, mouse drag (with pointer capture so dragging
 * outside the element still registers), thumbnail click, and auto-cycle.
 */
export function ImageGallery({ images, alt, onVideoClick, hasVideo, autoCycleMs = 4000 }: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const startX = useRef<number | null>(null);
    const hasMoved = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    // Pause auto-cycle when user is interacting
    const pausedRef = useRef(false);

    const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
    const next = () => setActiveIndex((i) => (i + 1) % images.length);

    // Auto-cycle with pause-on-interaction
    useEffect(() => {
        if (images.length <= 1 || autoCycleMs <= 0) return;
        const timer = setInterval(() => {
            if (!pausedRef.current) {
                setActiveIndex((prev) => (prev + 1) % images.length);
            }
        }, autoCycleMs);
        return () => clearInterval(timer);
    }, [images.length, autoCycleMs]);

    // ── Touch events (most reliable on mobile) ──
    function onTouchStart(e: React.TouchEvent) {
        startX.current = e.touches[0].clientX;
        hasMoved.current = false;
        pausedRef.current = true;
    }
    function onTouchMove(e: React.TouchEvent) {
        if (startX.current !== null && Math.abs(e.touches[0].clientX - startX.current) > 8) {
            hasMoved.current = true;
        }
    }
    function onTouchEnd(e: React.TouchEvent) {
        if (startX.current === null) return;
        const delta = e.changedTouches[0].clientX - startX.current;
        if (Math.abs(delta) > 40) {
            delta < 0 ? next() : prev();
        }
        startX.current = null;
        hasMoved.current = false;
        // Resume auto-cycle after short delay
        setTimeout(() => { pausedRef.current = false; }, 3000);
    }

    // ── Mouse events with pointer capture so mouse-up fires even outside ──
    function onMouseDown(e: React.MouseEvent) {
        if (e.button !== 0) return; // left click only
        startX.current = e.clientX;
        hasMoved.current = false;
        pausedRef.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.nativeEvent.pointerId ?? 1);
        e.preventDefault();
    }
    function onMouseMove(e: React.MouseEvent) {
        if (startX.current === null) return;
        if (Math.abs(e.clientX - startX.current) > 8) hasMoved.current = true;
    }
    function onMouseUp(e: React.MouseEvent) {
        if (startX.current === null) return;
        const delta = e.clientX - startX.current;
        if (hasMoved.current && Math.abs(delta) > 40) {
            delta < 0 ? next() : prev();
        }
        startX.current = null;
        hasMoved.current = false;
        setTimeout(() => { pausedRef.current = false; }, 3000);
    }

    if (images.length === 0) return null;

    return (
        <div className="w-full">
            {/* Main image */}
            <div
                ref={containerRef}
                className="relative mb-3 cursor-grab select-none overflow-hidden rounded-xl border border-gray-200 shadow-sm active:cursor-grabbing"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                style={{ touchAction: 'pan-y' }}
            >
                <img
                    src={images[activeIndex]?.src}
                    alt={alt}
                    className="h-auto w-full select-none object-cover pointer-events-none"
                    draggable={false}
                />

                {/* Dot indicators */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                                className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-white/60'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Video play button */}
                {hasVideo && onVideoClick && (
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onVideoClick(); }}
                        className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-white transition-colors hover:bg-black/90"
                    >
                        <PlayCircle className="h-5 w-5 text-red-500" />
                        <span className="text-xs font-medium">Watch Video</span>
                    </button>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => { setActiveIndex(i); pausedRef.current = true; setTimeout(() => { pausedRef.current = false; }, 5000); }}
                            className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-colors sm:h-16 sm:w-16 ${i === activeIndex ? 'border-primary' : 'border-gray-200'}`}
                        >
                            <img src={img.src} alt="" className="h-full w-full object-cover" draggable={false} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

