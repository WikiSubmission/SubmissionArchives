'use client';

import Link from 'next/link';
import { ArrowRight, BookOpenText, FileStack, LibraryBig, ScrollText } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const shelves = [
    {
        title: 'Submitter perspectives',
        copy: 'Newsletter writing, commentary, and interpretive material preserved for contextual study.',
    },
    {
        title: 'Appendices',
        copy: 'Reference material, structured explanatory works, and study-ready supplements.',
    },
    {
        title: 'Historical scans',
        copy: 'Documents and archival imagery that belong to the longer textual memory of the archive.',
    },
    {
        title: 'Major works',
        copy: 'Longer-form written material that should feel substantial, not buried in a generic file list.',
    },
];

export default function OtherPage() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <Header />

            <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <header className="grid gap-8 border border-ed-rule bg-ed-surface/72 p-6 backdrop-blur-sm sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:p-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-ed-accent">
                            <LibraryBig className="h-6 w-6" />
                            <span className="text-[0.68rem] uppercase tracking-[0.28em]">
                                Written archive
                            </span>
                        </div>
                        <h1 className="max-w-[11ch] font-display text-5xl leading-[0.92] text-ed-fg sm:text-6xl lg:text-7xl">
                            The text archive, given its own room.
                        </h1>
                        <p className="max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted sm:text-base">
                            This route used to fall back to the homepage. It now has its own surface, with the same
                            dark and light editorial system as the rest of the site, so written material can develop
                            as a proper destination.
                        </p>
                    </div>

                    <div className="grid gap-px border border-ed-rule bg-ed-rule sm:grid-cols-3 lg:self-end">
                        <ShelfStat label="Primary mode" value="Reading" />
                        <ShelfStat label="Collections" value="4" />
                        <ShelfStat label="Palette" value="Parchment and olive" />
                    </div>
                </header>

                <section className="mt-14 grid gap-6 lg:grid-cols-2">
                    {shelves.map((shelf, index) => (
                        <article key={shelf.title} className="border border-ed-rule bg-ed-surface/68 p-6 sm:p-8">
                            <div className="flex items-center justify-between gap-4 border-b border-ed-rule pb-5">
                                <div className="flex items-center gap-3 text-ed-accent">
                                    {index % 2 === 0 ? (
                                        <BookOpenText className="h-5 w-5" />
                                    ) : (
                                        <ScrollText className="h-5 w-5" />
                                    )}
                                    <span className="text-[0.66rem] uppercase tracking-[0.24em]">
                                        Collection {index + 1}
                                    </span>
                                </div>
                                <FileStack className="h-4 w-4 text-ed-fg-muted" />
                            </div>
                            <h2 className="mt-6 font-display text-3xl text-ed-fg">{shelf.title}</h2>
                            <p className="mt-3 max-w-[40ch] text-sm leading-8 text-ed-fg-muted sm:text-[15px]">
                                {shelf.copy}
                            </p>
                            <Link
                                href="/search"
                                className="mt-6 inline-flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.22em] text-ed-accent transition hover:opacity-80"
                            >
                                Search this material
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </article>
                    ))}
                </section>
            </main>

            <Footer />
        </div>
    );
}

function ShelfStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-ed-surface px-5 py-5">
            <p className="font-display text-2xl text-ed-fg">{value}</p>
            <p className="mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-ed-fg-muted">{label}</p>
        </div>
    );
}
