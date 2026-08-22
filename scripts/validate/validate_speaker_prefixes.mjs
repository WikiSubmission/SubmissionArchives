// Enforces the leading-prefix rule on the transcripts: if a caption bubble opens with
// "NAME:", that names the speaker of the bubble, so the Speaker column must agree.
//
// This is the strongest evidence available about who is speaking, because the transcriber
// wrote the name into the text. It is a build check rather than a review item because the
// review missed it repeatedly: files 05, 06 and 11 held 186 violations between them, and
// two earlier hand methods were structurally incapable of finding some of them. See
// docs/TRANSCRIPT_REVIEW_2026-08-19.md sections A.4 to A.6.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PLAYLISTS = path.join(ROOT, 'data', 'sources', 'playlists');

// The video transcripts have been brought into compliance, so a violation there is a
// regression and fails the build. The audio transcripts have not had this pass (different
// 10-column schema, and thousands of rows omit the Speaker field entirely), so findings
// there are reported as warnings. Move that path into ENFORCED once it has been audited.
const ENFORCED = [path.join(PLAYLISTS, 'video-transcripts')];
const AUDITED_LATER = [path.join(PLAYLISTS, 'audio-transcripts')];
const DIRS = [...ENFORCED, ...AUDITED_LATER];

const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

// Both the text and the Speaker column name some people several ways, and the two
// collections settled on different canonical spellings: the video files use "Dr. Rashad
// Khalifa", the audio files use "Dr. Khalifa". So this compares *identities*, not strings.
// A mismatch between two spellings of one person is house style, not a mislabelled row.
const KHALIFA = 'khalifa';
const IDENTITY = new Map(Object.entries({
    'the messenger': KHALIFA,
    messenger: KHALIFA,
    rashad: KHALIFA,
    khalifa: KHALIFA,
    'rashad khalifa': KHALIFA,
    'dr rashad': KHALIFA,
    'dr khalifa': KHALIFA,
    'dr rashad khalifa': KHALIFA,
    ismail: 'ismail',
    'ismail barakat': 'ismail',
}));
const identify = (name) => IDENTITY.get(normalize(name)) ?? normalize(name);

// "Name:" or "Name (aside):" at the very start of the cell.
const PREFIX = /^\s*([A-Z][A-Za-z.'’\- ]{1,40}?)\s*(?:\(([^)]{1,40})\))?\s*:/;

// Minimal RFC4180 reader: these files use quoted fields with embedded commas and newlines.
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
            } else { field += c; }
        } else if (c === '"') { quoted = true; } else if (c === ',') {
            row.push(field); field = '';
        } else if (c === '\n') {
            row.push(field); rows.push(row); row = []; field = '';
        } else if (c !== '\r') { field += c; }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
}

function readRows(dir, file) {
    const rows = parseCsv(fs.readFileSync(path.join(dir, file), 'utf8')).slice(1);
    // Rows in the audio collection often omit trailing empty fields, so a row can be
    // shorter than the header and carry no Speaker cell at all.
    return rows.map((r) => (r.length >= 6 ? r : [...r, ...Array(6 - r.length).fill('')]));
}

// Every name the archive actually uses as a speaker. A prefix that matches none of these
// is prose ("There are two kinds of people:"), not an attribution.
const known = new Map();
for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
        if (!file.toLowerCase().endsWith('.csv')) continue;
        for (const r of readRows(dir, file)) {
            const s = (r[5] || '').trim();
            if (s) known.set(normalize(s), s);
        }
    }
}

const violations = [];
let checked = 0;

for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    const enforced = ENFORCED.includes(dir);
    for (const file of fs.readdirSync(dir)) {
        if (!file.toLowerCase().endsWith('.csv')) continue;
        readRows(dir, file).forEach((r, i) => {
            const m = PREFIX.exec(r[4] || '');
            if (!m) return;
            // "The messenger (PBUH): to clarify what GOD revealed" is a reverential
            // definition inside somebody's argument, not an attribution.
            if (m[2] && /pbuh|saw/i.test(m[2])) return;
            const key = normalize(m[1]);
            const target = IDENTITY.has(key) ? m[1].trim() : known.get(key);
            if (!target) return;
            checked += 1;
            const actual = (r[5] || '').trim();
            if (identify(actual) !== identify(target)) {
                violations.push({ file, row: i, time: (r[2] || '').slice(0, 8), actual, target, enforced });
            }
        });
    }
}

const hard = violations.filter((v) => v.enforced);
const soft = violations.filter((v) => !v.enforced);

function show(list) {
    for (const v of list) {
        const label = v.actual ? `"${v.actual}"` : '(empty)';
        console.error(`  ${v.file}`);
        console.error(`    row ${v.row} at ${v.time}: label ${label} but text declares "${v.target}"`);
    }
}

if (soft.length) {
    console.error(`WARNING: ${soft.length} row(s) in the un-audited audio transcripts contradict their inline name prefix.`);
    console.error('Not failing: that collection has not had this pass. See docs/TRANSCRIPT_REVIEW_2026-08-19.md A.5.');
    show(soft.slice(0, 15));
    if (soft.length > 15) console.error(`  ... ${soft.length - 15} more`);
    console.error('');
}

if (hard.length) {
    console.error(`Speaker label contradicts the inline name prefix in ${hard.length} enforced row(s):`);
    show(hard);
    console.error('');
    console.error('The text prefix is authoritative: the transcriber wrote the name.');
    process.exit(1);
}

console.log(`Speaker prefixes: ${checked} declared attributions checked, 0 violations in enforced files.`);
if (soft.length) console.log(`(${soft.length} warnings in the un-audited audio transcripts.)`);
