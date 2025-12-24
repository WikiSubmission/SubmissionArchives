
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import https from 'https';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import sharp from 'sharp';
import zlib from 'zlib';

const API_KEY = "f78c6f5417ce45e285eebdfc6f0d321f";
const MODEL_ID = "DeepSeek-OCR";
const MODEL_VERSION_ID = "86b122666c2548f88d04dd998ccfbd70";

const METADATA_PATH = path.join(process.cwd(), 'public/data/newsletters/metadata.json');
const OCR_DIR = path.join(process.cwd(), 'public/data/newsletters/ocr');
const TEMP_DIR = path.join(process.cwd(), 'public/data/newsletters/temp_images');

if (!fs.existsSync(OCR_DIR)) fs.mkdirSync(OCR_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Reuse the extraction logic
async function extractImagesFromPdf(filePath) {
    // console.log(`Extracting images from ${path.basename(filePath)}...`);
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    const extractedImages = []; // { path, pageNum }

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const resources = page.node.Resources();
        if (!resources) continue;

        const xObjects = resources.lookup(PDFName.of('XObject'));
        if (!xObjects) continue;

        const keys = xObjects.keys();
        for (const key of keys) {
            const ref = xObjects.get(key);
            const xObject = pdfDoc.context.lookup(ref);

            if (xObject instanceof PDFRawStream) {
                const subtype = xObject.dict.lookup(PDFName.of('Subtype'));
                if (subtype === PDFName.of('Image')) {
                    const data = xObject.contents;
                    const pageNum = i + 1;
                    const suffix = `${path.basename(filePath, '.pdf')}_p${pageNum}_${key.decodeText ? key.decodeText() : 'img'}`;

                    const filter = xObject.dict.lookup(PDFName.of('Filter'));
                    const width = xObject.dict.lookup(PDFName.of('Width')).numberValue;
                    const height = xObject.dict.lookup(PDFName.of('Height')).numberValue;
                    const colorspace = xObject.dict.lookup(PDFName.of('ColorSpace'));

                    let ext = 'bin';
                    let isPngRaw = false;

                    if (filter === PDFName.of('DCTDecode')) ext = 'jpg';
                    else if (filter === PDFName.of('FlateDecode')) {
                        ext = 'png';
                        isPngRaw = true;
                    }

                    if (ext === 'jpg') {
                        const outPath = path.join(TEMP_DIR, `${suffix}.jpg`);
                        fs.writeFileSync(outPath, data);
                        extractedImages.push({ path: outPath, pageNum });
                    } else if (isPngRaw) {
                        // Decompress
                        let rawValues;
                        try { rawValues = zlib.unzipSync(data); }
                        catch (e) { rawValues = zlib.inflateSync(data); }

                        let channels = 1;
                        if (colorspace === PDFName.of('DeviceRGB')) channels = 3;
                        else if (colorspace === PDFName.of('DeviceGray')) channels = 1;
                        else if (colorspace === PDFName.of('DeviceCMYK')) channels = 4;

                        // Sharp conversion
                        try {
                            const outPath = path.join(TEMP_DIR, `${suffix}.png`);
                            await sharp(rawValues, { raw: { width, height, channels } }).toFile(outPath);
                            extractedImages.push({ path: outPath, pageNum });
                        } catch (e) {
                            console.error(`Error converting PNG for page ${pageNum}: ${e.message}`);
                        }
                    }
                }
            }
        }
    }
    return extractedImages.sort((a, b) => a.pageNum - b.pageNum);
}

function ocrImage(imagePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(imagePath)) {
            resolve("");
            return;
        }

        const buffer = fs.readFileSync(imagePath);
        const base64Data = buffer.toString('base64');

        const data = JSON.stringify({
            "user_app_id": { "user_id": "deepseek-ai", "app_id": "deepseek-ocr" },
            "inputs": [
                {
                    "data": {
                        "image": { "base64": base64Data },
                        "text": { "raw": "OCR this page" }
                    }
                }
            ]
        });

        const options = {
            hostname: 'api.clarifai.com',
            path: `/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Key ' + API_KEY,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error(`Clarifai Error Status: ${res.statusCode}`);
                    resolve("");
                    return;
                }
                try {
                    const json = JSON.parse(body);
                    if (json.outputs && json.outputs[0] && json.outputs[0].data && json.outputs[0].data.text) {
                        resolve(json.outputs[0].data.text.raw);
                    } else {
                        console.error("No text in OCR response");
                        resolve("");
                    }
                } catch (e) {
                    console.error("JSON Parse Error");
                    resolve("");
                }
            });
        });

        req.on('error', e => {
            console.error("Request Error", e);
            resolve("");
        });

        req.write(data);
        req.end();
    });
}

async function main() {
    console.log("Starting Batch Processing...");
    if (!fs.existsSync(METADATA_PATH)) {
        console.error("Metadata not found");
        return;
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    // Process latest to earliest or vice versa? 
    // Just simple seq.

    // IMPORTANT: Only process FIRST 5 for testing/demo to avoid massive wait/usage, 
    // unless user explicitly asked for ALL (which they did: "process all 63").
    // I will process only ONE file first properly, then ask user if they want the rest?
    // No, user gave green light. I will process them.
    // Iteration...

    for (let i = 0; i < metadata.length; i++) {
        const item = metadata[i];
        const resultFile = path.join(OCR_DIR, `${item.filename}.json`); // e.g. 1990_01_January.pdf.json

        if (fs.existsSync(resultFile)) {
            console.log(`[${i + 1}/${metadata.length}] Skipping ${item.filename} (Already Done)`);
            continue;
        }

        const pdfPath = path.join(process.cwd(), 'public/data/newsletters', item.filename);
        if (!fs.existsSync(pdfPath)) {
            console.error(`PDF Missing: ${item.filename}`);
            continue;
        }

        console.log(`[${i + 1}/${metadata.length}] Processing ${item.filename}...`);

        // 1. Extract
        let images;
        try {
            images = await extractImagesFromPdf(pdfPath);
        } catch (e) {
            console.error(`Extraction failed for ${item.filename}:`, e);
            continue;
        }

        if (images.length === 0) {
            console.log("No images extracted?");
            continue;
        }

        console.log(`   Extracted ${images.length} pages. Running OCR...`);

        const pagesText = [];
        let fullText = "";

        for (const img of images) {
            // console.log(`   OCR Page ${img.pageNum}...`);
            const text = await ocrImage(img.path);
            pagesText.push({ page: img.pageNum, text: text });
            fullText += `\n\n--- Page ${img.pageNum} ---\n\n` + text;

            // Cleanup temp image immediately to save space
            try { fs.unlinkSync(img.path); } catch (e) { }

            // Rate limit sleep
            await sleep(500);
        }

        // Save result
        const result = {
            id: item.id,
            filename: item.filename,
            processedAt: new Date().toISOString(),
            pages: pagesText,
            fullText: fullText
        };

        fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
        console.log(`   Saved OCR result.`);
    }

    console.log("All done.");
}

main().catch(console.error);
