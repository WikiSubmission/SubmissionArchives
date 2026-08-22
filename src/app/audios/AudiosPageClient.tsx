'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Media } from '@/types/media';
import PlayButton from '@/components/player/PlayButton';
import { getMediaAssetUrl, getPublicAssetUrl } from '@/lib/mediaAssets';
import { getMediaHref } from '@/lib/utils';
import QuranStudyThumbnail from '@/components/media/QuranStudyThumbnail';
import { QURAN_STUDY_SLIDES } from '@/data/quran-study-thumbnail-data';
import './audios.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'quran-studies' | 'messenger-audios';
type SortKey = 'number-asc' | 'number-desc' | 'date-desc' | 'date-asc';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(secs: number): string {
    const s = Number.isFinite(secs) && secs > 0 ? Math.floor(secs) : 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
        : `${m}:${String(ss).padStart(2, '0')}`;
}

function getQsNumber(item: Media): number | null {
    if (typeof item.primaryNumber === 'number' && Number.isFinite(item.primaryNumber)) {
        return item.primaryNumber;
    }
    const idMatch = item.id.match(/^quran-study\/(\d+)/i);
    if (idMatch) return Number(idMatch[1]);
    const titleMatch = (item.displayTitle ?? '').match(/^(?:QS\s*)?(\d{1,3})\b/i);
    return titleMatch ? Number(titleMatch[1]) : null;
}

function getThumbnailSrc(item: Media): string | null {
    if (item.thumbnailOverride) return getPublicAssetUrl(item.thumbnailOverride);
    return null;
}

function playableTrack(item: Media) {
    const url = item.youtubeId ? getMediaAssetUrl(item) : '';
    if (!url) return null;
    return { id: item.id, title: item.displayTitle, url, href: getMediaHref(item.id) };
}

function getUniqueAuthors(audios: Media[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const a of audios) {
        if (a.author && !seen.has(a.author)) {
            seen.add(a.author);
            result.push(a.author);
        }
    }
    return result.sort();
}

// ─── Audio Card ───────────────────────────────────────────────────────────────

function AudioCard({ item }: { item: Media }) {
    const isQs = item.type === 'quran-study';
    const qsNumber = isQs ? getQsNumber(item) : null;
    const hasCssSlide = qsNumber !== null && Boolean(QURAN_STUDY_SLIDES[qsNumber]);
    const thumbnailSrc = getThumbnailSrc(item);
    const track = playableTrack(item);
    const href = getMediaHref(item.id);

    // Label shown in the card thumbnail (QS 01, MA 92, etc.)
    const thumbnailLabel = isQs
        ? qsNumber !== null ? `QS ${String(qsNumber).padStart(2, '0')}` : 'Quran Study'
        : item.primaryNumber !== undefined
        ? `MA ${item.primaryNumber}`
        : 'Messenger Audio';

    // Strip the "QS 01 —" prefix from the title for a cleaner thumbnail display
    const thumbnailTitle = (item.displayTitle ?? item.title ?? '')
        .replace(/^(?:QS|MA)\s*\d+\s*[—–-]\s*/i, '')
        .trim() || (item.displayTitle ?? item.title ?? '');

    const collectionTag = isQs ? 'Quran Study' : 'Messenger Audio';

    return (
        <Link href={href} className="aa-audio-card group" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Thumbnail */}
            <div className={`aa-card-thumbnail${isQs ? '' : ' messenger'}`}>
                {hasCssSlide && qsNumber !== null ? (
                    <QuranStudyThumbnail qsNumber={qsNumber} />
                ) : thumbnailSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumbnailSrc}
                        alt=""
                        loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div className="aa-card-thumbnail-content">
                        <div className="aa-card-thumbnail-label">{thumbnailLabel}</div>
                        <div className="aa-card-thumbnail-title">{thumbnailTitle}</div>
                        {item.author && (
                            <div className="aa-card-thumbnail-meta">{item.author}</div>
                        )}
                    </div>
                )}

                {/* Hover darkening overlay — purely visual, pointer-events:none */}
                <div className="aa-card-play-overlay" style={{ pointerEvents: 'none' }} />

                {/* Play button — sits on top, pointer-events:auto */}
                {track ? (
                    <PlayButton track={track} />
                ) : null}

                {/* Duration */}
                {item.duration_seconds && item.duration_seconds > 0 ? (
                    <span className="aa-card-duration">{formatDuration(item.duration_seconds)}</span>
                ) : null}
            </div>

            {/* Content */}
            <div className="aa-card-content">
                <div className="aa-card-date-row">
                    <span className="aa-card-date">{item.displayDate || thumbnailLabel}</span>
                    <span className="aa-card-collection-tag">{collectionTag}</span>
                </div>

                <h3 className="aa-card-title">
                    {item.displayTitle ?? item.title}
                </h3>

                <div className="aa-card-footer">
                    <span
                        className="aa-btn-listen"
                        onClick={(e) => e.stopPropagation()}
                        role="presentation"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                        Listen
                    </span>
                    <span className="aa-btn-icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────

