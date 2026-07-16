import Link from 'next/link';
import { ArrowUpRight, BookMarked } from 'lucide-react';

const EDITIONS = [
    { label: 'Primary (1992)', active: true },
    { label: '1989', active: false },
    { label: '1981', active: false },
] as const;

export function QuranEditionsVisual() {
    return (
        <div className="overflow-hidden border border-ed-rule bg-ed-surface">
            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center border border-ed-rule bg-ed-bg text-ed-accent">
                        <BookMarked className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                            Verse study
                        </p>
                        <p className="mt-1 text-sm text-ed-fg">Sura 1 · The Key</p>
                    </div>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-ed-accent">1:1</span>
            </div>

            <div className="px-4 py-6 sm:px-6 sm:py-8">
                <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
                    {EDITIONS.map((edition) => (
                        <span
                            key={edition.label}
                            className={`inline-flex min-h-8 items-center border px-3 text-[0.68rem] font-semibold uppercase tracking-[0.08em] ${
                                edition.active
                                    ? 'border-ed-accent bg-ed-accent/10 text-ed-accent'
                                    : 'border-ed-rule text-ed-fg-muted'
                            }`}
                        >
                            {edition.label}
                        </span>
                    ))}
                </div>

                <p
                    dir="rtl"
                    lang="ar"
                    className="mt-7 font-arabic text-[clamp(1.7rem,4vw,2.5rem)] leading-[1.9] text-ed-fg"
                >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>

                <p className="mt-5 border-l-2 border-ed-accent pl-4 font-display text-lg leading-8 text-ed-fg sm:text-xl">
                    In the name of GOD, Most Gracious, Most Merciful.
                </p>

                <p className="mt-6 max-w-[52ch] text-sm leading-7 text-ed-fg-muted">
                    Every verse carries its Arabic text, three English editions, and the
                    subtitles and footnotes recorded by Dr. Rashad Khalifa.
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule px-4 py-4 sm:px-5">
                <Link
                    href="/quran/1"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ed-fg transition-colors hover:text-ed-accent"
                >
                    Read Sura 1, The Key
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                    114 suras · 3 editions
                </span>
            </div>
        </div>
    );
}
