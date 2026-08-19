'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';

type FooterNavSection = {
    title: string;
    links: Array<{ name: string; href: string }>;
};

const TOGGLE_DURATION_MS = 160;

export function FooterAccordionSection({ section }: { section: FooterNavSection }) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<Animation | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const closingRef = useRef(false);

    const handleToggleClick = (event: React.MouseEvent<HTMLElement>) => {
        // Desktop: always open, skip accordion animation
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
        <details ref={detailsRef} className="group border-b border-[#2A2928] sm:border-b-0" open>
            <summary
                onClick={handleToggleClick}
                className="flex cursor-pointer list-none items-center justify-between py-4 font-sans text-xs font-semibold text-[#6B6560] sm:cursor-default sm:border-b sm:border-[#2A2928] sm:pb-3 sm:pt-0 [&::-webkit-details-marker]:hidden"
            >
                {section.title}
                <ChevronDown className="h-4 w-4 shrink-0 text-[#6B6560] transition-transform duration-200 group-open:rotate-180 sm:hidden" aria-hidden="true" />
            </summary>
            <div ref={contentRef} className="overflow-hidden">
                <ul className="pb-4 sm:mt-3.5 sm:pb-0 space-y-2">
                    {section.links.map((link) => (
                        <li key={link.name}>
                            {link.href.startsWith('http') ? (
                                <a
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-8 items-center text-sm text-[#6B6560] transition-colors duration-150 hover:text-[#F5F0EB]"
                                >
                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            ) : (
                                <Link
                                    href={link.href}
                                    className="inline-flex min-h-8 items-center text-sm text-[#6B6560] transition-colors duration-150 hover:text-[#F5F0EB]"
                                >
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
