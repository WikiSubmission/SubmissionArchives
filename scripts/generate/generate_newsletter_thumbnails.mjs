// Renders page 1 of each Submitters Perspective newsletter PDF to a JPEG
// thumbnail, used as the issue's cover image on the written archive page.
//
// Unlike generate_book_thumbnails.mjs, this always re-renders and overwrites
// existing thumbnails — it exists to refresh covers after the source PDFs
// are updated (see download_sp_pdfs.sh), not to backfill missing ones.
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ROOT = process.cwd();
const NEWSLETTER_DIR = path.join(ROOT, 'public', 'content', 'written', 'newsletters');
const PDF_DIR = path.join(NEWSLETTER_DIR, 'pdfs');
const THUMB_DIR = path.join(NEWSLETTER_DIR, 'thumbnails');
const TARGET_WIDTH = 720;

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

function listNewsletterPdfs() {
  return fs.readdirSync(PDF_DIR).filter((filename) => filename.toLowerCase().endsWith('.pdf'));
}

async function main() {
  fs.mkdirSync(THUMB_DIR, { recursive: true });

  for (const pdf of listNewsletterPdfs()) {
    const baseName = pdf.replace(/\.pdf$/i, '');
    const pdfPath = path.join(PDF_DIR, pdf);
    const outPath = path.join(THUMB_DIR, `${baseName}.jpg`);
    await renderFirstPage(pdfPath, outPath);
    console.log('wrote', path.relative(ROOT, outPath));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
