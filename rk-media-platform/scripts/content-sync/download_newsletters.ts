
import https from 'https';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.masjidtucson.org/publications/books/sp/';
const OUT_DIR = 'public/data/newsletters';

const YEARS = [1985, 1986, 1987, 1988, 1989, 1990];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

function checkAndDownload(year: number, month: string): Promise<{ filename: string, url: string } | null> {
    return new Promise(async (resolve) => {
        // Try multiple formats
        const candidates = [
            `${year}/${month}.pdf`,
            `${year}/${month.toLowerCase()}.pdf`,
            `${year}/${month.substring(0, 3)}.pdf`, // Jan.pdf ?
            // Rare cases for older sites
        ];

        for (const relativePath of candidates) {
            const url = BASE_URL + relativePath;
            const success = await new Promise<boolean>((res) => {
                const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
                    if (response.statusCode === 200) {
                        // Found! Download it.
                        const filename = `${year}_${month}.pdf`;
                        const file = fs.createWriteStream(path.join(OUT_DIR, filename));
                        response.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            console.log(`Downloaded: ${filename} from ${url}`);
                            res(true);
                        });
                    } else {
                        response.resume(); // Consume
                        res(false);
                    }
                });
                req.on('error', () => res(false));
            });

            if (success) {
                resolve({ filename: `${year}_${month}.pdf`, url });
                return;
            }
        }
        resolve(null);
    });
}

async function main() {
    const metadata: any[] = [];

    for (const year of YEARS) {
        for (let i = 0; i < MONTHS.length; i++) {
            const month = MONTHS[i];
            // Skip 1985 Jan (started Feb per search/screenshot)
            if (year === 1985 && i === 0) continue;
            // Stop after March 1990 (per screenshot)
            if (year === 1990 && i > 2) continue;

            const result = await checkAndDownload(year, month);
            if (result) {
                metadata.push({
                    title: `Submitter Perspective ${month} ${year}`,
                    date: `${month} ${year}`, // For display
                    sortDate: `${year}-${(i + 1).toString().padStart(2, '0')}-01`, // ISO for sorting
                    filename: result.filename,
                    url: result.url
                });
            } else {
                console.log(`Missing: ${month} ${year}`);
            }
        }
    }

    fs.writeFileSync(path.join(OUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
    console.log(`Downloaded ${metadata.length} newsletters.`);
}

main();
