import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import { CtaLink } from './SectionCta';

const SHELF_COVERS = [
    {
        id: 'quran1981',
        title: 'Quran: The Final Scripture (1981)',
        src: '/content/written/books/thumbnails/Quran1981.png',
    },
    {
        id: 'hard-cover-1989',
        title: 'Quran: The Final Testament (1989)',
        src: '/content/written/books/thumbnails/Hard Cover 1989.png',
    },
    {
        id: 'quran-hadith-islam',
        title: 'Quran, Hadith, and Islam',
        src: '/content/written/books/thumbnails/Quran, Hadith, and Islam.png',
    },
    {
        id: 'miracle-of-quran-alphabets',
        title: 'Miracle of the Quran',
        src: '/content/written/books/thumbnails/Miracle of Quran - Significance of the Mysterious Alphabets.png',
    },
    {
        id: 'computer-speaks',
        title: 'The Computer Speaks',
        src: "/content/written/books/thumbnails/The Computer Speaks God's Message to the World.jpg",
    },
] as const;

const SHELF_TILT = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1'] as const;

export function WrittenArchiveVisual() {
    return (
        <div className="lift-card relative overflow-hidden rounded-[var(--ed-radius-lg)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-md)]">
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/60 to-transparent"
            />

            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-bg text-ed-accent">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                            Reading room
                        </p>
                        <p className="mt-1 text-sm text-ed-fg">From the shelf</p>
                    </div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-ed-fg-muted">
                    10 books · 64 newsletters
                </span>
            </div>

            <div className="relative bg-[color-mix(in_oklch,var(--ed-surface)_68%,var(--ed-bg))] px-4 pb-0 pt-8 sm:px-6 sm:pt-10">
                {/* Warm lamp glow over the shelf */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 top-0 h-40 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--ed-gold)_16%,transparent),transparent)] blur-xl"
                />
                <div className="relative mx-auto flex max-w-xl items-end justify-center">
                    {SHELF_COVERS.map((cover, index) => (
                        <Link
                            key={cover.id}
                            href={`/library/${cover.id}`}
                            aria-label={`Open ${cover.title}`}
                            className={`group relative -mx-2 block w-[22%] max-w-[8.5rem] origin-bottom rounded-[4px] border border-ed-rule bg-ed-bg shadow-[0_14px_35px_color-mix(in_oklch,var(--ed-fg)_16%,transparent)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] first:ml-0 last:mr-0 hover:z-10 hover:-translate-y-3 hover:rotate-0 hover:shadow-[var(--ed-shadow-lg)] ${SHELF_TILT[index]}`}
                            style={{ zIndex: index === 2 ? 5 : 4 - Math.abs(index - 2) }}
                        >
                            <span className="relative block aspect-[2/3] overflow-hidden rounded-[3px]">
                                <Image
                                    src={cover.src}
                                    alt={`Cover of ${cover.title}`}
                                    fill
                                    unoptimized
                                    sizes="140px"
                                    className="object-cover"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 transition-colors duration-300 group-hover:from-black/12"
                                />
                            </span>
                        </Link>
                    ))}
                </div>
                <div
                    className="relative mx-auto h-2 max-w-2xl rounded-t-sm border-x border-t border-ed-rule bg-gradient-to-b from-ed-surface-strong to-ed-surface"
                    aria-hidden="true"
                />
            </div>

            <div className="border-t border-ed-rule px-4 py-3 sm:px-5">
                <CtaLink href="/written" label="Open the reading room" />
            </div>
        </div>
    );
}
