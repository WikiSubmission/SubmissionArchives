
import https from 'https';

const BASE_URL = 'https://www.masjidtucson.org/publications/books/sp/';
const YEAR = 1985;
const MONTH = 'February';

const PATTERNS = [
    `${YEAR}/${MONTH}.pdf`,
    `${YEAR}/${MONTH.toLowerCase()}.pdf`,
    `${YEAR}/${MONTH.substring(0, 3)}.pdf`,
    `${YEAR}/${MONTH.substring(0, 3).toLowerCase()}.pdf`,
    `${YEAR}/${MONTH.toUpperCase()}.pdf`,
    `${YEAR}/${YEAR}_${MONTH.substring(0, 3).toLowerCase()}.pdf`,
    `${YEAR}/${MONTH.substring(0, 3)}_${YEAR}.pdf`,
    `1985-1990/${MONTH}_${YEAR}.pdf`,
    `1985-1990/${YEAR}/${MONTH}.pdf`,
    // Try without year folder
    `${MONTH}${YEAR}.pdf`,
    `${MONTH.toLowerCase()}${YEAR}.pdf`,
    // Try 1990 just in case 1985 is missing
    `1990/January.pdf`,
    `1990/january.pdf`,
    `1990/jan.pdf`,
    // Try the "books/sp/..." part variations
];

async function check(path: string) {
    return new Promise((resolve) => {
        const url = BASE_URL + path;
        const req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 200) {
                console.log(`[FOUND!] ${url}`);
                resolve(true);
            } else {
                console.log(`[${res.statusCode}] ${url}`);
                resolve(false);
            }
        });
        req.on('error', () => resolve(false));
        req.end();
    });
}

async function main() {
    console.log('Probing paths...');
    for (const p of PATTERNS) {
        if (await check(p)) {
            process.exit(0);
        }
    }
    console.log('No matches found.');
}

main();
