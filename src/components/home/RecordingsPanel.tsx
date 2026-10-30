import Link from 'next/link';
import { ArrowRight, Headphones } from 'lucide-react';
import MediaThumbnail from '@/components/media/MediaThumbnail';
import { COLLECTIONS, getCollectionHref, type Recording } from '@/lib/recordings';
import { ArchivePanel, PanelLink, SERIF } from './ArchivePanel';

export function RecordingsPanel({ recordings }: { recordings: Recording[] }) {
    const collections = COLLECTIONS.map((collection) => {
        const items = recordings.filter((recording) => recording.collection === collection.key);
        return { ...collection, count: items.length, cover: items[0] };
    });

    return (
        <ArchivePanel
            id="home-recordings"
            title="Recordings"
            meta={`${recordings.length} recordings`}
            footer={<PanelLink href="/media">Browse all {recordings.length} recordings</PanelLink>}
        >
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
                {collections.filter((collection) => collection.format === 'Video').map((collection) => (
                    <li key={collection.key}>
                        <Link href={getCollectionHref(collection.key)} className="group block">
                            <div className="relative aspect-video overflow-hidden rounded-[6px] border border-ed-rule bg-ed-surface-strong">
                                {collection.cover ? (
                                    <MediaThumbnail media={collection.cover} sizes="(min-width: 1024px) 260px, 45vw" />
                                ) : null}
                            </div>
                            <p className="mt-2.5 text-[15px] font-semibold leading-snug transition-colors group-hover:text-ed-accent" style={SERIF}>
                                {collection.label}
                            </p>
                            <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-ed-fg-muted">
                                {collection.count} videos
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>

            <ul className="mt-6 grid gap-3 border-t border-ed-rule pt-5 sm:grid-cols-2">
                {collections.filter((collection) => collection.format === 'Audio').map((collection) => (
                    <li key={collection.key}>
                        <Link
                            href={getCollectionHref(collection.key)}
                            className="group flex items-center gap-3.5 rounded-[6px] border border-ed-rule bg-ed-bg px-4 py-3 transition-colors hover:border-ed-rule-strong"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ed-rule-strong text-ed-fg-secondary transition-colors group-hover:border-ed-accent group-hover:text-ed-accent">
                                <Headphones className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[15px] font-semibold leading-snug" style={SERIF}>
                                    {collection.label}
                                </span>
                                <span className="block font-mono text-[0.65rem] uppercase tracking-[0.1em] text-ed-fg-muted">
                                    {collection.count} audio recordings
                                </span>
                            </span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-ed-fg-muted transition-colors group-hover:text-ed-accent" aria-hidden="true" />
                        </Link>
                    </li>
                ))}
            </ul>
        </ArchivePanel>
    );
}
