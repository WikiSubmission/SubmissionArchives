// Phase 1 of the RAG pipeline: parses the 51 playlist transcript CSVs into
// timestamp-anchored, overlapping chunks ready for contextualization + embedding.
//
// Design notes (see conversation record for the research this follows):
// - Chunks carry real start/end timestamps so a citation can jump straight to the
//   cited moment via the existing `?t=` player deep-linking.
// - ~15% overlap between consecutive chunks (by rolling back a few caption rows)
//   so a claim spanning a chunk boundary isn't orphaned from its context. The
//   *citation* timestamp still points at this chunk's own new content, not the
//   borrowed lead-in from the previous chunk — otherwise clicking a citation would
//   land slightly before the relevant part, replaying content the user just heard.
// - Video identity (id/title/youtubeId) comes from the existing catalog, matched by
//   YouTube ID, not parsed from the CSV's own title column — the CSV's title text
//   drifts from the canonical one (e.g. "08.The Great Debate..." for the file
//   numbered 06), so the catalog is the source of truth.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TRANSCRIPTS_DIR = path.join(ROOT, 'data', 'sources', 'playlists', 'video-transcripts');
const VIDEOS_CATALOG = path.join(ROOT, 'data', 'catalog', 'videos.json');
const OUT_PATH = path.join(ROOT, 'data', 'sources', 'playlists', 'video-chunks.json');

const TARGET_CHUNK_CHARS = 700;
const OVERLAP_FRACTION = 0.15;

// Minimal RFC4180 parser: handles quoted fields with embedded commas, newlines,
// and escaped ("") quotes. The transcript exports use all three.
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') { inQuotes = true; continue; }
        if (char === ',') { row.push(field); field = ''; continue; }
        if (char === '\r') continue;
        if (char === '\n') {
            row.push(field);
            if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
            row = [];
            field = '';
            continue;
        }
        field += char;
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
    }

    return rows;
}

// "00:01:04.110" -> 64.11 seconds.
function parseTimestamp(value) {
    const match = value.trim().match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (!match) return null;
    const [, h, m, s, ms] = match;
    return Number(h) * 3600 + Number(m) * 60 + Number(s) + (ms ? Number(`0.${ms}`) : 0);
}

function loadCaptionRows(csvPath) {
    const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    const [header, ...body] = rows;
    const col = (name) => header.findIndex((h) => h.trim().toLowerCase() === name);
    const linkIdx = col('link');
    const startIdx = col('start time');
    const endIdx = col('end time');
    const textIdx = col('text');

    const captions = [];
    let youtubeId = null;
    for (const cells of body) {
        const start = parseTimestamp(cells[startIdx] ?? '');
        const end = parseTimestamp(cells[endIdx] ?? '');
        const text = (cells[textIdx] ?? '').replace(/\s+/g, ' ').trim();
        if (start === null || end === null || !text) continue;

        if (!youtubeId) {
            youtubeId = (cells[linkIdx] ?? '').match(/watch\?v=([\w-]+)/)?.[1] ?? null;
        }
        captions.push({ start, end, text });
    }
    return { youtubeId, captions };
}

// Greedily accumulates caption rows into a chunk until it reaches the target size,
// then starts the next chunk a few rows back so context overlaps the boundary.
//
// `cursor` (where this chunk's rows start) and `newContentIndex` (where this
// chunk's *own*, non-overlapped content starts) diverge once overlap kicks in:
// chunk N's rows begin partway through chunk N-1's tail, but the citation
// timestamp must point at the first row that chunk N-1 didn't already cover —
// otherwise clicking a citation replays a few seconds the user already heard.
function chunkCaptions(captions) {
    const chunks = [];
    let cursor = 0;
    let newContentIndex = 0;

    while (cursor < captions.length) {
        let end = cursor;
        let chars = 0;
        while (end < captions.length && (chars < TARGET_CHUNK_CHARS || end === cursor)) {
            chars += captions[end].text.length + 1;
            end++;
        }

        const rows = captions.slice(cursor, end);
        const citationRow = captions[Math.min(newContentIndex, end - 1)];
        chunks.push({
            citation_start: citationRow.start,
            start: rows[0].start,
            end: rows[rows.length - 1].end,
            text: rows.map((r) => r.text).join(' '),
        });

        if (end >= captions.length) break;
        newContentIndex = end;

        // Roll back by ~OVERLAP_FRACTION of this chunk's char count, measured in
        // whole caption rows, so the next chunk's lead-in carries real context.
        const overlapBudget = chars * OVERLAP_FRACTION;
        let rollback = 0;
        let i = end - 1;
        while (i > cursor && rollback < overlapBudget) {
            rollback += captions[i].text.length + 1;
            i--;
        }
        cursor = Math.max(cursor + 1, i + 1);
    }

    return chunks;
}

function main() {
    const videos = JSON.parse(fs.readFileSync(VIDEOS_CATALOG, 'utf8'));
    const byYoutubeId = new Map(videos.map((v) => [v.youtubeId, v]));

    const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(
        (f) =>
            f.endsWith('.csv') &&
            // Guard: a "<n> - Foo_updated.csv" alongside "<n> - Foo.csv" would emit
            // a second set of chunks with colliding ids for the same video.
            !f.endsWith('_updated.csv') &&
            // The Arabic transcript shares its youtubeId with the English one, so
            // indexing both would collide. Index the English transcript only.
            !f.includes(' - Arabic.') &&
            (/^\d+ - /.test(f) || f.startsWith('Debate ')),
    );
    const allChunks = [];
    let skipped = [];

    for (const file of files) {
        const { youtubeId, captions } = loadCaptionRows(path.join(TRANSCRIPTS_DIR, file));
        const video = youtubeId ? byYoutubeId.get(youtubeId) : null;
        if (!video) { skipped.push(file); continue; }
        if (captions.length === 0) continue;

        const chunks = chunkCaptions(captions);
        chunks.forEach((chunk, index) => {
            allChunks.push({
                id: `${video.id}#${index}`,
                video_id: video.id,
                video_title: video.displayTitle || video.title,
                youtube_id: video.youtubeId,
                chunk_index: index,
                start_time: Math.floor(chunk.start),
                end_time: Math.ceil(chunk.end),
                citation_start_time: Math.floor(chunk.citation_start),
                text: chunk.text,
            });
        });
    }

    fs.writeFileSync(OUT_PATH, JSON.stringify({ chunks: allChunks }, null, 2) + '\n', 'utf8');

    const lengths = allChunks.map((c) => c.text.length);
    console.log(`videos=${files.length - skipped.length} chunks=${allChunks.length}`);
    console.log(`chunk chars: median=${lengths.sort((a, b) => a - b)[Math.floor(lengths.length / 2)]} max=${Math.max(...lengths)}`);
    if (skipped.length) console.log('skipped (no catalog match):', skipped.join(', '));
    console.log(`wrote ${path.relative(ROOT, OUT_PATH)}`);
}

main();
