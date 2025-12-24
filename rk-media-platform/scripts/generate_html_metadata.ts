
import fs from 'fs';
import path from 'path';

const HTML_DIR = path.join(process.cwd(), 'public/data/newsletters/html');
const OUT_FILE = path.join(process.cwd(), 'public/data/newsletters/metadata.json');

const monthsFull: { [key: string]: string } = {
    jan: 'January', jan_2: 'January (Bonus)', feb: 'February', mar: 'March', apr: 'April',
    may: 'May', may_2: 'May (Bonus)', jun: 'June', jul: 'July', aug: 'August',
    sep: 'September', oct: 'October', nov: 'November', dec: 'December'
};

const monthOrder: { [key: string]: number } = {
    jan: 1, jan_2: 1.5, feb: 2, mar: 3, apr: 4, may: 5, may_2: 5.5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

function main() {
    if (!fs.existsSync(HTML_DIR)) {
        console.log("No scraped data found yet.");
        return;
    }

    const files = fs.readdirSync(HTML_DIR).filter(f => f.endsWith('.json'));
    const metadata = files.map(f => {
        try {
            const content = JSON.parse(fs.readFileSync(path.join(HTML_DIR, f), 'utf-8'));
            const { id, year, month } = content;
            const monthName = monthsFull[month] || month;

            return {
                id,
                title: `Submitter Perspectives ${monthName} ${year}`,
                date: `${monthName.toUpperCase()} ${year}`,
                fullDate: `${year}-${String(Math.floor(monthOrder[month] || 0)).padStart(2, '0')}-01`,
                monthSort: monthOrder[month] || 0,
                year: parseInt(year),
                filename: id // used for dynamic route link
            };
        } catch (e) {
            console.error(`Error reading ${f}:`, e);
            return null;
        }
    });

    // Filter nulls and sort
    const validMetadata = metadata.filter((m): m is NonNullable<typeof m> => m !== null);

    validMetadata.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.monthSort - a.monthSort;
    });

    fs.writeFileSync(OUT_FILE, JSON.stringify(validMetadata, null, 2));
    console.log(`Generated metadata for ${validMetadata.length} newsletters.`);
}

main();
