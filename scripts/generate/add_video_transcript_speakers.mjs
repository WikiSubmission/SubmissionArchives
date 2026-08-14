// Adds a populated Speaker column to the 51 video-transcript CSVs, matching the
// schema already used by the 102 audio-transcript CSVs (same six columns).
//
// Rule, verified against raw rows before being applied at scale (see the
// conversation record — row-level inspection of the debate transcript confirmed
// untagged rows are grammatical continuations of the most recently tagged
// speaker, not a reason to default back to Rashad):
//   1. Rows before any tag appears default to "Dr. Rashad Khalifa" (he opens
//      virtually every one of these).
//   2. A recognized name tag anywhere in a row's text sets the speaker from
//      that point forward — tags can appear mid-row, not only at a row's start.
//   3. Untagged rows carry the most recently seen speaker forward.
//   4. Only a curated allowlist of real names is treated as a tag. A blind
//      "capitalized phrase before a colon" regex produces false positives from
//      ordinary sentences ("The sugar is carbon:", "It says:", "Ask him:") that
//      are not speaker cues at all — confirmed by scanning all 51 files first.
//
// Text content itself is never modified — only the Speaker column is added.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data', 'sources', 'playlists', 'video-transcripts');
const DEFAULT_SPEAKER = 'Dr. Rashad Khalifa';

// Canonical name -> aliases actually observed in the raw captions (see the
// classification scan in the conversation record). Christie/Christina are kept
// distinct per an explicit decision not to merge them.
const CANONICAL = {
    'Dr. Rashad Khalifa': ['The messenger', 'Messenger', 'Dr. Khalifa', 'Dr. KHalifa'],
    'Abdel Rahman': ['Abdel Rahman'],
    'Carole': ['Carole'],
    'Audience': ['Audience'],
    'Ismail': ['Ismail'],
    'Azhar': ['Azhar'],
    'Edip': ['Edip'],
    'Christie': ['Christie'],
    'Christina': ['Christina'],
    'A man': ['A man'],
    'A woman': ['A woman'],
    'Raymond': ['Raymond', 'Raymon'],
    'Sophie': ['Sophie'],
    'People': ['People'],
    'Susan': ['Susan'],
    'Cecilia': ['Cecilia'],
    'Abdullah': ['Abdullah'],
};

const ALIAS_TO_CANONICAL = new Map();
for (const [canonical, aliases] of Object.entries(CANONICAL)) {
    for (const alias of aliases) ALIAS_TO_CANONICAL.set(alias, canonical);
}

// Matches "Name: " anywhere in a row's text, not just at the start (row 206 of
// the debate transcript has a speaker change mid-row).
const ALIAS_PATTERN = new RegExp(
    `(?:^|[.!?]\\s+)(${[...ALIAS_TO_CANONICAL.keys()].map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}):\\s`,
    'g',
);

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

// Returns the speaker in effect by the *end* of this row's text — a row can
// contain a tag partway through (see row 206 example), in which case the row
// hands off to the new speaker rather than staying with the one it opened with.
function speakerAfterRow(text, currentSpeaker) {
    let speaker = currentSpeaker;
    let match;
    ALIAS_PATTERN.lastIndex = 0;
    while ((match = ALIAS_PATTERN.exec(text))) {
        speaker = ALIAS_TO_CANONICAL.get(match[1]);
    }
    return speaker;
}

function processFile(filePath) {
    const rows = parseCsv(fs.readFileSync(filePath, 'utf8'));
    const [header, ...body] = rows;
    const textIdx = header.findIndex((h) => h.trim().toLowerCase() === 'text');
    const speakerIdx = header.findIndex((h) => h.trim().toLowerCase() === 'speaker');

    let currentSpeaker = DEFAULT_SPEAKER;
    let taggedRows = 0;
    const speakersUsed = new Set();

    const outRows = [header];
    for (const row of body) {
        const text = row[textIdx] ?? '';
        const before = currentSpeaker;
        currentSpeaker = speakerAfterRow(text, currentSpeaker);
        if (currentSpeaker !== before || ALIAS_PATTERN.test(text)) taggedRows++;
        speakersUsed.add(currentSpeaker);

        const nextRow = [...row];
        nextRow[speakerIdx] = currentSpeaker;
        outRows.push(nextRow);
    }

    const csv = outRows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
    fs.writeFileSync(filePath, csv, 'utf8');

    return { rows: body.length, taggedRows, speakers: [...speakersUsed] };
}

function main() {
    const files = fs.readdirSync(DIR).filter((f) => /^\d+ - /.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
    for (const file of files) {
        const result = processFile(path.join(DIR, file));
        const multiSpeaker = result.speakers.length > 1;
        console.log(
            `${file.match(/^\d+/)[0].padStart(2)} rows=${String(result.rows).padStart(5)} `
            + `speakers=${result.speakers.length} ${multiSpeaker ? '[' + result.speakers.join(', ') + ']' : ''}`,
        );
    }
    console.log(`\nprocessed ${files.length} files.`);
}

main();
