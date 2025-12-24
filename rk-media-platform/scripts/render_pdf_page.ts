
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const FILE_PATH = path.join(process.cwd(), 'public/data/newsletters/1990_01_January.pdf');
const OUT_DIR = path.join(process.cwd(), 'public/data/newsletters/test_images');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
    console.log("Reading PDF...");
    const data = new Uint8Array(fs.readFileSync(FILE_PATH));

    // Disable worker for Node environment
    // pdfjsLib.GlobalWorkerOptions.workerSrc = ''; 
    // Actually legacy build usually works without checking workerSrc

    const loadingTask = pdfjsLib.getDocument(data);
    const pdfDocument = await loadingTask.promise;

    console.log(`PDF Loaded. Pages: ${pdfDocument.numPages}`);

    // Render Page 1
    const pageNumber = 1;
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.0 }); // 2.0 scale for better OCR

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
