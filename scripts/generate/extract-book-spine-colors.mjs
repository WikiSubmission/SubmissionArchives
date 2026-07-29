// Samples each book cover's average color at build time so the 3D cuboid's
// spine and edge faces can be color-matched to cover art that has no
// separate spine or back-cover photography.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const BOOKS_LIST_PATH = path.join(ROOT, 'public', 'data', 'generated_indices', 'BOOKS_LIST.json');
const OUTPUT_PATH = path.join(ROOT, 'public', 'data', 'generated_indices', 'BOOK_SPINE_COLORS.json');

function toHex(channel) {
  return Math.round(channel).toString(16).padStart(2, '0');
}

async function averageColorHex(imagePath) {
  const { data } = await sharp(imagePath).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function main() {
  const books = JSON.parse(fs.readFileSync(BOOKS_LIST_PATH, 'utf8')).filter(
    (book) => book.category === 'Books' && book.thumbnailOverride,
  );

  const colors = {};
  for (const book of books) {
    const imagePath = path.join(ROOT, 'public', book.thumbnailOverride);
    colors[book.id] = await averageColorHex(imagePath);
    console.log(`${book.id}: ${colors[book.id]}`);
  }

  const sorted = Object.fromEntries(Object.entries(colors).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log('wrote', path.relative(ROOT, OUTPUT_PATH));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
