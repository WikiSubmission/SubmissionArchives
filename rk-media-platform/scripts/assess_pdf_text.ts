
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const FILES = [
    'salat_booklet.pdf',
    'quran_hadith_islam.pdf',
    'computer_speaks.pdf',
    'quran_visual_presentation.pdf',
    'perpetual_miracle.pdf',
    'miracle_of_quran_alphabets.pdf'
];

async function assessPdfs() {
    const results = [];

    for (const file of FILES) {
        const filePath = path.join(process.cwd(), 'public', 'other', file);
        if (!fs.existsSync(filePath)) {
            console.log(`[MISSING] ${file}`);
            continue;
        }

        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);

            const text = data.text.trim();
            const charCount = text.length;
            const snippet = text.substring(0, 200).replace(/\n/g, ' ');
            const looksLikeScan = charCount < 100; // Arbitrary threshold for "scanned"

            results.push({
                file,
                charCount,
                pages: data.numpages,
                looksLikeScan,
                snippet
            });

        } catch (err: any) {
            console.error(`[ERROR] ${file}: ${err.message}`);
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

assessPdfs();
