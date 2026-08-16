// Fix 1 of the Quran Study transcript normalization pass (see
// data/sources/playlists/audio-transcripts/FIX-PLAN.md, Step 1).
//
// `ã` (U+00E3, "a with tilde") stands in for `ā` (macron-a) throughout the
// Quran Study transcripts — confirmed by checking actual Unicode codepoints
// against the affected words (Al-Fãtehah, Mã Shã Allãh, M�lek, etc.), all of
// which are Arabic-transliteration terms that should carry a macron. No
// legitimate use of ã was found anywhere in the corpus.
//
// Only the Text column is touched. Video Title, Link, Start Time, End Time,
// and Speaker are never modified by this script.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data', 'sources', 'playlists', 'audio-transcripts');

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

// Files 01-52 only — the Quran Study batch. 53+ (Messenger Audio, Friday
// Sermons, etc.) are a different set and out of scope for this pass.
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

    let replacements = 0;
    const outRows = [header];
    for (const row of body) {
        const nextRow = [...row];
        const text = nextRow[textIdx] ?? '';
        const matches = text.match(/ã/g);
        if (matches) {
            replacements += matches.length;
            nextRow[textIdx] = text.replace(/ã/g, 'ā');
        }
        outRows.push(nextRow);
    }

    if (replacements > 0) {
        const csv = outRows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
        fs.writeFileSync(filePath, csv, 'utf8');
    }

    return { rows: body.length, replacements };
}

function main() {
    const files = fs.readdirSync(DIR).filter(isInScope).sort((a, b) => parseInt(a) - parseInt(b));
    let totalReplacements = 0;
    let filesChanged = 0;

    for (const file of files) {
        const result = processFile(path.join(DIR, file));
        totalReplacements += result.replacements;
        if (result.replacements > 0) filesChanged++;
        const num = file.match(/^\d+/)[0].padStart(2);
        console.log(`${num} rows=${String(result.rows).padStart(5)} replacements=${result.replacements}`);
    }

    console.log(`\nProcessed ${files.length} files, ${filesChanged} changed, ${totalReplacements} total ã→ā replacements.`);
}

main();
