import Image from 'next/image';
import Link from 'next/link';
import type { BookListItem } from '@/lib/books';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import { ArchivePanel, PanelLink, SERIF } from './ArchivePanel';

const COVER_COUNT = 5;

type WrittenPanelProps = {
    books: BookListItem[];
    appendixCount: number;
    newsletterCount: number;
};

export function WrittenPanel({ books, appendixCount, newsletterCount }: WrittenPanelProps) {
    const shelves = [
        { label: 'Books & publications', href: '/written#books', count: books.length },
        { label: 'Appendices', href: '/written#appendices', count: appendixCount },
        { label: 'Submitters Perspectives', href: '/written#newsletters', count: newsletterCount },
    ];

    return (
        <ArchivePanel
            id="home-written"
            title="Written works"
            meta={`${books.length + appendixCount + newsletterCount} publications`}
            footer={<PanelLink href="/written">Browse the written archive</PanelLink>}
        >
            <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {books.slice(0, COVER_COUNT).map((book, index) => (
                    // Four covers fill a phone-width row; the fifth waits for room.
                    <li key={book.id} className={index === COVER_COUNT - 1 ? 'hidden sm:block' : undefined}>
                        <Link
                            href={`/library/${book.id}`}
                            title={book.displayTitle || book.title}
                            className="group relative block aspect-[3/4] overflow-hidden rounded-[4px] border border-ed-rule bg-ed-bg"
                        >
                            {book.thumbnailOverride ? (
                                <Image
                                    src={getPublicAssetUrl(book.thumbnailOverride)}
                                    alt={`Cover of ${book.displayTitle || book.title}`}
                                    fill
                                    sizes="(min-width: 1024px) 110px, 22vw"
                                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                                />
                            ) : (
                                <span className="sr-only">{book.displayTitle || book.title}</span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>

            <ul className="mt-5 divide-y divide-ed-rule border-t border-ed-rule">
                {shelves.map((shelf) => (
                    <li key={shelf.href}>
                        <Link href={shelf.href} className="group flex items-baseline justify-between gap-4 py-2.5">
                            <span className="text-[15px] transition-colors group-hover:text-ed-accent" style={SERIF}>
                                {shelf.label}
                            </span>
                            <span className="font-mono text-[0.68rem] tabular-nums text-ed-fg-muted">{shelf.count}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </ArchivePanel>
    );
}
