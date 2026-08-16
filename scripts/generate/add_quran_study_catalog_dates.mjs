// Fix 8 of the Quran Study transcript normalization pass (see
// data/sources/playlists/audio-transcripts/FIX-PLAN.md, Step 8).
//
// This is not a CSV/transcript change -- data/catalog/audios.json already
// has a clean, human-composed displayTitle per quran-study video (e.g.
// "QS 01 -- Sura 72-73, Jinns & Night Prayer (Kathryn Jinns, 05/26/1989)"),
// with the date already extracted into readable text but not as a
// structured field. This adds one: a nullable ISO 8601 `date` on each of
// the 52 quran-study entries, parsed from the displayTitle in priority
// order (full date > month/year > bare year), inserted right after `type`.
//
// The catalog's own `folder` field (the raw, often-truncated original
// title) was checked too and is strictly less reliable for this -- long
// titles get cut at ~255 characters and frequently lose the trailing date
// entirely, while displayTitle was already composed with the full title in
// view. Some sessions genuinely have no date anywhere (night sessions,
// undated Behrouz/Roxana visits) and get `date: null` rather than a guess.
import fs from 'node:fs';
import path from 'node:path';

const CATALOG_PATH = path.join(process.cwd(), 'data', 'catalog', 'audios.json');

function extractDate(displayTitle) {
    const full = displayTitle.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
    if (full) {
        const [, mm, dd, yyyy] = full;
        return `${yyyy}-${mm}-${dd}`;
    }
    const monthYear = displayTitle.match(/\b(\d{2})\/(\d{4})\b/);
    if (monthYear) {
        const [, mm, yyyy] = monthYear;
        return `${yyyy}-${mm}`;
    }
    const bareYear = displayTitle.match(/\b(19\d{2})\b/);
    if (bareYear) {
        return bareYear[1];
    }
    return null;
}

function main() {
    const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
    const catalog = JSON.parse(raw);

    let updated = 0;
    let withDate = 0;
    let nullDate = 0;

    const next = catalog.map((entry) => {
        if (entry.type !== 'quran-study') return entry;

        const date = extractDate(entry.displayTitle);
        updated++;
        if (date) withDate++;
        else nullDate++;

        const { id, title, displayTitle, type, ...rest } = entry;
        return { id, title, displayTitle, type, date, ...rest };
    });

    const output = `${JSON.stringify(next, null, 2)}\n`;
    fs.writeFileSync(CATALOG_PATH, output, 'utf8');

    console.log(`Updated ${updated} quran-study entries.`);
    console.log(`  with a date: ${withDate}`);
    console.log(`  date: null: ${nullDate}`);
}

main();
