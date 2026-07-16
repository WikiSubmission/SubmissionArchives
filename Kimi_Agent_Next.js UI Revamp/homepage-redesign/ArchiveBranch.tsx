import type { ReactNode } from 'react';

import { DeferredSearchFunctionDemo } from './DeferredSearchFunctionDemo';
import { ExpectationCard } from './ExpectationCard';
import { Reveal } from './Reveal';
import { SectionCta } from './SectionCta';
import { SectionHeading } from './SectionHeading';

type ArchiveBranchProps = {
    numeral: string;
    kicker: string;
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
    kicker,
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
            <article
                className={`archive-section grid gap-10 lg:items-center lg:gap-16 ${
                    reverse ? 'lg:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-[0.85fr_1.15fr]'
                }`}
            >
                <div className={`min-w-0 ${reverse ? 'lg:order-2' : ''}`}>
                    <Reveal>
                        <p className="archive-kicker mb-6">{kicker}</p>
                    </Reveal>
                    <Reveal delay={70}>
                        <SectionHeading numeral={numeral} title={title} />
                    </Reveal>
                    <Reveal delay={140}>
                        <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                            {body}
                        </p>
                    </Reveal>

                    <div className="mt-8 grid gap-x-6 sm:grid-cols-2">
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

                    <Reveal delay={200 + details.length * 80}>
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
                <Reveal>
                    <p className="archive-kicker mb-6">{kicker}</p>
                </Reveal>
                <Reveal delay={70}>
                    <SectionHeading numeral={numeral} title={title} />
                </Reveal>
                <Reveal delay={140}>
                    <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                        {body}
                    </p>
                </Reveal>
            </div>

            <div className="mt-8 grid gap-x-8 divide-y divide-ed-rule border-y border-ed-rule sm:grid-cols-3">
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

            <Reveal delay={200 + details.length * 80}>
                <SectionCta href={href} label={cta} />
            </Reveal>

            {showSearchDemo ? (
                <Reveal delay={120} className="mt-10 lg:mt-14">
                    <DeferredSearchFunctionDemo />
                </Reveal>
            ) : null}
        </article>
    );
}
