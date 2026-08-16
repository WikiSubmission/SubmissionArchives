// Fix 7 of the Quran Study transcript normalization pass (see
// data/sources/playlists/audio-transcripts/FIX-PLAN.md, Step 7) -- purely
// additive, Text is never modified.
//
// Adds a HasArabic boolean column via Unicode range detection: the Arabic
// block (U+0600-U+06FF) plus the Arabic Supplement block (U+0750-U+077F),
// the same range already used for VerseLang detection in Step 6 and for
// the original audit (confirmed 50/52 files contain Arabic script, no
// false positives).
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data', 'sources', 'playlists', 'audio-transcripts');
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿ]/;

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
            else field += char;
            continue;
        }
        if (char === '"') { inQuotes = true; continue; }
        if (char === ',') { row.push(field); field = ''; continue; }
        if (char === '\r') continue;
        if (char === '\n') { row.push(field); if (row.some((c) => c.trim())) rows.push(row); row = []; field = ''; continue; }
        field += char;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); if (row.some((c) => c.trim())) rows.push(row); }
    return rows;
}

function csvField(value) {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
}

function isInScope(filename) {
    const match = filename.match(/^(\d+)\s*-/);
    if (!match) return false;
    const num = Number(match[1]);
    return num >= 1 && num <= 52;
}

function processFile(filePath) {
    const original = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(original);
    const [header, ...body] = rows;
    const textIdx = header.findIndex((h) => h.trim().toLowerCase() === 'text');
    if (textIdx === -1) throw new Error(`No Text column found in ${filePath}`);

    const newHeader = [...header, 'HasArabic'];
    const outRows = [newHeader];

    let flaggedCount = 0;
    for (const row of body) {
        const text = row[textIdx] ?? '';
        const hasArabic = ARABIC_SCRIPT.test(text);
        if (hasArabic) flaggedCount++;
        outRows.push([...row, hasArabic ? 'true' : 'false']);
    }

    const csv = outRows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
    fs.writeFileSync(filePath, csv, 'utf8');

    return { rows: body.length, flaggedCount };
}

function main() {
    const files = fs.readdirSync(DIR).filter(isInScope).sort((a, b) => parseInt(a) - parseInt(b));
    let totalRows = 0;
    let totalFlagged = 0;
    let filesWithArabic = 0;

    for (const file of files) {
        const result = processFile(path.join(DIR, file));
        totalRows += result.rows;
        totalFlagged += result.flaggedCount;
        if (result.flaggedCount > 0) filesWithArabic++;
        const num = file.match(/^\d+/)[0].padStart(2);
        console.log(`${num} rows=${String(result.rows).padStart(5)} hasArabicRows=${result.flaggedCount}`);
    }

    console.log(`\nProcessed ${files.length} files, ${filesWithArabic} contain Arabic script (expected 50).`);
    console.log(`Total rows: ${totalRows}, rows flagged HasArabic=true: ${totalFlagged}`);
}

main();
