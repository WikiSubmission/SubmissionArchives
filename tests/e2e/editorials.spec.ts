import { expect, test } from '@playwright/test';

const EDITORIAL_PATH = '/editorials/how-the-archive-is-assembled';

test.describe('Archive Editorials', () => {
    test('the Written Archives page links into the editorials section', async ({ page }) => {
        await page.goto('/written');

        await expect(page.getByRole('heading', { name: 'Archive Editorials' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Read all editorials' })).toHaveAttribute('href', '/editorials');
    });

    test('the reading sheet renders its masthead, figures and footnotes', async ({ page }) => {
        await page.goto(EDITORIAL_PATH);

        await expect(page.getByRole('heading', { level: 1, name: 'How the archive is assembled' })).toBeVisible();

        const article = page.locator('article.editorial-prose');
        await expect(article).toHaveAttribute('data-align', 'justify');

        // Figures break past the text measure rather than sitting inside it.
        const paragraph = article.locator('> p').first();
        const fullFigure = article.locator('figure.editorial-breakout').first();
        const paragraphBox = await paragraph.boundingBox();
        const figureBox = await fullFigure.boundingBox();
        expect(figureBox?.width ?? 0).toBeGreaterThan(paragraphBox?.width ?? 0);

        // Footnote markers resolve to the notes at the end of the piece.
        const marker = article.locator('a.editorial-ref').first();
        const target = await marker.getAttribute('href');
        expect(target).toBe('#note-1');
        await expect(page.locator('#note-1')).toHaveCount(1);
    });

    test('a figure opens at full size and closes again', async ({ page }) => {
        await page.goto(EDITORIAL_PATH);

        // The lead figure sits between the masthead and the body text.
        const figures = page.locator('[data-editorial-figure]');
        await expect(figures).toHaveCount(4);

        await figures.first().click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Numbered from document order, in the reference's caption style.
        await expect(page.locator('.editorial-lightbox-caption')).toContainText('fig. 1');

        // The page behind must not scroll while the enlarged view is up.
        await expect
            .poll(() => page.evaluate(() => document.body.style.overflow))
            .toBe('hidden');

        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect
            .poll(() => page.evaluate(() => document.body.style.overflow))
            .toBe('');
    });

    test('the sidebar tracks the section being read', async ({ page }) => {
        await page.goto(EDITORIAL_PATH);

        const toc = page.getByRole('navigation', { name: 'Sections in this editorial' });
        await expect(toc.getByRole('link', { name: 'Acquisition' })).toHaveAttribute('data-active', 'true');

        // Jumping from the sidebar lands the heading at the top of the reading
        // area, which is also what marks it as the current section.
        await toc.getByRole('link', { name: 'Indexing' }).click();
        await expect(toc.getByRole('link', { name: 'Indexing' })).toHaveAttribute('data-active', 'true');
        await expect(toc.getByRole('link', { name: 'Acquisition' })).toHaveAttribute('data-active', 'false');
    });

    test('reading settings change the prose and survive a reload', async ({ page }) => {
        await page.goto(EDITORIAL_PATH);

        const article = page.locator('article.editorial-prose');
        await page.getByRole('button', { name: 'Reading settings' }).click();

        const panel = page.getByRole('group', { name: 'Reading settings' });
        await panel.getByRole('button', { name: 'Ragged' }).click();
        await panel.getByRole('button', { name: 'Large' }).click();

        await expect(article).toHaveAttribute('data-align', 'start');
        await expect(article).toHaveAttribute('data-size', 'l');

        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden();

        await page.reload();
        await expect(page.locator('article.editorial-prose')).toHaveAttribute('data-size', 'l');
    });

    test('the page does not scroll horizontally on a narrow viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(EDITORIAL_PATH);

        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);
    });
});
