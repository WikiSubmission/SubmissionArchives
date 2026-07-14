import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { getAppendixCatalog } from '@/lib/appendixCatalog';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Appendices',
    description: 'Reference material and structured explanatory works from the translated editions.',
};

export default function AppendicesPage() {
    const appendices = getAppendixCatalog();

    return (
        <div className="min-h-screen bg-ed-bg font-body text-ed-fg">
            <main id="main-content" className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <header className="grid gap-10 border-y border-ed-rule py-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                    <div className="space-y-6">
                        <Link href="/quran" className="inline-flex items-center gap-2 text-sm text-ed-fg-muted hover:text-ed-accent transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Qur&apos;an
                        </Link>
                        <h1 className="max-w-[12ch] font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] text-ed-fg">
                            Appendices
                        </h1>
                    </div>
                    <div className="space-y-5 lg:pb-1">
                        <p className="max-w-[58ch] text-base leading-8 text-ed-fg-muted sm:text-lg">
                            Compare and read the explanatory appendices detailing the miraculous mathematical structure and divine preservation of the Qur&apos;an.
                        </p>
                    </div>
                </header>

                <section aria-labelledby="appendices-grid" className="mt-16">
                    <div className="mb-8 flex flex-col gap-3 border-b border-ed-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="archive-kicker text-ed-fg-muted">The Appendices</p>
                            <h2 id="appendices-grid" className="mt-3 font-display text-3xl text-ed-fg sm:text-4xl">All Reference Materials</h2>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {appendices.map((appendix) => (
                            <Link key={appendix.id} href={`/library/${appendix.id}`} className="group flex flex-col gap-3">
                                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-ed-rule bg-ed-surface transition-colors group-hover:border-ed-accent">
                                    {appendix.thumbnailOverride ? (
                                        <Image
                                            src={appendix.thumbnailOverride}
                                            alt={`Cover of ${appendix.title}`}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-ed-surface text-ed-fg-muted">
                                            <span className="font-serif text-sm">No Cover</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-serif text-sm font-medium text-ed-fg group-hover:text-ed-accent line-clamp-2">
                                        {appendix.title}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
