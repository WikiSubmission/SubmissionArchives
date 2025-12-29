import { createRequire } from 'module';
// @ts-ignore
const require = createRequire(import.meta.url);

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const PDF_PATH = 'Gospel of Thomas Lambdin.pdf';
const DEST_PATH = 'public/data/web_nt.json';

async function main() {
    console.log('Reading PDF...');
    const dataBuffer = fs.readFileSync(PDF_PATH);

    // Helper to get pdf function
    const parseArg = pdf;
    const data = await (parseArg as any)(dataBuffer);
    const text = data.text;

    console.log(`Extracted ${text.length} chars.`);

    // Parse Sayings
    // Pattern: Digits at start of line or sentence followed by dot?
    // The PDF likely has "1 And he said..." or "1." 
    // Let's rely on regex finding "N <text> (N+1)" boundaries.

    // Clean text: normalize whitespace
    const cleanText = text.replace(/\s+/g, ' ');

    // Finding Sayings
    const sayings = [];

    // We expect 114 sayings.
    // Regex: look for numbers 1 to 114.
    // CAUTION: Text might contain other numbers.
    // But usually sayings are distinct.

    // Let's try splitting by regex `\s(\d+)\s` and validating sequence.

    let currentSaying = 1;
    let scanIndex = 0;

    // Finds " 1 " or start string "1 "
    // Lambdin translation usually: "1. And he said..."

    while (currentSaying <= 114) {
        // Regex for current saying number boundary
        // Look for number followed by dot or space?
        // Let's assume the text has " 1 " or " 1. " or newline.

        // Simple approach: Split by `\s${nextSaying}\.?\s`
        // But we need to keep the content.

        // Let's iterate.
        // Find index of current number.
        // Note: Number 1 might be at start.

        // Improve regex based on debug output (which we didn't see fully but pdf-parse usually gives linear text).
        // Let's try a robust split.
    }

    // SIMPLER REGEX STRATEGY:
    // /(:?^|\s)(\d+)\.?\s/g 
    // Iterate matches. If match is currentSaying + 1, then everything before is currentSaying.

    const regex = /(?:^|\s)(\d+)\s+/g;
    let match;
    let lastIndex = 0;
    let lastNum = 0;

    const foundSayings = []; // { num: 1, text: "..." }

    // Mock "0" saying to capture preamble if any? No, finding 1 starts it.

    while ((match = regex.exec(cleanText)) !== null) {
        const num = parseInt(match[1]);
        const index = match.index;

        if (num === lastNum + 1) {
            // Validate this is likely the saying number
            // For example, if we found 1, now finding 2.
            // Capture previous text
            if (lastNum > 0) {
                const content = cleanText.substring(lastIndex, index).trim();
                foundSayings.push({ num: lastNum, text: content });
            } else {
                // Found 1. Preamble is before this.
                // console.log("Preamble:", cleanText.substring(0, index));
            }

            lastNum = num;
            lastIndex = index + match[0].length; // skip " 1 "
        }
    }

    // Add the last one (114)
    if (lastNum === 114) {
        const content = cleanText.substring(lastIndex).trim();
        foundSayings.push({ num: 114, text: content });
    }

    console.log(`Found ${foundSayings.length} sayings.`);
    if (foundSayings.length < 114) {
        console.warn('WARNING: Did not find all 114 sayings. Check extracted text.');
        // Dump some text to see what happened
        // console.log(cleanText.substring(0, 1000));
    }

    // 2. Format as Bible Book
    // Thomas has 1 chapter? Or 114 verses?
    // Usually styled as "The Gospel of Thomas" -> One Chapter, 114 Verses.

    const thomasEntry = {
        abbrev: 'THO',
        name: 'Gospel of Thomas',
        chapters: [
            // Chapter 1
            foundSayings.map(s => ({
                num: s.num,
                text: s.text,
                footnotes: []
            }))
        ]
    };

    // 3. Read & Update JSON
    console.log('Reading web_nt.json...');
    const webNtRaw = fs.readFileSync(DEST_PATH, 'utf-8');
    const webNt = JSON.parse(webNtRaw);

    // Remove existing Thomas if any
    const existsIndex = webNt.findIndex((b: any) => b.abbrev === 'THO');
    if (existsIndex >= 0) {
        webNt.splice(existsIndex, 1);
    }

    // Append
    webNt.push(thomasEntry);

    // Write back
    fs.writeFileSync(DEST_PATH, JSON.stringify(webNt, null, 2));
    console.log('Success! Added Gospel of Thomas to web_nt.json');
}

main();
