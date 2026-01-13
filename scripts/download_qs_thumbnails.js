
const fs = require('fs');
const https = require('https');
const path = require('path');

const htmlPath = 'temp_audios.html';
const outputDir = 'public/images/quran-studies';

const html = fs.readFileSync(htmlPath, 'utf8');

// Regex to match the pattern: src=".../QS{number}{maybe_suffix}.jpg"
// Example: src="https://1ga.org/wp-content/uploads/2022/08/QS1.jpg"
// Example: src="https://1ga.org/wp-content/uploads/2022/08/QS31-e1661888774778.jpg"
const regex = /src="(https:\/\/1ga\.org\/wp-content\/uploads\/[^"]*\/QS(\d+)[^"]*\.jpg)"/g;

let match;
const downloads = [];

while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const number = match[2];

    // Check if this number is within 1-51 range
    if (parseInt(number) >= 1 && parseInt(number) <= 51) {
        downloads.push({ url, number });
    }
}

// Ensure unique numbers (some might match multiple times due to srcset)
const uniqueDownloads = new Map();
downloads.forEach(item => {
    if (!uniqueDownloads.has(item.number)) {
        uniqueDownloads.set(item.number, item.url);
    }
});

console.log(`Found ${uniqueDownloads.size} unique Quran Study images.`);

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(true));
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { }); // Delete the file async. (But we don't check the result)
            reject(err.message);
        });
    });
}

async function processDownloads() {
    for (const [number, url] of uniqueDownloads) {
        const dest = path.join(outputDir, `QS${number}.jpg`);
        console.log(`Downloading QS${number} from ${url}...`);
        try {
            await downloadImage(url, dest);
        } catch (err) {
            console.error(`Failed to download QS${number}: ${err}`);
        }
    }
}

processDownloads();
