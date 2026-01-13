import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from 'canvas';
import sharp from 'sharp';

const OTHER_DIR = path.join(process.cwd(), 'public/other');
const OUTPUT_DIR = path.join(process.cwd(), 'public/images/other');
const SEARCH_INDEX_PATH = path.join(process.cwd(), 'public/data/other/search_index.json');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// NodeCanvasFactory needed for pdfjs-dist in Node
class NodeCanvasFactory {
    create(width: number, height: number) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');
        return {
            canvas,
            context,
        };
    }

    reset(canvasAndContext: any, width: number, height: number) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }

    destroy(canvasAndContext: any) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
}

async function generateThumbnail(pdfPath: string, outputPath: string) {
    if (fs.existsSync(outputPath)) {
        console.log(`Thumbnail already exists: ${path.basename(outputPath)}`);
        return;
    }

    console.log(`Processing: ${path.basename(pdfPath)}`);

    try {
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjsLib.getDocument({
            data,
            cMapUrl: 'node_modules/pdfjs-dist/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'
        });

        const pdfDocument = await loadingTask.promise;
        const page = await pdfDocument.getPage(1);

        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        const canvasFactory = new NodeCanvasFactory();
        const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

        await page.render({
            canvasContext: canvasAndContext.context,
            viewport,
            canvasFactory
        }).promise;

        const buffer = canvasAndContext.canvas.toBuffer('image/png');

        // Use sharp to resize and save as JPG
        await sharp(buffer)
            .resize({ width: 400 }) // Reasonable width for thumbnail
            .jpeg({ quality: 80 })
            .toFile(outputPath);

        console.log(`Generated: ${path.basename(outputPath)}`);

    } catch (err) {
        console.error(`Error processing ${path.basename(pdfPath)}:`, err);
    }
}

async function main() {
    if (!fs.existsSync(SEARCH_INDEX_PATH)) {
        console.error('Search index file not found at:', SEARCH_INDEX_PATH);
        return;
    }

    const searchIndex = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, 'utf-8'));
    console.log(`Loaded search index with ${searchIndex.length} items.`);

    for (const item of searchIndex) {
        const pdfFilename = item.filename;
        const id = item.id;

        const pdfPath = path.join(OTHER_DIR, pdfFilename);

        if (!fs.existsSync(pdfPath)) {
            console.warn(`PDF not found: ${pdfFilename}, skipping...`);
            continue;
        }

        const outputFilename = `${id}.jpg`;
        const outputPath = path.join(OUTPUT_DIR, outputFilename);

        try {
            await generateThumbnail(pdfPath, outputPath);
        } catch (error) {
            console.error(`Failed to generate thumbnail for ${pdfFilename}:`, error);
        }
    }
}

main().catch(console.error);
