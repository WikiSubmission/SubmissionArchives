import { HeroSection } from './HeroSection';
import { RecordingsPanel } from './RecordingsPanel';
import { WrittenPanel } from './WrittenPanel';
import { SearchPanel } from './SearchPanel';
import { SERIF } from './ArchivePanel';
import { getRecordings } from '@/lib/recordingCatalog';
import { getBooks } from '@/lib/books';
import { getAppendixCatalog } from '@/lib/appendixCatalog';
import { getNewsletterIssues } from '@/lib/newsletterCatalog';

export default function HomePage() {
    const recordings = getRecordings();
    const books = getBooks();
    const appendixCount = getAppendixCatalog().length;
    const newsletterCount = getNewsletterIssues().length;
    const sourceCount = recordings.length + books.length + appendixCount + newsletterCount;

    return (
        <main id="main-content" className="min-h-screen bg-ed-bg text-ed-fg">
            <HeroSection />

            <div className="mx-auto max-w-[1160px] space-y-6 px-5 py-16 sm:px-8 lg:py-24">
                <RecordingsPanel recordings={recordings} />
                <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                    <WrittenPanel books={books} appendixCount={appendixCount} newsletterCount={newsletterCount} />
                    <SearchPanel sourceCount={sourceCount} />
                </div>

                <figure className="mx-auto max-w-3xl pt-14 text-center lg:pt-20">
                    <blockquote
                        className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-normal italic leading-[1.25] tracking-[-0.02em]"
                        style={SERIF}
                    >
                        &ldquo;You shall not accept any information, unless you verify it for yourself.&rdquo;
                    </blockquote>
                    <figcaption className="mt-5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ed-fg-muted">Quran 17:36</figcaption>
                    <p
                        className="mx-auto mt-6 max-w-[52ch] text-base leading-[1.65] text-ed-fg-secondary"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        Each transcript here sits beside the recording or scan it came from, so you can check it against the source.
                    </p>
                </figure>
            </div>
        </main>
    );
}
