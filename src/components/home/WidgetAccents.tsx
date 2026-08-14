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
    const dimensions = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-xl';
    return (
        <span
            className={`relative inline-flex ${dimensions} shrink-0 items-center justify-center overflow-hidden border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface via-ed-surface/90 to-ed-surface/70 text-ed-fg shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.08)_inset]`}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent dark:from-white/10"
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
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/20"
        />
    );
}

// Shared outer classes for the homepage's five preview widgets (hero
// carousel, video/audio players, book shelf, Qur'an panel), so they all sit
// on the same lifted, accent-lit glass surface rather than a flat gray card.
export const widgetCardClass =
    'relative overflow-hidden rounded-3xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/95 via-ed-surface/85 to-ed-surface/65 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-2xl transition-all duration-300';

// Shared chip/pill states so every segmented control (source filters, view
// tabs, verse pickers) reads as one family: an accent glow when active
// instead of a stark black-fill invert.
export const activeChipClass =
    'border-ed-fg bg-ed-fg text-ed-bg shadow-sm font-semibold';
export const inactiveChipClass =
    'border-ed-rule-strong/80 bg-ed-surface/80 text-ed-fg-muted hover:border-ed-fg hover:text-ed-fg hover:bg-ed-surface';

// Squircle chrome-button class for header controls (prev/next/pause), swapped
// in for the previous plain circular button so hover states pick up the
// accent glow instead of a generic border darken.
export const chromeButtonClass =
    'inline-flex min-h-8 min-w-8 items-center justify-center rounded-xl border border-ed-rule-strong/80 bg-ed-surface/80 text-ed-fg-muted transition-all duration-200 hover:scale-105 hover:border-ed-fg hover:bg-ed-surface hover:text-ed-fg active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ed-bg';

// Same family, sized up to a full 44px touch target for standalone primary
// nav controls (a page/reader "Back" button) rather than the tighter 32px
// carousel chrome above.
export const chromeButtonClassLg =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-ed-rule-strong/80 bg-ed-surface/80 px-2.5 text-ed-fg-muted transition-all duration-200 hover:scale-105 hover:border-ed-fg hover:bg-ed-surface hover:text-ed-fg active:scale-95 shadow-sm disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ed-bg';

// Borderless icon-button variant sized for touch, meant to live *inside* an
// already-bordered dock/toolbar group rather than carry its own border.
export const toolbarButtonClass =
    'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ed-fg-muted transition-all duration-200 hover:bg-ed-surface hover:text-ed-fg active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ed-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ed-bg';

// Small accent pill for a live numeric readout (page count, zoom level)
// sitting inside a dock toolbar.
export const dockPillClass =
    'inline-flex min-w-[3.25rem] items-center justify-center rounded-full border border-ed-rule-strong bg-ed-surface px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-ed-fg shadow-inner';
