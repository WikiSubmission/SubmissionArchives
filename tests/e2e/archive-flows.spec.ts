import { expect, test } from '@playwright/test';

import catalogValidation from '../../public/data/generated_indices/CATALOG_VALIDATION.json';

test('health endpoint reports the validated catalog as ready', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBe(true);
    await expect(response.json()).resolves.toMatchObject({
        status: 'ok',
        catalog: {
            records: catalogValidation.recordCount,
            segments: catalogValidation.segmentCount,
        },
    });
});

test('written archive prioritizes books and exposes every newsletter issue', async ({ page }) => {
    await page.goto('/written');

    const books = page.getByRole('region', { name: 'Books & Publications' });
    const bookLinks = await books.locator('a[href^="/library/"]').evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')),
    );

    expect(bookLinks.slice(0, 8)).toEqual([
        '/library/quran-visual-presentation',
        '/library/miracle-of-quran-alphabets',
        '/library/quran-hadith-islam',
        '/library/islam-volume-1-number-1-april-1974',
        '/library/islam-volume-1-number-2-july-1974',
        '/library/islam-volume-1-number-3-4-january-1975',
        '/library/perpetual-miracle',
        '/library/computer-speaks',
    ]);

    const newsletters = page.getByRole('region', { name: 'Submitters Perspectives' });
    await expect(newsletters.getByRole('link', { name: /Search the newsletters/ })).toHaveAttribute(
        'href',
        '/search?filters=perspective',
    );
    await expect(newsletters.locator('a[href^="/library/"]')).toHaveCount(64);
});

test('home route exposes primary archive pathways without mobile overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const main = page.getByRole('main');
    await expect(page.getByRole('heading', { level: 1, name: 'SUBMISSION ARCHIVES' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Browse recordings' })).toHaveAttribute('href', '/videos');
    await expect(main.getByRole('link', { name: 'Search the archive', exact: true }).first()).toHaveAttribute(
        'href',
        '/search',
    );

    // scroll-gutter reservation can make scrollWidth slightly smaller than
    // clientWidth; only a positive difference means real horizontal overflow.
    const horizontalOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(0);
});

test('book-only search returns a page-specific reader link', async ({ page }) => {
    await page.goto('/search?filters=other');
    await page.getByLabel('Search transcripts, perspectives, appendices').fill('contact prayer');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    await expect(page.getByText('Searching the archive...')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'The Contact Prayers', exact: true })).toBeVisible();
    const resultLink = page.locator('a[href^="/library/salat-booklet"]').filter({ hasText: 'Best passage' });
    await expect(resultLink).toHaveCount(1);
    await expect(resultLink).toHaveAttribute('href', /page=1/);
});

test('legacy book slug renders the current PDF', async ({ page }) => {
    await page.goto('/library/salat-booklet');

    await expect(page.getByRole('heading', { level: 1, name: 'The Contact Prayers' })).toBeVisible();
    await expect(page.getByText("Couldn't load this document.")).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(2);
});

test('newsletter reader renders its archived PDF', async ({ page }) => {
    await page.goto('/library/SP1985feb');

    await expect(page.getByRole('heading', { level: 1, name: 'Submitter Perspectives February 1985' })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(2);
});

test('Quran chapter exposes verse search, editions, RTL text, and copy controls', async ({ page }) => {
    await page.goto('/quran/1');

    await expect(page.getByRole('heading', { level: 1, name: '1. The Key' })).toBeVisible();
    await expect(page.getByLabel('Search within this sura')).toBeVisible();
    await expect(page.locator('[dir="rtl"]')).toHaveCount(8);
    await expect(page.getByRole('button', { name: 'Copy verse' })).toHaveCount(7);
});

test('media player loads YouTube and keeps transcript controls keyboard reachable', async ({ page }) => {
    await page.goto('/media/video-program/what-is-life-all-about');

    await expect(page.getByRole('heading', { level: 1, name: 'What is Life All About?' })).toBeVisible();
    await expect(page.locator('iframe[title="YouTube video player"]')).toBeVisible();

    const transcriptMode = page.getByRole('button', { name: 'Transcript', exact: true });
    await transcriptMode.focus();
    await expect(transcriptMode).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Theater', exact: true })).toBeFocused();
    await expect(page.getByLabel('Search transcript')).toBeVisible();
});

test('keyboard navigation moves through result cards and into passages', async ({ page }) => {
    await page.goto('/search?filters=other');

    const input = page.getByRole('combobox');
    await input.fill('prayer');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    await expect(page.locator('#search-card-0')).toBeVisible();

    await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'search-card-0');

    await input.press('ArrowRight');
    await expect(input).toHaveAttribute('aria-activedescendant', 'search-card-0-passage-0');

    await input.press('Enter');
    await expect(page).not.toHaveURL(/\/search(\?|$)/);
});
