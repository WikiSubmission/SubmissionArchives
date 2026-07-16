import { BookText, Search, Sparkles } from 'lucide-react';

import { ArchiveBranch } from './ArchiveBranch';
import { AudioArchiveSection } from './AudioArchiveSection';
import { HeroSection } from './HeroSection';
import { VideoArchiveSection } from './VideoArchiveSection';

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

export default function HomePageClient() {
    return (
        <main id="main-content" className="min-h-screen overflow-hidden bg-ed-bg text-ed-fg">
            <HeroSection />

            <section
                aria-labelledby="archive-pathways-title"
                className="mx-auto max-w-[1440px] px-4 pb-20 pt-14 sm:px-6 lg:px-10 lg:pb-28 lg:pt-24"
            >
                <header className="grid gap-6 border-y border-ed-rule py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end lg:py-10">
                    <div>
                        <p className="archive-kicker">Ways into the collection</p>
                        <p className="mt-3 max-w-[35ch] text-sm leading-7 text-ed-fg-muted">
                            Browse by medium, then move from a catalog record to its original recording, transcript, or scan.
                        </p>
                    </div>
                    <h2
                        id="archive-pathways-title"
                        className="max-w-[18ch] font-display text-[clamp(2.65rem,7vw,5.5rem)] font-medium leading-[0.92] tracking-[-0.035em] text-ed-fg"
                    >
                        Five paths through one archive.
                    </h2>
                </header>

                <div className="mt-12 space-y-20 lg:mt-16 lg:space-y-28">
                    <VideoArchiveSection />
                    <AudioArchiveSection />
                    <ArchiveBranch
                        numeral="III"
                        kicker="Books, newsletters, appendices"
                        title="Read the written archive"
                        body="Books, newsletters, and appendices by Dr. Rashad Khalifa, transcribed and connected to the same research search used across the whole collection."
                        href="/written"
                        cta="Browse the written archive"
                        details={WRITTEN_CAPABILITIES}
                        icon={BookText}
                    />
                    <ArchiveBranch
                        numeral="IV"
                        kicker="Three editions, one text"
                        title="Study the Qur'an editions"
                        body="Arabic text alongside the 1981, 1989, and 1992 English editions, with subtitles, footnotes, and verse-level search for all 114 suras."
                        href="/quran"
                        cta="Open the Qur'an editions"
                        details={QURAN_CAPABILITIES}
                        icon={Sparkles}
                    />
                    <ArchiveBranch
                        numeral="V"
                        kicker="Cross-collection search"
                        title="Search the full archive"
                        body="Search names, verses, phrases, and recurring ideas across transcripts and written works. Results are ranked by exact phrases, nearby terms, and repeated evidence."
                        href="/search"
                        cta="Search the archive"
                        details={SEARCH_CAPABILITIES}
                        icon={Search}
                        showSearchDemo
                    />
                </div>
            </section>
        </main>
    );
}
