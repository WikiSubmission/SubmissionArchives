'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ExpectationCard } from './ExpectationCard';
import { SectionCta } from './SectionCta';

const SearchFunctionDemo = dynamic(() => import('./SearchFunctionDemo'), {
    ssr: false,
    loading: () => <div className="h-[560px] sm:h-[620px] animate-pulse rounded-[1.25rem] bg-ed-surface" />
});

export function ArchiveBranch({
    numeral,
    title,
    body,
    href,
    cta,
    cardTitle,
    details,
    icon: Icon,
    align,
    kind,
}: {
    numeral: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    cardTitle: string;
    details: Array<{ title: string; body: string }>;
    icon: React.ComponentType<{ className?: string }>;
    align: 'left' | 'right' | 'center';
    kind?: 'search';
}) {
    const isRight = align === 'right';
    const isCenter = align === 'center';

    return (
        <article
            className={`soft-shell grid w-full max-w-[calc(100vw-2rem)] min-w-0 overflow-hidden gap-8 p-5 sm:max-w-none sm:p-7 lg:p-8 ${
                isCenter ? 'mx-auto sm:max-w-6xl lg:grid-cols-[1fr]' : 'lg:grid-cols-[0.95fr_1.05fr]'
            }`}
        >
            <div className={`${isRight ? 'lg:order-2' : ''} ${isCenter ? 'mx-auto w-full max-w-[calc(100vw-4.5rem)] text-center sm:max-w-4xl' : ''} min-w-0 space-y-6`}>
                <div className={`flex flex-col gap-5 border-b border-ed-rule pb-5 sm:flex-row sm:items-end ${isCenter ? 'justify-center' : ''}`}>
                    <div className={`flex items-end ${isCenter ? 'justify-center' : ''}`}>
                        <span className="font-serif text-6xl leading-none text-ed-accent sm:text-7xl">
                            {numeral}
                        </span>
                    </div>
                    <h3 className="max-w-full break-words font-serif text-[clamp(1.85rem,8.5vw,3rem)] leading-[0.98] text-ed-fg sm:text-5xl lg:whitespace-nowrap overflow-hidden">
                        {title}
                    </h3>
                </div>

                <div className="space-y-4">
                    <p className={`${isCenter ? 'mx-auto lg:max-w-none' : ''} max-w-[68ch] text-[15px] leading-8 text-ed-fg-muted`}>
                        {body}
                    </p>
                </div>

                <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                    {details.map((item) => (
                        <ExpectationCard key={item.title} title={item.title} body={item.body} />
                    ))}
                </div>

                <SectionCta href={href} label={cta} />
            </div>

            <div className={`${isRight ? 'lg:order-1' : ''} ${isCenter ? 'mx-auto w-full max-w-[calc(100vw-4.5rem)] sm:max-w-5xl' : ''}`}>
                {kind === 'search' ? (
                    <SearchFunctionDemo />
                ) : (
                    <div className="relative rounded-[1.25rem] p-[1px] overflow-hidden shadow-[0_0_30px_0_color-mix(in_srgb,var(--ed-accent)_6%,transparent)]">
                        {/* Rotating glow for the slideshow frame */}
                        <div className="absolute inset-[-100%] z-0 hidden animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,color-mix(in_srgb,var(--ed-accent)_40%,transparent)_15%,transparent_20%)] sm:block" />
                        
                        <div className="relative z-10 flex flex-col h-full min-h-[320px] overflow-hidden rounded-[1.25rem] bg-ed-bg/95 p-3 sm:min-h-[360px] sm:p-4">
                            <div className="archive-soft-orb absolute inset-0" />
                            <div className="relative flex h-full flex-col justify-between">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="inline-flex h-12 w-12 items-center justify-center border border-ed-rule bg-ed-surface text-ed-accent">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className="max-w-[18ch] text-right text-[0.58rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                        Archival Record
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="h-px w-24 bg-ed-rule" />
                                    <h4 className="whitespace-pre-line font-serif text-3xl leading-tight text-ed-fg sm:text-4xl">
                                        {cardTitle}
                                    </h4>
                                    <p className="max-w-[34ch] text-sm leading-7 text-ed-fg-muted">
                                        Watch, Listen, and Search a variety of materials.
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
                )}
            </div>
        </article>
    );
}
