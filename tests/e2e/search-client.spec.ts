import { expect, test } from '@playwright/test';

const RESULT_CARD = '#search-results [data-media-id]';

// The result list is windowed, so the number of nodes in the DOM is whatever fits
// the viewport plus overscan — never the number loaded. Assertions therefore go
// through the stats line and the Load More button rather than counting nodes.
const STATS = /(\d+) documents, (\d+) passages/;
const REMAINING = /Load More Results \((\d+) remaining\)/;

async function remainingCount(text: string | null): Promise<number> {
    return Number(text?.match(REMAINING)?.[1]);
}

test.describe('search client', () => {
    test('a deep-linked query renders results immediately', async ({ page }) => {
        await page.goto('/search?q=miracle');

        // Generous: the first search after a cold server parses the whole index.
        await expect(page.getByText(STATS)).toBeVisible({ timeout: 45_000 });
        await expect(page.locator(RESULT_CARD).first()).toBeVisible();

        const total = Number((await page.getByText(STATS).textContent())?.match(STATS)?.[1]);
        expect(total).toBeGreaterThan(10);

        // Windowed, so fewer nodes than loaded — but the first page is what drives it.
        const rendered = await page.locator(RESULT_CARD).count();
        expect(rendered).toBeGreaterThan(0);
        expect(rendered).toBeLessThanOrEqual(10);
    });

    test('load more appends the next page rather than replacing it', async ({ page }) => {
        await page.goto('/search?q=miracle');
        await expect(page.getByText(STATS)).toBeVisible({ timeout: 45_000 });

        const loadMore = page.getByRole('button', { name: REMAINING });
        const before = await remainingCount(await loadMore.textContent());
        const rankZeroId = await page
            .locator('#search-results [data-result-rank="0"]')
            .getAttribute('data-media-id');

        await loadMore.click();

        // One more page is loaded, so the outstanding count drops by the page size.
        await expect
            .poll(async () => remainingCount(await loadMore.textContent()))
            .toBe(before - 10);

        // A rank from the second page becomes reachable as the window advances.
        // Scrolling the window rather than an element handle, because a virtual row
        // can be recycled out of the DOM while a handle to it is still being resolved.
        await expect
            .poll(async () => {
                await page.evaluate(() => window.scrollBy(0, window.innerHeight));
                return page.locator('#search-results [data-result-rank="12"]').count();
            }, { timeout: 15_000 })
            .toBeGreaterThan(0);

        // Appended, not replaced: back at the top, rank 0 is the same document.
        // Checked after scrolling back because the window unmounts rank 0 on the way down.
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect
            .poll(async () => page
                .locator('#search-results [data-result-rank="0"]')
                .getAttribute('data-media-id')
                .catch(() => null))
            .toBe(rankZeroId);
    });

    test('typing a multi-character query adds no history entries', async ({ page }) => {
        await page.goto('/search');
        const before = await page.evaluate(() => history.length);

        await page.locator('#archive-search-input').pressSequentially('miracle', { delay: 60 });
        await expect(page.locator(RESULT_CARD).first()).toBeVisible();

        expect(await page.evaluate(() => history.length)).toBe(before);
        await expect(page).toHaveURL(/\?q=miracle/);
    });

    test('clearing the query clears the q param', async ({ page }) => {
        await page.goto('/search?q=miracle');
        await expect(page.locator(RESULT_CARD).first()).toBeVisible();

        await page.getByRole('button', { name: 'Clear search query' }).click();

        await expect(page).toHaveURL(/\/search$/);
        await expect(page.locator(RESULT_CARD)).toHaveCount(0);
    });

    test('suggestions open on typing and Escape dismisses them', async ({ page }) => {
        await page.goto('/search');
        const suggestions = page.locator('#search-suggestions');

        await page.locator('#archive-search-input').pressSequentially('mir', { delay: 60 });
        await expect(suggestions).toBeVisible();
        await expect(suggestions.locator('li')).toHaveCount(8);

        await page.locator('#archive-search-input').press('Escape');
        await expect(suggestions).toBeHidden();
    });

    test('query operators are surfaced as chips and narrow the result set', async ({ page }) => {
        await page.goto('/search?q=miracle');
        await expect(page.locator(RESULT_CARD).first()).toBeVisible();
        const unfiltered = await page.getByText(/(\d+) documents/).textContent();

        await page.goto('/search?q=miracle+-number+type%3Aperspective');
        await expect(page.getByLabel('Active query operators')).toBeVisible();
        await expect(page.getByText('excluding number')).toBeVisible();
        await expect(page.getByText('type:perspective')).toBeVisible();

        const filtered = await page.getByText(/(\d+) documents/).textContent();
        expect(filtered).not.toBe(unfiltered);
    });

    test('the highlight and page params reach the PDF reader', async ({ page }) => {
        await page.goto('/library/computer-speaks?page=42&highlight=god');

        // Asserting on the reader's own state rather than on rendered <mark> nodes:
        // whether a highlight paints depends on the OCR text layer of that particular
        // scanned page, which is not a property of the deep-link wiring.
        const search = page.getByRole('searchbox', { name: 'Search text in document' });
        await expect(search).toHaveValue('god', { timeout: 45_000 });

        await expect(page.getByRole('button', { name: /^Page 42 of \d+/ })).toBeVisible();
    });
});

test.describe('citations', () => {
    test('the reader offers a copyable citation in several styles', async ({ page }) => {
        await page.goto('/library/computer-speaks?page=42');
        await page.getByRole('button', { name: 'Cite' }).click();

        const dialog = page.getByRole('dialog', { name: 'Copy a citation' });
        await expect(dialog).toBeVisible();
        // Defaults to the permalink, which must carry the page the reader is on.
        await expect(dialog).toContainText('page=42');

        await dialog.getByRole('button', { name: 'APA' }).click();
        await expect(dialog).toContainText('Submission Archives');
        await expect(dialog).toContainText('p. 42');

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
    });
});
