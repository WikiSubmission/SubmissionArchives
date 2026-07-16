import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const generatedDir = path.join(root, 'public', 'data', 'generated_indices');
const files = [
  path.join(generatedDir, 'ASSET_MANIFEST.csv'),
  path.join(generatedDir, 'BOOKS_LIST.json'),
  path.join(generatedDir, 'CATALOG_VALIDATION.json'),
  path.join(generatedDir, 'MASTER_INDEX.json'),
  path.join(generatedDir, 'QURAN_CHAPTERS.json'),
];

function digest(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const before = new Map(files.map((filePath) => [filePath, digest(filePath)]));
const result = spawnSync(process.execPath, ['scripts/generate/generate_catalog_search_indices.mjs'], {
  cwd: root,
  encoding: 'utf8',
});

if (result.status !== 0) {
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  process.exit(result.status || 1);
}

const changed = files.filter((filePath) => before.get(filePath) !== digest(filePath));
if (changed.length > 0) {
  throw new Error(`Catalog generation is not reproducible:\n${changed.map((filePath) => `- ${path.relative(root, filePath)}`).join('\n')}`);
}

console.log(`Catalog generation is reproducible across ${files.length} generated artifacts.`);
