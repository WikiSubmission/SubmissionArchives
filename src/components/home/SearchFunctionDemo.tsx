'use client';

import Image from 'next/image';
import {
    Pause,
    Play,
    RefreshCw,
    Search,
    Volume2,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type RefObject,
} from 'react';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import styles from './SearchFunctionDemo.module.css';

type DemoPhase = 'query' | 'results' | 'selected' | 'player';

type DemoResult = {
    id: string;
    rank: string;
    collection: 'Quran study' | 'Video program';
    title: string;
    thumbnail: string;
    signal: 'Best match' | 'Close match';
    timestamp: string;
    snippet: readonly DemoSnippetPart[];
};

type DemoSnippetPart = {
    text: string;
    highlighted?: boolean;
};

const PHASES = ['query', 'results', 'selected', 'player'] as const satisfies readonly DemoPhase[];

const PHASE_DURATION_MS = {
    query: 1_900,
    results: 2_600,
    selected: 1_650,
    player: 5_800,
} as const satisfies Record<DemoPhase, number>;

const QUERY_TERMS = ['quran', 'mathematical', 'miracle'] as const;

const FILTERS = [
    'Videos',
    'Quran studies',
    'Messenger audios',
    'Written archive',
] as const;

const DEMO_RESULTS = [
    {
        id: 'quran-study/45',
        rank: '01',
        collection: 'Quran study',
        title: 'QS 45 — Sura 40 & Déjà Vu',
        thumbnail: getPublicAssetUrl(
            '/content/audios/quran-studies/thumbnails/45-quran-study-from-roxana-445-sura-40-by-rashad-firozs-home-deja-vu-believers-usually-95-yrs-old-f.jpg',
        ),
        signal: 'Best match',
        timestamp: '07:01',
        snippet: [
            { text: 'This is God\'s ' },
            { text: 'mathematical', highlighted: true },
            { text: ' confirmation of the messenger of the ' },
            { text: 'covenant', highlighted: true },
            { text: '.' },
        ],
    },
    {
        id: 'video-program/old-message-new-messenger',
        rank: '02',
        collection: 'Video program',
        title: 'Old Message, New Messenger',
        thumbnail: getPublicAssetUrl(
            '/content/videos/thumbnails/old-message-new-messenger.jpg',
        ),
        signal: 'Close match',
        timestamp: '12:48',
        snippet: [
            { text: 'The ' },
            { text: 'covenant', highlighted: true },
            { text: ' was fulfilled through a ' },
            { text: 'mathematical', highlighted: true },
            { text: ' code.' },
        ],
    },
] as const satisfies readonly DemoResult[];

const PHASE_LABELS = {
    query: 'Forming a cross-collection query',
    results: 'Ranking passages across the archive',
    selected: 'Opening the strongest passage',
    player: 'Playing from the matched timestamp',
} as const satisfies Record<DemoPhase, string>;

function useReducedMotionPreference() {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updatePreference = () => setReducedMotion(mediaQuery.matches);

        updatePreference();
        mediaQuery.addEventListener('change', updatePreference);
        return () => mediaQuery.removeEventListener('change', updatePreference);
    }, []);

    return reducedMotion;
}

function useElementVisibility<T extends Element>(
    ref: RefObject<T | null>,
    rootMargin = '180px 0px',
) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin, threshold: 0.15 },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, rootMargin]);

    return isVisible;
}

function useDocumentVisibility() {
    const [isDocumentVisible, setIsDocumentVisible] = useState(true);

    useEffect(() => {
        const updateVisibility = () => {
            setIsDocumentVisible(document.visibilityState === 'visible');
        };

        updateVisibility();
        document.addEventListener('visibilitychange', updateVisibility);
        return () => document.removeEventListener('visibilitychange', updateVisibility);
    }, []);

    return isDocumentVisible;
}

function useDemoTimeline({
    enabled,
    reducedMotion,
}: {
    enabled: boolean;
    reducedMotion: boolean;
}) {
    const [phase, setPhase] = useState<DemoPhase>('query');
    const [isPaused, setIsPaused] = useState(false);
    const [cycle, setCycle] = useState(0);

    useEffect(() => {
        if (!enabled || isPaused || reducedMotion) return;

        const timeout = window.setTimeout(() => {
            const currentIndex = PHASES.indexOf(phase);
            const nextIndex = (currentIndex + 1) % PHASES.length;

            if (nextIndex === 0) {
                setCycle((currentCycle) => currentCycle + 1);
            }

            setPhase(PHASES[nextIndex]);
        }, PHASE_DURATION_MS[phase]);

        return () => window.clearTimeout(timeout);
    }, [enabled, isPaused, phase, reducedMotion]);

    const restart = useCallback(() => {
        setCycle((currentCycle) => currentCycle + 1);
        setPhase('query');
        setIsPaused(false);
    }, []);

    return {
        phase: reducedMotion ? 'player' : phase,
        cycle,
        isPaused,
        setIsPaused,
        restart,
    };
}

