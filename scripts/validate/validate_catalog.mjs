import fs from 'node:fs';
import path from 'node:path';
import { assertValidArchiveRecords } from '../lib/archive-schema.mjs';

const root = process.cwd();
const masterPath = path.join(root, 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');
const publicDir = path.join(root, 'public');

if (!fs.existsSync(masterPath)) {
  throw new Error(`Missing generated catalog: ${path.relative(root, masterPath)}`);
}

const records = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const report = assertValidArchiveRecords(records, { publicDir });

console.log(`Validated ${report.recordCount} records and ${report.segmentCount} searchable segments.`);
for (const warning of report.warnings) console.warn(`Warning: ${warning}`);
