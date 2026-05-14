'use client';

import React from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    BookOpenText,
    Headphones,
    Search,
    Video,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTheme } from './components/ThemeProvider';

interface HomePageClientProps {
    initialMedia?: unknown[];
}

type BranchCard = {
    numeral: string;
    eyebrow: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    accent: string;
    meta: string;
    cardTitle: string;
    icon: React.ComponentType<{ className?: string }>;
    align: 'left' | 'right' | 'center';
};

const archiveBranches: BranchCard[] = [
    {
        numeral: 'I',
        eyebrow: 'Moving image archive',
        title: 'The visual record.',
        body: 'Broadcasts, Friday sermons, and conference footage arranged as a study collection rather than a content feed. The page should feel closer to a reading room than a media app.',
        href: '/videos',
        cta: 'Enter the film archive',
        accent: 'Latest restoration',
        meta: 'Frame-stable transfers, timestamps, transcript pairing',
        cardTitle: 'Friday Sermon\nThe Covenant Renewed',
        icon: Video,
        align: 'left',
    },
    {
        numeral: 'II',
        eyebrow: 'Voice and recitation',
        title: 'The oral tradition.',
        body: 'Verse studies, historical reflections, and preserved addresses held in a slower, more legible listening environment. Less streaming platform, more annotated collection.',
        href: '/audios',
        cta: 'Browse the audio library',
        accent: 'Featured sequence',
        meta: 'Study runs, messenger audios, long-form reflections',
        cardTitle: 'Verse-by-verse\nExcavation Series',
        icon: Headphones,
        align: 'right',
    },
    {
        numeral: 'III',
        eyebrow: 'Unified lookup',
        title: 'A calmer discovery engine.',
        body: 'Search across transcripts, newsletters, appendices, and notes from one place. The interaction stays understated so the archive feels deep, not noisy.',
        href: '/search',
        cta: 'Open the index',
        accent: 'Cross-collection recall',
        meta: 'Names, verses, phrases, and references across the corpus',
        cardTitle: 'Search across\n1,240 archive units',
        icon: Search,
        align: 'center',
    },
];

const textShelves = [
    { count: '142', label: 'Submitter perspectives' },
    { count: '89', label: 'Appendices' },
    { count: '24', label: 'Major books' },
    { count: '567', label: 'Articles' },
    { count: '31', label: 'Manuscripts' },
    { count: '18', label: 'Miracle data' },
];

