import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const mdPath = path.join(ROOT, 'data', 'sources', 'quran', '1981', 'source-markdown', 'quran-complete.md');
const outDir = path.join(ROOT, 'data', 'sources', 'quran', '1981');
fs.mkdirSync(outDir, { recursive: true });

const content = fs.readFileSync(mdPath, 'utf8');
const lines = content.split('\n');

const verses = [];
const footnotes = [];
const subheadings = [];

let currentChapter = 0;
let currentVerse = 0;
let nextSubheading = [];
let inFootnotes = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();

  // If we hit a chapter heading, we exit footnotes
  if (line.startsWith('## Sura ')) {
    const match = line.match(/^## Sura (\d+):/);
    if (match) {
      currentChapter = Number(match[1]);
      currentVerse = 0;
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
    // Some source pages place a footnote block in the middle of a sura. Resume
    // verse parsing when the next sequential numbered verse begins.
    const resumedVerse = line.match(/^(\d+)\.\s*(.*)/);
    if (resumedVerse && Number(resumedVerse[1]) === currentVerse + 1) {
      inFootnotes = false;
    }
  }

  if (inFootnotes) {
    if (!line) {
      if (footnotes.length > 0) {
        footnotes[footnotes.length - 1].text += '\n\n';
      }
      continue;
    }

    const fnMatch = line.match(/^(\d+:\d+(?:-\d+)?(?:\s*(?:&|and)\s*\d+)?(?:\s*\[[^\]]+\])?)(?:\s*\(\\?\*+\))?\.\s*(.*)/);
    if (fnMatch) {
      const printedReference = fnMatch[1];
      const verseReference = printedReference.replace(/\s*\[[^\]]+\]\s*$/, '').trim();
      const anchorMatch = verseReference.match(/^(\d+:\d+)/);
      const sourceAnnotation = printedReference.match(/\[([^\]]+)\]/)?.[1];
      footnotes.push({
        verse_reference: verseReference,
        verse_id: anchorMatch?.[1] || verseReference,
        text: sourceAnnotation ? `[${sourceAnnotation}] ${fnMatch[2]}` : fnMatch[2]
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
    if (/\d+:\d+-\d+\s*(?:—|â€”|-)\s*p\./.test(line)) {
      continue;
    }
    nextSubheading.push(line.replace(/^\*+/, '').replace(/\*+$/, '').replace(/\\$/, '').trim());
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
    currentVerse = verseNum;

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

const uniqueVerseIds = new Set(verses.map((verse) => verse.verse_id));
if (verses.length !== 6236 || uniqueVerseIds.size !== 6236) {
  throw new Error(`Expected 6,236 unique numbered verses for the complete 1981 edition, found ${verses.length} rows / ${uniqueVerseIds.size} unique IDs`);
}

writeCsv('Quran1981_verse_index.csv', ['verse_id', 'english_1981'], verses.map(v => ({ verse_id: v.verse_id, english_1981: v.english })));
writeCsv('Quran1981_footnotes.csv', ['verse_reference', 'verse_id', 'text'], footnotes.map(f => ({
  verse_reference: f.verse_reference,
  verse_id: f.verse_id,
  text: f.text.trim()
})));
writeCsv('Quran1981_subheadings.csv', ['verse_id', 'text'], subheadings.map(s => ({ verse_id: s.verse_id, text: s.text })));

console.log(`Extracted ${verses.length} verses, ${footnotes.length} footnotes, ${subheadings.length} subheadings to ${outDir}`);
