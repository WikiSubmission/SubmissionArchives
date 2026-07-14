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
const BOOKS_DIR = path.join(ROOT, 'public', 'content', 'books');
const THUMB_DIR = path.join(BOOKS_DIR, 'thumbnails');
const TARGET_WIDTH = 900;

const BOOKS = [
  { pdf: 'salat_booklet.pdf', thumb: 'salat_booklet.jpg' },
  { pdf: 'perpetual_miracle.pdf', thumb: 'perpetual_miracle.jpg' },
];

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

async function main() {
  fs.mkdirSync(THUMB_DIR, { recursive: true });

  for (const book of BOOKS) {
    const pdfPath = path.join(BOOKS_DIR, book.pdf);
    const outPath = path.join(THUMB_DIR, book.thumb);
    if (!fs.existsSync(pdfPath)) {
      console.log('skip (pdf missing):', book.pdf);
      continue;
    }
    await renderFirstPage(pdfPath, outPath);
    console.log('wrote', path.relative(ROOT, outPath));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
