
import fs from 'fs';
import path from 'path';

console.log('Hello from test env');
console.log('CWD:', process.cwd());
const p = path.join(process.cwd(), 'public/data/newsletters/1990_01_January.pdf');
console.log('Exists:', fs.existsSync(p));
