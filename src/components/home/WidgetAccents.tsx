import type { ReactNode } from 'react';

// A small gradient "squircle" icon badge, used in place of a flat bordered
// circle for every widget header icon on the homepage.
export function IconBadge({
    children,
    size = 'md',
}: {
    children: ReactNode;
    size?: 'sm' | 'md';
}) {
    const dimensions = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-xl';
    return (
        <span
            className={`relative inline-flex ${dimensions} shrink-0 items-center justify-center overflow-hidden border border-ed-rule bg-gradient-to-b from-ed-surface-strong via-ed-surface to-ed-surface text-ed-fg shadow-sm`}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"
            />
            <span className="relative">{children}</span>
        </span>
    );
}

// A hairline gloss along the top inside edge of a widget card
export function GlassSheen() {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-ed-accent/30 to-transparent"
        />
    );
}

// Shared outer classes for the homepage preview widgets, sitting on the warm surface
export const widgetCardClass =
    'relative overflow-hidden rounded-2xl border border-ed-rule bg-gradient-to-b from-ed-surface/95 via-ed-surface/90 to-ed-bg/90 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)_inset] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-2xl transition-all duration-300 hover:border-ed-rule-strong';

// Shared chip/pill states for segmented controls
export const activeChipClass =
    'border-ed-accent bg-ed-accent-soft text-ed-accent dark:text-ed-fg shadow-sm font-semibold';
export const inactiveChipClass =
    'border-ed-rule bg-ed-surface text-ed-fg-muted hover:border-ed-rule-strong hover:text-ed-fg hover:bg-ed-surface-strong';

// Squircle chrome-button class for header controls (prev/next/pause)
export const chromeButtonClass =
    'inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border border-ed-rule bg-ed-surface text-ed-fg-muted transition-all duration-200 hover:scale-105 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent';

export const chromeButtonClassLg =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-ed-rule bg-ed-surface px-2.5 text-ed-fg-muted transition-all duration-200 hover:scale-105 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:scale-95 shadow-sm disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent';

export const toolbarButtonClass =
    'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ed-fg-muted transition-all duration-200 hover:bg-ed-surface hover:text-ed-fg active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ed-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent';

export const dockPillClass =
    'inline-flex min-w-[3.25rem] items-center justify-center rounded-full border border-ed-rule bg-ed-surface px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-ed-fg shadow-inner';

