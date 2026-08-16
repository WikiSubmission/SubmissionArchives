// Fix 5 of the Quran Study transcript normalization pass (see
// data/sources/playlists/audio-transcripts/FIX-PLAN.md, Step 5).
//
// Exact-match replacement on the Speaker column only, using the 9 names
// confirmed across transcripts, newsletters, the Quran translation itself,
// and books (see NORMALIZATION-NOTES.md). Everything not on this list is
// left untouched -- including Ahmad/Ahmed (too common a name to force one
// spelling per instruction) and bare "Mahmoud" (ambiguous: distinct from
// both "Dr. Sabahi" and the already-correct "Mahmoud Abib" label,
// resolved case-by-case in context, not by a blanket rule).
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data', 'sources', 'playlists', 'audio-transcripts');

const CANONICAL_SPEAKERS = {
    'Dr. Sabahi': 'Dr. Mahmoud Sabahi',
    'Apamea': 'Apamea Bashar',
    'Feroz': 'Feroz Karmally',
    'Farhad': "Farhad Mo'ini",
    'Ihsan': 'Ihsan Ramadan',
    'Linda': 'Linda Baroni',
    'Gatut': 'Gatut Adisoma',
    'Shakira': 'Shakira Karipineni',
    'Parivash': 'Parivash Ettefagh',
};

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
    const speakerIdx = header.findIndex((h) => h.trim().toLowerCase() === 'speaker');
    if (speakerIdx === -1) throw new Error(`No Speaker column found in ${filePath}`);

    const perNameCounts = {};
    let totalReplacements = 0;
    const outRows = [header];
    for (const row of body) {
        const nextRow = [...row];
        const value = (nextRow[speakerIdx] ?? '').trim();
        const canonical = CANONICAL_SPEAKERS[value];
        if (canonical) {
            nextRow[speakerIdx] = canonical;
            perNameCounts[value] = (perNameCounts[value] ?? 0) + 1;
            totalReplacements++;
        }
        outRows.push(nextRow);
    }

    if (totalReplacements > 0) {
        const csv = outRows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
        fs.writeFileSync(filePath, csv, 'utf8');
    }

    return { rows: body.length, totalReplacements, perNameCounts };
}

function main() {
    const files = fs.readdirSync(DIR).filter(isInScope).sort((a, b) => parseInt(a) - parseInt(b));
    const grandTotals = {};
    let totalReplacements = 0;

    for (const file of files) {
        const result = processFile(path.join(DIR, file));
        totalReplacements += result.totalReplacements;
        for (const [name, count] of Object.entries(result.perNameCounts)) {
            grandTotals[name] = (grandTotals[name] ?? 0) + count;
        }
        const num = file.match(/^\d+/)[0].padStart(2);
        console.log(`${num} rows=${String(result.rows).padStart(5)} replacements=${result.totalReplacements}`);
    }

    console.log(`\nProcessed ${files.length} files, ${totalReplacements} total speaker replacements.`);
    for (const [name, canonical] of Object.entries(CANONICAL_SPEAKERS)) {
        console.log(`  ${name} -> ${canonical}: ${grandTotals[name] ?? 0}`);
    }
}

main();
