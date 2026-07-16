import type { ReactNode } from 'react';

import { DeferredSearchFunctionDemo } from './DeferredSearchFunctionDemo';
import { ExpectationCard } from './ExpectationCard';
import { SectionCta } from './SectionCta';

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

function BranchHeading({ numeral, title }: { numeral: string; title: string }) {
    return (
        <header className="grid grid-cols-[auto_1fr] items-end gap-5 border-b border-ed-rule pb-5">
            <span className="font-display text-6xl leading-[0.8] text-ed-accent sm:text-7xl" aria-hidden="true">
                {numeral}
            </span>
            <h3 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.035em] text-ed-fg">
                {title}
            </h3>
        </header>
    );
}

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
                className={`archive-section grid gap-10 border-b border-ed-rule pb-16 lg:items-center lg:gap-16 lg:pb-24 ${
                    reverse ? 'lg:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-[0.85fr_1.15fr]'
                }`}
            >
                <div className={`min-w-0 ${reverse ? 'lg:order-2' : ''}`}>
                    <p className="archive-kicker mb-6">{kicker}</p>
                    <BranchHeading numeral={numeral} title={title} />
                    <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                        {body}
                    </p>

                    <div className="mt-8 grid gap-x-6 sm:grid-cols-2">
                        {details.map((item, itemIndex) => (
                            <ExpectationCard
                                key={item.title}
                                index={String(itemIndex + 1).padStart(2, '0')}
                                title={item.title}
                                body={item.body}
                            />
                        ))}
                    </div>

                    <SectionCta href={href} label={cta} />
                </div>

                <div className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`}>{visual}</div>
            </article>
        );
    }

    return (
        <article className="archive-section border-b border-ed-rule pb-16 lg:pb-24">
            <div className="max-w-3xl">
                <p className="archive-kicker mb-6">{kicker}</p>
                <BranchHeading numeral={numeral} title={title} />
                <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                    {body}
                </p>
            </div>

            <div className="mt-8 grid gap-x-8 border-y border-ed-rule sm:grid-cols-3">
                {details.map((item, itemIndex) => (
                    <ExpectationCard
                        key={item.title}
                        index={String(itemIndex + 1).padStart(2, '0')}
                        title={item.title}
                        body={item.body}
                    />
                ))}
            </div>

            <SectionCta href={href} label={cta} />

            {showSearchDemo ? (
                <div className="mt-10 lg:mt-14">
                    <DeferredSearchFunctionDemo />
                </div>
            ) : null}
        </article>
    );
}
