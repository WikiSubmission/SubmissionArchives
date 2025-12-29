import { createRequire } from 'module';
// @ts-ignore
const require = createRequire(import.meta.url);

const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('Gospel of Thomas Lambdin.pdf');

console.log('PDF Import:', pdf);
// Try executing usage if it is a function
const parseArg = pdf;
if (typeof parseArg === 'function') {
    parseArg(dataBuffer).then(function (data: any) {
        console.log(data.text);
    });
} else {
    console.log('PDF Parse is not a function:', typeof parseArg);
}
