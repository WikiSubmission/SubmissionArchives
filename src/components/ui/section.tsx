import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionProps {
    /** Renders a fading hairline divider above the section. */
    divider?: boolean;
    className?: string;
    children: ReactNode;
}

export function Section({ divider = false, className, children }: SectionProps) {
    return (
        <section className={cn('mt-16 md:mt-24 lg:mt-32', className)}>
            {divider ? <div className="divider-fade mb-16 md:mb-24 lg:mb-32" aria-hidden="true" /> : null}
            {children}
        </section>
    );
}
