import { ArrowRight, ShieldCheck, Sparkles, BookOpen, Search } from 'lucide-react';
import Link from 'next/link';

import { ArchiveBranch } from './ArchiveBranch';
import { AudioArchiveSection } from './AudioArchiveSection';
import { HeroSection } from './HeroSection';
import { ScripturesVisual } from './ScripturesVisual';
import { Reveal } from './Reveal';
import { VideoArchiveSection } from './VideoArchiveSection';
import { WrittenArchiveVisual } from './WrittenArchiveVisual';

const WRITTEN_CAPABILITIES = [
    {
        title: 'Complete Published Books',
        body: 'Full-length works including Quran: The Final Scripture (1981), The Final Testament (1989/1992), Quran, Hadith, and Islam, and The Computer Speaks.',
    },
    {
        title: 'Submitters Perspective Chronicle',
        body: 'Every monthly newsletter issue (1985–1990+) preserved and indexed in full with original articles and historic announcements.',
    },
    {
        title: 'High-Resolution Facsimiles',
        body: 'Scanned original pages paired with searchable OCR text layers and page-accurate navigation.',
    },
    {
        title: 'Research & Cross-Referencing',
        body: 'Seamlessly search across books and newsletters with highlighted phrase matching.',
    },
] as const;

const SCRIPTURE_CAPABILITIES = [
    {
        title: 'Five Sacred Canons & Collections',
        body: 'The Qur\'an (114 Surahs), 38 Appendices, Old Testament (39 books), OT Apocrypha (15 books), and New Testament (27 books).',
    },
    {
        title: 'Original Languages & Translations',
        body: 'Arabic calligraphy, Hebrew, and Greek scriptures alongside authorized English translations and transliterations.',
    },
    {
        title: '3 Dynamic Reading Modes',
        body: 'Switch effortlessly between Reading Mode, Parallel Bilingual View, and Focus Study Mode with custom font scaling.',
    },
    {
        title: 'Verse-Level Precision Search',
        body: 'Search across all surahs, biblical chapters, and appendices with instant verse copy and deep link sharing.',
    },
] as const;

const SEARCH_CAPABILITIES = [
    {
        title: 'Unified Cross-Corpus Index',
        body: 'One query instantly searches across audio recordings, video lectures, newsletters, published books, appendices, and scripture verses.',
    },
    {
        title: 'Exact Phrase & Operator Syntax',
        body: 'Use quotes ("God is one"), Boolean exclusions (-hadith), and type filters (type:audio, type:video, type:book, type:quran).',
    },
    {
        title: 'Open Directly at the Evidence',
        body: 'Audio and video results begin playback at the exact matched timestamp; written works open to the exact matched page scan.',
    },
    {
        title: 'Fast & Lightweight',
        body: 'Interactive client-side index delivers immediate real-time results without lag or complex configurations.',
    },
] as const;

