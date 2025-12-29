
import fs from 'fs';
import path from 'path';

const META_FILE = path.join(process.cwd(), 'public/data/newsletters/metadata.json');
const HTML_DIR = path.join(process.cwd(), 'public/data/newsletters/html');
const OUT_INDEX = path.join(process.cwd(), 'public/data/newsletters/search_index.json');

function stripHtml(html: string) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function main() {
    if (!fs.existsSync(META_FILE)) {
        console.error("Metadata not found.");
        return;
    }

    const metadata = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
    const searchIndex = [];

    for (const item of metadata) {
        const jsonPath = path.join(HTML_DIR, `${item.id}.json`);
        if (fs.existsSync(jsonPath)) {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            const textContent = stripHtml(data.html);

            searchIndex.push({
                id: item.id,
                title: item.title,
                displayDate: item.date,
                fullDate: item.fullDate,
                filename: item.id, // for link
                content: textContent
            });
        }
    }

    fs.writeFileSync(OUT_INDEX, JSON.stringify(searchIndex, null, 2));
    console.log(`Built search index with ${searchIndex.length} items.`);
}

main();
