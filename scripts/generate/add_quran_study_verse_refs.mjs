// Fix 6 of the Quran Study transcript normalization pass (see
// data/sources/playlists/audio-transcripts/FIX-PLAN.md, Step 6) -- purely
// additive, Text is never modified.
//
// English citations are bracketed, e.g. "[72:19]  When GOD's..."; Arabic
// citations are parenthetical, trailing the Arabic phrase, e.g. "(67:8)".
// Surveyed the whole corpus before writing this: the dominant shapes are
// clean "[N:N]" (2,851) and "(N:N)" (846), but there's real variety worth
// handling rather than silently dropping:
//   - "[ N:N ]" -- space-padded (5 occurrences)
//   - "(N:N-N)" -- a verse range in parens
//   - "(see N:N)" and "(Matthew N:N)" -- a colon-pair with leading text
//     inside the parens, not just the bare citation
//   - "(N:N, N:N, and N:N)" -- three refs in one parenthetical
// So instead of requiring the bracket/paren's entire content to be exactly
// "N:N", this searches for every "N:N(-N)?" pattern found *within* each
// bracket or paren span, which handles all of the above uniformly. Things
// that were never citations -- footnote markers like "(3)", translator
// insertions like "[and it]", math like "(19 x 2)" -- have no colon and
// never match.
//
// Language is NOT determined by delimiter shape alone (bracket=en,
// paren=ar), because a couple of real rows break that: "(Matthew 5:9)" and
// "(9:33, 48:28, and 61:9)" are both parenthetical but plainly English --
// no Arabic script anywhere in the row. Checked instead: a paren-derived
// ref is only tagged "ar" if the row actually contains Arabic Unicode
// script; otherwise every ref in the row (bracket or paren) is "en". This
// fixed both of the above during verification, without affecting any of
// the genuine Arabic-recitation-plus-citation rows.
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

const NUM_PAIR = /(\d{1,3}):(\d{1,3}(?:-\d{1,3})?)/g;

function extractRefs(content) {
    const refs = [];
    NUM_PAIR.lastIndex = 0;
    let m;
    while ((m = NUM_PAIR.exec(content))) {
        refs.push(`${m[1]}:${m[2]}`);
    }
    return refs;
}

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿ]/;

function extractVerseRefs(text) {
    const refs = [];
    const langs = new Set();
    const hasArabic = ARABIC_SCRIPT.test(text);

    const bracketRe = /\[([^\]]*)\]/g;
    let m;
    while ((m = bracketRe.exec(text))) {
        const found = extractRefs(m[1]);
        if (found.length) {
            refs.push(...found);
            langs.add('en');
        }
    }

    const parenRe = /\(([^)]*)\)/g;
    while ((m = parenRe.exec(text))) {
        const found = extractRefs(m[1]);
        if (found.length) {
            refs.push(...found);
            langs.add(hasArabic ? 'ar' : 'en');
        }
    }

    return { refs, lang: [...langs].join(',') };
}

function processFile(filePath) {
    const original = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(original);
    const [header, ...body] = rows;
    const textIdx = header.findIndex((h) => h.trim().toLowerCase() === 'text');
    if (textIdx === -1) throw new Error(`No Text column found in ${filePath}`);

    const newHeader = [...header, 'VerseRefs', 'VerseLang'];
    const outRows = [newHeader];

    let rowsWithRefs = 0;
    let totalRefs = 0;
    let rowsWithBoth = 0;

    for (const row of body) {
        const text = row[textIdx] ?? '';
        const { refs, lang } = extractVerseRefs(text);
        if (refs.length > 0) {
            rowsWithRefs++;
            totalRefs += refs.length;
            if (lang === 'en,ar') rowsWithBoth++;
        }
        outRows.push([...row, refs.join('; '), lang]);
    }

    const csv = outRows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
    fs.writeFileSync(filePath, csv, 'utf8');

    return { rows: body.length, rowsWithRefs, totalRefs, rowsWithBoth };
}

function main() {
    const files = fs.readdirSync(DIR).filter(isInScope).sort((a, b) => parseInt(a) - parseInt(b));
    let totals = { rows: 0, rowsWithRefs: 0, totalRefs: 0, rowsWithBoth: 0 };

    for (const file of files) {
        const result = processFile(path.join(DIR, file));
        for (const key of Object.keys(totals)) totals[key] += result[key];
        const num = file.match(/^\d+/)[0].padStart(2);
        console.log(`${num} rows=${String(result.rows).padStart(5)} rowsWithRefs=${String(result.rowsWithRefs).padStart(4)} totalRefs=${String(result.totalRefs).padStart(4)} both=${result.rowsWithBoth}`);
    }

    console.log(`\nProcessed ${files.length} files.`);
    console.log(`Total rows: ${totals.rows}, rows with at least one verse ref: ${totals.rowsWithRefs}, total refs extracted: ${totals.totalRefs}, rows with both en+ar: ${totals.rowsWithBoth}`);
}

main();
