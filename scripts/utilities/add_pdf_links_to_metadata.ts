import fs from 'fs';
import path from 'path';

const METADATA_PATH = path.join(process.cwd(), 'public/data/newsletters/metadata.json');
const HTML_DIR = path.join(process.cwd(), 'public/data/newsletters/html');

// Read existing metadata
const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));

// Update each entry with PDF link from the corresponding JSON file
for (const entry of metadata) {
    const jsonPath = path.join(HTML_DIR, `${entry.id}.json`);

    if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const pdfLink = data.document?.header?.pdf_link;

        if (pdfLink) {
            entry.pdfLink = pdfLink;
            console.log(`✓ Added PDF link for ${entry.id}: ${pdfLink}`);
        } else {
            console.log(`⚠ No PDF link found for ${entry.id}`);
        }
    } else {
        console.log(`✗ JSON file not found for ${entry.id}`);
    }
}

// Write updated metadata
fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
console.log(`\n✅ Updated metadata.json with ${metadata.length} entries`);
