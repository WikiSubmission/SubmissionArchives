'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';

import { CtaLink } from './SectionCta';
import { IconBadge, GlassSheen, activeChipClass, inactiveChipClass, widgetCardClass } from './WidgetAccents';

const BOOKS = [
    {
        id: 'quran1981',
        title: 'Quran: The Final Scripture (1981)',
        src: '/content/written/books/thumbnails/quran1981.png',
        meta: '384 pages · 1981 Edition',
    },
    {
        id: 'hard-cover-1989',
        title: 'Quran: The Final Testament (1989)',
        src: '/content/written/books/thumbnails/hard-cover-1989.png',
        meta: '760 pages · 1989 Edition',
    },
    {
        id: 'quran-hadith-islam',
        title: 'Quran, Hadith, and Islam',
        src: '/content/written/books/thumbnails/quran-hadith-islam.png',
        meta: '128 pages · Publication',
    },
    {
        id: 'miracle-of-quran-alphabets',
        title: 'Miracle of the Quran',
        src: '/content/written/books/thumbnails/miracle-of-quran-alphabets.png',
        meta: '220 pages · Mathematical Study',
    },
    {
        id: 'computer-speaks',
        title: 'The Computer Speaks',
        src: "/content/written/books/thumbnails/computer-speaks.jpg",
        meta: '190 pages · Research Work',
    },
] as const;

const NEWSLETTERS = [
    {
        id: 'sp-1989-09',
        title: 'Submitters Perspective — Sep 1989',
        src: '/content/written/newsletters/thumbnails/1989_09_September.jpg',
        meta: 'Issue #57 · Tucson, AZ',
    },
    {
        id: 'sp-1989-10',
        title: 'Submitters Perspective — Oct 1989',
        src: '/content/written/newsletters/thumbnails/1989_10_October.jpg',
        meta: 'Issue #58 · Tucson, AZ',
    },
    {
        id: 'sp-1989-11',
        title: 'Submitters Perspective — Nov 1989',
        src: '/content/written/newsletters/thumbnails/1989_11_November.jpg',
        meta: 'Issue #59 · Tucson, AZ',
    },
] as const;

export function WrittenArchiveVisual() {
    const [viewTab, setViewTab] = useState<'books' | 'newsletters'>('books');
    const items = viewTab === 'books' ? BOOKS : NEWSLETTERS;

    return (
        <div className={widgetCardClass}>
            <GlassSheen />
            {/* Header bar */}
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-ed-rule px-4 py-2.5 sm:px-5 bg-ed-surface/50">
                <div className="flex items-center gap-3">
                    <IconBadge>
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconBadge>
                    <div>
                        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                            Reading Room · Written Shelf
                        </p>
                    </div>
                </div>

                {/* View tab toggles */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setViewTab('books')}
                        className={`inline-flex min-h-7 items-center rounded-full border px-3 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                            viewTab === 'books' ? activeChipClass : inactiveChipClass
                        }`}
                    >
                        Books (10)
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewTab('newsletters')}
                        className={`inline-flex min-h-7 items-center rounded-full border px-3 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                            viewTab === 'newsletters' ? activeChipClass : inactiveChipClass
                        }`}
                    >
                        Newsletters (64)
                    </button>
                </div>
            </div>

            {/* Shelf Display */}
            <div className="relative bg-ed-surface/40 px-4 pb-0 pt-8 sm:px-6 sm:pt-10">
                <div className="relative mx-auto flex max-w-xl items-end justify-center pb-2">
                    {items.map((item, index) => (
                        <Link
                            key={item.id}
                            href={`/library/${item.id}`}
                            aria-label={`Open ${item.title}`}
                            className="group relative -mx-2 block w-[24%] max-w-[8.5rem] origin-bottom overflow-hidden rounded-xl border border-ed-rule bg-ed-bg shadow-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] first:ml-0 last:mr-0 hover:z-10 hover:-translate-y-3 hover:border-ed-fg hover:shadow-2xl"
                            style={{ zIndex: index === Math.floor(items.length / 2) ? 5 : 4 - Math.abs(index - Math.floor(items.length / 2)) }}
                        >
                            <span className="relative block aspect-[2/3] overflow-hidden rounded-xl">
                                <Image
                                    src={item.src}
                                    alt={`Cover of ${item.title}`}
                                    fill
                                    sizes="140px"
                                    className="object-cover"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                />
                            </span>
                        </Link>
                    ))}
                </div>
                <div
                    className="relative mx-auto h-2 max-w-2xl rounded-full border-x border-t border-ed-rule bg-gradient-to-b from-ed-surface-strong to-ed-surface"
                    aria-hidden="true"
                />
            </div>

            {/* Footer bar */}
            <div className="border-t border-ed-rule px-4 py-3 sm:px-5 bg-ed-surface/50">
                <CtaLink href="/written" label="Open the full written archive" />
            </div>
        </div>
    );
}