export default function SearchFunctionDemo() {
    const rootRef = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotionPreference();
    const isInView = useElementVisibility(rootRef);
    const isDocumentVisible = useDocumentVisibility();
    const enabled = isInView && isDocumentVisible;
    const { phase, cycle, isPaused, setIsPaused, restart } = useDemoTimeline({
        enabled,
        reducedMotion,
    });

    const phaseIndex = PHASES.indexOf(phase);
    const progress = reducedMotion ? 1 : (phaseIndex + 1) / PHASES.length;
    const isSearchSceneVisible = phase !== 'player';

    const statusText = useMemo(() => {
        if (reducedMotion) return 'Motion reduced. Final state shown.';
        if (!isInView) return 'Animation paused while offscreen.';
        if (!isDocumentVisible) return 'Animation paused while the tab is hidden.';
        if (isPaused) return 'Animation paused.';
        return PHASE_LABELS[phase];
    }, [isDocumentVisible, isInView, isPaused, phase, reducedMotion]);

    return (
        <section
            ref={rootRef}
            className={styles.root}
            data-phase={phase}
            data-paused={isPaused || !enabled}
            aria-label="Animated demonstration of the archive search workflow"
        >
            <div className={styles.header}>
                <div className={styles.headerIdentity}>
                    <span className={styles.headerIcon} aria-hidden="true">
                        <Search size={15} strokeWidth={1.8} />
                    </span>
                    <div>
                        <p className={styles.eyebrow}>Archive search demonstration</p>
                        <p className={styles.status}>
                            {statusText}
                        </p>
                    </div>
                </div>

                <div className={styles.controls}>
                    {!reducedMotion ? (
                        <button
                            type="button"
                            className={styles.controlButton}
                            onClick={() => setIsPaused((current) => !current)}
                            aria-label={isPaused ? 'Resume search demonstration' : 'Pause search demonstration'}
                        >
                            {isPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}
                            <span>{isPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={restart}
                        aria-label="Replay search demonstration"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className={styles.phaseTrack} aria-hidden="true">
                <span
                    className={styles.phaseProgress}
                    style={{ transform: `scaleX(${progress})` }}
                />
            </div>

            <div className={styles.stage} key={cycle} aria-hidden="true">
                <div
                    className={styles.searchScene}
                    data-visible={isSearchSceneVisible}
                >
                    <div className={styles.searchBar}>
                        <Search className={styles.searchIcon} size={19} strokeWidth={1.7} />
                        <div className={styles.query}>
                            {QUERY_TERMS.map((term) => (
                                <span key={term} className={styles.queryTerm}>
                                    {term}
                                </span>
                            ))}
                            <span className={styles.caret} />
                        </div>
                        <span className={styles.searchAction}>Search</span>
                    </div>

                    <div className={styles.filterRow}>
                        {FILTERS.map((filter, index) => (
                            <span
                                key={filter}
                                className={styles.filter}
                                data-active={index < 3}
                            >
                                {filter}
                            </span>
                        ))}
                    </div>

                    <div className={styles.resultSummary}>
                        <div>
                            <span className={styles.summaryLabel}>Best matches first</span>
                            <strong>12 documents, 31 passages</strong>
                        </div>
                        <span className={styles.rankMethod}>exact + nearby + repeated</span>
                    </div>

                    <div className={styles.results}>
                        {DEMO_RESULTS.map((result, index) => (
                            <DemoResultCard
                                key={result.id}
                                result={result}
                                index={index}
                                selected={phase === 'selected' && index === 0}
                            />
                        ))}
                    </div>
                </div>

                <div
                    className={styles.playerScene}
                    data-visible={phase === 'player'}
                >
                    <div className={styles.playerHeading}>
                        <div>
                            <span className={styles.backLabel}>Search results / Quran studies</span>
                            <h4>QS 45 — Sura 40 &amp; Déjà Vu</h4>
                            <p>Dr. Rashad Khalifa · Quran Study 45</p>
                        </div>
                        <Image
                            src={DEMO_RESULTS[0].thumbnail}
                            alt=""
                            width={156}
                            height={88}
                            quality={60}
                            sizes="156px"
                            className={styles.playerThumbnail}
                        />
                    </div>

                    <div className={styles.passage}>
                        <div className={styles.passageMeta}>
                            <span>Best passage</span>
                            <span>Play at 07:01</span>
                        </div>
                        <p>
                            This is God&apos;s{' '}
                            <mark className={styles.highlight}>mathematical</mark>{' '}
                            confirmation that we are living in an age where God will send the
                            messenger of the{' '}
                            <mark className={styles.highlight}>covenant</mark>.
                        </p>
                    </div>

                    <div className={styles.player}>
                        <div className={styles.playerTopline}>
                            <span className={styles.nowPlaying}>
                                <Volume2 size={14} />
                                Playing matched passage
                            </span>
                            <span className={styles.playerTime}>07:01 / 45:12</span>
                        </div>
                        <div className={styles.waveform}>
                            {Array.from({ length: 32 }, (_, index) => (
                                <span key={index} style={{ height: `${18 + ((index * 17) % 66)}%` }} />
                            ))}
                        </div>
                        <div className={styles.playerProgressTrack}>
                            <span className={styles.playerProgress} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function DemoResultCard({
    result,
    index,
    selected,
}: {
    result: DemoResult;
    index: number;
    selected: boolean;
}) {
    return (
        <article
            className={styles.resultCard}
            data-selected={selected}
            style={{ transitionDelay: `${index * 90}ms` }}
        >
            <span className={styles.selectionRail} />
            <Image
                src={result.thumbnail}
                alt=""
                width={128}
                height={72}
                quality={60}
                sizes="(max-width: 639px) 84px, 128px"
                className={styles.thumbnail}
            />
            <div className={styles.resultBody}>
                <div className={styles.resultMeta}>
                    <span className={styles.rank}>{result.rank}</span>
                    <span>{result.collection}</span>
                    <span className={styles.signal}>{result.signal}</span>
                </div>
                <h4>{result.title}</h4>
                <p>
                    {result.snippet.map((part, partIndex) => (
                        <span
                            key={`${part.text}-${partIndex}`}
                            className={part.highlighted ? styles.inlineHighlight : undefined}
                        >
                            {part.text}
                        </span>
                    ))}
                </p>
            </div>
            <span className={styles.timestamp}>{result.timestamp}</span>
        </article>
    );
}
