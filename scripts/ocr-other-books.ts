/**
 * High-Quality OCR for "Other" Books
 * Uses Tesseract.js for free, accurate English + Arabic text extraction
 */

import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import Tesseract from 'tesseract.js';

// Use require for pdfjs-dist (CJS compatibility)
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

// Configuration
const OTHER_DIR = path.join(process.cwd(), 'public/other');
const OUTPUT_FILE = path.join(process.cwd(), 'public/data/other/search_index.json');
const DPI = 300; // Higher DPI = better OCR accuracy
const SCALE = DPI / 72; // PDF default is 72 DPI

const FILES_TO_INDEX = [
    {
        filename: 'salat_booklet.pdf',
        id: 'salat-booklet',
        title: 'Contact Prayer [Salat] Booklet',
        author: 'Dr. Rashad Khalifa'
    },
    {
        filename: 'quran_hadith_islam.pdf',
        id: 'quran-hadith-islam',
        title: 'Quran, Hadith, and Islam',
        author: 'Dr. Rashad Khalifa'
    },
    {
        filename: 'computer_speaks.pdf',
        id: 'computer-speaks',
        title: 'The Computer Speaks',
        author: 'Dr. Rashad Khalifa'
    },
    {
        filename: 'perpetual_miracle.pdf',
        id: 'perpetual-miracle',
        title: 'The Perpetual Miracle of Muhammad',
        author: 'Dr. Rashad Khalifa'
    },
    {
        filename: 'miracle_of_quran_alphabets.pdf',
        id: 'miracle-of-quran-alphabets',
        title: 'Miracle of Quran: Significance of the Mysterious Alphabets',
        author: 'Dr. Rashad Khalifa'
    },
    {
        filename: 'quran_visual_presentation.pdf',
        id: 'quran-visual-presentation',
        title: 'Quran: Visual Presentation of the Miracle',
        author: 'Dr. Rashad Khalifa'
    }
];

/**
 * Convert a PDF page to a PNG image buffer
 */
async function pdfPageToImage(pdfPath: string, pageNum: number): Promise<Buffer> {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdf.getPage(pageNum);

    const viewport = page.getViewport({ scale: SCALE });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
        canvasContext: context as any,
        viewport: viewport
    }).promise;

    return canvas.toBuffer('image/png');
}

/**
 * Get total page count of a PDF
 */
async function getPdfPageCount(pdfPath: string): Promise<number> {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    return pdf.numPages;
}

/**
 * OCR a single image using Tesseract.js
 */
async function ocrImage(imageBuffer: Buffer, worker: Tesseract.Worker): Promise<string> {
    const { data: { text } } = await worker.recognize(imageBuffer);
    return text.trim();
}

/**
 * Process a single PDF file
 */
async function processPdf(
    item: typeof FILES_TO_INDEX[0],
    worker: Tesseract.Worker
): Promise<{ pages: { page: number; content: string }[]; content: string }> {
    const pdfPath = path.join(OTHER_DIR, item.filename);

    if (!fs.existsSync(pdfPath)) {
        console.warn(`[WARN] File not found: ${pdfPath}`);
        return { pages: [], content: '' };
    }

    const pageCount = await getPdfPageCount(pdfPath);
    console.log(`  Processing ${pageCount} pages...`);

    const pages: { page: number; content: string }[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        process.stdout.write(`    Page ${pageNum}/${pageCount}...`);

        try {
            const imageBuffer = await pdfPageToImage(pdfPath, pageNum);
            const text = await ocrImage(imageBuffer, worker);

            pages.push({
                page: pageNum,
                content: text
            });

            console.log(` ✓ (${text.length} chars)`);
        } catch (err: any) {
            console.log(` ✗ Error: ${err.message}`);
            pages.push({
                page: pageNum,
                content: ''
            });
        }
    }

    const fullContent = pages.map(p => p.content).join(' ');
    return { pages, content: fullContent };
}

/**
 * Main OCR function
 */
async function runOcr() {
    console.log('='.repeat(60));
    console.log('High-Quality OCR for Other Books');
    console.log('Using Tesseract.js with English + Arabic support');
    console.log('='.repeat(60));
    console.log();

    // Initialize Tesseract worker with English + Arabic
    console.log('Initializing Tesseract worker (eng+ara)...');
    const worker = await Tesseract.createWorker('eng+ara', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                // Suppress progress logs for cleaner output
            }
        }
    });
    console.log('Worker ready.\n');

    const index: any[] = [];

    for (const item of FILES_TO_INDEX) {
        console.log(`\n[${item.id}] ${item.title}`);
        console.log('-'.repeat(50));

        const { pages, content } = await processPdf(item, worker);

        index.push({
            filename: item.filename,
            id: item.id,
            title: item.title,
            author: item.author,
            content: content,
            pages: pages
        });

        console.log(`  -> Total: ${pages.length} pages, ${content.length} characters`);
    }

    // Terminate worker
    await worker.terminate();

    // Save output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SUCCESS! Saved ${index.length} books to ${OUTPUT_FILE}`);
    console.log(`${'='.repeat(60)}`);
}

runOcr().catch(console.error);
