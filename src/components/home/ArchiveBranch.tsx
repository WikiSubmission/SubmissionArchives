import type { ReactNode } from 'react';

import { ExpectationCard } from './ExpectationCard';
import { Reveal } from './Reveal';
import { DeferredSearchFunctionDemo } from './DeferredSearchFunctionDemo';
import { SectionCta } from './SectionCta';
import { SectionHeading } from './SectionHeading';

type ArchiveBranchProps = {
    numeral: string;
    kicker?: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    details: ReadonlyArray<{ title: string; body: string }>;
    visual?: ReactNode;
    reverse?: boolean;
    showSearchDemo?: boolean;
};

export function ArchiveBranch({
    numeral,
    title,
    body,
    href,
    cta,
    details,
    visual,
    reverse = false,
    showSearchDemo = false,
}: ArchiveBranchProps) {
    if (visual) {
        return (
            <article className="archive-section grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                <div className={`min-w-0 ${reverse ? 'lg:order-2' : ''}`}>
                    <Reveal delay={70}>
                        <SectionHeading numeral={numeral} title={title} />
                    </Reveal>
                    <Reveal delay={140} className="mt-4 sm:mt-5 lg:mt-6">
                        <p className="max-w-[62ch] text-base leading-[1.65] tracking-[-0.01em] text-ed-fg-muted sm:text-lg">
                            {body}
                        </p>
                    </Reveal>

                    <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6">
                        {details.map((item, itemIndex) => (
                            <Reveal key={item.title} delay={200 + itemIndex * 80}>
                                <ExpectationCard
                                    index={String(itemIndex + 1).padStart(2, '0')}
                                    title={item.title}
                                    body={item.body}
                                />
                            </Reveal>
                        ))}
                    </div>

                    <Reveal delay={200 + details.length * 80} className="mt-8 sm:mt-10">
                        <SectionCta href={href} label={cta} />
                    </Reveal>
                </div>

                <Reveal delay={160} className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`}>
                    {visual}
                </Reveal>
            </article>
        );
    }

    return (
        <article className="archive-section">
            <div className="max-w-3xl">
                <Reveal delay={70}>
                    <SectionHeading numeral={numeral} title={title} />
                </Reveal>
                <Reveal delay={140} className="mt-4 sm:mt-5 lg:mt-6">
                    <p className="max-w-[62ch] text-base leading-[1.65] tracking-[-0.01em] text-ed-fg-muted sm:text-lg">
                        {body}
                    </p>
                </Reveal>
            </div>

            {showSearchDemo ? (
                <div className="mt-12">
                    <DeferredSearchFunctionDemo />
                </div>
            ) : null}
        </article>
    );
}
