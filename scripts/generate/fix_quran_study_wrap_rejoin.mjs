// Fix 3 of the Quran Study transcript normalization pass (see
// data/sources/playlists/audio-transcripts/FIX-PLAN.md, Step 3).
//
// Many of the ~17,000 rows with an embedded line break in Text are just a
// sentence broken mid-thought by a stray non-breaking space + newline from
// the original export -- same speaker, no real content change needed. This
// script only handles that safe case.
//
// A row is a wrap artifact (safe to rejoin) only if NONE of its lines begin
// with a recognized "KnownSpeaker: " prefix, checked against every distinct
// Speaker value actually present in these 52 files (86 labels), not just
// the 9 with confirmed full names. If any line starts with a recognized
// speaker prefix, the row is a genuine multi-speaker exchange and is left
// untouched here -- that's Step 4's job, deliberately kept separate so this
// step carries zero row-count / timestamp risk.
//
// Only the Text column is touched. Never adds or removes rows.
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

function isInScope(filename) {
    const match = filename.match(/^(\d+)\s*-/);
    if (!match) return false;
    const num = Number(match[1]);
    return num >= 1 && num <= 52;
}

function loadAllRows(files) {
    const perFile = new Map();
    for (const file of files) {
        const original = fs.readFileSync(path.join(DIR, file), 'utf8');
        const rows = parseCsv(original);
        perFile.set(file, rows);
    }
    return perFile;
}

// Every distinct Speaker label actually present across the 52 files, used
// to detect a genuine speaker-change line versus a plain wrap. Escaped for
// use inside a regex (several labels contain "." -- "Dr. Khalifa", "Mr.
// Azarshahr").
function collectKnownSpeakers(perFile) {
    const speakers = new Set();
    for (const rows of perFile.values()) {
        const [header, ...body] = rows;
        const speakerIdx = header.findIndex((h) => h.trim().toLowerCase() === 'speaker');
        for (const row of body) {
            const value = (row[speakerIdx] ?? '').trim();
            if (value) speakers.add(value);
        }
    }
    return speakers;
}

function buildSpeakerLinePattern(speakers) {
    const escaped = [...speakers]
        .sort((a, b) => b.length - a.length) // longest first, avoids partial-prefix ambiguity
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`^(?:${escaped.join('|')}):\\s`);
}

function splitLines(text) {
    return text.split(/\r\n|\n|\r/);
}

function processFile(file, rows, speakerLinePattern) {
    const [header, ...body] = rows;
    const textIdx = header.findIndex((h) => h.trim().toLowerCase() === 'text');
    if (textIdx === -1) throw new Error(`No Text column found in ${file}`);

    let flagged = 0;
    let rejoined = 0;
    let deferred = 0;

    const outRows = [header];
    for (const row of body) {
        const nextRow = [...row];
        const text = nextRow[textIdx] ?? '';

        if (!/\r\n|\n|\r/.test(text)) {
            outRows.push(nextRow);
            continue;
        }
        flagged++;

        const lines = splitLines(text);
        const hasSpeakerChange = lines.some((line) => speakerLinePattern.test(line.replace(/^[\s ]+/, '')));

        if (hasSpeakerChange) {
            deferred++;
            outRows.push(nextRow);
            continue;
        }

        const joined = lines
            .map((line) => line.replace(/[\s ]+$/, '').replace(/^[\s ]+/, ''))
            .join(' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
        nextRow[textIdx] = joined;
        rejoined++;
        outRows.push(nextRow);
    }

    if (rejoined > 0) {
        const csv = outRows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
        fs.writeFileSync(path.join(DIR, file), csv, 'utf8');
    }

    return { rows: body.length, flagged, rejoined, deferred };
}

function main() {
    const files = fs.readdirSync(DIR).filter(isInScope).sort((a, b) => parseInt(a) - parseInt(b));
    const perFile = loadAllRows(files);
    const speakers = collectKnownSpeakers(perFile);
    console.log(`Known speaker labels loaded: ${speakers.size}`);
    const speakerLinePattern = buildSpeakerLinePattern(speakers);

    let totalFlagged = 0;
    let totalRejoined = 0;
    let totalDeferred = 0;

    for (const file of files) {
        const result = processFile(file, perFile.get(file), speakerLinePattern);
        totalFlagged += result.flagged;
        totalRejoined += result.rejoined;
        totalDeferred += result.deferred;
        const num = file.match(/^\d+/)[0].padStart(2);
        console.log(`${num} rows=${String(result.rows).padStart(5)} flagged=${String(result.flagged).padStart(4)} rejoined=${String(result.rejoined).padStart(4)} deferred=${String(result.deferred).padStart(3)}`);
    }

    console.log(`\nProcessed ${files.length} files.`);
    console.log(`Flagged (had embedded line break): ${totalFlagged}`);
    console.log(`Rejoined (safe wrap artifact): ${totalRejoined}`);
    console.log(`Deferred to Step 4 (genuine multi-speaker): ${totalDeferred}`);
}

main();
