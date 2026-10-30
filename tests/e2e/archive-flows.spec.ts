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

test('written archive prioritizes books and lists every appendix and newsletter issue', async ({ page }) => {
    await page.goto('/written');

    const books = page.getByRole('region', { name: 'Books & Publications' });
    // evaluateAll does not wait, so let the grid render before reading it.
    await expect(books.locator('a[href^="/library/"]').first()).toBeVisible();
    const bookLinks = await books.locator('a[href^="/library/"]').evaluateAll((links) =>
        [...new Set(links.map((link) => link.getAttribute('href')))],
    );

    expect(bookLinks.slice(0, 8)).toEqual([
        '/library/quran-visual-presentation',
        '/library/quran-hadith-islam',
        '/library/miracle-of-quran-alphabets',
        '/library/islam-volume-1-number-1-april-1974',
        '/library/islam-volume-1-number-2-july-1974',
        '/library/islam-volume-1-number-3-4-january-1975',
        '/library/perpetual-miracle',
        '/library/computer-speaks',
    ]);

    const appendices = page.getByRole('region', { name: 'Appendices' });
    const appendixLinks = await appendices.locator('a[href^="/library/"]').evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')),
    );
    expect(appendixLinks).toHaveLength(40);
    expect(appendixLinks.slice(0, 3)).toEqual(['/library/proclamation', '/library/introduction', '/library/appendix-1']);

    const newsletters = page.getByRole('region', { name: 'Submitters Perspectives' });
    await expect(newsletters.getByRole('link', { name: /Search the newsletters/ })).toHaveAttribute(
        'href',
        '/search?filters=perspective',
    );
    expect(await newsletters.locator('a[href^="/library/"]').evaluateAll(links => new Set(links.map(link => link.getAttribute('href'))).size)).toBe(64);
});

test('home route exposes primary archive pathways without mobile overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const main = page.getByRole('main');
    await expect(page.getByRole('heading', { level: 1, name: 'SUBMISSION ARCHIVES' })).toBeVisible();
    await expect(main.getByRole('link', { name: /^Browse all \d+ recordings$/ })).toHaveAttribute('href', '/media');
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

test('home search form opens the search page with the query', async ({ page }) => {
    await page.goto('/');

    const form = page.getByRole('main').getByRole('search');
    await form.getByRole('searchbox', { name: 'Search the archive' }).fill('contact prayers');
    await form.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/search\?q=contact\+prayers$/);
});

test('book-only search returns a page-specific reader link', async ({ page }) => {
    await page.goto('/search?filters=other');
    await page.getByLabel('Search transcripts, perspectives, appendices').fill('contact prayer');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    await expect(page.getByText('Searching the archive...')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'The Contact Prayers', exact: true })).toBeVisible();
    const resultLink = page.getByRole('link', { name: 'Open The Contact Prayers', exact: true });
    await expect(resultLink).toHaveCount(1);
    await expect(resultLink).toHaveAttribute('href', /page=1/);
    await resultLink.click();
    await expect(page).toHaveURL(/\/library\/salat-booklet\?.*page=1/);
    await expect(page.getByRole('heading', { level: 1, name: 'The Contact Prayers' })).toBeVisible();
});

test('legacy book slug renders the current PDF', async ({ page }) => {
    await page.goto('/library/salat-booklet');

    await expect(page.getByRole('heading', { level: 1, name: 'The Contact Prayers' })).toBeVisible();
    await expect(page.getByText("Couldn't load this document.")).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(2);
});

test('appendix reader renders the 1992 PDF and returns to the appendix list', async ({ page }) => {
    await page.goto('/library/appendix-1');

    await expect(page.getByRole('heading', { level: 1, name: '1. One of the Great Miracles [74:35]' })).toBeVisible();
    await expect(page.getByText("Couldn't load this document.")).toHaveCount(0);
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.locator('a[href="/written#appendices"]').first()).toBeAttached();
});

test('newsletter reader renders its archived PDF', async ({ page }) => {
    await page.goto('/library/SP1985feb');

    await expect(page.getByRole('heading', { level: 1, name: 'Submitter Perspectives February 1985' })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(2);
});

test('recordings page groups video and audio into collections and filters by title', async ({ page }) => {
    await page.goto('/media');

    await expect(page.getByRole('heading', { level: 1, name: 'Recordings' })).toBeVisible();
    const collections = page.getByRole('navigation', { name: 'Collections' });
    await expect(collections.getByRole('link')).toHaveCount(6);
    await collections.getByRole('link', { name: /Quran Studies/ }).click();
    await expect(page).toHaveURL(/\/media#quran-studies$/);

    const showAll = page.getByRole('button', { name: /^Show all \d+$/ }).first();
    await showAll.click();
    await expect(page.getByRole('button', { name: 'Show fewer' }).first()).toHaveAttribute('aria-expanded', 'true');

    await page.getByLabel('Filter recordings').fill('jinns');
    await expect(page.getByRole('heading', { level: 2, name: 'Quran Studies' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Programs' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Search their transcripts instead' })).toHaveAttribute('href', '/search?q=jinns');
    await expect(page.getByRole('button', { name: /^Play Quran Study 01/ })).toHaveCount(1);
});

test('media player loads YouTube and keeps transcript controls keyboard reachable', async ({ page }) => {
    await page.goto('/media/video-program/what-is-life-all-about');

    await expect(page.getByRole('heading', { level: 1, name: 'What is Life All About?' })).toBeVisible();
    await expect(page.locator('iframe[title="YouTube video player"]')).toBeVisible();

    const expandAll = page.getByRole('button', { name: 'Expand All', exact: true });
    await expandAll.focus();
    await expect(expandAll).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Search transcript')).toBeFocused();
});

test('keyboard navigation moves through result cards and into passages', async ({ page }) => {
    await page.goto('/search?filters=other');

    const input = page.getByRole('combobox', { name: 'Search transcripts, perspectives, appendices' });
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
