
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// pdfjs-dist v4 is ESM only
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.url);
const { createCanvas } = require('canvas');

const FILE_PATH = path.join(process.cwd(), 'public/data/newsletters/1990_01_January.pdf');
const OUT_DIR = path.join(process.cwd(), 'public/data/newsletters/test_images');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
    console.log("Reading PDF...");
    const data = new Uint8Array(fs.readFileSync(FILE_PATH));

    console.log(`PDF Loaded via ESM.`);

    const loadingTask = pdfjsLib.getDocument({
        data,
        cMapUrl: 'node_modules/pdfjs-dist/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'
    });

    const pdfDocument = await loadingTask.promise;
    console.log(`Pages: ${pdfDocument.numPages}`);

    // Render Page 1
    const pageNumber = 1;
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.0 });

    console.log(`Rendering Page ${pageNumber} (Size: ${viewport.width}x${viewport.height})...`);

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(OUT_DIR, `page_${pageNumber}.png`), buffer);
    console.log(`Saved page_${pageNumber}.png`);
}

main().catch(console.error);
