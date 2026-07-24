import type { ReactNode } from 'react';

// A small gradient "squircle" icon badge, used in place of a flat bordered
// circle for every widget header icon on the homepage. This is the detail
// that reads as a live dashboard widget rather than a plain content card.
export function IconBadge({
    children,
    size = 'md',
}: {
    children: ReactNode;
    size?: 'sm' | 'md';
}) {
    const dimensions = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
    return (
        <span
            className={`relative inline-flex ${dimensions} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ed-accent/25 bg-gradient-to-b from-ed-accent/25 to-ed-accent/5 text-ed-accent shadow-inner`}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent dark:from-white/10"
            />
            <span className="relative">{children}</span>
        </span>
    );
}

// A hairline gloss along the top inside edge of a widget card — the detail
// that makes a flat dark panel read as a lit glass surface instead of a
// plain rectangle.
export function GlassSheen() {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/25"
        />
    );
}

// Shared outer classes for the homepage's five preview widgets (hero
// carousel, video/audio players, book shelf, Qur'an panel), so they all sit
// on the same lifted, accent-lit glass surface rather than a flat gray card.
export const widgetCardClass =
    'lift-card relative overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/90 shadow-2xl shadow-ed-accent/10 backdrop-blur-xl';

// Shared chip/pill states so every segmented control (source filters, view
// tabs, verse pickers) reads as one family: an accent glow when active
// instead of a stark black-fill invert.
export const activeChipClass =
    'border-ed-accent/50 bg-ed-accent/15 text-ed-accent shadow-sm shadow-ed-accent/30 font-bold';
export const inactiveChipClass =
    'border-ed-rule bg-ed-surface/50 text-ed-fg-muted hover:border-ed-accent/40 hover:text-ed-fg';

// Squircle chrome-button class for header controls (prev/next/pause), swapped
// in for the previous plain circular button so hover states pick up the
// accent glow instead of a generic border darken.
export const chromeButtonClass =
    'inline-flex min-h-8 min-w-8 items-center justify-center rounded-xl border border-ed-rule bg-ed-surface/70 text-ed-fg-muted transition-all duration-200 hover:scale-105 hover:border-ed-accent/50 hover:bg-ed-accent/10 hover:text-ed-accent active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ed-bg';

// Same family, sized up to a full 44px touch target for standalone primary
// nav controls (a page/reader "Back" button) rather than the tighter 32px
// carousel chrome above.
export const chromeButtonClassLg =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-ed-rule bg-ed-surface/70 px-2.5 text-ed-fg-muted transition-all duration-200 hover:scale-105 hover:border-ed-accent/50 hover:bg-ed-accent/10 hover:text-ed-accent active:scale-95 shadow-sm disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ed-bg';

// Borderless icon-button variant sized for touch, meant to live *inside* an
// already-bordered dock/toolbar group rather than carry its own border.
export const toolbarButtonClass =
    'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ed-fg-muted transition-all duration-200 hover:bg-ed-accent/10 hover:text-ed-accent active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ed-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ed-bg';

// Small accent pill for a live numeric readout (page count, zoom level)
// sitting inside a dock toolbar.
export const dockPillClass =
    'inline-flex min-w-[3.25rem] items-center justify-center rounded-full border border-ed-accent/30 bg-ed-accent/10 px-2 py-1 font-mono text-xs font-semibold tabular-nums text-ed-accent';
