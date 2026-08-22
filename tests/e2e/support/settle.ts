import type { Page } from '@playwright/test';

/**
 * Puts a page into the deterministic rendering the assertion suites need.
 *
 * Entrance reveals start at opacity 0 and fade in on a per-block delay, and the home
 * page's section carousels advance on timers. Both leave a moving target: axe blends
 * opacity into its contrast calculation, so an element caught mid-fade is reported as a
 * serious contrast failure, and a screenshot taken mid-rotation captures whichever slide
 * happened to be up.
 *
 * Reduced motion is a state the app already supports (globals.css collapses `.reveal` to
 * its final values, and useAutoplayCarousel stops advancing), so this asserts a real
 * rendering rather than a frozen frame of an animation. It also widens contrast coverage:
 * axe skips fully transparent text, so reveals below the fold are only scanned once they
 * have settled opaque.
 *
 * Note this uses page.emulateMedia rather than the `reducedMotion` context option, which
 * does not reach the page in the Playwright version pinned here.
 */
export async function useReducedMotion(page: Page): Promise<void> {
    await page.emulateMedia({ reducedMotion: 'reduce' });
}

/** Waits for fonts and two frames, so assertions run against a painted page. */
export async function waitForPaint(page: Page): Promise<void> {
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
}

type StableLayoutOptions = {
    /** Consecutive identical readings required before the layout counts as settled. */
    requiredMatches?: number;
    intervalMs?: number;
    timeoutMs?: number;
};

/**
 * Waits until the document stops growing.
 *
 * A full-page screenshot is asserted against an exact pixel height, so a capture taken
 * while layout is still converging fails outright rather than diffing. The home page
 * settles from 9737px to 9816px over the first few hundred milliseconds as fonts swap in
 * and the section widgets lay out, and a slower run can capture an even earlier state.
 * Polling for a height that repeats is cheap and does not bake a fixed sleep into the run.
 */
export async function waitForStableLayout(
    page: Page,
    { requiredMatches = 4, intervalMs = 150, timeoutMs = 20_000 }: StableLayoutOptions = {},
): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let previous = -1;
    let matches = 0;

    while (Date.now() < deadline) {
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        matches = height === previous ? matches + 1 : 0;
        previous = height;

        if (matches >= requiredMatches) return;
        await page.waitForTimeout(intervalMs);
    }

    throw new Error(`Document height never settled within ${timeoutMs}ms; last reading was ${previous}px.`);
}
