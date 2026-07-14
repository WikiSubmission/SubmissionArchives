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
