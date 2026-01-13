import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from 'canvas';
import sharp from 'sharp';

// Configure PDF.js worker
// In node environment with legacy build, we can mock the worker or disable it if possible, 
// strictly speaking pdfjs-dist requires a worker.
// However, for node usage, it's often easier to just use the main lib directly if it works.
// A common pattern for Node.js is setting the workerSrc to null? No, that breaks it.
// We'll try standard import.

const NEWSLETTER_DIR = path.join(process.cwd(), 'public/data/newsletters');
const OUTPUT_DIR = path.join(process.cwd(), 'public/images/newsletters');

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

        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality before resizing
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

const METADATA_PATH = path.join(process.cwd(), 'public/data/newsletters/metadata.json');

async function main() {
    if (!fs.existsSync(METADATA_PATH)) {
        console.error('Metadata file found not found at:', METADATA_PATH);
        return;
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    console.log(`Loaded metadata for ${metadata.length} newsletters.`);

    // Map filename (from PDF link) to ID
    // Also map "year-month" to ID as fallback for mismatched filenames
    const pdfToIdMap = new Map();
    const yearMonthToIdMap = new Map(); // Key: "YYYY-MM" or "YYYY-MM-bonus"

    for (const item of metadata) {
        if (item.pdfLink) {
            const pdfName = path.basename(item.pdfLink);
            pdfToIdMap.set(pdfName, item.id);
        }

        if (item.year && item.monthSort) {
            const isBonus = item.monthSort % 1 !== 0;
            const month = Math.floor(item.monthSort).toString().padStart(2, '0');
            const key = `${item.year}-${month}${isBonus ? '-bonus' : ''}`;

            // Only set if not already set, or handle duplicates carefully (earlier usually preferred)
            yearMonthToIdMap.set(key, item.id);
        }
    }

    const files = fs.readdirSync(NEWSLETTER_DIR);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf')).sort();

    console.log(`Found ${pdfFiles.length} PDF files.`);

    for (const file of pdfFiles) {
        if (file.includes('1989_09_September')) {
            console.log(`DEBUG: Processing target file ${file}`);
        }

        let id = pdfToIdMap.get(file);

        if (!id) {
            // Fallback: Parse Year and Month from filename "YYYY_MM_MonthName.pdf"
            const match = file.match(/^(\d{4})_(\d{2})_/);
            if (match) {
                const year = match[1];
                const month = match[2]; // already 2 digits
                const isBonus = file.toLowerCase().includes('bonus') || file.toLowerCase().includes('bulletin');
                const key = `${year}-${month}${isBonus ? '-bonus' : ''}`;

                if (file.includes('1989_09_September')) {
                    console.log(`DEBUG: Fallback key for ${file}: ${key}`);
                    console.log(`DEBUG: ID found: ${yearMonthToIdMap.get(key)}`);
                }

                id = yearMonthToIdMap.get(key);
                if (id) {
                    console.log(`Mapped ${file} to ID ${id} via fallback.`);
                }
            }
        }

        if (!id) {
            console.warn(`No ID found for PDF: ${file}, skipping...`);
            continue;
        }

        const pdfPath = path.join(NEWSLETTER_DIR, file);
        const outputFilename = `${id}.jpg`;
        const outputPath = path.join(OUTPUT_DIR, outputFilename);

        if (file.includes('1989_11_November')) {
            console.log(`DEBUG: Processing 1989_11 ID=${id} Path=${outputPath}`);
        }

        try {
            await generateThumbnail(pdfPath, outputPath);
        } catch (error) {
            console.error(`Failed to generate thumbnail for ${file}:`, error);
        }
    }
}

main().catch(console.error);
