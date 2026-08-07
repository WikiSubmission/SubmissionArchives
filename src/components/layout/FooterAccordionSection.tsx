'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';

type FooterNavSection = {
    title: string;
    links: Array<{ name: string; href: string }>;
};

// Native <details> snaps open/closed instantly with no way to transition its
// content height in CSS alone -- the browser hides non-summary children
// outright when closed, and there's no transform equivalent for height. On
// desktop (sm+) this section is always open and non-interactive (see the
// sm: classes below); this animation only ever runs on mobile.
const TOGGLE_DURATION_MS = 160;

export function FooterAccordionSection({ section }: { section: FooterNavSection }) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<Animation | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const closingRef = useRef(false);

    const handleToggleClick = (event: React.MouseEvent<HTMLElement>) => {
        // Desktop: the browser's own hover/focus styles are enough, and this
        // section never closes there -- let the native click through.
        if (window.matchMedia('(min-width: 640px)').matches) return;

        const details = detailsRef.current;
        const content = contentRef.current;
        if (!details || !content) return;

        event.preventDefault();
        animationRef.current?.cancel();
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);

        const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

        if (!details.open || closingRef.current) {
            const wasClosing = closingRef.current;
            details.open = true;
            const target = content.scrollHeight;
            animationRef.current = content.animate(
                { height: [`${wasClosing ? content.offsetHeight : 0}px`, `${target}px`] },
                { duration: TOGGLE_DURATION_MS, easing },
            );
            closingRef.current = false;
            timeoutRef.current = window.setTimeout(() => {
                content.style.height = '';
            }, TOGGLE_DURATION_MS);
        } else {
            closingRef.current = true;
            const start = content.offsetHeight;
            animationRef.current = content.animate(
                { height: [`${start}px`, '0px'] },
                { duration: TOGGLE_DURATION_MS, easing },
            );
            timeoutRef.current = window.setTimeout(() => {
                closingRef.current = false;
                content.style.height = '';
                details.open = false;
            }, TOGGLE_DURATION_MS);
        }
    };

    return (
        <details ref={detailsRef} className="group border-b border-ed-rule/60 dark:border-white/10 sm:border-b-0" open>
            <summary
                onClick={handleToggleClick}
                className="flex cursor-pointer list-none items-center justify-between py-4 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted sm:cursor-default sm:border-b sm:border-ed-rule/60 dark:sm:border-white/10 sm:pb-3 sm:pt-0 [&::-webkit-details-marker]:hidden"
            >
                {section.title}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 sm:hidden" aria-hidden="true" />
            </summary>
            <div ref={contentRef} className="overflow-hidden">
                <ul className="pb-4 sm:mt-3 sm:pb-0 space-y-1">
                    {section.links.map((link) => (
                        <li key={link.name}>
                            {link.href.startsWith('http') ? (
                                <a
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-9 items-center font-sans text-[0.88rem] text-ed-fg-muted transition-colors hover:text-ed-fg"
                                >
                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            ) : (
                                <Link href={link.href} className="inline-flex min-h-9 items-center font-sans text-[0.88rem] text-ed-fg-muted transition-colors hover:text-ed-fg">
                                    {link.name}
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}
