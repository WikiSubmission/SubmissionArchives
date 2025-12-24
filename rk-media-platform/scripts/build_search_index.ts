
import fs from 'fs';
import path from 'path';

const METADATA_PATH = path.join(process.cwd(), 'public/data/newsletters/metadata.json');
const OCR_DIR = path.join(process.cwd(), 'public/data/newsletters/ocr');
const OUT_PATH = path.join(process.cwd(), 'public/data/newsletters/search_index.json');

async function main() {
    if (!fs.existsSync(METADATA_PATH)) {
        console.error("Metadata missing");
        return;
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    const index = [];

    console.log("Building search index...");

    for (const item of metadata) {
        const ocrPath = path.join(OCR_DIR, `${item.filename}.json`);
        let fullText = "";

        if (fs.existsSync(ocrPath)) {
            try {
                const ocrData = JSON.parse(fs.readFileSync(ocrPath, 'utf-8'));
                fullText = ocrData.fullText || "";
            } catch (e) {
                console.error(`Error reading OCR for ${item.filename}`);
            }
        }

        index.push({
            id: item.id,
            title: item.title,
            displayDate: item.displayDate,
            fullDate: item.fullDate,
            filename: item.filename,
            content: fullText
        });
    }

    fs.writeFileSync(OUT_PATH, JSON.stringify(index, null, 2));
    console.log(`Search index built with ${index.length} items.`);
    console.log(`Size: ${(fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2)} MB`);
}

main();
