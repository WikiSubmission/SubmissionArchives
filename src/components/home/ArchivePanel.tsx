import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const SERIF = { fontFamily: 'var(--font-source-serif), Georgia, serif' };

type ArchivePanelProps = {
    id: string;
    title: string;
    meta?: string;
    footer: ReactNode;
    children: ReactNode;
};

// The frame every home panel shares: a titled header strip, the content, and a footer strip
// holding the way into that part of the archive.
export function ArchivePanel({ id, title, meta, footer, children }: ArchivePanelProps) {
    return (
        <section aria-labelledby={id} className="flex flex-col overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ed-rule px-5 py-3.5">
                <h2 id={id} className="text-[19px] font-semibold tracking-[-0.01em]" style={SERIF}>
                    {title}
                </h2>
                {meta ? (
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ed-fg-muted">{meta}</span>
                ) : null}
            </header>
            <div className="flex-1 p-5">{children}</div>
            <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ed-rule px-5 py-3.5">{footer}</footer>
        </section>
    );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ed-accent">
            {children}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
    );
}
