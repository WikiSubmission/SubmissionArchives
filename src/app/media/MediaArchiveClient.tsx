'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import MediaThumbnail from '@/components/media/MediaThumbnail';
import PlayButton from '@/components/player/PlayButton';
import { COLLECTIONS, type CollectionKey, type Recording } from '@/lib/recordings';
import { getMediaHref } from '@/lib/utils';

// Two rows of video cards, or a short track list; the rest is one click away.
const PREVIEW_COUNT = { Video: 6, Audio: 8 } as const;
const SERIF = { fontFamily: 'var(--font-source-serif), Georgia, serif' };

export default function MediaArchiveClient({ recordings }: { recordings: Recording[] }) {
    const [filter, setFilter] = useState('');
    const [expanded, setExpanded] = useState<ReadonlySet<CollectionKey>>(() => new Set());

    const searchText = useMemo(
        () => new Map(recordings.map((r) => [r.id, `${r.title} ${r.number ?? ''} ${r.date ?? ''}`.toLowerCase()])),
        [recordings],
    );
    const query = filter.trim().toLowerCase();
    const sections = useMemo(() => {
        const terms = query.split(/\s+/).filter(Boolean);
        return COLLECTIONS.map((collection) => ({
            ...collection,
            items: recordings.filter((r) => r.collection === collection.key
                && terms.every((term) => searchText.get(r.id)!.includes(term))),
        }));
    }, [recordings, searchText, query]);
    const shown = sections.reduce((sum, section) => sum + section.items.length, 0);

    const toggle = (key: CollectionKey) => setExpanded((prev) => {
        const next = new Set(prev);
        if (!next.delete(key)) next.add(key);
        return next;
    });

    return (
        <main id="main-content" className="min-h-screen bg-ed-bg text-ed-fg">
            <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-7 lg:pt-14">
                <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pb-8">
                    <div className="max-w-2xl">
                        <h1 className="text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em]" style={SERIF}>
                            Recordings
                        </h1>
                        <p
                            className="mt-3 text-[16.5px] leading-[1.6] text-ed-fg-secondary"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            Programs, Friday sermons, lessons and Quran study sessions from Masjid Tucson. Open a recording to
                            watch or listen with its transcript.
                        </p>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" aria-hidden="true" />
                        <input
                            type="text"
                            value={filter}
                            onChange={(event) => setFilter(event.target.value)}
                            placeholder="Filter by title, number or date"
                            aria-label="Filter recordings"
                            autoComplete="off"
                            className="w-full rounded-[4px] border border-ed-rule bg-ed-surface py-2.5 pl-10 pr-10 text-base outline-none transition-colors placeholder:text-ed-fg-muted focus:border-ed-rule-strong sm:text-sm"
                        />
                        {filter ? (
                            <button
                                type="button"
                                onClick={() => setFilter('')}
                                aria-label="Clear filter"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[4px] p-1 text-ed-fg-muted hover:text-ed-fg"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        ) : null}
                    </div>
                </header>

                {/* Stays under the site header so any collection is one jump away, however far down you are. */}
                <nav
                    aria-label="Collections"
                    className="sticky top-[65px] z-20 -mx-4 border-y border-ed-rule bg-ed-bg/95 px-4 backdrop-blur sm:top-[73px] sm:-mx-7 sm:px-7"
                >
                    <div className="flex items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {sections.map((section, index) => (
                            <span key={section.key} className="contents">
                                {index === 0 || sections[index - 1].format !== section.format ? (
                                    <span className={`shrink-0 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ed-fg-muted ${index > 0 ? 'ml-4' : ''}`}>
                                        {section.format}
                                    </span>
                                ) : null}
                                <CollectionChip href={`#${section.key}`} label={section.label} count={section.items.length} />
                            </span>
                        ))}
                    </div>
                </nav>

                <p role="status" className="mb-10 mt-5 text-sm text-ed-fg-muted">
                    {query ? (
                        <>
                            {shown} of {recordings.length} recordings match.{' '}
                            <Link href={`/search?q=${encodeURIComponent(filter.trim())}`} className="font-medium text-ed-accent hover:underline">
                                Search their transcripts instead
                            </Link>
                        </>
                    ) : (
                        `${recordings.length} recordings in ${COLLECTIONS.length} collections`
                    )}
                </p>

                {shown === 0 ? (
                    <div className="rounded-[8px] border border-dashed border-ed-rule px-6 py-14 text-center">
                        <p className="text-ed-fg">No recording titles match &ldquo;{filter.trim()}&rdquo;.</p>
                        <button
                            type="button"
                            onClick={() => setFilter('')}
                            className="mt-4 rounded-[4px] border border-ed-rule bg-ed-surface px-4 py-2 text-xs font-semibold text-ed-fg-secondary hover:border-ed-rule-strong hover:text-ed-fg"
                        >
                            Clear filter
                        </button>
                    </div>
                ) : null}

                <div className="space-y-16">
                    {sections.filter((section) => section.items.length > 0).map((section) => {
                        // A filtered list is short, so every match shows.
                        const open = Boolean(query) || expanded.has(section.key);
                        const limit = PREVIEW_COUNT[section.format];
                        const visible = open ? section.items : section.items.slice(0, limit);
                        const toggleButton = !query && section.items.length > limit ? (
                            <button
                                type="button"
                                onClick={() => toggle(section.key)}
                                aria-expanded={open}
                                className="rounded-[4px] border border-ed-rule bg-ed-surface px-4 py-2 text-xs font-semibold text-ed-fg-secondary transition-colors hover:border-ed-rule-strong hover:text-ed-fg"
                            >
                                {open ? 'Show fewer' : `Show all ${section.items.length}`}
                            </button>
                        ) : null;

                        return (
                            <section key={section.key} id={section.key} aria-labelledby={`${section.key}-title`} className="scroll-mt-36">
                                <div className="mb-5 flex items-baseline justify-between gap-4">
                                    <h2 id={`${section.key}-title`} className="text-xl font-semibold tracking-tight sm:text-2xl" style={SERIF}>
                                        {section.label}
                                    </h2>
                                    <span className="shrink-0 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ed-fg-muted">
                                        {section.format} · {section.items.length}
                                    </span>
                                </div>

                                {section.format === 'Video' ? (
                                    <>
                                        <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                                            {visible.map((recording) => (
                                                <li key={recording.id}>
                                                    <VideoCard recording={recording} />
                                                </li>
                                            ))}
                                        </ul>
                                        {toggleButton ? <div className="mt-6">{toggleButton}</div> : null}
                                    </>
                                ) : (
                                    // Audio has no artwork worth a grid, so it reads as a track list.
                                    <div className="overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface">
                                        <ol className="divide-y divide-ed-rule">
                                            {visible.map((recording) => (
                                                <TrackRow key={recording.id} recording={recording} />
                                            ))}
                                        </ol>
                                        {toggleButton ? <div className="border-t border-ed-rule px-4 py-3 sm:px-5">{toggleButton}</div> : null}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}

function CollectionChip({ href, label, count }: { href: string; label: string; count: number }) {
    if (count === 0) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-ed-rule px-2.5 py-1 text-xs text-ed-fg-muted opacity-50">
                {label}
                <span className="font-mono text-[0.65rem]">0</span>
            </span>
        );
    }
    return (
        <a
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-ed-rule bg-ed-surface px-2.5 py-1 text-xs font-medium text-ed-fg-secondary transition-colors hover:border-ed-rule-strong hover:text-ed-fg"
        >
            {label}
            <span className="font-mono text-[0.65rem] text-ed-fg-muted">{count}</span>
        </a>
    );
}

function VideoCard({ recording }: { recording: Recording }) {
    return (
        <Link href={getMediaHref(recording.id)} className="group block">
            <div className="relative aspect-video overflow-hidden rounded-[6px] border border-ed-rule bg-ed-surface">
                <MediaThumbnail media={recording} sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" />
            </div>
            {recording.date ? (
                <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ed-fg-muted">{recording.date}</p>
            ) : null}
            <h3
                className={`${recording.date ? 'mt-1' : 'mt-3'} line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-ed-accent`}
                style={SERIF}
                title={recording.title}
            >
                {recording.shortTitle}
            </h3>
        </Link>
    );
}

function TrackRow({ recording }: { recording: Recording }) {
    const href = getMediaHref(recording.id);
    return (
        <li className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ed-surface-strong sm:gap-4 sm:px-5">
            {recording.playUrl ? (
                <PlayButton track={{ id: recording.id, title: recording.title, url: recording.playUrl, href }} />
            ) : (
                <span className="w-9 shrink-0" aria-hidden="true" />
            )}
            <span className="w-12 shrink-0 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-ed-fg-muted">{recording.number}</span>
            {/* The link stretches over the whole row; the play button sits above it. */}
            <Link href={href} title={recording.title} className="min-w-0 flex-1 after:absolute after:inset-0">
                <span className="block text-[15px] leading-snug transition-colors group-hover:text-ed-accent" style={SERIF}>
                    {recording.shortTitle}
                </span>
                {recording.date ? (
                    <span className="mt-0.5 block font-mono text-[0.65rem] uppercase tracking-[0.08em] text-ed-fg-muted md:hidden">
                        {recording.date}
                    </span>
                ) : null}
            </Link>
            {recording.date ? (
                <span className="hidden shrink-0 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-ed-fg-muted md:block">
                    {recording.date}
                </span>
            ) : null}
        </li>
    );
}
