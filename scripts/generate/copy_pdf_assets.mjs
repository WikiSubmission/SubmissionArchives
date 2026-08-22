// Copies pdfjs-dist's cmaps and standard_fonts into public/pdf/ so the reader
// resolves them locally instead of hitting unpkg.com at runtime (a privacy leak
// and reliability risk for non-Latin PDF text rendering). Re-run after bumping
// pdfjs-dist to pick up the matching cmap/font revision.
import { cpSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pdfjsDistDir = dirname(fileURLToPath(import.meta.resolve('pdfjs-dist/package.json')));
const publicPdfDir = join(projectRoot, 'public', 'pdf');

for (const assetDir of ['cmaps', 'standard_fonts']) {
    const destination = join(publicPdfDir, assetDir);
    mkdirSync(destination, { recursive: true });
    cpSync(join(pdfjsDistDir, assetDir), destination, { recursive: true, force: true });
    console.log(`Copied ${assetDir} to public/pdf/${assetDir}`);
}
