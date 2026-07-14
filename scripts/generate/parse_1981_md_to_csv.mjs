import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const mdPath = path.join(ROOT, '1981_Quran_Complete.md');
const outDir = path.join(ROOT, 'data', 'sources', 'quran', '1981');
fs.mkdirSync(outDir, { recursive: true });

const content = fs.readFileSync(mdPath, 'utf8');
const lines = content.split('\n');

const verses = [];
const footnotes = [];
const subheadings = [];

let currentChapter = 0;
let nextSubheading = [];
let inFootnotes = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();

  // If we hit a chapter heading, we exit footnotes
  if (line.startsWith('## Sura ')) {
    const match = line.match(/^## Sura (\d+):/);
    if (match) {
      currentChapter = Number(match[1]);
      inFootnotes = false;
      nextSubheading = [];
    }
    continue;
  }

  if (line === '**Footnotes:**') {
    inFootnotes = true;
    continue;
  }

  if (line === '---') {
    continue; // Section break
  }

  if (inFootnotes) {
    if (!line) {
      if (footnotes.length > 0) {
        footnotes[footnotes.length - 1].text += '\n\n';
      }
      continue;
    }

    const fnMatch = line.match(/^(\d+:\d+)\.\s*(.*)/);
    if (fnMatch) {
      footnotes.push({
        verse_id: fnMatch[1],
        text: fnMatch[2]
      });
    } else {
      if (footnotes.length > 0) {
        const last = footnotes[footnotes.length - 1];
        if (last.text.endsWith('\n\n')) {
          last.text += line;
        } else {
          last.text += ' ' + line;
        }
      }
    }
    continue;
  }

  if (!line) continue;

  if (line.startsWith('*') && line.endsWith('*')) {
    // Skip page headers like "*The Heifer (Al-Baqarah) 2:1-10 — p. 2 / ...*"
    if (line.match(/\d+:\d+-\d+\s*—/)) {
      continue;
    }
    nextSubheading.push(line.replace(/^\*+/, '').replace(/\*+$/, '').trim());
    continue;
  }

  const verseMatch = line.match(/^(\d+)\.\s*(.*)/);
  if (verseMatch) {
    const verseNum = Number(verseMatch[1]);
    let text = verseMatch[2];
    
    // Remove trailing asterisk which denotes a footnote
    if (text.endsWith('*')) {
      text = text.slice(0, -1).trim();
    }

    const verseId = `${currentChapter}:${verseNum}`;

    verses.push({
      verse_id: verseId,
      english: text
    });

    if (nextSubheading.length > 0) {
      subheadings.push({
        verse_id: verseId,
        text: nextSubheading.join('\n')
      });
      nextSubheading = [];
    }
    continue;
  }
}

function csvEscape(value) {
  if (value === undefined || value === null) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filename, headers, rows) {
  const fileLines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => csvEscape(row[h])).join(','))
  ];
  fs.writeFileSync(path.join(outDir, filename), fileLines.join('\n'));
}

writeCsv('Quran1981_verse_index.csv', ['verse_id', 'english_1981'], verses.map(v => ({ verse_id: v.verse_id, english_1981: v.english })));
writeCsv('Quran1981_footnotes.csv', ['verse_id', 'text'], footnotes.map(f => ({ verse_id: f.verse_id, text: f.text.trim() })));
writeCsv('Quran1981_subheadings.csv', ['verse_id', 'text'], subheadings.map(s => ({ verse_id: s.verse_id, text: s.text })));

console.log(`Extracted ${verses.length} verses, ${footnotes.length} footnotes, ${subheadings.length} subheadings to ${outDir}`);
