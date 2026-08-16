// Fix 2 of the Quran Study transcript normalization pass (see
// data/sources/playlists/audio-transcripts/FIX-PLAN.md, Step 2).
//
// Terminology decisions: Al-Fatiha, Surah, Quran, Rasulallah. Run after
// fix_quran_study_encoding.mjs (Step 1) so the corrected macron spellings
// are what this step matches against.
//
// Only the Text column is touched.
//
// Rasul is NOT blindly folded into Rasulallah: three occurrences (files 20
// x2, 37 x1) use "Rasul" as a standalone vocabulary word being defined
// ("Rasul, messenger, in Quran" / "Nabi has come, Rasul has come") and are
// left untouched. Every other Rasul-family occurrence is part of the
// "Muhammad Rasul[u/a]llah" / "Muhammad Rasul Allah" honorific phrase,
// confirmed by inspecting every occurrence's context before writing this.
//
// Sura -> Surah is skipped inside rows carrying an English [chapter:verse]
// citation (3 occurrences total) -- that text is a direct quotation of
// Rashad Khalifa's published translation, and altering its wording is a
// different kind of change than normalizing our own community members'
// conversational terminology. Same principle already applied to GOD/God
// capitalization in Step 0 of the audit.
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

const HAS_VERSE_CITATION = /\[\d+:\d+/;

// Each fixer returns { text, count } — count is how many replacements it made.
const fixers = [
    // Al-Fatiha family: Al-Fatehah / Al-Fateha / al-Fatiha / Al-Fatehahs -> Al-Fatiha(s)
    function fixAlFatiha(text) {
        let count = 0;
        const next = text.replace(/\bal-F[aā]teh?ah(s?)\b/gi, (_match, plural) => {
            count++;
            return plural ? 'Al-Fatihas' : 'Al-Fatiha';
        });
        return { text: next, count };
    },
    // Sura(s) -> Surah(s), skipped inside English verse-citation rows.
    function fixSurah(text) {
        if (HAS_VERSE_CITATION.test(text)) return { text, count: 0 };
        let count = 0;
        const next = text.replace(/\b[Ss]ura(s?)\b/g, (match, plural) => {
            count++;
            const capitalized = match[0] === 'S';
            const base = capitalized ? 'Surah' : 'surah';
            return base + plural;
        });
        return { text: next, count };
    },
    // Qur'an / Koran -> Quran. "Qurans" is already correctly spelled, left alone.
    function fixQuran(text) {
        let count = 0;
        let next = text.replace(/\bQur'an\b/g, () => { count++; return 'Quran'; });
        next = next.replace(/\bKoran\b/g, () => { count++; return 'Quran'; });
        return { text: next, count };
    },
    // Rasulullah / rasulullah / rasulallah / "Rasul Allah" -> Rasulallah.
    // Bare "Rasul" (not followed by Allah in any spelling) is left alone --
    // it's a standalone vocabulary word in every occurrence found.
    function fixRasulallah(text) {
        let count = 0;
        let next = text.replace(/\bRasul[uU]llah\b/g, () => { count++; return 'Rasulallah'; });
        next = next.replace(/\brasulullah\b/g, () => { count++; return 'Rasulallah'; });
        next = next.replace(/\brasulallah\b/g, () => { count++; return 'Rasulallah'; });
        next = next.replace(/\bRasul Allah\b/g, () => { count++; return 'Rasulallah'; });
        return { text: next, count };
    },
];

function processFile(filePath) {
    const original = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(original);
    const [header, ...body] = rows;
    const textIdx = header.findIndex((h) => h.trim().toLowerCase() === 'text');
    if (textIdx === -1) throw new Error(`No Text column found in ${filePath}`);

    const counts = { alFatiha: 0, surah: 0, quran: 0, rasulallah: 0 };
    const outRows = [header];
    for (const row of body) {
        const nextRow = [...row];
        let text = nextRow[textIdx] ?? '';

        const r1 = fixers[0](text); text = r1.text; counts.alFatiha += r1.count;
        const r2 = fixers[1](text); text = r2.text; counts.surah += r2.count;
        const r3 = fixers[2](text); text = r3.text; counts.quran += r3.count;
        const r4 = fixers[3](text); text = r4.text; counts.rasulallah += r4.count;

        nextRow[textIdx] = text;
        outRows.push(nextRow);
    }

    const totalChanges = counts.alFatiha + counts.surah + counts.quran + counts.rasulallah;
    if (totalChanges > 0) {
        const csv = outRows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
        fs.writeFileSync(filePath, csv, 'utf8');
    }

    return { rows: body.length, counts, totalChanges };
}

function main() {
    const files = fs.readdirSync(DIR).filter(isInScope).sort((a, b) => parseInt(a) - parseInt(b));
    const grandTotal = { alFatiha: 0, surah: 0, quran: 0, rasulallah: 0 };
    let filesChanged = 0;

    for (const file of files) {
        const result = processFile(path.join(DIR, file));
        if (result.totalChanges > 0) filesChanged++;
        for (const key of Object.keys(grandTotal)) grandTotal[key] += result.counts[key];
        const num = file.match(/^\d+/)[0].padStart(2);
        console.log(
            `${num} rows=${String(result.rows).padStart(5)} `
            + `alFatiha=${result.counts.alFatiha} surah=${result.counts.surah} `
            + `quran=${result.counts.quran} rasulallah=${result.counts.rasulallah}`,
        );
    }

    console.log(`\nProcessed ${files.length} files, ${filesChanged} changed.`);
    console.log(`Totals: Al-Fatiha=${grandTotal.alFatiha} Surah=${grandTotal.surah} Quran=${grandTotal.quran} Rasulallah=${grandTotal.rasulallah}`);
}

main();
