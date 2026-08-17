'use client';

import { useMemo, useState } from 'react';
import type { Media } from '@/types/media';

type VideoSection = {
    id: string;
    title: string;
    description: string;
    videos: Media[];
};

type SortOption = 'featured' | 'title-asc' | 'title-desc';

const SECTION_DEFS: Omit<VideoSection, 'videos'>[] = [
    {
        id: 'programs',
        title: 'Video Programs',
        description: 'Core broadcasts, explainers, and documentary-style presentations.',
    },
    {
        id: 'debates',
        title: 'Debates & Discussions',
        description: 'Preserved public debates featuring Dr. Rashad Khalifa and contemporary scholars.',
    },
    {
        id: 'instructional',
        title: 'Instructional Works',
        description: 'Practical lessons, prayer principles, and foundational teaching materials.',
    },
    {
        id: 'sermons',
        title: 'Friday Sermons',
        description: 'Chronological sermon material and preserved public addresses from Masjid Tucson.',
    },
    {
        id: 'conferences',
        title: 'USI Conferences',
        description: 'Annual conference footage, presentations, and public event documentation.',
    },
];

const INITIAL_VISIBLE = 8;

function categorize(title: string): string {
    const t = title.toLowerCase();

    if (t.includes('friday sermon') || t.includes('khutba')) return 'sermons';
    if (
        t.includes('united submitters international conference') ||
        t.includes('usi conference') ||
        t.includes('fulfillment of the covenant')
    ) {
        return 'conferences';
    }
    if (
        t.includes('essentials of submission') ||
        t.includes('principles of contact prayers') ||
        t.includes('principles of friday prayer') ||
        t.includes('arabic language lessons')
    ) {
        return 'instructional';
    }
    if (t.includes('debate') || t.includes('discussion')) return 'debates';

    return 'programs';
}

