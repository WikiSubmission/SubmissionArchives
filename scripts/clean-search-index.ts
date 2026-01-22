
import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.join(process.cwd(), 'public/data/other/search_index.json');

function cleanText(text: string): string {
    // Remove specific unicode control characters common in OCR/PDF text
    // \u2000-\u200F: Zero-width spaces, LTR/RTL marks
    // \u2028-\u202F: Line/paragraph separators, narrow spaces
    // \uFEFF: Zero width no-break space
    return text.replace(/[\u2000-\u200F\u2028-\u202F\uFEFF]/g, '');
}

function run() {
    if (!fs.existsSync(INDEX_FILE)) {
        console.error('Search index file not found:', INDEX_FILE);
        process.exit(1);
    }

    console.log('Reading search index...');
    const rawData = fs.readFileSync(INDEX_FILE, 'utf-8');

    // Count occurrences for reporting
    const matchCount = (rawData.match(/[\u2000-\u200F\u2028-\u202F\uFEFF]/g) || []).length;
    console.log(`Found ${matchCount} invisible control characters.`);

    if (matchCount > 0) {
        console.log('Cleaning file...');
        const data = JSON.parse(rawData);

        // Deep clean the object
        const cleanValue = (val: any): any => {
            if (typeof val === 'string') return cleanText(val);
            if (Array.isArray(val)) return val.map(cleanValue);
            if (val && typeof val === 'object') {
                const newVal: any = {};
                for (const key in val) {
                    newVal[key] = cleanValue(val[key]);
                }
                return newVal;
            }
            return val;
        };

        const cleanedData = cleanValue(data);

        console.log('Writing cleaned file...');
        fs.writeFileSync(INDEX_FILE, JSON.stringify(cleanedData, null, 2));
        console.log('Done!');
    } else {
        console.log('File is already clean.');
    }
}

run();
