'use client';
import Link from 'next/link';
import { ChevronDown, FileText, Play } from 'lucide-react';
import SaveReference from '@/components/research/SaveReference';
import MediaThumbnail from '@/components/media/MediaThumbnail';
import { highlightSearchText } from '@/lib/search/highlight';
import { getMatchHref, getMediaLink, isDocumentType } from '@/lib/search/navigation';
import { getSourceLabel, type SearchMatch, type SearchMedia, type SearchResult } from '@/lib/search/results';

const COLLAPSED_PASSAGES = 2;

export function getResultKey(media: SearchMedia) {
    return `${media.id}${media.page ? `-${media.page}` : ''}`;
}

export default function SearchResultCard({
    result,
    query,
    cardIndex,
    active,
    expanded,
    onToggle,
}: {
    result: SearchResult;
    // The query that produced this result, with operators removed, so highlights and
    // destination links only carry words that can actually appear in the text.
    query: string;
    cardIndex: number;
    // -1 for the card itself, a passage index, or null when keyboard focus is elsewhere.
    active: number | null;
    expanded: boolean;
    onToggle: () => void;
}) {
    const { media, matches, matchCount } = result;
    const title = media.displayTitle || media.title;
    const isDocument = isDocumentType(media.type);
    const bestMatch = matches[0];
    const bestHref = bestMatch ? getMatchHref(media, bestMatch, query) : getMediaLink(media, query);
    const visibleMatches = expanded ? matches : matches.slice(0, COLLAPSED_PASSAGES);
    const unit = isDocument ? 'page' : 'passage';
    const notShown = matchCount - matches.length;

    return (
        <article
            id={`search-card-${cardIndex}`}
            role="group"
            aria-label={title}
            className={`rounded-[8px] border border-ed-rule bg-ed-surface p-4 transition-colors duration-200 [contain-intrinsic-size:auto_260px] [content-visibility:auto] hover:border-ed-rule-strong sm:p-5 ${
                active === -1 ? 'ring-2 ring-ed-accent ring-offset-2 ring-offset-ed-bg' : ''
            }`}
        >
            <div className="flex gap-4 sm:gap-5">
                <Link
                    href={bestHref}
                    data-result-link
                    aria-label={`Open ${title}`}
                    className={`group relative shrink-0 self-start overflow-hidden rounded-[6px] border border-ed-rule bg-ed-bg ${
                        isDocument ? 'aspect-[3/4] w-14 sm:w-[76px]' : 'aspect-video w-24 sm:w-36'
                    }`}
                >
                    <MediaThumbnail media={media} sizes="144px" />
                    {!isDocument ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/10">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ed-bg/85 sm:h-10 sm:w-10">
                                <Play className="ml-0.5 h-3.5 w-3.5 fill-ed-fg text-ed-fg" aria-hidden="true" />
                            </span>
                        </span>
                    ) : null}
                </Link>

                <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ed-fg-muted">
                        <span>{getSourceLabel(media.type)}</span>
                        {media.displayDate ? (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>{media.displayDate}</span>
                            </>
                        ) : null}
                        {media.isOcr ? (
                            <span className="rounded-[4px] border border-amber-500/30 bg-amber-500/10 px-1.5 py-px text-amber-700 dark:text-amber-300">
                                OCR text
                            </span>
                        ) : null}
                    </p>
                    <Link href={getMediaLink(media, query)} data-result-link className="group mt-1.5 block">
                        <h3
                            className="text-lg font-semibold leading-snug tracking-tight text-ed-fg transition-colors group-hover:text-ed-accent sm:text-xl"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                        >
                            {title}
                        </h3>
                    </Link>
                    {media.author ? <p className="mt-1 text-xs text-ed-fg-muted">{media.author}</p> : null}
                </div>
            </div>

            {visibleMatches.length > 0 ? (
                <div className="mt-4 space-y-0.5 border-t border-ed-rule pt-3">
                    {visibleMatches.map((match, passageIndex) => (
                        <PassageLink
                            key={`${match.id}-${passageIndex}`}
                            media={media}
                            match={match}
                            query={query}
                            nodeId={`search-card-${cardIndex}-passage-${passageIndex}`}
                            active={active === passageIndex}
                            primary={passageIndex === 0}
                        />
                    ))}
                    {expanded && notShown > 0 ? (
                        <p className="px-2 pt-1 text-xs text-ed-fg-muted">
                            {plural(notShown, `more ${unit}`)} in this source.
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {matches.length > COLLAPSED_PASSAGES ? (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={expanded}
                        className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-xs font-medium text-ed-fg-muted transition-colors hover:bg-ed-surface-strong hover:text-ed-fg"
                    >
                        {expanded ? 'Show fewer' : `Show ${plural(matches.length - COLLAPSED_PASSAGES, `more ${unit}`)}`}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                ) : (
                    <span />
                )}
                {bestMatch ? (
                    <SaveReference
                        entry={{
                            id: `${media.id}:${bestMatch.page ?? bestMatch.start_time}`,
                            sourceId: media.id,
                            kind: isDocument ? 'pdf' : 'media',
                            title,
                            url: bestHref,
                            excerpt: bestMatch.content.slice(0, 600),
                            locator: isDocument ? `PDF page ${bestMatch.page ?? 1}` : formatTime(bestMatch.start_time),
                            provenance: media.isOcr ? 'OCR text; consult the original scan' : 'Verify excerpt against the original source',
                        }}
                    />
                ) : null}
            </div>
        </article>
    );
}

function PassageLink({
    media,
    match,
    query,
    nodeId,
    active,
    primary,
}: {
    media: SearchMedia;
    match: SearchMatch;
    query: string;
    nodeId: string;
    active: boolean;
    primary: boolean;
}) {
    const isDocument = isDocumentType(media.type);
    // Perspectives carry the article a passage belongs to; scanned books only carry page headers.
    const label = match.label && !media.isOcr ? match.label : null;

    return (
        <Link
            href={getMatchHref(media, match, query)}
            data-result-link
            id={nodeId}
            role="option"
            aria-selected={active}
            className={`group -mx-2 flex items-start gap-3 rounded-[4px] px-2 py-2 transition-colors hover:bg-ed-surface-strong ${
                active ? 'bg-ed-surface-strong ring-1 ring-ed-accent/60' : ''
            }`}
        >
            <span className="inline-flex w-[4.75rem] shrink-0 items-center gap-1.5 whitespace-nowrap pt-0.5 font-mono text-xs font-semibold text-ed-accent">
                {isDocument
                    ? <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
                    : <Play className="h-3 w-3 shrink-0 fill-current" aria-hidden="true" />}
                {getLocator(media, match)}
            </span>
            <span className="min-w-0 flex-1">
                {label ? (
                    <span className="mb-0.5 block font-mono text-[0.62rem] uppercase tracking-wider text-ed-fg-muted">{label}</span>
                ) : null}
                <span
                    className={`block text-sm leading-relaxed transition-colors group-hover:text-ed-fg ${primary ? 'text-ed-fg' : 'text-ed-fg-secondary'}`}
                    dangerouslySetInnerHTML={{ __html: highlightSearchText(match.content, query) }}
                />
            </span>
        </Link>
    );
}

function getLocator(media: SearchMedia, match: SearchMatch) {
    // Book pages are PDF pages; the card's OCR tag already says the text comes from a scan.
    return isDocumentType(media.type) ? `p. ${match.page || 1}` : formatTime(match.start_time);
}

function formatTime(seconds: number) {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = String(total % 60).padStart(2, '0');
    return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
}

function plural(count: number, noun: string) {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