export default function HomePageClient({ initialMedia }: HomePageClientProps) {
    const { darkMode } = useTheme();
    const mediaCount = initialMedia?.length ?? 1240;

    return (
        <div className="relative min-h-screen overflow-hidden bg-ed-bg text-ed-fg">
            <div className="pointer-events-none absolute inset-0">
                <div className="archive-atmosphere absolute inset-0" />
                <div className="archive-grid absolute inset-0 opacity-[0.14]" />
                <div className="absolute left-[8%] top-[14rem] h-64 w-64 rounded-full bg-ed-accent/10 blur-3xl" />
                <div className="absolute right-[10%] top-[42rem] h-72 w-72 rounded-full bg-ed-accent/10 blur-3xl" />
            </div>

            <Header />

            <main className="relative z-10">
                <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pb-24 lg:pt-16">
                    <div className="flex flex-col justify-between gap-10">
                        <div className="max-w-3xl space-y-8">
                            <div className="space-y-4">
                                <p className="text-[0.68rem] uppercase tracking-[0.3em] text-ed-accent">
                                    Preservation infrastructure for a living archive
                                </p>
                                <h1 className="max-w-[11ch] font-serif text-[3.6rem] leading-[0.9] text-ed-fg sm:text-[4.8rem] lg:text-[6.8rem]">
                                    A quiet architecture for enduring material.
                                </h1>
                                <p className="max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted sm:text-base">
                                    Submission Archives is being reshaped as an editorial archive: less neon,
                                    less dashboard theater, more atmosphere, typography, and patient structure.
                                    The intent is reverent, modern, and unmistakably deliberate.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    href="/videos"
                                    className="inline-flex items-center justify-center gap-3 border border-ed-accent/30 bg-ed-accent/10 px-6 py-3 text-[0.72rem] uppercase tracking-[0.22em] text-ed-fg transition hover:bg-ed-accent/15"
                                >
                                    Start with the archive
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/search"
                                    className="inline-flex items-center justify-center gap-3 border border-ed-rule px-6 py-3 text-[0.72rem] uppercase tracking-[0.22em] text-ed-fg-muted transition hover:bg-ed-surface/70 hover:text-ed-fg"
                                >
                                    Search the corpus
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-px border border-ed-rule bg-ed-rule sm:grid-cols-3">
                            <HeroStat value={mediaCount.toLocaleString()} label="Archive units" />
                            <HeroStat value="1950s–2026" label="Temporal span" />
                            <HeroStat value="Text, audio, film" label="Formats held" />
                        </div>
                    </div>

                    <div className="relative flex items-center justify-center lg:justify-end">
                        <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full border border-ed-rule bg-ed-accent/10 blur-sm lg:block" />
                        <div className="w-full max-w-[560px] border border-ed-rule bg-ed-surface/74 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-5">
                            <div className="relative aspect-[4/5] overflow-hidden border border-ed-rule bg-ed-surface">
                                <div
                                    className="absolute inset-0 bg-cover bg-center grayscale"
                                    style={{
                                        backgroundImage: 'url("/images/rashadandothers/M3.png")',
                                        opacity: darkMode ? 0.54 : 0.3,
                                    }}
                                />
                                <div className="archive-image-fade absolute inset-0" />
                                <div className="archive-grid absolute inset-0 opacity-[0.18] [background-size:64px_64px]" />

                                <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-ed-rule px-5 py-4 text-[0.62rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                    <span>Submission Archives</span>
                                    <span>Editorial preview</span>
                                </div>

                                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                                    <div className="max-w-sm space-y-4">
                                        <p className="text-[0.64rem] uppercase tracking-[0.28em] text-ed-accent">
                                            From the collection
                                        </p>
                                        <h2 className="font-serif text-3xl leading-[1] text-ed-fg sm:text-4xl">
                                            Submission
                                            <span className="block italic text-ed-fg">Archives</span>
                                        </h2>
                                        <p className="max-w-[30ch] text-sm leading-7 text-ed-fg-muted">
                                            Preserving sermons, studies, recorded broadcasts, and written material
                                            with enough restraint for the archive itself to carry the emotion.
                                        </p>
                                    </div>
                                </div>

                                <div className="absolute -bottom-px left-0 right-0 grid gap-px border-t border-ed-rule bg-ed-rule sm:grid-cols-3">
                                    <ArtifactMeta label="Collection mode" value="Calm, dark, editorial" />
                                    <ArtifactMeta label="Primary accent" value="Warm parchment peach" />
                                    <ArtifactMeta label="Avoided" value="Terminal theater, AI gloss" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">
                    <div className="grid gap-px border border-ed-rule bg-ed-rule lg:grid-cols-[0.9fr_1.1fr_1fr]">
                        <EditorialCell
                            title="Three major lanes"
                            copy="Moving image, preserved audio, and textual study material, all treated like a single archive rather than siloed product surfaces."
                        />
                        <EditorialCell
                            title="Editorial restraint"
                            copy="The visual target is closer to a literary artifact or museum interface: toned neutrals, serif gravity, careful spacing, sparse ornament."
                        />
                        <EditorialCell
                            title="Search without noise"
                            copy="Discovery should feel immediate without turning the whole homepage into a software dashboard."
                        />
                    </div>
                </section>

                <section className="mx-auto max-w-[1440px] px-4 pb-8 pt-16 sm:px-6 lg:px-10 lg:pt-24">
                    <div className="mb-16 flex flex-col gap-6 border-b border-ed-rule pb-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-4">
                            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-ed-fg-muted">
                                Branches of the archive
                            </p>
                            <h2 className="max-w-[12ch] font-serif text-4xl leading-[0.98] text-ed-fg sm:text-5xl lg:text-6xl">
                                Three pathways into the collection.
                            </h2>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-ed-fg-muted sm:text-[15px]">
                            This replaces the old stacked chapter treatment with bigger planes, quieter metadata,
                            and stronger asymmetry so each section feels authored rather than templated.
                        </p>
                    </div>

                    <div className="space-y-16 lg:space-y-24">
                        {archiveBranches.map((branch) => (
                            <ArchiveBranch key={branch.numeral} {...branch} />
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-[1440px] px-4 pb-8 pt-24 sm:px-6 lg:px-10">
                    <div className="grid gap-10 border border-ed-rule bg-ed-surface/72 p-6 backdrop-blur-sm lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
                        <div className="space-y-5">
                            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-ed-accent">
                                The scriptorium
                            </p>
                            <h2 className="max-w-[10ch] font-serif text-4xl leading-[0.98] text-ed-fg sm:text-5xl">
                                Text as a first-class surface.
                            </h2>
                            <p className="max-w-xl text-sm leading-8 text-ed-fg-muted sm:text-[15px]">
                                Articles, appendices, manuscripts, and major written works should not feel like an
                                afterthought. The archive’s written body needs weight, structure, and room to breathe.
                            </p>
                            <Link
                                href="/other"
                                className="inline-flex items-center gap-3 border border-ed-rule px-5 py-3 text-[0.72rem] uppercase tracking-[0.22em] text-ed-fg transition hover:bg-ed-surface/70"
                            >
                                Enter the text archive
                                <BookOpenText className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="grid gap-px border border-ed-rule bg-ed-rule sm:grid-cols-2 lg:grid-cols-3">
                            {textShelves.map((item) => (
                                <Link
                                    key={item.label}
                                    href="/other"
                                    className="group bg-ed-surface/82 p-6 transition hover:bg-ed-bg/60"
                                >
                                    <p className="font-serif text-4xl text-ed-fg">{item.count}</p>
                                    <p className="mt-4 text-[0.68rem] uppercase tracking-[0.22em] text-ed-fg-muted transition group-hover:text-ed-accent">
                                        {item.label}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function HeroStat({ value, label }: { value: string; label: string }) {
    return (
        <div className="bg-ed-surface/74 px-5 py-5">
            <p className="font-serif text-2xl text-ed-fg sm:text-3xl">{value}</p>
            <p className="mt-2 text-[0.64rem] uppercase tracking-[0.22em] text-ed-fg-muted">{label}</p>
        </div>
    );
}

function ArtifactMeta({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-ed-surface/88 px-4 py-4">
            <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ed-fg-muted">{label}</p>
            <p className="mt-2 text-sm leading-6 text-ed-fg/78">{value}</p>
        </div>
    );
}

function EditorialCell({ title, copy }: { title: string; copy: string }) {
    return (
        <div className="bg-ed-surface/72 p-6 sm:p-7">
            <p className="font-serif text-2xl text-ed-fg">{title}</p>
            <p className="mt-3 max-w-[34ch] text-sm leading-7 text-ed-fg-muted">{copy}</p>
        </div>
    );
}

function ArchiveBranch({
    numeral,
    eyebrow,
    title,
    body,
    href,
    cta,
    accent,
    meta,
    cardTitle,
    icon: Icon,
    align,
}: {
    numeral: string;
    eyebrow: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    accent: string;
    meta: string;
    cardTitle: string;
    icon: React.ComponentType<{ className?: string }>;
    align: 'left' | 'right' | 'center';
}) {
    const isRight = align === 'right';
    const isCenter = align === 'center';

    return (
        <article
            className={`grid gap-8 border border-ed-rule p-5 sm:p-7 lg:p-8 ${
                isCenter ? 'lg:grid-cols-[1fr]' : 'lg:grid-cols-[0.95fr_1.05fr]'
            }`}
        >
            <div className={`${isRight ? 'lg:order-2' : ''} ${isCenter ? 'max-w-3xl' : ''} space-y-6`}>
                <div className="flex items-end gap-5 border-b border-ed-rule pb-4">
                    <span className="font-serif text-6xl leading-none text-ed-accent/50 sm:text-7xl">
                        {numeral}
                    </span>
                    <p className="pb-2 text-[0.68rem] uppercase tracking-[0.26em] text-ed-fg-muted">
                        {eyebrow}
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="max-w-[12ch] font-serif text-4xl leading-[0.98] text-ed-fg sm:text-5xl">
                        {title}
                    </h3>
                    <p className="max-w-[60ch] text-sm leading-8 text-ed-fg-muted sm:text-[15px]">
                        {body}
                    </p>
                </div>

                <div className="space-y-3 border-l border-ed-accent/30 pl-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-ed-accent">{accent}</p>
                    <p className="max-w-[54ch] text-sm leading-7 text-ed-fg-muted">{meta}</p>
                </div>

                <Link
                    href={href}
                    className="inline-flex items-center gap-3 border border-ed-rule px-5 py-3 text-[0.72rem] uppercase tracking-[0.22em] text-ed-fg transition hover:bg-ed-surface/70"
                >
                    {cta}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className={`${isRight ? 'lg:order-1' : ''} ${isCenter ? 'max-w-3xl' : ''}`}>
                <div className="relative min-h-[320px] border border-ed-rule bg-ed-surface/78 p-5 sm:min-h-[360px] sm:p-6">
                    <div className="archive-soft-orb absolute inset-0" />
                    <div className="relative flex h-full flex-col justify-between">
                        <div className="flex items-start justify-between gap-4">
                            <div className="inline-flex h-12 w-12 items-center justify-center border border-ed-rule bg-ed-surface text-ed-accent">
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="max-w-[18ch] text-right text-[0.58rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                Sample presentation card
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="h-px w-24 bg-ed-rule" />
                            <h4 className="whitespace-pre-line font-serif text-3xl leading-tight text-ed-fg sm:text-4xl">
                                {cardTitle}
                            </h4>
                            <p className="max-w-[34ch] text-sm leading-7 text-ed-fg-muted">
                                A stronger home page card system should feel like an artifact label, not a SaaS tile.
                            </p>
                        </div>

                        <div className="grid gap-px border border-ed-rule bg-ed-rule sm:grid-cols-2">
                            <div className="bg-ed-surface px-4 py-4">
                                <p className="text-[0.56rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                    Orientation
                                </p>
                                <p className="mt-2 text-sm text-ed-fg/76">Editorial, spare, tactile</p>
                            </div>
                            <div className="bg-ed-surface px-4 py-4">
                                <p className="text-[0.56rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                    Behavior
                                </p>
                                <p className="mt-2 text-sm text-ed-fg/76">Readable first, product second</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
