'use client';

import { useEffect, useState } from 'react';

import type { EditorialHeading } from '@/lib/editorials';

interface EditorialTocProps {
    headings: EditorialHeading[];
}

/** Distance below the sticky header at which a heading counts as "current". */
const ACTIVE_OFFSET_PX = 120;

/**
 * In-article table of contents styled after Making Software:
 * Clean monospace section headers with bulleted section links and illuminated active state.
 */
export default function EditorialToc({ headings }: EditorialTocProps) {
    const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '');

    useEffect(() => {
        if (headings.length === 0) return;

        let frame = 0;

        const resolveActive = () => {
            frame = 0;

            let current = headings[0].id;
            for (const heading of headings) {
                const element = document.getElementById(heading.id);
                if (!element) continue;
                if (element.getBoundingClientRect().top > ACTIVE_OFFSET_PX) break;
                current = heading.id;
            }

            setActiveId((previous) => (previous === current ? previous : current));
        };

        const onScroll = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(resolveActive);
        };

        resolveActive();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [headings]);

    if (headings.length === 0) {
        return null;
    }

    return (
        <nav aria-label="Sections in this editorial" className="space-y-4">
            <p
                className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ed-fg-faint"
                style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}
            >
                SECTIONS &amp; CITATIONS
            </p>
            <ul className="list-none space-y-1.5 pl-0">
                {headings.map((heading) => {
                    const isActive = activeId === heading.id;
                    const isSub = heading.level === 3;
                    return (
                        <li key={heading.id} className={isSub ? 'pl-3.5' : ''}>
                            <a
                                href={`#${heading.id}`}
                                aria-current={isActive ? 'location' : undefined}
                                className={`group flex items-start gap-2 py-0.5 font-sans text-[13px] leading-snug transition-colors ${
                                    isActive
                                        ? 'font-medium text-ed-accent'
                                        : 'text-ed-fg-muted hover:text-ed-fg'
                                }`}
                            >
                                <span
                                    className={`select-none font-mono text-[12px] leading-none transition-colors ${
                                        isActive ? 'text-ed-accent' : 'text-ed-fg-faint group-hover:text-ed-fg-muted'
                                    }`}
                                    aria-hidden="true"
                                >
                                    •
                                </span>
                                <span className="flex-1">{heading.text}</span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
