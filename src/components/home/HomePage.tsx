import { ArrowRight, ShieldCheck, BookOpen, Search, Volume2 } from 'lucide-react';
import Link from 'next/link';

import { HeroSection } from './HeroSection';
import { VideoArchiveSection } from './VideoArchiveSection';
import { AudioArchiveSection } from './AudioArchiveSection';
import { WrittenLibrarySection } from './WrittenLibrarySection';
import { ScripturesSection } from './ScripturesSection';
import { SearchSection } from './SearchSection';
import { Reveal } from './Reveal';
import { CardSplitAccordion, type AccordionItemData } from '@/components/ui/card-split-accordion';
import { TextScramble } from '@/components/ui/text-scramble';

const PRESERVATION_PILLARS: AccordionItemData[] = [
    {
        id: 1,
        title: 'Original Facsimile & First Edition Printings',
        badge: 'Zero Transcription Error',
        icon: <BookOpen className="h-4 w-4 text-[#C8794A]" />,
        content:
            'Every book, appendix, and monthly newsletter is paired directly with high-resolution page scans of the original 1981 and 1989 First Edition printings, ensuring absolute zero transcription variance or retroactive alterations.',
    },
    {
        id: 2,
        title: 'Time-Synchronized Audio & Video Recordings',
        badge: 'Acoustic Verification',
        icon: <Volume2 className="h-4 w-4 text-[#C8794A]" />,
        content:
            'Over 600 audio sermons and 300 videotaped lectures are synchronized line-by-line with verbatim transcripts. You can listen directly to the authentic spoken delivery at the exact millisecond of any phrase.',
    },
    {
        id: 3,
        title: 'Full Mathematical & Structural Consistency',
        badge: 'Sura 17:36 Audit',
        icon: <ShieldCheck className="h-4 w-4 text-[#C8794A]" />,
        content:
            'All text indexes preserve the original Arabic letter counts, chapter headers, and verse alignments, allowing researcher verification through reproducible, deterministic search and indexing pipelines.',
    },
    {
        id: 4,
        title: 'Universal Cross-Canon Parallel Corpus',
        badge: '4 Scriptural Canons',
        icon: <Search className="h-4 w-4 text-[#C8794A]" />,
        content:
            'A unified academic reading room linking the Authorized English Qur\'an, Tanakh, Greek New Testament, and Apocrypha with instant phrase cross-referencing and contextual citation tools.',
    },
];

