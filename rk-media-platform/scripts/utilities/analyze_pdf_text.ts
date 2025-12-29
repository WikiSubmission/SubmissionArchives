
import fs from 'fs';
import pdf from 'pdf-parse';

import path from 'path';

const FILE = path.join(process.cwd(), 'public/data/newsletters/1990_01_January.pdf');
console.log('CWD:', process.cwd());
console.log('Checking File:', FILE);

async function main() {
    if (!fs.existsSync(FILE)) {
        console.log('File not found:', FILE);
        return;
    }

    const dataBuffer = fs.readFileSync(FILE);
    try {
        const data = await pdf(dataBuffer);
        console.log('--- PDF INFO ---');
        console.log('Pages:', data.numpages);
        console.log('Info:', data.info);
        console.log('--- TEXT PREVIEW (First 500 chars) ---');
        console.log(data.text.substring(0, 500));
        console.log('--- END PREVIEW ---');

        if (data.text.trim().length === 0) {
            console.log('RESULT: PDF appears to be empty or effectively an image (scanned).');
        } else {
            console.log('RESULT: PDF contains extractable text.');
        }
    } catch (e) {
        console.error('Error parsing PDF:', e);
    }
}

main();
