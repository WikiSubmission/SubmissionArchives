
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

// Configuration
const OTHER_DIR = path.join(process.cwd(), 'public/other');
const OUTPUT_FILE = path.join(process.cwd(), 'public/data/other/search_index.json');
const PAGE_DELIMITER = '||PAGE_BREAK||';

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

async function renderPage(pageData: any) {
    // Extract text from the page
    const renderOptions = {
        normalizeWhitespace: true,
        disableCombineTextItems: false
    };

    const textContent = await pageData.getTextContent(renderOptions);

    // Simple text reconstruction
    // We wrap it to just map items and append our delimiter
    const pageText = textContent.items.map((item: any) => item.str).join(' ');

    return pageText + PAGE_DELIMITER;
}

async function generateIndex() {
    console.log('Generating search index for Other Resources...');
    const index = [];

    for (const item of FILES_TO_INDEX) {
        const filePath = path.join(OTHER_DIR, item.filename);

        if (!fs.existsSync(filePath)) {
            console.warn(`[WARN] File not found: ${filePath}`);
            continue;
        }

        console.log(`Processing ${item.filename}...`);
        const dataBuffer = fs.readFileSync(filePath);

        try {
            const data = await pdfParse(dataBuffer, {
                pagerender: renderPage
            });

            // Split content by delimiter to get pages
            const rawPages = data.text.split(PAGE_DELIMITER);
            const pages = rawPages
                .map((content, idx) => {
                    const cleanContent = content.trim();
                    if (!cleanContent) return null;
                    return {
                        page: idx + 1,
                        content: cleanContent
                    };
                })
                .filter(p => p !== null);

            const fullContent = pages.map(p => p?.content).join(' ');

            index.push({
                ...item,
                content: fullContent,
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
