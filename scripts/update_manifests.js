import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mapping = {
  "ETERNITY - Screenplay(1).pdf": "eternity-screenplay.pdf",
  "ETERNITY - Screenplay.pdf": "eternity-screenplay.pdf",
  "English Meanings of the Quran(1).pdf": "english-meanings-of-the-quran.pdf",
  "English Meanings of the Quran.pdf": "english-meanings-of-the-quran.pdf",
  "Miracle of Quran - Significance of the Mysterious Alphabets.pdf": "miracle-of-quran-alphabets.pdf",
  "Quran - Visual Presentation of the Miracle.pdf": "quran-visual-presentation.pdf",
  "Quran, Hadith, and Islam(1).pdf": "quran-hadith-islam.pdf",
  "Quran, Hadith, and Islam.pdf": "quran-hadith-islam.pdf",
  "ISLAM - Volume 1, Number 1 (April 1974).pdf": "islam-volume-1-number-1-april-1974.pdf",
  "The Computer Speaks God's Message to the World.pdf": "computer-speaks.pdf",
  "The Contact Prayers.pdf": "salat-booklet.pdf",
  "The Perpetual Miracle of Muhammad.pdf": "perpetual-miracle.pdf",
  "ISLAM - Volume 1, Number 2 (July 1974).pdf": "islam-volume-1-number-2-july-1974.pdf",
  "ISLAM - Volume 1, Number 3 & 4 (January 1975).pdf": "islam-volume-1-number-3-4-january-1975.pdf",
  "Hard Cover 1989.pdf": "hard-cover-1989.pdf",
  "Quran1981.pdf": "quran1981.pdf"
};

// 1. Update corpus_manifest.json
const manifestPath = path.join(__dirname, '../data/sources/books/corpus_manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const item of manifest) {
    if (mapping[item.source_pdf]) {
      item.source_pdf = mapping[item.source_pdf];
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('Updated corpus_manifest.json');
}

// 2. Update individual _complete.json files in data/sources/books/
const booksDir = path.join(__dirname, '../data/sources/books');
for (const slug of fs.readdirSync(booksDir)) {
  const completePath = path.join(booksDir, slug, `${slug}_complete.json`);
  if (fs.existsSync(completePath)) {
    const data = JSON.parse(fs.readFileSync(completePath, 'utf8'));
    let modified = false;
    
    if (data.metadata) {
      if (data.metadata.source_pdf && mapping[data.metadata.source_pdf]) {
        data.metadata.source_pdf = mapping[data.metadata.source_pdf];
        modified = true;
      }
      if (data.metadata.source_file && mapping[data.metadata.source_file]) {
        data.metadata.source_file = mapping[data.metadata.source_file];
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(completePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Updated ${slug}_complete.json`);
    }
  }
}

// 3. Update Quran complete files
const quran1989Path = path.join(__dirname, '../data/sources/quran/1989/Quran1989_complete.json');
if (fs.existsSync(quran1989Path)) {
  const data = JSON.parse(fs.readFileSync(quran1989Path, 'utf8'));
  if (data.manifest && data.manifest.source_file && mapping[data.manifest.source_file]) {
    data.manifest.source_file = mapping[data.manifest.source_file];
    fs.writeFileSync(quran1989Path, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('Updated Quran1989_complete.json');
  }
}

const quran1981Path = path.join(__dirname, '../data/sources/quran/1981/Quran1981_complete.json');
if (fs.existsSync(quran1981Path)) {
  const data = JSON.parse(fs.readFileSync(quran1981Path, 'utf8'));
  if (data.manifest && data.manifest.source_file && mapping[data.manifest.source_file]) {
    data.manifest.source_file = mapping[data.manifest.source_file];
    fs.writeFileSync(quran1981Path, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('Updated Quran1981_complete.json');
  }
}

console.log('Done mapping.');
