
import https from 'https';

const BASE_URL = 'https://www.masjidtucson.org/publications/books/sp/';

const PATTERNS = [
    '2015/january.pdf',
    '2015/January.pdf',
    '2015/jan.pdf',
    '2015/Jan.pdf',
    '2015/sp_2015_jan.pdf',
    '2015/SP_Jan_2015.pdf'
];

async function check(path: string) {
    return new Promise((resolve) => {
        const url = BASE_URL + path;
        console.log(`Checking ${url}...`);
        const req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 200) {
                console.log(`[FOUND!] ${url}`);
                resolve(true);
            } else {
                console.log(`[${res.statusCode}]`);
                resolve(false);
            }
        });
        req.on('error', (e) => {
            console.log(`[ERR] ${e.message}`);
            resolve(false);
        });
        req.end();
    });
}

async function main() {
    for (const p of PATTERNS) {
        if (await check(p)) {
            process.exit(0);
        }
    }
}

main();
