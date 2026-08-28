'use client';

import { useEffect, useRef } from 'react';

/**
 * Reading progress through the article, shown as a fraction. It writes to the
 * DOM directly rather than through state, so scrolling never re-renders the
 * page tree.
 */
export default function ReadingProgress() {
    const valueRef = useRef<HTMLSpanElement>(null);
    const barRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let frame = 0;

        const paint = () => {
            frame = 0;

            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;

            if (valueRef.current) {
                valueRef.current.textContent = ratio.toFixed(2);
            }
            if (barRef.current) {
                barRef.current.style.transform = `scaleY(${ratio})`;
            }
        };

        const onScroll = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(paint);
        };

        paint();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return (
        <div className="flex items-start gap-2" aria-hidden="true">
            <span className="font-sans font-medium text-[10px] tabular-nums tracking-[0.08em] text-ed-fg-faint" ref={valueRef}>
                0.00
            </span>
            <span className="relative mt-1 block h-16 w-px bg-ed-rule">
                <span className="absolute inset-0 block origin-top bg-ed-fg" ref={barRef} style={{ transform: 'scaleY(0)' }} />
            </span>
        </div>
    );
}
