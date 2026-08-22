import { expect, test } from '@playwright/test';

const DOCK = 'iframe[src*="youtube"]';

test.describe('global media player', () => {
    test('a card play button docks the player and it survives navigation', async ({ page }) => {
        await page.goto('/audios');

        const playButton = page.getByRole('button', { name: /^Play / }).first();
        const label = await playButton.getAttribute('aria-label');
        await playButton.click();

        // The dock mounts a visible player rather than a hidden one — YouTube's terms
        // require the embed to stay visible, so this assertion is deliberate.
        const dockFrame = page.locator(DOCK);
        await expect(dockFrame).toBeVisible();
        const box = await dockFrame.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(200);

        // Client-side navigation must not tear it down — that is the whole point. Navigating
        // via a Link rather than page.goto on purpose: a full document load legitimately
        // destroys React state, so goto would be testing the browser, not this feature.
        await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Written' }).click();
        await page.waitForURL(/\/written/);

        await expect(page.locator(DOCK)).toBeVisible();
        await expect(page.getByRole('link', { name: label!.replace(/^Play /, '') })).toBeVisible();
    });

    test('clicking a card play button does not navigate', async ({ page }) => {
        await page.goto('/audios');
        await page.getByRole('button', { name: /^Play / }).first().click();
        await expect(page).toHaveURL(/\/audios/);
    });

    test('the dock stands down on the track own page', async ({ page }) => {
        await page.goto('/audios');
        await page.getByRole('button', { name: /^Play / }).first().click();
        await expect(page.locator(DOCK)).toBeVisible();

        // Following the dock's own title link lands on the detail page, where the full
        // player takes over and the dock must not leave a second player running.
        await page.locator('.pointer-events-auto a').first().click();
        await page.waitForURL(/\/media\//);
        await expect(page.locator('.pointer-events-auto ' + DOCK)).toHaveCount(0);
    });

    test('the dock can be dismissed', async ({ page }) => {
        await page.goto('/audios');
        await page.getByRole('button', { name: /^Play / }).first().click();
        await expect(page.locator(DOCK)).toBeVisible();

        await page.getByRole('button', { name: 'Close player' }).click();
        await expect(page.locator(DOCK)).toHaveCount(0);
    });
});
