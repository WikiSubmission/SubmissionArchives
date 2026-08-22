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

// Squircle chrome-button class for header controls (prev/next/pause)
export const chromeButtonClass =
    'inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border border-ed-rule bg-ed-surface text-ed-fg-muted transition-all duration-200 hover:scale-105 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent';

