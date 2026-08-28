'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Maximize2, Pin, X } from 'lucide-react';

import type { EditorialSummary } from '@/lib/editorialTypes';
import { formatEditorialDate } from '@/lib/editorialTypes';

import '@/app/editorials/editorials.css';

const emptySubscribe = () => () => {};

interface EditorialCardProps {
    editorial: EditorialSummary;
    /** Position in the listing, shown as an editorial index rather than a badge. */
    index: number;
    /** Matches the card's title to the surrounding document outline. */
    headingLevel?: 2 | 3;
    /** Marks the card as the pinned foundational article at the top of the archive. */
    isPinned?: boolean;
}

/**
 * Editorial row with distinct interactive thumbnail and reading link:
 * - Clicking the thumbnail opens the enlarged cover artwork in a high-res lightbox modal.
 * - Clicking the title, summary, or card body opens the full editorial article.
 */
export default function EditorialCard({ editorial, index, headingLevel = 3, isPinned = false }: EditorialCardProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    // Lock background scroll and listen for Escape key when lightbox is open
    useEffect(() => {
        if (!isLightboxOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsLightboxOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isLightboxOpen]);

    const indexLabel = index.toString().padStart(2, '0');
    const Heading = headingLevel === 2 ? 'h2' : 'h3';
    const visual = editorial.thumbnail ?? editorial.hero;

    return (
        <>
            <article
                className={`group grid gap-x-8 gap-y-5 px-3 py-8 transition-colors ${
                    isPinned
                        ? 'rounded-[8px] border border-ed-accent/30 bg-ed-surface/90 shadow-sm my-2'
                        : 'border-b border-ed-rule hover:bg-ed-surface/60'
                } sm:grid-cols-[14.5rem_1fr]`}
            >
                {/* Dedicated Interactive Thumbnail Plate (Opens Lightbox on click) */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (visual) setIsLightboxOpen(true);
                        }}
                        aria-label={`Inspect cover artwork for ${editorial.title}`}
                        className={`group/thumb relative aspect-[4/3] w-full max-w-[14.5rem] overflow-hidden rounded-[6px] border bg-ed-surface shadow-sm transition-all duration-200 hover:border-ed-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent cursor-zoom-in text-left ${
                            isPinned ? 'border-ed-accent/40 ring-1 ring-ed-accent/20' : 'border-ed-rule'
                        }`}
                    >
                        {visual ? (
                            <>
                                <Image
                                    src={visual.src}
                                    alt={visual.alt}
                                    fill
                                    quality={85}
                                    priority={isPinned || index <= 2}
                                    unoptimized={visual.src.endsWith('.svg')}
                                    sizes="(max-width: 640px) 100vw, 232px"
                                    className="editorial-thumbnail-image object-cover transition-transform duration-300 group-hover/thumb:scale-[1.03]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover/thumb:opacity-100 flex items-end justify-between p-3">
                                    <span className="font-sans text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white">
                                        Inspect Artwork
                                    </span>
                                    <Maximize2 className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-1">
                                <span
                                    className="text-[32px] leading-none text-ed-fg-faint transition-colors group-hover/thumb:text-ed-accent"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    {indexLabel}
                                </span>
                                <span className="font-sans font-medium text-[9px] uppercase tracking-[0.16em] text-ed-fg-faint">
                                    Editorial
                                </span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Article Info & Reading Link */}
                <div className="flex min-w-0 flex-col justify-between">
                    <div>
                        {/* Pinned Tag with Physical Thumbtack Icon */}
                        {isPinned ? (
                            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/30 bg-ed-accent/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ed-accent">
                                <Pin className="h-3.5 w-3.5 fill-ed-accent text-ed-accent rotate-45" aria-hidden="true" />
                                Pinned Foundation Monograph · Site Architecture
                            </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-4">
                            <Link href={`/editorials/${editorial.slug}`} className="group/link block">
                                <Heading
                                    className="text-[20px] sm:text-[22px] font-semibold leading-[1.25] tracking-[-0.015em] text-ed-fg transition-colors group-hover/link:text-ed-accent"
                                    style={{ fontFamily: 'var(--font-source-serif-4), var(--font-source-serif), Georgia, serif' }}
                                >
                                    {editorial.title}
                                </Heading>
                            </Link>
                            <Link
                                href={`/editorials/${editorial.slug}`}
                                aria-label={`Read ${editorial.title}`}
                                className="mt-1 flex-shrink-0 text-ed-fg-faint transition-all hover:text-ed-accent"
                            >
                                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </div>

                        {editorial.subtitle ? (
                            <Link href={`/editorials/${editorial.slug}`} className="block">
                                <p
                                    className="mt-2 max-w-[68ch] text-[15px] leading-[1.62] text-ed-fg-muted transition-colors hover:text-ed-fg-secondary"
                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                >
                                    {editorial.subtitle}
                                </p>
                            </Link>
                        ) : null}
                    </div>

                    {/* Monospace Metadata Line */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-y-2 pt-3 border-t border-ed-rule/60">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">
                            <time dateTime={editorial.publishedAt}>{formatEditorialDate(editorial.publishedAt)}</time>
                            <Separator />
                            <span>{editorial.author}</span>
                            <Separator />
                            <span>{editorial.readingMinutes} min read</span>
                            {editorial.topics.length > 0 ? (
                                <>
                                    <Separator />
                                    <span className="text-ed-fg-muted">{editorial.topics.join(' · ')}</span>
                                </>
                            ) : null}
                        </p>

                        <Link
                            href={`/editorials/${editorial.slug}`}
                            className="inline-flex items-center gap-1 font-sans font-semibold text-[11px] uppercase tracking-[0.1em] text-ed-accent transition-colors hover:text-ed-accent-strong"
                        >
                            Read Article
                            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </article>

            {/* Portal Lightbox Modal for Full-Resolution Cover Artwork */}
            {mounted && isLightboxOpen && visual
                ? createPortal(
                      <div
                          className="editorial-lightbox"
                          role="dialog"
                          aria-modal="true"
                          aria-label={`Enlarged artwork: ${editorial.title}`}
                          onClick={() => setIsLightboxOpen(false)}
                      >
                          <button
                              type="button"
                              className="editorial-lightbox-exit"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setIsLightboxOpen(false);
                              }}
                              aria-label="Close enlarged artwork"
                          >
                              <X className="h-3.5 w-3.5 inline-block mr-1" />
                              Exit (Esc)
                          </button>

                          <figure
                              className="editorial-lightbox-figure"
                              onClick={(e) => e.stopPropagation()}
                          >
                              <div className="editorial-lightbox-plate">
                                  <Image
                                      src={visual.src}
                                      alt={visual.alt}
                                      width={visual.width || 800}
                                      height={visual.height || 600}
                                      unoptimized={visual.src.endsWith('.svg')}
                                      className="editorial-thumbnail-image max-h-[80vh] w-auto max-w-[92vw] object-contain mx-auto"
                                      priority
                                  />
                              </div>
                              <figcaption className="editorial-lightbox-caption">
                                  <em>Monograph Artwork</em> — {editorial.title}
                              </figcaption>
                          </figure>
                      </div>,
                      document.body,
                  )
                : null}
        </>
    );
}

function Separator() {
    return (
        <span className="text-ed-rule-strong" aria-hidden="true">
            /
        </span>
    );
}
