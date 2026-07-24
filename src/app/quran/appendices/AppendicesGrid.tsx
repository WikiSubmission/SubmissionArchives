'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AppendixEdition, AppendixItem } from '@/lib/appendixCatalog';

type Props = {
    appendices: AppendixItem[];
};

export default function AppendicesGrid({ appendices }: Props) {
    const [edition, setEdition] = useState<AppendixEdition>('1992');
    const editions: AppendixEdition[] = ['1981', '1989', '1992'];

    return (
        <section aria-labelledby="appendices-grid" className="mt-20">
            <div className="mb-10 flex flex-col gap-6 border-b border-ed-rule pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                    <p className="font-mono text-xs tracking-[0.2em] text-ed-accent uppercase">
                        The Appendices
                    </p>
                    <h2 id="appendices-grid" className="font-serif text-[clamp(2rem,4vw,3rem)] leading-none text-ed-fg">
                        Reference Materials
                    </h2>
                </div>
                
                {/* Tactile Toggle System */}
                <div className="inline-flex rounded-lg border border-ed-rule bg-ed-surface p-1 shadow-inner">
                    {editions.map((year) => (
                        <button
                            key={year}
                            type="button"
                            onClick={() => setEdition(year)}
                            aria-pressed={edition === year}
                            className={`rounded-md px-5 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                edition === year 
                                    ? 'bg-ed-bg text-ed-accent shadow-sm border border-ed-rule' 
                                    : 'text-ed-fg-muted hover:text-ed-fg'
                            }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {appendices.filter((appendix) => appendix.editions[edition]).map((appendix) => {
                    const asset = appendix.editions[edition]!;
                    const url = `/library/${appendix.id}?edition=${edition}`;
                    const thumbnail = asset.thumbnail;

                    return (
                        <Link key={appendix.id} href={url} className="group flex flex-col gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-4 rounded-lg">
                            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-ed-rule bg-ed-surface shadow-lg transition-all duration-500 group-hover:-translate-y-2 group-hover:border-ed-accent/40 group-hover:shadow-xl">
                                {thumbnail ? (
                                    <Image
                                        src={thumbnail}
                                        alt={`Cover of ${appendix.title}`}
                                        fill
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-ed-surface">
                                        <span className="font-serif text-sm text-ed-fg-muted italic">No Cover</span>
                                    </div>
                                )}
                                
                                {edition !== '1992' && (
                                    <div className="absolute top-3 right-3 rounded-full border border-ed-accent/20 bg-ed-bg/90 px-2.5 py-1 backdrop-blur-md">
                                        <span className="font-mono text-[10px] font-bold tracking-widest text-ed-accent uppercase">
                                            {edition}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="px-1">
                                <h3 className="font-serif text-sm font-medium leading-relaxed text-ed-fg transition-colors duration-300 group-hover:text-ed-accent line-clamp-2">
                                    {appendix.title}
                                </h3>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
