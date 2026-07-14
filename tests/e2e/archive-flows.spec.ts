import { expect, test } from '@playwright/test';

test('health endpoint reports the validated catalog as ready', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBe(true);
    await expect(response.json()).resolves.toMatchObject({
        status: 'ok',
        catalog: { records: 380, segments: 112488 },
    });
});

test('home route exposes primary archive pathways without mobile overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'SUBMISSION ARCHIVES' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start with the archive' })).toHaveAttribute('href', '/videos');
    await expect(page.getByRole('link', { name: 'Search the corpus' })).toHaveAttribute('href', '/search');

    const horizontalOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(horizontalOverflow).toBe(0);
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
