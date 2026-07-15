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
        <section aria-labelledby="appendices-grid" className="mt-16">
            <div className="mb-8 flex flex-col gap-3 border-b border-ed-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="archive-kicker text-ed-fg-muted">The Appendices</p>
                    <h2 id="appendices-grid" className="mt-3 font-display text-3xl text-ed-fg sm:text-4xl">All Reference Materials</h2>
                </div>
                <div className="flex bg-ed-surface border border-ed-rule rounded-md overflow-hidden text-sm">
                    {editions.map((year) => (
                        <button
                            key={year}
                            type="button"
                            onClick={() => setEdition(year)}
                            aria-pressed={edition === year}
                            className={`px-4 py-2 transition-colors ${edition === year ? 'bg-ed-accent text-white' : 'text-ed-fg hover:bg-ed-bg'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {appendices.filter((appendix) => appendix.editions[edition]).map((appendix) => {
                    const asset = appendix.editions[edition]!;
                    const url = `/library/${appendix.id}?edition=${edition}`;
                    const thumbnail = asset.thumbnail;

                    return (
                        <Link key={appendix.id} href={url} className="group flex flex-col gap-3">
                            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-ed-rule bg-ed-surface transition-colors group-hover:border-ed-accent">
                                {thumbnail ? (
                                    <Image
                                        src={thumbnail}
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
                                {edition !== '1992' && (
                                    <div className="absolute top-2 right-2 bg-ed-accent text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                        {edition}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-serif text-sm font-medium text-ed-fg group-hover:text-ed-accent line-clamp-2">
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
