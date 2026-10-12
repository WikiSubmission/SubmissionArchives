import { expect, test } from '@playwright/test';
async function saveReference(page: import('@playwright/test').Page) {
 await page.getByRole('button',{name:'Save',exact:true}).first().click();
 await page.getByRole('button',{name:'Save reference',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Saved to Research.'})).toBeVisible();
}
test('save and reopen all supported source kinds and export a local backup', async ({page}, testInfo) => {
 await page.route('**/*youtube*', route=>route.abort());
 await page.goto('/editorials/how-the-archive-is-assembled');
 await saveReference(page);
 await page.goto('/media/video-program/what-is-life-all-about?t=30');
 await expect(page.locator('.qs-entry').getByRole('button', {name:'Save', exact:true})).toHaveCount(0);
 await saveReference(page);
 await page.goto('/library/salat-booklet?page=2');
 await page.getByRole('button',{name:'More document actions',exact:true}).click();
 await page.getByRole('button',{name:'Cite this page',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Copy a citation'})).toBeVisible();
 await page.getByRole('button',{name:'APA',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('PDF page 2');
 await saveReference(page);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await expect(page.getByRole('button',{name:'More document actions',exact:true})).toBeFocused();
 await page.goto('/scripture/quran/1?page=1#verse-1');
 await page.locator('#verse-1').hover();
 await saveReference(page);
 await page.goto('/collections');
 await expect(page.locator('article')).toHaveCount(4);
 const links = await page.getByRole('link',{name:'Open original'}).evaluateAll(nodes=>nodes.map(node=>(node as HTMLAnchorElement).getAttribute('href')));
 expect(links.some(link=>link?.includes('?page=2'))).toBe(true);
 expect(links.some(link=>link?.includes('?t='))).toBe(true);
 expect(links.some(link=>link?.includes('#verse-1'))).toBe(true);
 for (const link of links) { await page.goto(link!); await expect(page.locator('#main-content')).toBeVisible(); }
 await page.goto('/collections');
 await page.getByRole('textbox',{name:'Rename Research'}).fill('Archive notes');
 await page.getByRole('textbox',{name:'Rename Research'}).press('Tab');
 await page.getByRole('button',{name:'Move reference up',exact:true}).nth(1).click();
 await expect(page.getByRole('link',{name:'Open original'}).first()).toHaveAttribute('href', links[1]!);
 await page.reload();await expect(page.locator('article')).toHaveCount(4);
 await expect(page.getByRole('textbox',{name:'Rename Archive notes'})).toHaveValue('Archive notes');
 await page.screenshot({path:testInfo.outputPath('collections-review.png'),fullPage:true});
 const bibDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Export BibTeX'}).click();
 expect((await bibDownload).suggestedFilename()).toBe('research.bib');
 const download = page.waitForEvent('download');await page.getByRole('button',{name:'Export Markdown'}).click();
 expect((await download).suggestedFilename()).toBe('research.md');
});
test('Unicode queries reach the actual API and discovery filters remain usable on mobile', async ({request,page}) => {
 for (const q of ['God','الله','שלום']) {
  const response=await request.get('/api/search?q='+encodeURIComponent(q));expect(response.status()).toBe(200);
  const body=await response.json();expect(typeof body.total).toBe('number');
  if(q==='الله')expect(body.total).toBeGreaterThan(0);
 }
 await page.setViewportSize({width:390,height:844});await page.goto('/explore');
 await expect(page.getByRole('heading',{name:'Timeline & topics'})).toBeVisible();
 await page.getByRole('combobox',{name:'Subject'}).selectOption('Quran studies');
 await page.getByRole('checkbox',{name:'Include undated works'}).check();
 await expect(page.locator('article').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('archive PDFs support byte ranges without transferring the full artifact', async ({request}) => {
 const response = await request.get('/content/written/books/salat-booklet.pdf', {headers:{Range:'bytes=0-1023'}});
 expect(response.status()).toBe(206);
 expect(response.headers()['content-range']).toMatch(/^bytes 0-1023\//);
 expect((await response.body()).length).toBe(1024);
});
