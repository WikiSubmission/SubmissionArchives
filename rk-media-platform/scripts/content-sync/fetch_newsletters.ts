import https from 'https';
import fs from 'fs';

const url = 'https://www.masjidtucson.org/publications/books/SP/';

function fetch(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
    });
}

async function main() {
    try {
        console.log('Fetching base page...');
        const html = await fetch(url);
        fs.writeFileSync('temp_sp_index.html', html);
        console.log('Saved temp_sp_index.html');

        // Quick regex check in log
        const linkRegex = /<a href="([^"]+\.pdf)"/g;
        let match;
        let count = 0;
        while ((match = linkRegex.exec(html)) !== null) {
            count++;
        }
        console.log(`Found ${count} PDF links.`);

    } catch (e) {
        console.error(e);
    }
}

main();
