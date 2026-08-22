import { expect, test } from '@playwright/test';

// Visual regression, opt-in via VISUAL=1.
//
// Screenshot baselines are platform-specific: font rasterisation differs between Windows,
// macOS and the Linux runner CI uses, so baselines generated on a developer machine fail
// everywhere else. Committing mine would hand you a permanently red pipeline.
//
// To adopt these, generate the baselines on the platform that will assert them — i.e. in
// CI, on Linux — and commit what it produces:
//
//   VISUAL=1 npx playwright test tests/e2e/visual.spec.ts --update-snapshots
//
// then flip this suite on by setting VISUAL=1 for the CI job. Snapshots are stored per
// platform (see snapshotPathTemplate in playwright.config.ts), so several can coexist.
const VISUAL_ENABLED = process.env.VISUAL === '1';

test.describe('visual regression', () => {
    test.skip(!VISUAL_ENABLED, 'Set VISUAL=1 once platform baselines are committed.');

    const routes = [
        { path: '/', name: 'home' },
        { path: '/search?q=miracle', name: 'search-results' },
        { path: '/quran/1', name: 'quran-chapter' },
    ];

    for (const route of routes) {
        test(`${route.name} matches its baseline`, async ({ page }) => {
            await page.goto(route.path);

            // Same settle as the accessibility suite: assert on a painted page, not a
            // half-painted one, or the diff is just timing noise.
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(
                () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
            );

            await expect(page).toHaveScreenshot(`${route.name}.png`, {
                fullPage: true,
                // Scanned thumbnails and the PDF canvas decode slightly differently run to
                // run; this absorbs that without hiding a real layout break.
                maxDiffPixelRatio: 0.05,
                animations: 'disabled',
            });
        });
    }
});