const INITIAL_COUNT = 12;
const INCREMENT = 12;

function AudioSection({
    title,
    audios,
    visibleCount,
    onLoadMore,
}: {
    title: string;
    audios: Media[];
    visibleCount: number;
    onLoadMore: () => void;
}) {
    const visible = audios.slice(0, visibleCount);
    const remaining = audios.length - visible.length;

    return (
        <section>
            <div className="aa-section-divider">
                <h2>{title}</h2>
                <div className="aa-section-divider-line" />
                <span className="aa-section-divider-count">{audios.length} sessions</span>
            </div>

            <div className="aa-audio-grid">
                {visible.map((item) => <AudioCard key={item.id} item={item} />)}
            </div>

            {remaining > 0 && (
                <div className="aa-load-more">
                    <button type="button" className="aa-load-more-btn" onClick={onLoadMore}>
                        Load {Math.min(INCREMENT, remaining)} more
                    </button>
                    <span className="aa-load-more-label">
                        Showing {visible.length} of {audios.length}
                    </span>
                </div>
            )}
        </section>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AudiosPageClient({ initialAudios }: { initialAudios: Media[] }) {
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('all');
    const [sortKey, setSortKey] = useState<SortKey>('number-asc');
    const [qsVisible, setQsVisible] = useState(INITIAL_COUNT);
    const [maVisible, setMaVisible] = useState(INITIAL_COUNT);

    const authors = useMemo(() => getUniqueAuthors(initialAudios), [initialAudios]);

    const quranStudies = useMemo(
        () => initialAudios.filter((a) => a.type === 'quran-study'),
        [initialAudios],
    );
    const messengerAudios = useMemo(
        () => initialAudios.filter((a) => a.type === 'messenger-audio'),
        [initialAudios],
    );

    // Apply search + author filters
    const applyFilters = useCallback((list: Media[]) => {
        let result = list;

        if (selectedAuthor !== 'all') {
            result = result.filter((a) => a.author === selectedAuthor);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (a) =>
                    (a.displayTitle ?? a.title ?? '').toLowerCase().includes(q) ||
                    (a.author ?? '').toLowerCase().includes(q) ||
                    (a.displayDate ?? '').toLowerCase().includes(q),
            );
        }

        return result;
    }, [searchQuery, selectedAuthor]);

    // Apply sort
    const applySort = useCallback((list: Media[]): Media[] => {
        const sorted = [...list];
        sorted.sort((a, b) => {
            const na = a.primaryNumber ?? 0;
            const nb = b.primaryNumber ?? 0;
            if (sortKey === 'number-asc') return na - nb;
            if (sortKey === 'number-desc') return nb - na;
            // date sort fallback to primaryNumber
            if (sortKey === 'date-asc') return na - nb;
            if (sortKey === 'date-desc') return nb - na;
            return 0;
        });
        return sorted;
    }, [sortKey]);

    const filteredQs = useMemo(() => applySort(applyFilters(quranStudies)), [quranStudies, applyFilters, applySort]);
    const filteredMa = useMemo(() => applySort(applyFilters(messengerAudios)), [messengerAudios, applyFilters, applySort]);

    const showQs = activeTab === 'all' || activeTab === 'quran-studies';
    const showMa = activeTab === 'all' || activeTab === 'messenger-audios';

    const totalShown = (showQs ? filteredQs.length : 0) + (showMa ? filteredMa.length : 0);
    const isEmpty = totalShown === 0;

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedAuthor('all');
        setActiveTab('all');
        setSortKey('number-asc');
    };

    return (
        <div className="qs-golden-player audio-archive-shell min-h-screen" style={{ paddingBottom: 100 }}>
            <div className="qs-page-bg" />

            <main className="qs-container" style={{ paddingTop: 32 }}>
                {/* Hero Header */}
                <header className="aa-hero-header">
                    <div className="aa-hero-text">
                        <div className="aa-section-tag">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                            Audio Archive Index
                        </div>
                        <h1 className="aa-hero-title">The Audio Archives</h1>
                        <p className="aa-hero-desc">
                            Systematic study sequences and preserved recordings, arranged for steady, focused engagement.
                            Digitized directly from the historical analog cassette masters recorded at Masjid Tucson (1987–1990).
                        </p>
                    </div>

                    <div className="aa-hero-stats">
                        <div className="aa-stat-item">
                            <span className="aa-stat-num">{initialAudios.length}</span>
                            <span className="aa-stat-label">Audio Records</span>
                        </div>
                        <div className="aa-stat-item">
                            <span className="aa-stat-num">2</span>
                            <span className="aa-stat-label">Collections</span>
                        </div>
                        <div className="aa-stat-item">
                            <span className="aa-stat-num">1987–90</span>
                            <span className="aa-stat-label">Master Tapes</span>
                        </div>
                    </div>
                </header>

                {/* Collection Tabs */}
                <div className="aa-collection-tabs" role="tablist">
                    {(
                        [
                            { id: 'all', label: 'All Records', count: initialAudios.length },
                            { id: 'quran-studies', label: 'Quran Studies', count: quranStudies.length },
                            { id: 'messenger-audios', label: 'Messenger Audios', count: messengerAudios.length },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`aa-tab-btn${activeTab === tab.id ? ' active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.label}</span>
                            <span className="aa-tab-badge">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="aa-filter-bar">
                    <div className="aa-filter-left">
                        <div className="aa-search-box">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                id="audio-search-input"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search sura, topic, speaker, or date…"
                                autoComplete="off"
                                aria-label="Search audio records"
                            />
                        </div>

                        {authors.length > 1 && (
                            <select
                                className="aa-custom-select"
                                value={selectedAuthor}
                                onChange={(e) => setSelectedAuthor(e.target.value)}
                                aria-label="Filter by speaker"
                            >
                                <option value="all">All Speakers</option>
                                {authors.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="aa-filter-right">
                        <select
                            className="aa-custom-select"
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as SortKey)}
                            aria-label="Sort audio records"
                        >
                            <option value="number-asc">Sort: 01 → Last</option>
                            <option value="number-desc">Sort: Last → 01</option>
                        </select>
                        <span className="aa-results-count">{totalShown} shown</span>
                    </div>
                </div>

                {/* Empty State */}
                {isEmpty && (
                    <div className="aa-empty-state">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--qs-text-muted)" strokeWidth="1.5" style={{ marginBottom: 12 }} aria-hidden="true">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <h3>No audio records found</h3>
                        <p>No recordings match your current search criteria. Try clearing your search or selecting a different filter.</p>
                        <button type="button" className="aa-tab-btn active" onClick={resetFilters} style={{ margin: '0 auto' }}>
                            Reset All Filters
                        </button>
                    </div>
                )}

                {/* Sections */}
                {showQs && filteredQs.length > 0 && (
                    <AudioSection
                        title="Quran Studies"
                        audios={filteredQs}
                        visibleCount={qsVisible}
                        onLoadMore={() => setQsVisible((v) => Math.min(v + INCREMENT, filteredQs.length))}
                    />
                )}

                {showMa && filteredMa.length > 0 && (
                    <AudioSection
                        title="Messenger Audios"
                        audios={filteredMa}
                        visibleCount={maVisible}
                        onLoadMore={() => setMaVisible((v) => Math.min(v + INCREMENT, filteredMa.length))}
                    />
                )}
            </main>
        </div>
    );
}
