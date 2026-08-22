import { expect, test, type Page } from '@playwright/test';

import { useReducedMotion, waitForPaint, waitForStableLayout } from './support/settle';

// Visual regression, opt-in via VISUAL=1.
//
// Screenshot baselines are platform-specific: font rasterisation differs between Windows,
// macOS and the Linux runner CI uses, so baselines generated on a developer machine fail
// everywhere else. Committing mine would hand you a permanently red pipeline.
//
// Baselines are therefore produced on Linux by the `visual-baselines` workflow, which is
// manual (workflow_dispatch) on purpose: regenerating them automatically on every push
// would let a real layout break approve itself. Run it after an intentional UI change.
//
// Locally, against a Linux container matching that workflow:
//
//   VISUAL=1 npx playwright test tests/e2e/visual.spec.ts --update-snapshots
//
// Snapshots are stored per platform (see snapshotPathTemplate in playwright.config.ts),
// so several can coexist.
const VISUAL_ENABLED = process.env.VISUAL === '1';

type VisualRoute = {
    path: string;
    name: string;
    /**
     * Full-page capture is only safe where the whole document is laid out up front.
     * A windowed list has neither the content nor the height for it.
     */
    fullPage: boolean;
    /** Content that has to be on screen before the page counts as painted. */
    settle: (page: Page) => Promise<void>;
};

const routes: VisualRoute[] = [
    {
        path: '/',
        name: 'home',
        fullPage: true,
        settle: async (page) => {
            await expect(page.locator('#hero-title')).toBeVisible();
        },
    },
    {
        path: '/search?q=miracle',
        name: 'search-results',
        // The result list is window-virtualised: rows below the fold are not in the
        // document at all, and the list's height comes from measuring the rows that
        // are, so a full-page capture has neither stable content nor a stable height.
        // That is what produced a 1569px baseline against a 6131px capture. The
        // viewport holds the header, the query, the stats line and the first cards,
        // which is the part worth asserting.
        fullPage: false,
        settle: async (page) => {
            // Generous: the first search after a cold server parses the whole index.
            await expect(page.getByText(/\d+ documents, \d+ passages/)).toBeVisible({ timeout: 45_000 });
            await expect(page.locator('#search-results [data-media-id]').first()).toBeVisible();
        },
    },
    {
        path: '/quran/1',
        name: 'quran-chapter',
        fullPage: true,
        settle: async (page) => {
            await expect(page.getByRole('heading', { level: 1, name: '1. The Key' })).toBeVisible();
        },
    },
];

test.describe('visual regression', () => {
    test.skip(!VISUAL_ENABLED, 'Set VISUAL=1 once platform baselines are committed.');

    for (const route of routes) {
        test(`${route.name} matches its baseline`, async ({ page }) => {
            // Entrance reveals start at opacity 0 and the section carousels advance on a
            // timer, so with motion on the capture races both.
            await useReducedMotion(page);
            await page.goto(route.path);
            await route.settle(page);

            // Same settle as the accessibility suite: assert on a painted page, not a
            // half-painted one, or the diff is just timing noise.
            await waitForPaint(page);
            await waitForStableLayout(page);

            await expect(page).toHaveScreenshot(`${route.name}.png`, {
                fullPage: route.fullPage,
                // Scanned thumbnails and the PDF canvas decode slightly differently run to
                // run; this absorbs that without hiding a real layout break.
                maxDiffPixelRatio: 0.05,
                animations: 'disabled',
            });
        });
    }
});