export default function HomePage() {
    return (
        <main id="main-content" className="ambient-page min-h-screen overflow-hidden bg-ed-bg text-ed-fg">
            {/* Hero Section */}
            <HeroSection />

            {/* 5 Main Pathways Through The Archive */}
            <section
                aria-labelledby="archive-pathways-title"
                className="mx-auto max-w-[1440px] px-4 pb-20 pt-16 sm:px-6 lg:px-10 lg:pb-28 lg:pt-28"
            >
                <header>
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-14">
                        <Reveal delay={90}>
                            <div className="space-y-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface/80 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-ed-fg-muted">
                                    <Sparkles className="h-3.5 w-3.5 text-ed-accent" />
                                    <span>Archive Architecture</span>
                                </span>
                                <h2
                                    id="archive-pathways-title"
                                    className="font-slab text-[clamp(2.5rem,6.5vw,5rem)] font-black leading-[0.95] tracking-tight text-ed-fg"
                                >
                                    Five portals into the{' '}
                                    <span className="italic underline decoration-ed-rule-strong decoration-2 underline-offset-8">
                                        preservation vault.
                                    </span>
                                </h2>
                            </div>
                        </Reveal>

                        <Reveal delay={180}>
                            <p className="text-base leading-relaxed text-ed-fg-muted sm:text-lg">
                                Each section provides dedicated tools for close study: interactive video playback, timestamped audio listening, high-resolution document facsimiles, multi-canon scripture reading, and deep search.
                            </p>
                        </Reveal>
                    </div>

                    <Reveal delay={260}>
                        <div className="divider-fade mt-10 lg:mt-12" aria-hidden="true" />
                    </Reveal>
                </header>

                <div className="mt-16 space-y-24 lg:mt-24 lg:space-y-32">
                    {/* Section I: Video Archive */}
                    <VideoArchiveSection />
                    <div className="divider-fade" aria-hidden="true" />

                    {/* Section II: Audio Archive */}
                    <AudioArchiveSection />
                    <div className="divider-fade" aria-hidden="true" />

                    {/* Section III: Written Archive */}
                    <ArchiveBranch
                        numeral="III"
                        title="Written Library"
                        body="Authorized scripture translations, research publications, and the complete monthly chronicles of Submitters Perspective by Dr. Rashad Khalifa, fully transcribed and linked to facsimile scans."
                        href="/written"
                        cta="Explore the written library"
                        details={WRITTEN_CAPABILITIES}
                        visual={<WrittenArchiveVisual />}
                    />
                    <div className="divider-fade" aria-hidden="true" />

                    {/* Section IV: Scriptures Vault */}
                    <ArchiveBranch
                        numeral="IV"
                        title="Scriptures & Appendices"
                        body="The Qur'an (114 Surahs with Arabic, English, Transliteration, Footnotes & 3 View Modes), 38 Appendices, Old Testament (39 books), OT Apocrypha (15 books), and New Testament (27 books) presented with verse-by-verse precision."
                        href="/scripture/quran"
                        cta="Launch Scripture Reader"
                        details={SCRIPTURE_CAPABILITIES}
                        visual={<ScripturesVisual />}
                        reverse
                    />
                    <div className="divider-fade" aria-hidden="true" />

                    {/* Section V: Universal Search Engine */}
                    <ArchiveBranch
                        numeral="V"
                        title="Universal Search Engine"
                        body="Query across all recorded sermons, conference talks, newsletter issues, books, appendices, and scripture verses simultaneously. Results jump directly to the exact audio second or book page."
                        href="/search"
                        cta="Launch Archive Search"
                        details={SEARCH_CAPABILITIES}
                        showSearchDemo
                    />
                </div>

                {/* Preservation Principle & Verification Callout (17:36) */}
                <Reveal className="mt-20 lg:mt-28">
                    <section
                        aria-labelledby="preservation-principle-title"
                        className="group relative overflow-hidden rounded-3xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-8 sm:p-12 lg:p-14 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-2xl transition-all duration-300 hover:border-ed-fg/40"
                    >
                        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
                        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                            <div className="max-w-2xl space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span>Preservation Principle · Sura 17:36</span>
                                </div>
                                <h3
                                    id="preservation-principle-title"
                                    className="font-serif text-2xl font-bold tracking-tight text-ed-fg sm:text-3xl lg:text-4xl"
                                >
                                    &ldquo;You shall not accept any information, unless you verify it for yourself.&rdquo;
                                </h3>
                                <p className="text-sm leading-relaxed text-ed-fg-muted sm:text-base">
                                    This archive is built on the commitment to direct evidence. Every transcript is accompanied by the original recording or print facsimile so you can independently verify every word and citation.
                                </p>
                            </div>

                            <div className="shrink-0">
                                <Link
                                    href="/search"
                                    className="archive-button archive-button-primary px-7 py-3 text-sm font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Start Verifying Sources
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </Reveal>

                {/* Luminous Closing CTA Banner */}
                <Reveal className="mt-12 lg:mt-16">
                    <section
                        aria-labelledby="closing-cta-title"
                        className="relative overflow-hidden rounded-3xl border border-ed-rule-strong bg-gradient-to-b from-ed-fg via-ed-fg to-ed-fg/95 px-6 py-16 text-center shadow-2xl sm:px-12 lg:py-20"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.18),transparent_70%)]"
                        />
                        <div className="relative mx-auto max-w-3xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-ed-bg/20 bg-ed-bg/10 px-3.5 py-1 text-[0.72rem] font-mono font-semibold uppercase tracking-[0.14em] text-ed-bg shadow-sm">
                                <Sparkles className="h-3 w-3 text-amber-300" />
                                <span>The Complete Digital Repository</span>
                            </span>
                            <h2
                                id="closing-cta-title"
                                className="mt-5 mx-auto max-w-[20ch] font-sans text-[clamp(2.2rem,5.5vw,4.2rem)] font-black leading-[1.02] tracking-tight text-ed-bg"
                            >
                                Everything preserved in one place.
                            </h2>
                            <p className="mx-auto mt-4 max-w-[50ch] font-sans text-base leading-relaxed text-ed-bg/85 sm:text-lg">
                                Search 600+ audio recordings, 300+ video lectures, 74 written works, 114 Surahs, and 81 biblical & apocryphal books in seconds.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                                <Link
                                    href="/search"
                                    className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-ed-bg px-7 font-bold text-ed-fg shadow-lg transition-all hover:bg-ed-bg/90 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Search className="h-4 w-4" />
                                    Search the Entire Collection
                                </Link>
                                <Link
                                    href="/scripture/quran"
                                    className="inline-flex h-12 items-center gap-2.5 rounded-xl border border-ed-bg/30 bg-ed-bg/10 px-7 font-semibold text-ed-bg backdrop-blur-md transition-all hover:bg-ed-bg/20 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    Read Authorized Scripture
                                </Link>
                                <Link
                                    href="/app"
                                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-ed-bg/30 bg-ed-bg/10 px-6 font-semibold text-ed-bg backdrop-blur-md transition-all hover:bg-ed-bg/20 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>SA Studio Desktop App</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </Reveal>
            </section>
        </main>
    );
}
