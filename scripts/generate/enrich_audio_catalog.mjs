/**
 * Harvests Description / TOC Time / TOC Title out of the audio transcript CSVs and writes
 * them into data/catalog/audios.json as `description` and `chapters`.
 *
 * Direct counterpart to enrich_video_catalog.mjs, deliberately: the transcript CSV is the
 * single source of truth and this script only reads it. A TOC entry is a pointer to a
 * caption row, so `TOC Time` always equals that row's own `Start Time`, and this asserts
 * that rather than assuming it.
 *
 * Chapters get their `endTime` from the next entry's `startTime`, exactly as the video
 * path does, so the two collections produce identically shaped data.
 *
 * Run: node scripts/generate/enrich_audio_catalog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const AUDIO_DIR = path.join(ROOT, 'data', 'sources', 'playlists', 'audio-transcripts');
const CATALOG = path.join(ROOT, 'data', 'catalog', 'audios.json');

function parseCsv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
            } else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c !== '\r') field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
}

const toSec = (t) => {
    const m = /^(\d+):(\d+):(\d+)(?:\.(\d+))?$/.exec((t || '').trim());
    return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + (m[4] ? +`0.${m[4]}` : 0) : null;
};

const ytId = (l) => {
    const m = /[?&]v=([A-Za-z0-9_-]{6,})/.exec(l || '') || /youtu\.be\/([A-Za-z0-9_-]{6,})/.exec(l || '');
    return m ? m[1] : null;
};

const byYt = new Map();
const problems = [];

for (const file of fs.readdirSync(AUDIO_DIR).filter((f) => f.toLowerCase().endsWith('.csv'))) {
    const rows = parseCsv(fs.readFileSync(path.join(AUDIO_DIR, file), 'utf8'));
    if (rows.length < 2) continue;
    const header = rows[0].map((h) => h.trim());
    const i = (name) => header.indexOf(name);
    const iLink = i('Link'), iStart = i('Start Time'), iDesc = i('Description');
    const iTime = i('TOC Time'), iTitle = i('TOC Title'), iSpk = i('Speaker');
    if (iDesc === -1 && iTime === -1) continue;   // not yet enriched

    let id = null, description = '';
    const tocs = [];
    for (const r of rows.slice(1)) {
        if (!id && iLink >= 0) id = ytId(r[iLink]);
        if (iDesc >= 0 && !description && (r[iDesc] || '').trim()) description = r[iDesc].trim();
        if (iTime >= 0 && iTitle >= 0 && (r[iTime] || '').trim() && (r[iTitle] || '').trim()) {
            const declared = r[iTime].trim();
            const own = (r[iStart] || '').trim();
            // The anchoring invariant. If this ever fails, the TOC has stopped being a row
            // reference and the timestamp can no longer be trusted.
            if (declared !== own) {
                problems.push(`${file} row: TOC Time ${declared} != Start Time ${own}`);
                continue;
            }
            tocs.push({
                startTime: toSec(declared),
                title: r[iTitle].trim(),
                speaker: iSpk >= 0 ? (r[iSpk] || '').trim() || undefined : undefined,
            });
        }
    }
    if (!id) continue;
    const entry = byYt.get(id) || { description: '', tocs: [], files: [] };
    entry.files.push(file);
    if (description && !entry.description) entry.description = description;
    entry.tocs.push(...tocs);
    byYt.set(id, entry);
}

for (const entry of byYt.values()) {
    entry.tocs.sort((a, b) => a.startTime - b.startTime);
    const seen = new Set();
    entry.chapters = [];
    for (const t of entry.tocs) {
        if (seen.has(t.startTime)) continue;
        seen.add(t.startTime);
        entry.chapters.push(t);
    }
    entry.chapters = entry.chapters.map((t, idx, arr) => ({
        id: idx + 1,
        startTime: Math.round(t.startTime * 100) / 100,
        endTime: arr[idx + 1] ? Math.round(arr[idx + 1].startTime * 100) / 100 : undefined,
        title: t.title,
        ...(t.speaker ? { speaker: t.speaker } : {}),
    }));
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
let touchedDesc = 0, touchedCh = 0;
const updated = catalog.map((item) => {
    const meta = byYt.get(item.youtubeId);
    if (!meta) return item;
    const next = { ...item };
    if (meta.description) { next.description = meta.description; touchedDesc += 1; }
    if (meta.chapters?.length) { next.chapters = meta.chapters; touchedCh += 1; }
    return next;
});

fs.writeFileSync(CATALOG, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
console.log(`audios.json: ${touchedDesc} description(s), ${touchedCh} chapter set(s) from transcripts.`);
if (problems.length) {
    console.error(`\n${problems.length} anchoring problem(s) — TOC Time must equal the row's Start Time:`);
    for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
    process.exit(1);
}
