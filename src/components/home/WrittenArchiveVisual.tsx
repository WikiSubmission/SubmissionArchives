'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

import { GlassSheen, widgetCardClass } from './WidgetAccents';
import { FluidTabs } from '@/components/ui/fluid-tabs';

const BOOKS = [
    {
        id: 'quran1981',
        title: 'Quran: The Final Scripture (1981)',
        src: '/content/written/books/thumbnails/quran1981.png',
        meta: '384 pages · 1981 Edition',
        badge: 'Authorized Translation',
    },
    {
        id: 'hard-cover-1989',
        title: 'Quran: The Final Testament (1989)',
        src: '/content/written/books/thumbnails/hard-cover-1989.png',
        meta: '760 pages · 1989 Edition',
        badge: 'Authorized Translation',
    },
    {
        id: 'quran-hadith-islam',
        title: 'Quran, Hadith, and Islam',
        src: '/content/written/books/thumbnails/quran-hadith-islam.png',
        meta: '128 pages · Landmark Book',
        badge: 'Monotheism Treatise',
    },
    {
        id: 'miracle-of-quran-alphabets',
        title: 'Visual Presentation of the Miracle',
        src: '/content/written/books/thumbnails/miracle-of-quran-alphabets.png',
        meta: '220 pages · Mathematical Study',
        badge: 'Mathematical Miracle',
    },
    {
        id: 'computer-speaks',
        title: 'The Computer Speaks',
        src: '/content/written/books/thumbnails/computer-speaks.jpg',
        meta: '190 pages · Research Work',
        badge: 'Research Publication',
    },
] as const;

const NEWSLETTERS = [
    {
        id: 'sp-1989-09',
        title: 'Submitters Perspective — Sep 1989',
        src: '/content/written/newsletters/thumbnails/1989_09_September.jpg',
        meta: 'Issue #57 · Tucson, AZ',
        badge: 'Monthly Bulletin',
    },
    {
        id: 'sp-1989-10',
        title: 'Submitters Perspective — Oct 1989',
        src: '/content/written/newsletters/thumbnails/1989_10_October.jpg',
        meta: 'Issue #58 · Tucson, AZ',
        badge: 'Monthly Bulletin',
    },
    {
        id: 'sp-1989-11',
        title: 'Submitters Perspective — Nov 1989',
        src: '/content/written/newsletters/thumbnails/1989_11_November.jpg',
        meta: 'Issue #59 · Tucson, AZ',
        badge: 'Monthly Bulletin',
    },
] as const;

export function WrittenArchiveVisual() {
    const [viewTab, setViewTab] = useState<'books' | 'newsletters'>('books');
    const items = viewTab === 'books' ? BOOKS : NEWSLETTERS;

    return (
        <div className={widgetCardClass}>
            <GlassSheen />
            {/* Header bar with Traffic Lights */}
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-6 bg-ed-surface-strong/40 select-none">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
                        <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
                        <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
                    </div>
                    <span className="h-3.5 w-px bg-ed-rule-strong/60" aria-hidden="true" />
                    <div>
                        <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                            Reading Room · <span className="text-ed-fg font-bold">Written Shelf</span>
                        </p>
                    </div>
                </div>

                {/* View tab toggles with Watermelon FluidTabs */}
                <FluidTabs
                    size="sm"
                    activeId={viewTab}
                    onChange={(id) => setViewTab(id as 'books' | 'newsletters')}
                    tabs={[
                        { id: 'books', label: 'Books', count: '10' },
                        { id: 'newsletters', label: 'Newsletters', count: '64' },
                    ]}
                />
            </div>

            {/* Shelf Display */}
            <div className="relative bg-ed-surface/30 px-4 pb-4 pt-8 sm:px-8 sm:pt-10">
                <div className="relative mx-auto flex max-w-xl items-end justify-center pb-3">
                    {items.map((item, index) => (
                        <Link
                            key={item.id}
                            href={`/library/${item.id}`}
                            aria-label={`Open ${item.title}`}
                            className="group relative -mx-2 block w-[24%] max-w-[9rem] origin-bottom overflow-hidden rounded-xl border border-ed-rule bg-ed-bg shadow-2xl transition-all duration-250 ease-out first:ml-0 last:mr-0 hover:z-20 hover:-translate-y-2 hover:border-ed-fg hover:shadow-[0_16px_30px_-10px_rgba(0,0,0,0.4)]"
                            style={{ zIndex: index === Math.floor(items.length / 2) ? 5 : 4 - Math.abs(index - Math.floor(items.length / 2)) }}
                        >
                            <span className="relative block aspect-[2/3] overflow-hidden rounded-xl bg-ed-surface">
                                <Image
                                    src={item.src}
                                    alt={`Cover of ${item.title}`}
                                    fill
                                    sizes="160px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                />
                                <span className="absolute bottom-2 left-2 right-2 hidden text-[10px] font-semibold leading-tight text-white group-hover:block line-clamp-2">
                                    {item.title}
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
                {/* Visual Shelf Ledge */}
                <div
                    className="relative mx-auto h-2.5 max-w-2xl rounded-full border-x border-t border-ed-rule bg-gradient-to-b from-ed-surface-strong to-ed-surface shadow-md"
                    aria-hidden="true"
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ed-fg-muted">
                    <span className="font-mono text-[0.68rem]">High-resolution PDF viewer & OCR text layer</span>
                    <span className="font-mono text-[0.68rem]">Click any book to open reader</span>
                </div>
            </div>

            {/* Footer bar */}
            <div className="flex items-center justify-between border-t border-ed-rule px-4 py-3 sm:px-5 bg-ed-surface/60">
                <Link
                    href="/written"
                    className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-ed-fg hover:text-ed-accent transition-colors"
                >
                    <span>Browse complete written collection</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                    74 Publications Preserved
                </span>
            </div>
        </div>
    );
}
