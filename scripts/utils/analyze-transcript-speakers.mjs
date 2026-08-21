// Speaker inventory for the playlist transcripts, modelled on scripts/utils/analyze-speakers.ts
// (which did this for the Quran Study VTTs and surfaced a pile of name typos).
//
// That script's value was not fixing anything: it was listing every distinct "Name:" the
// transcriber ever wrote, so a person could see that "Dr. Khalifa", "Dr. KhaIifa" (capital
// I for l), "Dr Khalifa", "Dr.Khalifa", "Dr. Khalfia" and "Dr. Khlaifa" are one man typed
// six ways. That class of defect is invisible to validate_speaker_prefixes.mjs, which skips
// any prefix it does not recognise as a known speaker -- so a typo'd name is silently
// ignored rather than flagged.
//
// This reports three things:
//   1. Every name used in the Speaker column, and every name declared by a text prefix.
//   2. Likely typo variants, by edit distance within a surname-sharing group.
//   3. Prefixes the validator currently SKIPS, so nothing hides behind "probably prose".
//
// Read-only. Run: node scripts/utils/analyze-transcript-speakers.mjs [--json out.json]

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIRS = {
    video: path.join(ROOT, 'data', 'sources', 'playlists', 'video-transcripts'),
    audio: path.join(ROOT, 'data', 'sources', 'playlists', 'audio-transcripts'),
};

// Same permissive shape as the original: letters, spaces, dots, apostrophes, hyphens,
// optionally followed by a parenthetical aside, then a colon.
//
// A literal space rather than \s, deliberately. Many cells in file 06 open with the tail
// of the previous speaker's sentence, then a newline, then the real prefix
// ("object.\nAbdel Rahman: ..."). With \s the name class swallows the newline and the
// match reports "object.\nAbdel Rahman" as a speaker. validate_speaker_prefixes.mjs has
// always used a literal space and so was never affected; this keeps the two consistent.
const PREFIX = /^[ \t]*([A-Za-z][A-Za-z .'’-]{0,48}?)\s*(?:\(([^)]{1,40})\))?\s*:/;

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

function parseCsv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
            } else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c !== '\r') field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
}

// Levenshtein, for spotting one-or-two-character name typos.
function edit(a, b) {
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i += 1) {
        const cur = [i];
        for (let j = 1; j <= n; j += 1) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
    }
    return prev[n];
}

// Prose that happens to contain a colon. Not speakers.
const looksLikeProse = (name) => {
    const words = name.trim().split(/\s+/);
    if (words.length > 4) return true;                       // a clause, not a name
    return /^(ok|so|and|but|the quran|it says|i say|note|verse|sura)\b/i.test(name.trim());
};

const collections = {};

for (const [tag, dir] of Object.entries(DIRS)) {
    if (!fs.existsSync(dir)) continue;
    const labels = new Map();     // Speaker column values -> count
    const declared = new Map();   // text prefix values -> {count, files, example}
    let rowCount = 0;

    for (const file of fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'))) {
        const rows = parseCsv(fs.readFileSync(path.join(dir, file), 'utf8')).slice(1);
        for (const raw of rows) {
            const r = raw.length >= 6 ? raw : [...raw, ...Array(6 - raw.length).fill('')];
            rowCount += 1;
            const label = (r[5] || '').trim();
            if (label) labels.set(label, (labels.get(label) || 0) + 1);

            const m = PREFIX.exec(r[4] || '');
            if (!m) continue;
            const name = m[1].trim();
            if (looksLikeProse(name)) continue;
            const e = declared.get(name) || { count: 0, files: new Set(), example: '', aside: m[2] || '' };
            e.count += 1;
            e.files.add(file);
            if (!e.example) e.example = (r[4] || '').replace(/\s+/g, ' ').slice(0, 90);
            declared.set(name, e);
        }
    }
    collections[tag] = { labels, declared, rowCount };
}

function variantGroups(names) {
    // Group names that share a token, then flag pairs within 2 edits as likely typos.
    const groups = [];
    const seen = new Set();
    const arr = [...names.keys()];
    for (const a of arr) {
        if (seen.has(a)) continue;
        const na = norm(a);
        const toksA = new Set(na.split(' ').filter((t) => t.length > 2));
        const family = [a];
        for (const b of arr) {
            if (b === a || seen.has(b)) continue;
            const nb = norm(b);
            const shares = [...toksA].some((t) => nb.split(' ').includes(t));
            const close = Math.abs(na.length - nb.length) <= 3 && edit(na, nb) <= 2;
            if (shares || close) family.push(b);
        }
        if (family.length > 1) {
            family.forEach((f) => seen.add(f));
            groups.push(family.sort((x, y) => (names.get(y) || 0) - (names.get(x) || 0)));
        }
    }
    return groups;
}

for (const [tag, { labels, declared, rowCount }] of Object.entries(collections)) {
    const line = '='.repeat(78);
    console.log(`\n${line}\n${tag.toUpperCase()} TRANSCRIPTS  (${rowCount} rows)\n${line}`);

    console.log(`\nSpeaker-column labels (${labels.size}):`);
    for (const [n, c] of [...labels].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(c).padStart(6)}  ${n}`);
    }

    console.log(`\nNames declared by a text prefix (${declared.size}):`);
    for (const [n, e] of [...declared].sort((a, b) => b[1].count - a[1].count)) {
        console.log(`  ${String(e.count).padStart(6)}  ${n}  [${e.files.size} file(s)]`);
    }

    // Typo variants, checked over labels and declared names together.
    const merged = new Map(labels);
    for (const [n, e] of declared) merged.set(n, (merged.get(n) || 0) + e.count);
    const groups = variantGroups(merged).filter((g) => new Set(g.map(norm)).size > 1);
    console.log(`\nPossible name variants / typos (${groups.length} group(s)):`);
    if (!groups.length) console.log('  none');
    for (const g of groups) {
        console.log(`  ${g.map((n) => `"${n}" (${merged.get(n)})`).join('  |  ')}`);
    }

    // Declared names with no matching Speaker label anywhere: these are exactly the rows
    // validate_speaker_prefixes.mjs skips, so they deserve eyes.
    const labelKeys = new Set([...labels.keys()].map(norm));
    const KHALIFA = new Set(['the messenger', 'messenger', 'rashad', 'khalifa', 'dr khalifa',
        'dr rashad khalifa', 'rashad khalifa', 'dr rashad']);
    const unmatched = [...declared].filter(([n]) => !labelKeys.has(norm(n)) && !KHALIFA.has(norm(n)));
    console.log(`\nDeclared names the validator does NOT recognise (${unmatched.length}) -- these are skipped:`);
    if (!unmatched.length) console.log('  none');
    for (const [n, e] of unmatched.sort((a, b) => b[1].count - a[1].count)) {
        console.log(`  ${String(e.count).padStart(4)}  "${n}"  ${e.example}`);
    }
}

const jsonFlag = process.argv.indexOf('--json');
if (jsonFlag !== -1 && process.argv[jsonFlag + 1]) {
    const out = {};
    for (const [tag, { labels, declared }] of Object.entries(collections)) {
        out[tag] = {
            labels: Object.fromEntries(labels),
            declared: Object.fromEntries([...declared].map(([n, e]) => [n, {
                count: e.count, files: [...e.files].sort(), example: e.example,
            }])),
        };
    }
    fs.writeFileSync(process.argv[jsonFlag + 1], JSON.stringify(out, null, 2));
    console.log(`\nwrote ${process.argv[jsonFlag + 1]}`);
}
