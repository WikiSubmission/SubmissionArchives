'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';

import { CtaLink } from './SectionCta';

const BOOKS = [
    {
        id: 'quran1981',
        title: 'Quran: The Final Scripture (1981)',
        src: '/content/written/books/thumbnails/Quran1981.png',
        meta: '384 pages · 1981 Edition',
    },
    {
        id: 'hard-cover-1989',
        title: 'Quran: The Final Testament (1989)',
        src: '/content/written/books/thumbnails/Hard Cover 1989.png',
        meta: '760 pages · 1989 Edition',
    },
    {
        id: 'quran-hadith-islam',
        title: 'Quran, Hadith, and Islam',
        src: '/content/written/books/thumbnails/Quran, Hadith, and Islam.png',
        meta: '128 pages · Publication',
    },
    {
        id: 'miracle-of-quran-alphabets',
        title: 'Miracle of the Quran',
        src: '/content/written/books/thumbnails/Miracle of Quran - Significance of the Mysterious Alphabets.png',
        meta: '220 pages · Mathematical Study',
    },
    {
        id: 'computer-speaks',
        title: 'The Computer Speaks',
        src: "/content/written/books/thumbnails/The Computer Speaks God's Message to the World.jpg",
        meta: '190 pages · Research Work',
    },
] as const;

const NEWSLETTERS = [
    {
        id: 'sp-1985-01',
        title: 'Submitters Perspective — Jan 1985',
        src: '/images/placeholders/newsletter.png',
        meta: 'Issue #1 · Tucson, AZ',
    },
    {
        id: 'sp-1989-09',
        title: 'Submitters Perspective — Sep 1989',
        src: '/images/placeholders/newsletter.png',
        meta: 'Issue #57 · Tucson, AZ',
    },
    {
        id: 'sp-1989-11',
        title: 'Submitters Perspective — Nov 1989',
        src: '/images/placeholders/newsletter.png',
        meta: 'Issue #59 · Tucson, AZ',
    },
] as const;

export function WrittenArchiveVisual() {
    const [viewTab, setViewTab] = useState<'books' | 'newsletters'>('books');
    const items = viewTab === 'books' ? BOOKS : NEWSLETTERS;

    return (
        <div className="lift-card relative overflow-hidden rounded-none border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-md)]">
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/60 to-transparent"
            />

            {/* Header bar */}
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-ed-rule bg-ed-bg text-ed-accent">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                            Reading room
                        </p>
                        <p className="mt-1 text-sm text-ed-fg">From the shelf</p>
                    </div>
                </div>

                {/* View tab toggles */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setViewTab('books')}
                        className={`inline-flex min-h-8 items-center border px-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
                            viewTab === 'books'
                                ? 'border-ed-accent bg-ed-accent/12 text-ed-accent'
                                : 'border-ed-rule text-ed-fg-muted hover:text-ed-fg'
                        }`}
                    >
                        Books (10)
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewTab('newsletters')}
                        className={`inline-flex min-h-8 items-center border px-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
                            viewTab === 'newsletters'
                                ? 'border-ed-accent bg-ed-accent/12 text-ed-accent'
                                : 'border-ed-rule text-ed-fg-muted hover:text-ed-fg'
                        }`}
                    >
                        Newsletters (64)
                    </button>
                </div>
            </div>

            {/* Shelf Display */}
            <div className="relative bg-[color-mix(in_oklch,var(--ed-surface)_68%,var(--ed-bg))] px-4 pb-0 pt-8 sm:px-6 sm:pt-10">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 top-0 h-40 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--ed-gold)_16%,transparent),transparent)] blur-xl"
                />
                <div className="relative mx-auto flex max-w-xl items-end justify-center">
                    {items.map((item, index) => (
                        <Link
                            key={item.id}
                            href={`/library/${item.id}`}
                            aria-label={`Open ${item.title}`}
                            className="group relative -mx-2 block w-[24%] max-w-[8.5rem] origin-bottom rounded-none border border-ed-rule bg-ed-bg shadow-[0_14px_35px_color-mix(in_oklch,var(--ed-fg)_16%,transparent)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] first:ml-0 last:mr-0 hover:z-10 hover:-translate-y-3 hover:shadow-[var(--ed-shadow-lg)]"
                            style={{ zIndex: index === Math.floor(items.length / 2) ? 5 : 4 - Math.abs(index - Math.floor(items.length / 2)) }}
                        >
                            <span className="relative block aspect-[2/3] overflow-hidden rounded-none">
                                <Image
                                    src={item.src}
                                    alt={`Cover of ${item.title}`}
                                    fill
                                    unoptimized
                                    sizes="140px"
                                    className="object-cover"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 transition-colors duration-300 group-hover:from-black/16"
                                />
                            </span>
                        </Link>
                    ))}
                </div>
                <div
                    className="relative mx-auto h-2 max-w-2xl border-x border-t border-ed-rule bg-gradient-to-b from-ed-surface-strong to-ed-surface"
                    aria-hidden="true"
                />
            </div>

            {/* Footer bar */}
            <div className="border-t border-ed-rule px-4 py-3 sm:px-5">
                <CtaLink href="/written" label="Open the full written archive" />
            </div>
        </div>
    );
}
