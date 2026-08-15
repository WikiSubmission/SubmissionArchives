import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const VARIANTS = {
    /** Prose measure for body copy. */
    reading: 'max-w-[68ch]',
    /** Standard page width. */
    page: 'max-w-[1200px] px-6 md:px-10 lg:px-16',
    /** Wide layouts (hero grids, media galleries). */
    wide: 'max-w-[1440px] px-6 md:px-10 lg:px-16',
} as const;

export type ContainerVariant = keyof typeof VARIANTS;

interface ContainerProps {
    variant?: ContainerVariant;
    className?: string;
    children: ReactNode;
}

export function Container({ variant = 'page', className, children }: ContainerProps) {
    return <div className={cn('mx-auto', VARIANTS[variant], className)}>{children}</div>;
}
