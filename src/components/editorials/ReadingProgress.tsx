'use client';

import { useEffect, useRef } from 'react';

/**
 * Reading progress ruler matching Making Software:
 * Monospace fractional indicator `0.00` at the top right,
 * with a technical calibration tick-mark ruler track.
 */
export default function ReadingProgress() {
    const valueRef = useRef<HTMLSpanElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let frame = 0;

        const paint = () => {
            frame = 0;

            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;

            if (valueRef.current) {
                valueRef.current.textContent = ratio.toFixed(2);
            }
            if (indicatorRef.current) {
                indicatorRef.current.style.transform = `scaleY(${ratio})`;
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
        <div className="flex flex-col items-end gap-1.5" aria-hidden="true">
            <span
                className="font-mono text-[11px] font-medium tabular-nums text-ed-accent"
                ref={valueRef}
                style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}
            >
                0.00
            </span>
            {/* Calibration Ruler Track with Ticks */}
            <div className="relative h-48 w-4">
                {/* Background Ticks */}
                <div className="absolute inset-y-0 right-0 flex flex-col justify-between py-1 opacity-40">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <span
                            key={i}
                            className={`block bg-ed-rule-strong ${i % 2 === 0 ? 'w-3 h-[1px]' : 'w-1.5 h-[1px]'}`}
                        />
                    ))}
                </div>
                {/* Vertical Hairline */}
                <div className="absolute inset-y-0 right-0 w-[1px] bg-ed-rule">
                    {/* Active Fill Indicator */}
                    <div
                        ref={indicatorRef}
                        className="absolute inset-0 origin-top bg-ed-accent"
                        style={{ transform: 'scaleY(0)' }}
                    />
                </div>
            </div>
        </div>
    );
}
