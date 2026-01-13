import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from 'canvas';
import sharp from 'sharp';

const APPENDIX_DIR = path.join(process.cwd(), 'public/appendices');
const OUTPUT_DIR = path.join(process.cwd(), 'public/images/appendices');
const METADATA_PATH = path.join(process.cwd(), 'public/data/appendices/metadata.json');

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
    if (!fs.existsSync(METADATA_PATH)) {
        console.error('Metadata file not found at:', METADATA_PATH);
        return;
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    console.log(`Loaded metadata for ${metadata.length} appendices.`);

    // Create mapping from ID to expected PDF filename
    const idToPdfMap = new Map();

    for (const item of metadata) {
        // Convert ID to PDF filename
        // e.g., "appendix-1" -> "appendix_1.pdf"
        //       "introduction" -> "introduction.pdf"
        const pdfFilename = item.id.replace(/-/g, '_') + '.pdf';
        idToPdfMap.set(pdfFilename, item.id);
    }

    const files = fs.readdirSync(APPENDIX_DIR);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf')).sort();

    console.log(`Found ${pdfFiles.length} PDF files.`);

    for (const file of pdfFiles) {
        const id = idToPdfMap.get(file);

        if (!id) {
            console.warn(`No ID found for PDF: ${file}, skipping...`);
            continue;
        }

        const pdfPath = path.join(APPENDIX_DIR, file);
        const outputFilename = `${id}.jpg`;
        const outputPath = path.join(OUTPUT_DIR, outputFilename);

        try {
            await generateThumbnail(pdfPath, outputPath);
        } catch (error) {
            console.error(`Failed to generate thumbnail for ${file}:`, error);
        }
    }
}

main().catch(console.error);
