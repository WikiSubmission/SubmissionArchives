
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'public/data/newsletters/1990_01_January.pdf');

function analyze(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.log('File not found');
        return;
    }
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('binary');

    // Look for text operators
    // BT = Begin Text object
    // ET = End Text object
    // Tj, TJ = Show text

    const btCount = (content.match(/^BT/gm) || []).length + (content.match(/ BT /g) || []).length;
    const etCount = (content.match(/^ET/gm) || []).length + (content.match(/ ET /g) || []).length;

    console.log(`BT markers: ${btCount}`);
    console.log(`ET markers: ${etCount}`);

    if (btCount > 10) {
        console.log('RESULT: PDF structure suggests it contains TEXT layers.');
    } else {
        console.log('RESULT: PDF structure suggests it is likely an IMAGE scan (few/no text layers).');
    }

    // Attempt to calculate rough text density
    // Text strings are usually (text)Tj or [(text)]TJ
    const textStrings = (content.match(/\([^\)]+\)Tj/g) || []).length;
    console.log(`Text string objects found: ${textStrings}`);
}

analyze(FILE);
