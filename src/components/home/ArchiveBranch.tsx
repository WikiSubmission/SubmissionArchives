import type { ComponentType } from 'react';

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
    icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
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
    icon: Icon,
    showSearchDemo = false,
}: ArchiveBranchProps) {
    return (
        <article className="archive-section border-b border-ed-rule pb-16 lg:pb-24">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-16">
                <div>
                    <div className="flex items-end gap-5 border-b border-ed-rule pb-5">
                        <span className="font-display text-6xl leading-[0.8] text-ed-accent sm:text-7xl" aria-hidden="true">
                            {numeral}
                        </span>
                        <span className="mb-1 inline-flex h-11 w-11 items-center justify-center border border-ed-rule bg-ed-surface text-ed-accent">
                            <Icon className="h-4 w-4" aria-hidden={true} />
                        </span>
                    </div>
                    <p className="mt-6 max-w-[54ch] text-[15px] leading-8 text-ed-fg-muted">
                        {body}
                    </p>
                    <SectionCta href={href} label={cta} />
                </div>

                <div>
                    <p className="archive-kicker">{kicker}</p>
                    <h3 className="mt-4 max-w-[13ch] font-display text-[clamp(2.8rem,7vw,5.7rem)] font-medium leading-[0.88] tracking-[-0.045em] text-ed-fg">
                        {title}
                    </h3>
                </div>
            </div>

            <div className="mt-10 grid gap-x-8 border-y border-ed-rule sm:grid-cols-3 lg:mt-14">
                {details.map((item, itemIndex) => (
                    <ExpectationCard
                        key={item.title}
                        index={String(itemIndex + 1).padStart(2, '0')}
                        title={item.title}
                        body={item.body}
                    />
                ))}
            </div>

            {showSearchDemo ? (
                <div className="mt-10 lg:mt-14">
                    <DeferredSearchFunctionDemo />
                </div>
            ) : null}
        </article>
    );
}
