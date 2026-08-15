import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface TypographyProps<T extends ElementType> {
    as?: T;
    className?: string;
    children: ReactNode;
}

type PolymorphicProps<T extends ElementType> = TypographyProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof TypographyProps<T>>;

function makeTier<DefaultTag extends ElementType>(defaultTag: DefaultTag, tierClassName: string) {
    return function Tier<T extends ElementType = DefaultTag>({
        as,
        className,
        children,
        ...rest
    }: PolymorphicProps<T>) {
        const Tag = (as ?? defaultTag) as ElementType;
        return (
            <Tag className={cn(tierClassName, className)} {...rest}>
                {children}
            </Tag>
        );
    };
}

/** Hero title only. 96px desktop / 48px mobile, serif. */
export const Display = makeTier('h1', 'font-serif text-display font-bold text-ed-fg');

/** Section titles. 48px desktop / 32px mobile, serif. */
export const Headline = makeTier('h2', 'font-serif text-headline font-bold text-ed-fg');

/** Card titles. 24px desktop / 20px mobile, sans. */
export const Title = makeTier('h3', 'font-sans text-title font-bold text-ed-fg');

/** Reading text. 17px desktop / 16px mobile, sans. */
export const Body = makeTier('p', 'font-sans text-body text-ed-fg');

/** Uppercase metadata. 12px desktop / 11px mobile, sans. */
export const Label = makeTier('span', 'font-sans text-label font-semibold uppercase text-ed-fg-muted');

/** Footnotes. 11px, sans. */
export const Caption = makeTier('span', 'font-sans text-caption text-ed-fg-muted');
