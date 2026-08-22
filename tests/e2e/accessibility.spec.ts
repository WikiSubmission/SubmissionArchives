import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
    '/',
    '/search',
    '/quran/1',
    '/media/video-program/what-is-life-all-about',
    '/library/salat-booklet',
];

for (const route of routes) {
    test(`${route} has no automatically detectable serious accessibility violations`, async ({ page }) => {
        await page.goto(route);

        // axe computes contrast from resolved colours, so it has to run after the page
        // has visually settled. Scanning too early reports near-white text as failing
        // because the dark surface behind it has not painted yet — which showed up as
        // an order-dependent flake on /quran/1 rather than a real defect.
        // Not networkidle: media pages hold connections open, so it never settles.
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
        const blocking = results.violations.filter((violation) =>
            violation.impact === 'critical' || violation.impact === 'serious',
        );

        const summary = blocking.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            targets: violation.nodes.flatMap((node) => node.target),
        }));

        expect(summary).toEqual([]);
    });
}
