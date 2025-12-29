
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const pdfModule = require('pdf-parse');

const PDF_PATH = 'Gospel of Thomas Lambdin.pdf';
const DEST_PATH = 'public/data/web_nt.json';

async function main() {
    console.log('Reading PDF...');
    const dataBuffer = fs.readFileSync(PDF_PATH);

    console.log('Module keys:', Object.keys(pdfModule));

    let text = '';

    // Standard API for v1.1.1
    if (typeof pdfModule === 'function') {
        try {
            const data = await pdfModule(dataBuffer);
            text = data.text;
        } catch (e) {
            console.error('Standard usage failed:', e);
        }
    } else {
        console.error('Still not a function after reinstall?', pdfModule);
    }

    if (!text) {
        console.error('FAILED TO GET TEXT. ABORTING.');
        return;
    }
    if (text) {
        fs.writeFileSync('thomas_raw.txt', text);
    }

    console.log(`Extracted ${text.length} chars.`);

    // Logic to parse Thomas
    const cleanText = text.replace(/\s+/g, ' ');
    // Regex: Handle (N) or N. or N followed by space
    const regex = /(?:^|\s)(?:\((\d+)\)|(\d+)\.?)\s+/g;
    let match;
    let lastIndex = 0;
    let lastNum = 0;

    const foundSayings = [];

    while ((match = regex.exec(cleanText)) !== null) {
        // Group 1 is (N), Group 2 is N.
        const numStr = match[1] || match[2];
        if (!numStr) continue;
        const num = parseInt(numStr);
        const index = match.index;

        // Gap check lenient
        if (num > lastNum && num <= lastNum + 10) {
            if (lastNum > 0) {
                const content = cleanText.substring(lastIndex, index).trim();
                foundSayings.push({ num: lastNum, text: content });
            }
            if (num > lastNum + 1) {
                console.log(`Warning: Skipped from ${lastNum} to ${num}`);
            }
            lastNum = num;
            lastIndex = index + match[0].length;
        }
    }
    if (lastNum === 114) {
        const content = cleanText.substring(lastIndex).trim();
        foundSayings.push({ num: 114, text: content });
    }

    console.log(`Found ${foundSayings.length} sayings.`);

    if (foundSayings.length > 0) {
        const thomasEntry = {
            abbrev: 'THO',
            name: 'Gospel of Thomas',
            chapters: [
                foundSayings.map(s => ({
                    num: s.num,
                    text: s.text,
                    footnotes: []
                }))
            ]
        };

        console.log('Reading web_nt.json...');
        const webNtRaw = fs.readFileSync(DEST_PATH, 'utf-8');
        const webNt = JSON.parse(webNtRaw);

        const existsIndex = webNt.findIndex((b) => b.abbrev === 'THO');
        if (existsIndex >= 0) webNt.splice(existsIndex, 1);
        webNt.push(thomasEntry);
        fs.writeFileSync(DEST_PATH, JSON.stringify(webNt, null, 2));
        console.log('Success! Added Gospel of Thomas to web_nt.json');
    }
}

main();
