'use client';

import { useEffect, useState } from 'react';

import type { EditorialHeading } from '@/lib/editorials';

interface EditorialTocProps {
    headings: EditorialHeading[];
}

/** Distance below the sticky header at which a heading counts as "current". */
const ACTIVE_OFFSET_PX = 120;

/**
 * The in-article table of contents. It tracks the section the reader is in and
 * updates React state only when that section changes, so scrolling costs one
 * render per section rather than one per frame.
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
        <nav aria-label="Sections in this editorial">
            <p className="mb-3 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">In this editorial</p>
            <ul className="list-none">
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <a
                            className="editorial-toc-link"
                            href={`#${heading.id}`}
                            data-level={heading.level}
                            data-active={activeId === heading.id}
                            aria-current={activeId === heading.id ? 'location' : undefined}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
