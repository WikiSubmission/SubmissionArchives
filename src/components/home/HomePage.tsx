import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ArchiveBranch } from './ArchiveBranch';
import { AudioArchiveSection } from './AudioArchiveSection';
import { HeroSection } from './HeroSection';
import { QuranEditionsVisual } from './QuranEditionsVisual';
import { Reveal } from './Reveal';
import { VideoArchiveSection } from './VideoArchiveSection';
import { WrittenArchiveVisual } from './WrittenArchiveVisual';

const WRITTEN_CAPABILITIES = [
    {
        title: 'Books and publications',
        body: 'Full-length works by Dr. Rashad Khalifa, transcribed and connected to the archive search.',
    },
    {
        title: 'Every newsletter issue',
        body: 'Submitters Perspectives issues are indexed in full, not summarized.',
    },
    {
        title: 'Page-accurate results',
        body: 'Search results open the original scan at the matched page.',
    },
] as const;

const QURAN_CAPABILITIES = [
    {
        title: 'Three parallel editions',
        body: 'The 1981, 1989, and 1992 English editions appear beside the Arabic text.',
    },
    {
        title: 'Subtitles and footnotes',
        body: 'Dr. Rashad Khalifa\'s subtitles and footnotes are preserved with each verse.',
    },
    {
        title: 'Verse-level search',
        body: 'Search within a sura or across all 114 suras at once.',
    },
] as const;

const SEARCH_CAPABILITIES = [
    {
        title: 'Exact and nearby terms',
        body: 'Search exact phrases or find related words within the same passage.',
    },
    {
        title: 'One index, many formats',
        body: 'Recordings, newsletters, books, appendices, and Qur\'an editions appear together.',
    },
    {
        title: 'Open at the evidence',
        body: 'Playable results begin at the matched timestamp, while documents open at the relevant page.',
    },
] as const;

export default function HomePage() {
    return (
        <main id="main-content" className="ambient-page min-h-screen overflow-hidden bg-ed-bg text-ed-fg">
            <HeroSection />

            <section
                aria-labelledby="archive-pathways-title"
                className="mx-auto max-w-[1440px] px-4 pb-20 pt-16 sm:px-6 lg:px-10 lg:pb-28 lg:pt-28"
            >
                <header>
                    <Reveal>
                        <p className="archive-kicker">Ways into the collection</p>
                    </Reveal>
                    <div className="mt-7 grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-end lg:gap-14">
                        <Reveal delay={90}>
                            <h2
                                id="archive-pathways-title"
                                className="max-w-[16ch] font-display text-[clamp(2.75rem,7vw,5.75rem)] font-medium leading-[0.92] tracking-[-0.035em] text-ed-fg"
                            >
                                Five paths through{' '}
                                <em className="bg-gradient-to-br from-ed-accent to-ed-accent-soft bg-clip-text italic text-transparent">
                                    one archive.
                                </em>
                            </h2>
                        </Reveal>

                    </div>
                    <Reveal delay={260}>
                        <div className="divider-fade mt-10 lg:mt-12" aria-hidden="true" />
                    </Reveal>
                </header>

                <div className="mt-16 space-y-24 lg:mt-24 lg:space-y-32">
                    <VideoArchiveSection />
                    <div className="divider-fade" aria-hidden="true" />
                    <AudioArchiveSection />
                    <div className="divider-fade" aria-hidden="true" />
                    <ArchiveBranch
                        numeral="III"
                        kicker="Books, newsletters, appendices"
                        title="Written archive"
                        body="Books, newsletters, and appendices by Dr. Rashad Khalifa, transcribed and connected to the same research search used across the whole collection."
                        href="/written"
                        cta="Browse the written archive"
                        details={WRITTEN_CAPABILITIES}
                        visual={<WrittenArchiveVisual />}
                    />
                    <div className="divider-fade" aria-hidden="true" />
                    <ArchiveBranch
                        numeral="IV"
                        kicker="Three editions, one text"
                        title="Qur'an editions"
                        body="Arabic text alongside the 1981, 1989, and 1992 English editions, with subtitles, footnotes, and verse-level search for all 114 suras."
                        href="/quran"
                        cta="Open the Qur'an editions"
                        details={QURAN_CAPABILITIES}
                        visual={<QuranEditionsVisual />}
                        reverse
                    />
                    <div className="divider-fade" aria-hidden="true" />
                    <ArchiveBranch
                        numeral="V"
                        kicker="Cross-collection search"
                        title="Search the archive"
                        body="Search names, verses, phrases, and recurring ideas across transcripts and written works. Results are ranked by exact phrases, nearby terms, and repeated evidence."
                        href="/search"
                        cta="Search the archive"
                        details={SEARCH_CAPABILITIES}
                        showSearchDemo
                    />
                </div>

                {/* Luminous Closing CTA Banner */}
                <Reveal className="mt-20 lg:mt-28">
                    <section
                        aria-labelledby="closing-cta-title"
                        className="relative overflow-hidden rounded-2xl border border-ed-rule-strong bg-ed-fg px-6 py-14 text-center shadow-2xl sm:px-12 lg:py-18"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.08),transparent_65%)]"
                        />
                        <div className="relative">
                            <div className="mx-auto w-fit">
                                <span className="inline-block rounded-full border border-ed-bg/20 bg-ed-bg/10 px-3.5 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ed-bg/90 backdrop-blur-md">
                                    Begin Anywhere
                                </span>
                            </div>
                            <h2
                                id="closing-cta-title"
                                className="mx-auto mt-6 max-w-[18ch] font-sans text-[clamp(2.4rem,5.5vw,4.2rem)] font-extrabold leading-[1] tracking-tight text-ed-bg"
                            >
                                Start with a single search.
                            </h2>
                            <p className="mx-auto mt-4 max-w-[46ch] font-sans text-[0.98rem] leading-7 text-ed-bg/85">
                                One query reaches every recording, transcript, newsletter, book, and verse in the collection.
                            </p>
                            <Link
                                href="/search"
                                className="group mt-8 inline-flex min-h-12 items-center gap-2.5 rounded-full bg-ed-bg px-8 font-sans text-sm font-semibold text-ed-fg shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                Search the archive
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </section>
                </Reveal>
            </section>
        </main>
    );
}
