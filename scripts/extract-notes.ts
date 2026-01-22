
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const NOTES_DIR = path.join(process.cwd(), 'public/quran-study-notes');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/notes/quran-studies.json');

async function extractNotes() {
    const files = fs.readdirSync(NOTES_DIR).filter(f => f.endsWith('.pdf'));
    fs.writeFileSync('extraction_debug.txt', `Found ${files.length} PDF files in ${NOTES_DIR}\n`);
    const notesData = [];

    for (const file of files) {
        fs.appendFileSync('extraction_debug.txt', `Processing ${file}...\n`);
        const filePath = path.join(NOTES_DIR, file);
        const dataBuffer = fs.readFileSync(filePath);

        try {
            const data = await pdfParse(dataBuffer);
            // Quick cleanup of text
            const text = data.text
                .replace(/\n\s*\n/g, '\n\n') // Normalize paragraphs
                .trim();

            // Extract number from filename (QS1QN -> 1)
            const match = file.match(/QS(\d+)QN/);
            const studyNumber = match ? parseInt(match[1]) : 0;

            notesData.push({
                id: `qs-${studyNumber}`,
                studyNumber,
                title: `Quran Study ${studyNumber}`,
                filename: file,
                content: text
            });
        } catch (e) {
            console.error(`Failed to parse ${file}`, e);
            fs.appendFileSync('extraction_debug.txt', `ERROR parsing ${file}: ${e}\n`);
        }
    }

    // Sort by study number
    notesData.sort((a, b) => a.studyNumber - b.studyNumber);

    // Ensure output dir exists
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(notesData, null, 2));
    console.log(`Saved ${notesData.length} notes to ${OUTPUT_FILE}`);
}

extractNotes();
