
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

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
    }
];

const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'other', 'search_index.json');

async function generateIndex() {
    console.log('Generating search index for Other Resources...');
    const index = [];

    for (const item of FILES_TO_INDEX) {
        const filePath = path.join(process.cwd(), 'public', 'other', item.filename);

        if (!fs.existsSync(filePath)) {
            console.warn(`[WARN] File not found: ${filePath}`);
            continue;
        }

        try {
            console.log(`Processing ${item.filename}...`);
            const dataBuffer = fs.readFileSync(filePath);

            let pages: any[] = [];

            await pdf(dataBuffer, {
                pagerender: async function (pageData: any) {
                    const textContent = await pageData.getTextContent();
                    let pageText = '';
                    let lastY;
                    for (let item of textContent.items) {
                        // Simple layout preservation: add newline if Y position changes significantly
                        if (lastY == item.transform[5] || !lastY) {
                            pageText += item.str + " ";
                        } else {
                            pageText += '\n' + item.str + " ";
                        }
                        lastY = item.transform[5];
                    }

                    pageText = pageText.replace(/\s+/g, ' ').trim();

                    pages.push({
                        page: pageData.pageIndex + 1,
                        content: pageText
                    });

                    return pageText;
                }
            });

            // Flatten for full text property (legacy support / backup)
            const fullText = pages.map((p: any) => p.content).join(' ');

            index.push({
                ...item,
                content: fullText,
                pages: pages
            });

            console.log(`  -> Indexed ${pages.length} pages.`);

        } catch (err: any) {
            console.error(`[ERROR] Failed to process ${item.filename}: ${err.message}`);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
    console.log(`\nIndex saved to ${OUTPUT_FILE}`);
    console.log(`Total items indexed: ${index.length}`);
}

generateIndex();
