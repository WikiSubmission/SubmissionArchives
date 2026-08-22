// Renders page 1 of each book PDF to a JPEG thumbnail, used as the book's
// cover image in search results and listings.
//
// pdfjs-dist's Node build already defaults to using @napi-rs/canvas for its
// internal rendering (see NodeCanvasFactory in pdf.mjs) — it's an existing
// transitive dependency here, not something new. The render-target canvas
// must be created with that same library rather than the unrelated `canvas`
// package (node-canvas/cairo), otherwise pdfjs's internally-created temp
// canvases and the target canvas are incompatible types and drawImage throws
// "Image or Canvas expected".
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ROOT = process.cwd();
const BOOKS_DIR = path.join(ROOT, 'public', 'content', 'written', 'books');
const THUMB_DIR = path.join(BOOKS_DIR, 'thumbnails');
const TARGET_WIDTH = 900;

async function renderFirstPage(pdfPath, outPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await getDocument({ data }).promise;
  const page = await pdf.getPage(1);

  const baseViewport = page.getViewport({ scale: 1 });
  const scale = TARGET_WIDTH / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const context = canvas.getContext('2d');

  await page.render({ canvasContext: context, viewport }).promise;

  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg', 90));
}

function findThumbnail(baseName) {
  return ['.jpg', '.png'].find((extension) =>
    fs.existsSync(path.join(THUMB_DIR, `${baseName}${extension}`)),
  );
}

function listBooks() {
  return fs.readdirSync(BOOKS_DIR).filter((filename) => filename.toLowerCase().endsWith('.pdf'));
}

// --check renders nothing and just reports drift, so CI can fail on a book that
// was added without a committed thumbnail without paying to rasterise every PDF.
function check() {
  const missing = listBooks()
    .map((pdf) => pdf.replace(/\.pdf$/i, ''))
    .filter((baseName) => !findThumbnail(baseName));

  if (missing.length > 0) {
    console.error(`Missing book thumbnails (${missing.length}):`);
    for (const baseName of missing) console.error(`  - ${baseName}`);
    console.error('\nRun `npm run generate:book-thumbnails` and commit the results.');
    process.exit(1);
  }

  console.log(`All ${listBooks().length} book thumbnails present.`);
}

async function main() {
  if (process.argv.includes('--check')) {
    check();
    return;
  }

  fs.mkdirSync(THUMB_DIR, { recursive: true });

  for (const pdf of listBooks()) {
    const baseName = pdf.replace(/\.pdf$/i, '');
    const existingThumbnail = findThumbnail(baseName);
    if (existingThumbnail) {
      console.log('skip (thumbnail exists):', `${baseName}${existingThumbnail}`);
      continue;
    }

    const pdfPath = path.join(BOOKS_DIR, pdf);
    const outPath = path.join(THUMB_DIR, `${baseName}.jpg`);
    await renderFirstPage(pdfPath, outPath);
    console.log('wrote', path.relative(ROOT, outPath));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
