import Link from 'next/link';
import { Search } from 'lucide-react';
import { EXAMPLE_QUERIES } from '@/lib/search/queryParser';
import { ArchivePanel } from './ArchivePanel';

const OPERATOR_CLASS = 'font-mono text-ed-accent';

// A plain GET form, so it searches before any script has loaded.
export function SearchPanel({ sourceCount }: { sourceCount: number }) {
    return (
        <ArchivePanel
            id="home-search"
            title="Search"
            meta={`${sourceCount} sources`}
            footer={
                <p className="text-xs leading-relaxed text-ed-fg-muted">
                    Narrow a search with <span className={OPERATOR_CLASS}>type:books</span>,{' '}
                    <span className={OPERATOR_CLASS}>before:1990</span> or <span className={OPERATOR_CLASS}>-word</span>.
                </p>
            }
        >
            <p className="text-[15px] leading-[1.6] text-ed-fg-secondary" style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}>
                Transcripts, newsletters, appendices and books, searched together.
            </p>
            <form action="/search" role="search" className="mt-4 flex gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" aria-hidden="true" />
                    <input
                        type="search"
                        name="q"
                        required
                        aria-label="Search the archive"
                        placeholder="Search the archive"
                        autoComplete="off"
                        className="w-full rounded-[4px] border border-ed-rule bg-ed-bg py-2.5 pl-10 pr-3 text-base outline-none transition-colors placeholder:text-ed-fg-muted focus:border-ed-rule-strong sm:text-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="shrink-0 rounded-[4px] bg-ed-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:text-[#0F0E0D]"
                >
                    Search
                </button>
            </form>
            <p className="mb-2 mt-5 text-xs font-semibold text-ed-fg-muted">Try</p>
            <ul className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((example) => (
                    <li key={example}>
                        <Link
                            href={`/search?q=${encodeURIComponent(example)}`}
                            className="inline-block rounded-[4px] border border-ed-rule bg-ed-bg px-2.5 py-1.5 font-mono text-xs text-ed-fg-secondary transition-colors hover:border-ed-rule-strong hover:text-ed-fg"
                        >
                            {example}
                        </Link>
                    </li>
                ))}
            </ul>
        </ArchivePanel>
    );
}