function formatDuration(seconds?: number): string | null {
    if (!seconds || seconds <= 0) return null;
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export default function VideosPageClient({ initialVideos }: { initialVideos: Media[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [sortBy, setSortBy] = useState<SortOption>('featured');
    const [speakerFilter, setSpeakerFilter] = useState('all');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const speakerList = useMemo(() => {
        const set = new Set<string>();
        initialVideos.forEach((v) => {
            if (v.author && v.author.trim().length > 0) {
                set.add(v.author.trim());
            }
        });
        return Array.from(set).sort();
    }, [initialVideos]);

    const baseSections = useMemo<VideoSection[]>(() => {
        const sections: VideoSection[] = SECTION_DEFS.map((def) => ({ ...def, videos: [] }));

        initialVideos.forEach((video) => {
            const sectionId = categorize(video.title);
            sections.find((section) => section.id === sectionId)?.videos.push(video);
        });

        return sections.filter((section) => section.videos.length > 0);
    }, [initialVideos]);

    const query = searchQuery.trim().toLowerCase();

    const visibleSections = useMemo(() => {
        return baseSections
            .map((section) => {
                let videos = section.videos;

                if (activeTab !== 'all' && section.id !== activeTab) {
                    return { ...section, videos: [] };
                }

                if (speakerFilter !== 'all') {
                    videos = videos.filter((video) => video.author === speakerFilter);
                }

                if (query) {
                    videos = videos.filter(
                        (video) =>
                            video.title.toLowerCase().includes(query) ||
                            (video.author ?? '').toLowerCase().includes(query) ||
                            (video.displayTitle ?? '').toLowerCase().includes(query),
                    );
                }

                videos = [...videos].sort((a, b) => {
                    if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
                    if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
                    return (a.sortValue ?? 0) - (b.sortValue ?? 0);
                });

                return { ...section, videos };
            })
            .filter((section) => section.videos.length > 0);
    }, [baseSections, activeTab, speakerFilter, query, sortBy]);

    const totalShown = visibleSections.reduce((sum, section) => sum + section.videos.length, 0);

    const resetFilters = () => {
        setSearchQuery('');
        setActiveTab('all');
        setSpeakerFilter('all');
        setSortBy('featured');
    };

    return (
        <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB] font-sans antialiased selection:bg-[#C8794A]/25 selection:text-[#F5F0EB]">
            {/* Ambient page glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(200,121,74,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(200,121,74,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-[#4A4542]">
                        <a href="/" className="text-[#6B6560] transition-colors hover:text-[#C8794A]">
                            Submission Archives
                        </a>
                        <span className="text-[#353433]">/</span>
                        <span className="text-[#6B6560]">Video Archives</span>
                    </nav>

                    {/* Hero Header */}
                    <header className="mb-7 flex flex-wrap items-end justify-between gap-8 border-b border-[#2A2928] pb-7">
                        <div className="max-w-[640px]">
                            <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-[#C8794A]/15 bg-[#C8794A]/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8794A]">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                Video Archive Index
                            </div>
                            <h1
                                className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                The Video Archives
                            </h1>
                            <p
                                className="text-[16.5px] leading-[1.6] text-[#9E9690]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                Systematic study sequences and preserved recordings, arranged for steady, focused engagement.
                                Preserved master recordings from Masjid Tucson.
                            </p>
                        </div>

                        <div className="flex flex-shrink-0 gap-6 rounded-[8px] border border-[#2A2928] bg-[#161514] px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                                    {initialVideos.length}
                                </span>
                                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                                    Video Records
                                </span>
                            </div>
                            <div className="flex flex-col border-l border-[#2A2928] pl-6">
                                <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                                    {baseSections.length}
                                </span>
                                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                                    Collections
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Collection Tabs */}
                    <div role="tablist" className="mb-6 flex flex-wrap gap-2" aria-label="Collections">
                        <button
                            role="tab"
                            aria-selected={activeTab === 'all'}
                            onClick={() => setActiveTab('all')}
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-[4px] border px-4 py-[7px] text-[13px] font-medium transition-all duration-200 ${activeTab === 'all'
                                ? 'border-[#C8794A] bg-[#C8794A]/[0.06] font-semibold text-[#C8794A]'
                                : 'border-[#2A2928] bg-[#161514] text-[#6B6560] hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#9E9690]'
                                }`}
                        >
                            <span>All Records</span>
                            <span
                                className={`rounded-[10px] px-1.5 py-0.5 text-[11px] ${activeTab === 'all'
                                    ? 'bg-[#C8794A] font-bold text-[#0F0E0D]'
                                    : 'bg-[#0F0E0D] text-inherit opacity-85'
                                    }`}
                            >
                                {initialVideos.length}
                            </span>
                        </button>

                        {baseSections.map((section) => {
                            const isActive = activeTab === section.id;
                            return (
                                <button
                                    key={section.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveTab(section.id)}
                                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-[4px] border px-4 py-[7px] text-[13px] font-medium transition-all duration-200 ${isActive
                                        ? 'border-[#C8794A] bg-[#C8794A]/[0.06] font-semibold text-[#C8794A]'
                                        : 'border-[#2A2928] bg-[#161514] text-[#6B6560] hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#9E9690]'
                                        }`}
                                >
                                    <span>{section.title}</span>
                                    <span
                                        className={`rounded-[10px] px-1.5 py-0.5 text-[11px] ${isActive
                                            ? 'bg-[#C8794A] font-bold text-[#0F0E0D]'
                                            : 'bg-[#0F0E0D] text-inherit opacity-85'
                                            }`}
                                    >
                                        {section.videos.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Filter Bar */}
                    <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2928] pb-5">
                        <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
                            <div className="relative max-w-[360px] flex-1">
                                <svg
                                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4A4542]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search title, speaker, or topic..."
                                    className="w-full rounded-[4px] border border-[#2A2928] bg-[#161514] py-2 pl-8 pr-3 text-[13px] font-medium text-[#F5F0EB] placeholder:text-[#4A4542] outline-none transition-all focus:border-[#353433] focus:bg-[#1C1B1A]"
                                />
                            </div>

                            {speakerList.length > 1 && (
                                <select
                                    value={speakerFilter}
                                    onChange={(e) => setSpeakerFilter(e.target.value)}
                                    aria-label="Filter by speaker"
                                    className="cursor-pointer rounded-[4px] border border-[#2A2928] bg-[#161514] px-3 py-2 text-[12.5px] font-medium text-[#9E9690] outline-none transition-all hover:border-[#353433] hover:text-[#F5F0EB]"
                                >
                                    <option value="all">All Speakers</option>
                                    {speakerList.map((speaker) => (
                                        <option key={speaker} value={speaker}>
                                            {speaker}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                aria-label="Sort videos"
                                className="cursor-pointer rounded-[4px] border border-[#2A2928] bg-[#161514] px-3 py-2 text-[12.5px] font-medium text-[#9E9690] outline-none transition-all hover:border-[#353433] hover:text-[#F5F0EB]"
                            >
                                <option value="featured">Sort: Featured Order</option>
                                <option value="title-asc">Sort: Title A–Z</option>
                                <option value="title-desc">Sort: Title Z–A</option>
                            </select>
                            <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-[#6B6560]">
                                {totalShown} shown
                            </span>
                        </div>
                    </div>

                    {/* Empty State */}
                    {totalShown === 0 && (
                        <div className="mb-16 rounded-[12px] border border-dashed border-[#2A2928] bg-[#161514] px-6 py-16 text-center">
                            <svg
                                className="mx-auto mb-3 h-10 w-10 text-[#6B6560]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <h3
                                className="text-[20px] font-semibold text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                No video records found
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-[14px] text-[#6B6560]">
                                No recordings match your current search criteria. Try clearing your query or selecting a different filter.
                            </p>
                            <button
                                onClick={resetFilters}
                                className="mt-4 inline-flex items-center gap-2 rounded-[4px] border border-[#C8794A] bg-[#C8794A]/10 px-4 py-2 text-[13px] font-semibold text-[#C8794A] transition-colors hover:bg-[#C8794A]/20"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}

                    {/* Video Sections */}
                    {visibleSections.map((section) => {
                        const expanded = expandedSections[section.id] ?? false;
                        const visible = expanded ? section.videos : section.videos.slice(0, INITIAL_VISIBLE);

                        return (
                            <section key={section.id} id={section.id} className="mb-14">
                                <div className="mb-7 flex items-center gap-4 border-b border-[#2A2928] pb-3">
                                    <h2
                                        className="whitespace-nowrap text-[22px] font-semibold tracking-[-0.01em] text-[#F5F0EB]"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        {section.title}
                                    </h2>
                                    <div className="h-px flex-1 bg-[#2A2928]" />
                                    <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-[#6B6560]">
                                        {section.videos.length} {section.videos.length === 1 ? 'record' : 'records'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
                                    {visible.map((video) => (
                                        <VideoCard key={video.id} video={video} />
                                    ))}
                                </div>

                                {section.videos.length > INITIAL_VISIBLE && (
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            onClick={() =>
                                                setExpandedSections((prev) => ({ ...prev, [section.id]: !expanded }))
                                            }
                                            className="rounded-[4px] border border-[#2A2928] bg-[#161514] px-4 py-2 text-[12px] font-semibold text-[#9E9690] transition-colors hover:border-[#353433] hover:text-[#F5F0EB]"
                                        >
                                            {expanded ? 'Show fewer' : `Show all ${section.videos.length}`}
                                        </button>
                                    </div>
                                )}
                            </section>
                        );
                    })}

                    <footer className="mt-16 border-t border-[#2A2928] py-9 text-center text-[12px] font-medium tracking-[0.04em] text-[#4A4542]">
                        Dedicated to preserving and sharing the message of God alone.
                    </footer>
                </div>
            </main>
        </div>
    );
}

function VideoCard({ video }: { video: Media }) {
    const duration = formatDuration(video.duration_seconds);
    const displayTitle = video.displayTitle ?? video.title;
    const speaker = video.author ?? 'Dr. Rashad Khalifa';
    const isDrKhalifa = speaker.toLowerCase().includes('khalifa');
    const isCatherine = speaker.toLowerCase().includes('catherine');
    const isEdip = speaker.toLowerCase().includes('edip');

    return (
        <a
            href={`/videos/${video.id}`}
            className="group relative flex flex-col overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514] transition-all duration-[280ms] ease-out hover:-translate-y-0.5 hover:border-[#353433] hover:bg-[#1C1B1A] hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        >
            {/* 16:9 Thumbnail Stage */}
            <div
                className="relative aspect-video overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #1a2e26 0%, #0f1a16 40%, #1a2520 100%)' }}
            >
                {video.thumbnailOverride ? (
                    <img
                        src={video.thumbnailOverride}
                        alt={displayTitle}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <>
                        <div
                            aria-hidden
                            className="absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(circle at 30% 40%, rgba(200,121,74,0.06) 0%, transparent 50%), ' +
                                    'radial-gradient(circle at 70% 65%, rgba(200,121,74,0.03) 0%, transparent 40%)',
                            }}
                        />
                        <div className="relative z-[2] flex h-full flex-col items-center justify-center p-5 text-center">
                            <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C8794A] opacity-90">
                                {speaker}
                            </span>
                            <span
                                className="line-clamp-2 text-[clamp(18px,2.5vw,22px)] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                {displayTitle}
                            </span>
                        </div>
                    </>
                )}

                {/* Duration Badge */}
                {duration && (
                    <span className="absolute bottom-2 right-2 z-[3] rounded-[4px] border border-white/5 bg-[#0F0E0D]/85 px-1.5 py-0.5 text-[11px] font-medium font-mono tabular-nums text-[#F5F0EB] backdrop-blur-sm">
                        {duration}
                    </span>
                )}

                {/* Hover Play Button */}
                <div className="absolute inset-0 z-[2] flex items-end justify-center pb-4 transition-colors duration-300 group-hover:bg-black/15">
                    <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full border border-[#353433] bg-[#0F0E0D]/85 opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 ease-out group-hover:scale-100 group-hover:border-[#C8794A] group-hover:opacity-100">
                        <span className="ml-0.5 h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-[#F5F0EB] transition-colors group-hover:border-l-[#C8794A]" />
                    </span>
                </div>
            </div>

            {/* Card Content */}
            <div className="flex flex-1 flex-col justify-between p-[16px_18px_18px]">
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11.5px] font-medium tracking-[0.02em] text-[#6B6560]">
                            {video.displayDate || 'Preserved Recording'}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4A4542]">
                            {video.type ?? 'Video'}
                        </span>
                    </div>

                    <h3
                        className="mb-1.5 line-clamp-2 text-[16.5px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#F5F0EB]"
                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                    >
                        {displayTitle}
                    </h3>

                    {/* Speaker Pill */}
                    <div className="mb-3.5 mt-2 flex items-center gap-1.5 flex-wrap">
                        <span
                            className={`rounded-[4px] px-2 py-0.5 text-[11px] font-semibold ${isDrKhalifa
                                ? 'border border-[#C8794A]/20 bg-[#C8794A]/[0.05] text-[#C8794A]'
                                : isCatherine
                                    ? 'bg-[#8FB8A8]/[0.08] text-[#8FB8A8]'
                                    : isEdip
                                        ? 'bg-[#8AA4C8]/[0.08] text-[#8AA4C8]'
                                        : 'bg-[#1C1B1A] text-[#9E9690]'
                                }`}
                        >
                            {speaker}
                        </span>
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-[#2A2928] pt-3 gap-2">
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-[4px] border border-[#2A2928] bg-transparent py-[7px] px-3 text-[12px] font-semibold text-[#9E9690] transition-all group-hover:border-[#353433] group-hover:bg-[#1E1D1C] group-hover:text-[#F5F0EB]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                            <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                        Watch Video
                    </span>
                </div>
            </div>
        </a>
    );
}