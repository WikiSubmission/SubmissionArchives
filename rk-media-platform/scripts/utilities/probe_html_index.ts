
import https from 'https';
import fs from 'fs';

const URL = 'https://www.masjidtucson.org/publications/books/sp/1990/jan/page1.html';

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

https.get(URL, options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        fs.writeFileSync('temp_newsletter_page.html', data);
        console.log('Saved to temp_newsletter_page.html');
    });
}).on('error', (e) => {
    console.error(e);
});
