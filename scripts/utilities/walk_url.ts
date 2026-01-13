
import https from 'https';

const validHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
};

const paths = [
    'https://www.masjidtucson.org/',
    'https://www.masjidtucson.org/publications/',
    'https://www.masjidtucson.org/publications/books/',
    'https://www.masjidtucson.org/publications/books/sp/',
    'https://www.masjidtucson.org/publications/books/sp/index.html',
    'https://www.masjidtucson.org/publications/books/sp/tab_index.html',
    'https://www.masjidtucson.org/newsletters/', // Guess
    'https://www.masjidtucson.org/submitters_perspective/' // Guess
];

function check(url: string) {
    return new Promise((resolve) => {
        https.get(url, { headers: validHeaders }, (res) => {
            console.log(`[${res.statusCode}] ${url}`);
            resolve(true);
        }).on('error', (e) => {
            console.log(`[ERR] ${url} - ${e.message}`);
            resolve(false);
        });
    });
}

async function main() {
    for (const p of paths) {
        await check(p);
    }
}

main();
