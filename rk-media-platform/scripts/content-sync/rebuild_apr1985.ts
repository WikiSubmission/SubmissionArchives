
import fs from 'fs';
import path from 'path';
import https from 'https';

const TARGET_FILE = path.join(process.cwd(), 'public/data/newsletters/html/1985_apr.json');

const URLS = [
    'https://www.masjidtucson.org/publications/books/sp/1985/apr/page1.html',
    'https://www.masjidtucson.org/publications/books/sp/1985/apr/page2.html',
    'https://www.masjidtucson.org/publications/books/sp/1985/apr/page3.html',
    'https://www.masjidtucson.org/publications/books/sp/1985/apr/page4.html'
];

async function fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function processHtml(html: string, pageNum: number): string {
    return `\n<!-- Page ${pageNum} Source -->\n<div class="newsletter-page" id="page-${pageNum}">\n${html}\n</div>\n`;
}

async function main() {
    console.log(`Fetching ${URLS.length} pages for April 1985...`);

    let allHtml = '';

    for (let i = 0; i < URLS.length; i++) {
        console.log(`Fetching ${URLS[i]}...`);
        try {
            const html = await fetchUrl(URLS[i]);
            allHtml += processHtml(html, i + 1);
        } catch (e) {
            console.error(`Error fetching ${URLS[i]}:`, e);
        }
    }

    let existingData: any = {};
    if (fs.existsSync(TARGET_FILE)) {
        existingData = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf-8'));
    }

    const newData = {
        id: "1985_apr",
        year: 1985,
        month: "apr",
        document: existingData.document || {},
        html: allHtml,
        scrapedAt: new Date().toISOString()
    };

    // Ensure directory exists
    const dir = path.dirname(TARGET_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(TARGET_FILE, JSON.stringify(newData, null, 2));
    console.log(`Updated ${TARGET_FILE}`);
}

main().catch(console.error);
