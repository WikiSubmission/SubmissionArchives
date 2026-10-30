import { expect, test } from '@playwright/test';

const RESULT_CARD = '#search-results [data-media-id]';

// Counts are locale-formatted ("1,204"), so the digits may carry separators.
const STATS = /([\d,]+) sources? · ([\d,]+) passages?/;
const REMAINING = /Load More Results \(([\d,]+) remaining\)/;

function toNumber(digits: string | undefined): number {
    return Number(digits?.replace(/,/g, ''));
}

async function remainingCount(text: string | null): Promise<number> {
    return toNumber(text?.match(REMAINING)?.[1]);
}

test.describe('search client', () => {
    test('a deep-linked query renders results immediately', async ({ page }) => {
        await page.goto('/search?q=miracle');

        // Generous: the first search after a cold server parses the whole index.
        await expect(page.getByText(STATS)).toBeVisible({ timeout: 45_000 });
        await expect(page.locator(RESULT_CARD).first()).toBeVisible();

        const total = toNumber((await page.getByText(STATS).textContent())?.match(STATS)?.[1]);
        expect(total).toBeGreaterThan(10);

        // One page of results is rendered.
        await expect(page.locator(RESULT_CARD)).toHaveCount(10);
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

        // Appended, not replaced: the second page follows the first, and rank 0 is unchanged.
        await expect(page.locator(RESULT_CARD)).toHaveCount(20);
        await expect(page.locator('#search-results [data-result-rank="0"]')).toHaveAttribute('data-media-id', rankZeroId ?? '');
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
        const unfiltered = await page.getByText(/(\d+) sources?/).textContent();

        await page.goto('/search?q=miracle+-number+type%3Aperspective');
        await expect(page.getByLabel('Active query operators')).toBeVisible();
        await expect(page.getByText('excluding number')).toBeVisible();
        await expect(page.getByText('type:perspective')).toBeVisible();

        const filtered = await page.getByText(/(\d+) sources?/).textContent();
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
        await page.getByRole('button', { name: 'More document actions', exact: true }).click();
        await page.getByRole('button', { name: 'Cite this page', exact: true }).click();

        const dialog = page.getByRole('dialog', { name: 'Copy a citation' });
        await expect(dialog).toBeVisible();
        // Defaults to the permalink, which must carry the page the reader is on.
        await expect(dialog).toContainText('page=42');

        await dialog.getByRole('button', { name: 'APA' }).click();
        await expect(dialog).toContainText('Khalifa, R.');
        await expect(dialog).toContainText('n.d.');
        await expect(dialog).toContainText('The Computer Speaks');
        await expect(dialog).toContainText('PDF page 42');

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
    });
});