export default function HomePage() {
    return (
        <main id="main-content" className="min-h-screen bg-[#0F0E0D] text-[#F5F0EB]">
            {/* Hero Section */}
            <HeroSection />

            {/* 5 Main Pathways Through The Archive */}
            <section
                aria-labelledby="archive-pathways-title"
                className="mx-auto max-w-[1160px] px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24"
            >
                <header className="mb-14 lg:mb-18">
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-14">
                        <Reveal delay={90}>
                            <div>
                                <h2
                                    id="archive-pathways-title"
                                    className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-[#F5F0EB]"
                                >
                                    Five portals into the{' '}
                                    <span className="italic font-normal text-[#D9916A]">
                                        preservation vault.
                                    </span>
                                </h2>
                            </div>
                        </Reveal>

                        <Reveal delay={180}>
                            <p
                                className="text-base leading-[1.65] text-[#9E9690] sm:text-lg"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                Each section provides dedicated tools for close study: interactive video playback, timestamped audio listening, high-resolution document facsimiles, multi-canon scripture reading, and deep search.
                            </p>
                        </Reveal>
                    </div>

                    <Reveal delay={260}>
                        <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-[#2A2928] to-transparent lg:mt-12" aria-hidden="true" />
                    </Reveal>
                </header>

                <div className="space-y-20 lg:space-y-28">
                    {/* Section I: Video Archive */}
                    <VideoArchiveSection />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2A2928] to-transparent" aria-hidden="true" />

                    {/* Section II: Audio Archive */}
                    <AudioArchiveSection />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2A2928] to-transparent" aria-hidden="true" />

                    {/* Section III: Written Library & Facsimiles */}
                    <WrittenLibrarySection />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2A2928] to-transparent" aria-hidden="true" />

                    {/* Section IV: Scriptures Vault */}
                    <ScripturesSection />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2A2928] to-transparent" aria-hidden="true" />

                    {/* Section V: Universal Search Engine */}
                    <SearchSection />
                </div>

                {/* Preservation Principle & Verification Callout (17:36) */}
                <Reveal className="mt-20 lg:mt-28">
                    <section
                        aria-labelledby="preservation-principle-title"
                        className="group relative overflow-hidden rounded-2xl border border-[#2A2928] bg-[#161514] p-8 sm:p-12 lg:p-14 shadow-2xl transition-all duration-300 hover:border-[#353433]"
                    >
                        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#C8794A]/5 blur-3xl" />
                        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <h3
                                    id="preservation-principle-title"
                                    className="font-serif italic text-2xl font-semibold leading-[1.2] tracking-[-0.025em] text-[#F5F0EB] sm:text-3xl lg:text-[2.25rem]"
                                >
                                    &ldquo;You shall not accept any information, unless you verify it for yourself.&rdquo;
                                </h3>
                                <p
                                    className="text-sm leading-[1.65] text-[#9E9690] sm:text-base"
                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                >
                                    This archive is built on the commitment to direct evidence. Every transcript is accompanied by the original recording or print facsimile so you can independently verify every word and citation.
                                </p>
                            </div>

                            <div className="shrink-0">
                                <Link
                                    href="/search"
                                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#C8794A] px-6 text-sm font-semibold text-[#0F0E0D] shadow-lg transition-all hover:bg-[#D9916A] hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Start Verifying Sources
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Interactive Verification Pillars with CardSplitAccordion */}
                        <div className="mt-8 pt-8 border-t border-[#2A2928]">
                            <p className="mb-4 font-sans text-xs font-semibold text-[#6B6560]">
                                Verification Pillars
                            </p>
                            <CardSplitAccordion items={PRESERVATION_PILLARS} defaultOpenId={1} />
                        </div>
                    </section>
                </Reveal>

                {/* Closing CTA Banner */}
                <Reveal className="mt-12 lg:mt-16">
                    <section
                        aria-labelledby="closing-cta-title"
                        className="relative overflow-hidden rounded-2xl border border-[#2A2928] bg-gradient-to-b from-[#1C1B1A] to-[#121110] px-6 py-14 text-center shadow-2xl sm:px-12 lg:py-18"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(200,121,74,0.08),transparent_70%)]"
                        />
                        <div className="relative mx-auto max-w-3xl">
                            <TextScramble
                                as="h2"
                                id="closing-cta-title"
                                text="Everything preserved in one place."
                                className="mx-auto block max-w-[20ch] font-serif text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]"
                            />
                            <p
                                className="mx-auto mt-4 max-w-[52ch] text-base leading-[1.65] text-[#9E9690] sm:text-lg"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                Search 600+ audio recordings, 300+ video lectures, 74 written works, 114 Surahs, and 81 biblical & apocryphal books in seconds.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                                <Link
                                    href="/search"
                                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#C8794A] px-6 text-sm font-semibold text-[#0F0E0D] shadow-lg transition-all hover:bg-[#D9916A] hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>Search the Entire Collection</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/scripture/quran"
                                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#2A2928] bg-[#161514] px-6 text-sm font-semibold text-[#F5F0EB] transition-all hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-white"
                                >
                                    <span>Read Authorized Scripture</span>
                                    <ArrowRight className="h-4 w-4 text-[#C8794A]" />
                                </Link>
                                <Link
                                    href="/app"
                                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#2A2928] bg-[#161514] px-5 text-sm font-semibold text-[#9E9690] transition-all hover:border-[#353433] hover:text-[#F5F0EB]"
                                >
                                    <span>SA Studio Desktop App</span>
                                    <ArrowRight className="h-3.5 w-3.5 text-[#C8794A]" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </Reveal>
            </section>
        </main>
    );
}

