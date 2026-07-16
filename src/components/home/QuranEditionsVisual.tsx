import { BookMarked } from 'lucide-react';

import { CtaLink } from './SectionCta';

const EDITIONS = [
    { label: 'Primary (1992)', active: true },
    { label: '1989', active: false },
    { label: '1981', active: false },
] as const;

export function QuranEditionsVisual() {
    return (
        <div className="lift-card relative overflow-hidden rounded-[var(--ed-radius-lg)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-md)]">
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/60 to-transparent"
            />

            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-bg text-ed-accent">
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
                            className={`inline-flex min-h-8 items-center rounded-full border px-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
                                edition.active
                                    ? 'border-ed-accent bg-ed-accent/10 text-ed-accent'
                                    : 'border-ed-rule text-ed-fg-muted'
                            }`}
                        >
                            {edition.label}
                        </span>
                    ))}
                </div>

                {/* The verse panel — a softly lit page inside the card */}
                <div className="relative mt-7 overflow-hidden rounded-[var(--ed-radius-md)] border border-ed-rule bg-ed-bg px-5 py-7 sm:px-7">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_130%_at_50%_0%,color-mix(in_oklch,var(--ed-gold)_12%,transparent),transparent_60%)]"
                    />
                    <p
                        dir="rtl"
                        lang="ar"
                        className="relative text-center font-arabic text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.9] text-ed-fg"
                    >
                        <span aria-hidden="true" className="mx-3 text-[0.6em] text-ed-accent">﴿</span>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        <span aria-hidden="true" className="mx-3 text-[0.6em] text-ed-accent">﴾</span>
                    </p>

                    <div className="relative mt-6 flex gap-4">
                        <span
                            aria-hidden="true"
                            className="w-[3px] shrink-0 rounded-full bg-gradient-to-b from-ed-accent to-ed-accent-soft"
                        />
                        <p className="font-display text-lg leading-8 text-ed-fg sm:text-xl">
                            In the name of GOD, Most Gracious, Most Merciful.
                        </p>
                    </div>
                </div>

                <p className="mt-6 max-w-[52ch] text-sm leading-7 text-ed-fg-muted">
                    Every verse carries its Arabic text, three English editions, and the
                    subtitles and footnotes recorded by Dr. Rashad Khalifa.
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule px-4 py-3 sm:px-5">
                <CtaLink href="/quran/1" label="Read Sura 1, The Key" />
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                    114 suras · 3 editions
                </span>
            </div>
        </div>
    );
}
