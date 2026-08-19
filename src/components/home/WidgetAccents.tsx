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
            className={`relative inline-flex ${dimensions} shrink-0 items-center justify-center overflow-hidden border border-[#2A2928] bg-gradient-to-b from-[#1C1B1A] via-[#161514] to-[#161514] text-[#F5F0EB] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset]`}
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
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#C8794A]/30 to-transparent"
        />
    );
}

// Shared outer classes for the homepage preview widgets, sitting on the warm dark obsidian surface
export const widgetCardClass =
    'relative overflow-hidden rounded-2xl border border-[#2A2928] bg-gradient-to-b from-[#161514]/95 via-[#161514]/90 to-[#0F0E0D]/90 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-2xl transition-all duration-300 hover:border-[#353433]';

// Shared chip/pill states for segmented controls
export const activeChipClass =
    'border-[#C8794A] bg-[#C8794A]/15 text-[#F5F0EB] shadow-sm font-semibold';
export const inactiveChipClass =
    'border-[#2A2928] bg-[#161514] text-[#9E9690] hover:border-[#353433] hover:text-[#F5F0EB] hover:bg-[#1C1B1A]';

// Squircle chrome-button class for header controls (prev/next/pause)
export const chromeButtonClass =
    'inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border border-[#2A2928] bg-[#161514] text-[#9E9690] transition-all duration-200 hover:scale-105 hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#F5F0EB] active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8794A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0E0D]';

export const chromeButtonClassLg =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-[#2A2928] bg-[#161514] px-2.5 text-[#9E9690] transition-all duration-200 hover:scale-105 hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#F5F0EB] active:scale-95 shadow-sm disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8794A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0E0D]';

export const toolbarButtonClass =
    'flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#9E9690] transition-all duration-200 hover:bg-[#161514] hover:text-[#F5F0EB] active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#9E9690] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8794A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0E0D]';

export const dockPillClass =
    'inline-flex min-w-[3.25rem] items-center justify-center rounded-full border border-[#2A2928] bg-[#161514] px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-[#F5F0EB] shadow-inner';

