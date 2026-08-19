// Builds a short, transcript-free metadata index of every video and audio in the
// catalog: number, title, date, duration, YouTube id, description, and the
// overlap/speaker findings recorded in docs/TRANSCRIPT_REVIEW_2026-08-19.md.
//
// Two outputs, deliberately:
// - data/catalog/media-index.csv  full field values, including untruncated
//   descriptions. This is the one to open in a spreadsheet or diff.
// - docs/MEDIA_INDEX.md           the same rows with descriptions clipped, so the
//   tables stay readable in a browser or editor.
//
// Anything genuinely unknown is written as "-" rather than guessed or left blank,
// so a gap is visibly a gap and can be filled in later.
//
// Dates come from three sources, in descending order of authority: the catalog's own
// `date` field, then the title, then a date stated inside a curated description. The
// title patterns are the same two used by enrich_media_years.mjs so the two scripts
// never disagree about what a title says. `date_source` always records which of the
// three a value came from, because they are not equally trustworthy.
//
// No date is inferred from a YouTube upload timestamp: an upload date for an archival
// re-upload can be decades off the recording date, and this index is about when things
// were recorded.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CATALOG_DIR = path.join(ROOT, 'data', 'catalog');
const TRANSCRIPTS_DIR = path.join(ROOT, 'data', 'sources', 'playlists', 'video-transcripts');
const PLAYLIST_ORDER_TS = path.join(ROOT, 'src', 'lib', 'playlistOrder.ts');
const OUT_CSV = path.join(CATALOG_DIR, 'media-index.csv');
const OUT_MD = path.join(ROOT, 'docs', 'MEDIA_INDEX.md');

const MD_DESCRIPTION_CHARS = 190;

// Same patterns as scripts/generate/enrich_media_years.mjs, so both scripts agree
// on what a title does and does not state. Accepts "/" or "-" as the separator.
const TITLE_FULL_DATE = /\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])[/-](19[6-9]\d|20[0-2]\d)\b/;
const TITLE_MONTH_YEAR = /\b(0?[1-9]|1[0-2])[/-](19[6-9]\d|20[0-2]\d)\b/;
const TITLE_YEAR_ONLY = /\b(19[6-9]\d|20[0-2]\d)\b/;

// Curated descriptions often state the recording date in prose ("Led by Kathryn, May 26,
// 1989") for records whose title and `date` field carry nothing. That recovers 11 dates
// that would otherwise read as unknown. A trailing "and 26" as in "January 19 and 26,
// 1990" is matched but ignored: the first date is the one recorded, and the fact that a
// study spans two sessions belongs in the description, not in a single date field.
const MONTH_NAMES = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
];
const PROSE_DATE = new RegExp(
    `\\b(${MONTH_NAMES.join('|')})\\s+(\\d{1,2})(?:\\s*(?:and|&|,)\\s*\\d{1,2})?,?\\s+(19[6-9]\\d|20[0-2]\\d)\\b`,
    'i',
);

// The Quran Study ids record which tape collection a study was digitized from, e.g.
// "09 Quran Study From Azhar 9 Sura 70 By Edip ...". That provenance is not stated
// anywhere else in the catalog.
const COLLECTION = /Quran Study From ([A-Z][A-Za-z]*)/;

// Findings from docs/TRANSCRIPT_REVIEW_2026-08-19.md, keyed by the transcript file's
// playlist number. Kept here rather than derived so the index states the *conclusion*
// of that review (which required listening and reading, not just measurement) instead
// of re-running a similarity check that cannot tell containment from coincidence.
const VIDEO_NOTES = {
    2: 'Same recording as 38. Verified: 0.9630 word similarity, median timestamp offset +0.01s across 1,994 aligned words. Packaged as a program; 38 is the sermon cut.',
    3: 'Trimmed: the World News Bulletin segment was removed (it is published separately as 14). Cut at 00:37:49.990.',
    5: 'Compilation. Contains sermon 34 in full (00:02:33-00:33:28, zero offset) then sermon 35 in full (00:36:11-01:11:30, constant -33:36 offset). Also repeats itself: 00:57:56-01:02:45 replays at 01:14:39-01:19:15 (~4m49s).',
    8: 'Trimmed: the radio debate segment was removed (it is published separately as 13). Cut at 00:55:49.240.',
    10: 'Speaker labels: 67 rows across 4 blocks are likely Dr. Rashad Khalifa but currently labelled with the questioner who preceded them. Pending audio verification at 00:10:47, 00:15:10, 00:16:25, 00:17:06.',
    11: 'Speaker labels reviewed and assessed correct. The unprefixed runs are continuations of long floor turns, not the sticky-label defect.',
    13: 'Published separately from 08, which previously contained this segment before it was trimmed.',
    14: 'Published separately from 03, which previously contained this segment before it was trimmed.',
    16: 'Mostly original. Quotes two sermon passages: 00:37:39-00:39:42 from 45, and 00:39:32-00:43:34 from 43. No overlap with 23.',
    18: 'Compilation. First ~16 minutes are unique to this video (the instructional section). Then sermon 32 in full (00:17:32-00:31:33, constant -17:25) and sermon 33 in full (00:34:17-00:56:33, constant -34:07).',
    23: 'Separate recording from 16 despite the shared theme. Measured: zero verbatim overlap.',
    32: 'Contained in full inside 18 at 00:17:32-00:31:33.',
    33: 'Contained in full inside 18 at 00:34:17-00:56:33.',
    34: 'Contained in full inside 05 at 00:02:33-00:33:28. No overlap with 35.',
    35: 'Contained in full inside 05 at 00:36:11-01:11:30. No overlap with 34.',
    38: 'Same recording as 02. Verified: 0.9630 word similarity, median timestamp offset +0.01s across 1,994 aligned words. This is the sermon cut; 02 is the packaged program.',
    43: 'Passage at 00:11:15-00:15:14 is quoted in 16.',
    45: 'Passage at 00:14:00-00:21:18 is quoted in 16.',
    50: 'Speaker labels corrected: 107 rows from 00:18:49.718 to the end were relabelled from Edip to Dr. Rashad Khalifa, verified by ear.',
};

// Recording dates for videos whose title states none. Kept as an explicit table rather
// than mined out of the descriptions with a regex, because a year appearing in a
// description is usually *content*, not a recording date: "Evolution or Creation" mentions
// the Supreme Court in 1987 and "Mathematical Miracle" mentions arriving in the US in
// 1968, and neither is when the tape was made. Every entry below is either an explicit
// "Recorded on ..." statement or a dating inherited from a proven duplicate.
//
// Keyed by transcript file number, like VIDEO_NOTES.
const VIDEO_DATES = {
    2: { date: '1988-08-04', precision: 'day', source: 'same-recording-as-38' },
    3: { date: '1986-01', precision: 'month', source: 'description' },
    5: { date: '1988', precision: 'year', source: 'description' },
    6: { date: '1987', precision: 'year', source: 'description' },
    14: { date: '1986-05-15', precision: 'day', source: 'description' },
};

// Where a compilation or a quoting program cannot be dated outright, the sermons it
// contains still put a floor under it. Stated as a bound in the notes rather than written
// into the date column, because "no earlier than" is not a date.
const VIDEO_DATE_BOUNDS = {
    16: 'Cannot be earlier than 1989-03-17, the date of sermon 45, whose audio it quotes.',
    18: 'Cannot be earlier than 1988-04-08, the date of sermon 33, which it contains in full.',
};

const DEBATE_NOTE =
    'An Arabic-captioned transcript of the same recording also exists (Debate ... (1987) - Arabic.csv). It shares this YouTube id, so it is not a separate catalog entry.';

// --- CSV -------------------------------------------------------------------

// Minimal RFC4180 parser. The transcript exports use quoted fields with embedded
// commas, newlines and escaped ("") quotes, so all three have to be handled.
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
            } else field += char;
            continue;
        }
        if (char === '"') { inQuotes = true; continue; }
        if (char === ',') { row.push(field); field = ''; continue; }
        if (char === '\r') continue;
        if (char === '\n') {
            row.push(field);
            if (row.some((c) => c.trim().length > 0)) rows.push(row);
            row = [];
            field = '';
            continue;
        }
        field += char;
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        if (row.some((c) => c.trim().length > 0)) rows.push(row);
    }
    return rows;
}

function csvEscape(value) {
    const s = String(value ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// --- helpers ---------------------------------------------------------------

const pad2 = (n) => String(n).padStart(2, '0');

// Returns [isoDate, precision] where precision is 'day' | 'month' | 'year'.
function dateFromTitle(title) {
    const full = title.match(TITLE_FULL_DATE);
    if (full) return [`${full[3]}-${pad2(full[1])}-${pad2(full[2])}`, 'day'];

    const monthYear = title.match(TITLE_MONTH_YEAR);
    if (monthYear) return [`${monthYear[2]}-${pad2(monthYear[1])}`, 'month'];

    const year = title.match(TITLE_YEAR_ONLY);
    if (year) return [year[1], 'year'];

    return [null, null];
}

// Same contract as dateFromTitle, reading a date written out in prose.
function dateFromDescription(description) {
    if (!description) return [null, null];

    const prose = description.match(PROSE_DATE);
    if (prose) {
        const month = MONTH_NAMES.indexOf(prose[1].toLowerCase()) + 1;
        return [`${prose[3]}-${pad2(month)}-${pad2(prose[2])}`, 'day'];
    }

    const year = description.match(TITLE_YEAR_ONLY);
    if (year) return [year[1], 'year'];

    return [null, null];
}

function secondsFromTimestamp(value) {
    const m = String(value ?? '').trim().match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (!m) return null;
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + (m[4] ? Number(`0.${m[4]}`) : 0);
}

function formatDuration(seconds) {
    if (seconds === null) return '-';
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}

function clip(text, limit) {
    const s = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (!s) return '-';
    if (s.length <= limit) return s;
    // Clip on a word boundary so the tail is not a half word.
    const cut = s.slice(0, limit);
    const space = cut.lastIndexOf(' ');
    return `${(space > limit * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:.]$/, '')}...`;
}

// Escapes the characters that would break out of a markdown table cell.
function mdCell(text) {
    return String(text ?? '-').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

// --- sources ---------------------------------------------------------------

function loadPlaylistOrder() {
    const source = fs.readFileSync(PLAYLIST_ORDER_TS, 'utf8');
    const order = {};
    for (const m of source.matchAll(/^\s*"([^"]+)":\s*([\d.]+),/gm)) {
        order[m[1]] = Number(m[2]);
    }
    return order;
}

// Reads the per-file facts that only the transcripts know: runtime, how many TOC
// entries were written, which speakers appear, and the curated description.
function loadTranscripts() {
    const byYoutubeId = new Map();
    for (const file of fs.readdirSync(TRANSCRIPTS_DIR)) {
        if (!file.endsWith('.csv')) continue;

        const rows = parseCsv(fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf8'));
        const [header, ...body] = rows;
        if (!header) continue;
        const col = (name) => header.findIndex((h) => h.trim().toLowerCase() === name);
        const idx = {
            link: col('link'),
            start: col('start time'),
            end: col('end time'),
            speaker: col('speaker'),
            description: col('description'),
            tocTime: col('toc time'),
        };

        let youtubeId = null;
        let description = '';
        let firstStart = null;
        let lastEnd = null;
        let tocEntries = 0;
        const speakers = new Set();

        for (const cells of body) {
            if (!youtubeId && idx.link >= 0) {
                youtubeId = (cells[idx.link] ?? '').match(/watch\?v=([\w-]+)/)?.[1] ?? null;
            }
            if (!description && idx.description >= 0 && (cells[idx.description] ?? '').trim()) {
                description = cells[idx.description].trim();
            }
            if (idx.tocTime >= 0 && (cells[idx.tocTime] ?? '').trim()) tocEntries++;
            if (idx.speaker >= 0 && (cells[idx.speaker] ?? '').trim()) speakers.add(cells[idx.speaker].trim());

            const start = secondsFromTimestamp(cells[idx.start]);
            const end = secondsFromTimestamp(cells[idx.end]);
            if (start !== null && (firstStart === null || start < firstStart)) firstStart = start;
            if (end !== null && (lastEnd === null || end > lastEnd)) lastEnd = end;
        }

        const isArabic = file.includes(' - Arabic.');
        const record = {
            file,
            isArabic,
            number: Number(file.match(/^(\d+) - /)?.[1] ?? NaN),
            rows: body.length,
            description,
            tocEntries,
            speakers: [...speakers],
            firstStart,
            lastEnd,
        };
        if (!youtubeId) continue;
        // The Arabic transcript shares its id with the English one; the English cut is
        // the catalog entry, so it must not be overwritten by the Arabic pass.
        if (byYoutubeId.has(youtubeId) && isArabic) continue;
        byYoutubeId.set(youtubeId, record);
    }
    return byYoutubeId;
}

// --- row construction ------------------------------------------------------

function buildVideoRows(videos, order, transcripts) {
    return videos
        .map((video) => {
            const transcript = transcripts.get(video.youtubeId) ?? null;
            const title = video.displayTitle || video.title;
            const number = order[video.id];
            const fileNo = Number.isFinite(transcript?.number) ? transcript.number : null;

            // A date stated in the title wins; otherwise fall back to the curated table.
            const [titleDate, titlePrecision] = dateFromTitle(title);
            const curated = fileNo !== null ? VIDEO_DATES[fileNo] : undefined;
            const date = titleDate ?? curated?.date ?? '-';
            const precision = titleDate ? titlePrecision : (curated?.precision ?? '-');
            const source = titleDate ? 'title' : (curated?.source ?? '-');

            const notes = [
                fileNo !== null ? VIDEO_NOTES[fileNo] : null,
                fileNo !== null ? VIDEO_DATE_BOUNDS[fileNo] : null,
                /sunni-scholars/.test(video.id) ? DEBATE_NOTE : null,
            ]
                .filter(Boolean)
                .join(' ');

            return {
                sort: number ?? Number.POSITIVE_INFINITY,
                kind: 'Video',
                number: number ?? '-',
                file_number: fileNo ?? '-',
                title,
                date,
                date_precision: precision,
                date_source: source,
                collection: '-', // Only the Quran Study tapes record a source collection.
                duration: formatDuration(transcript?.lastEnd ?? null),
                speakers: transcript?.speakers.length ? transcript.speakers.join('; ') : '-',
                youtube_id: video.youtubeId || '-',
                youtube_url: video.youtubeUrl || '-',
                transcript_file: transcript?.file ?? '-',
                transcript_rows: transcript?.rows ?? '-',
                toc_entries: transcript?.tocEntries ?? '-',
                description: transcript?.description || '-',
                notes: notes || '-',
            };
        })
        .sort((a, b) => a.sort - b.sort);
}

function loadQuranStudyThumbnailDates() {
    const thumbPath = path.join(ROOT, 'public', 'content', 'audios', 'quran-studies', 'thumbnail-text.md');
    const map = new Map();
    if (!fs.existsSync(thumbPath)) return map;

    const content = fs.readFileSync(thumbPath, 'utf8');
    const sections = content.split(/^###\s+(\d+)\s+—\s+`([^`]+)`/gm);
    for (let i = 1; i < sections.length; i += 3) {
        const num = Number(sections[i]);
        const text = sections[i + 2].replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '')).trim();
        const [date, precision] = dateFromDescription(text);
        if (date) {
            map.set(num, { date, precision, source: 'thumbnail' });
        }
    }
    return map;
}

function loadAudioVttDurations() {
    const vttDir = path.join(ROOT, 'public', 'content', 'audios', 'messenger-audios');
    const durations = new Map();
    if (!fs.existsSync(vttDir)) return durations;

    for (const file of fs.readdirSync(vttDir)) {
        if (!file.endsWith('.vtt')) continue;
        const text = fs.readFileSync(path.join(vttDir, file), 'utf8');
        const timestamps = [...text.matchAll(/-->\s+(\d+:\d{2}:\d{2}(?:\.\d+)?)/g)];
        if (timestamps.length > 0) {
            const last = timestamps[timestamps.length - 1][1];
            const sec = secondsFromTimestamp(last);
            const numMatch = file.match(/^MA(\d+)/i);
            if (numMatch && sec !== null) {
                durations.set(Number(numMatch[1]), formatDuration(sec));
            }
        }
    }
    return durations;
}

function parseSpeakerFromTitle(title, author) {
    const speakerInParen = title.match(/\(([^,)]+)(?:,\s*[^)]*)?\)/);
    if (speakerInParen) {
        const candidate = speakerInParen[1].trim();
        if (/^(Dr\.\s*Rashad Khalifa|Dean Mahmoud|Kathryn|Linda|Lisa|Edip Yuksel|Robert|Behrouz|Gatut|Parivash)/i.test(candidate)) {
            return candidate;
        }
    }
    return author || 'Dr. Rashad Khalifa';
}

function buildAudioRows(audios, thumbDates, vttDurations) {
    const kindOf = (type) => (type === 'quran-study' ? 'Quran Study' : 'Messenger Audio');

    return audios
        .map((audio) => {
            const title = audio.displayTitle || audio.title;
            const [titleDate, titlePrecision] = dateFromTitle(title);
            const [proseDate, prosePrecision] = dateFromDescription(audio.description);

            const number =
                audio.primaryNumber ??
                Number(title.match(/^QS\s+(\d+)/)?.[1] ?? NaN);

            const thumbEntry = Number.isFinite(number) && audio.type === 'quran-study'
                ? thumbDates.get(number)
                : undefined;

            // Date hierarchy: catalog date -> title date -> thumbnail date -> description date
            let date = '-';
            let precision = '-';
            let source = '-';
            if (audio.date) {
                date = audio.date;
                precision = 'day';
                source = 'catalog';
            } else if (titleDate) {
                date = titleDate;
                precision = titlePrecision;
                source = 'title';
            } else if (thumbEntry) {
                date = thumbEntry.date;
                precision = thumbEntry.precision;
                source = thumbEntry.source;
            } else if (proseDate) {
                date = proseDate;
                precision = prosePrecision;
                source = 'description';
            }

            const alternates = audio.alternateNumbers?.length
                ? `${audio.alternateNumberLabel || 'Also numbered'}: ${audio.alternateNumbers.join(', ')}`
                : '';

            const duration = (Number.isFinite(number) && vttDurations.has(number))
                ? vttDurations.get(number)
                : '-';

            const speakers = parseSpeakerFromTitle(title, audio.author);

            return {
                sort: Number.isFinite(number) ? number : Number.POSITIVE_INFINITY,
                kind: kindOf(audio.type),
                number: Number.isFinite(number) ? number : '-',
                file_number: '-', // Only the video playlist has numbered transcript files.
                title,
                date,
                date_precision: precision,
                date_source: source,
                collection: audio.id.match(COLLECTION)?.[1] ?? '-',
                duration,
                speakers: speakers || '-',
                youtube_id: audio.youtubeId || '-',
                youtube_url: audio.youtubeUrl || '-',
                transcript_file: audio.vttFile || '-',
                transcript_rows: '-',
                toc_entries: '-',
                description: audio.description || '-',
                notes: alternates || '-',
            };
        })
        .sort((a, b) => a.kind.localeCompare(b.kind) || a.sort - b.sort);
}

// --- output ----------------------------------------------------------------

const COLUMNS = [
    'kind', 'number', 'file_number', 'title', 'date', 'date_precision', 'date_source',
    'collection', 'duration', 'speakers', 'youtube_id', 'youtube_url', 'transcript_file',
    'transcript_rows', 'toc_entries', 'description', 'notes',
];

function writeCsv(rows) {
    const lines = [COLUMNS.join(',')];
    for (const row of rows) lines.push(COLUMNS.map((c) => csvEscape(row[c])).join(','));
    fs.writeFileSync(OUT_CSV, lines.join('\r\n') + '\r\n', 'utf8');
}

function coverage(rows, field) {
    const known = rows.filter((r) => r[field] !== '-' && r[field] !== '').length;
    return `${known}/${rows.length}`;
}

function mdTable(rows, columns) {
    const head = `| ${columns.map((c) => c.label).join(' | ')} |`;
    const rule = `|${columns.map(() => '---').join('|')}|`;
    const body = rows.map((r) => `| ${columns.map((c) => mdCell(c.value(r))).join(' | ')} |`);
    return [head, rule, ...body].join('\n');
}

function writeMarkdown(videoRows, audioRows) {
    const quranStudies = audioRows.filter((r) => r.kind === 'Quran Study');
    const messengerAudios = audioRows.filter((r) => r.kind === 'Messenger Audio');

    const bySource = { catalog: 0, title: 0, description: 0 };
    for (const row of [...videoRows, ...audioRows]) {
        if (row.date_source in bySource) bySource[row.date_source]++;
    }

    const videoColumns = [
        { label: '#', value: (r) => r.number },
        { label: 'File', value: (r) => r.file_number },
        { label: 'Title', value: (r) => r.title },
        { label: 'Date', value: (r) => r.date },
        { label: 'Length', value: (r) => r.duration },
        { label: 'YouTube', value: (r) => (r.youtube_id === '-' ? '-' : `\`${r.youtube_id}\``) },
        { label: 'TOC', value: (r) => r.toc_entries },
        { label: 'Description', value: (r) => clip(r.description, MD_DESCRIPTION_CHARS) },
    ];
    const audioColumns = [
        { label: '#', value: (r) => r.number },
        { label: 'Title', value: (r) => r.title },
        { label: 'Date', value: (r) => r.date },
        { label: 'YouTube', value: (r) => (r.youtube_id === '-' ? '-' : `\`${r.youtube_id}\``) },
        { label: 'Description', value: (r) => clip(r.description, MD_DESCRIPTION_CHARS) },
    ];
    // The tape collection is only meaningful for the Quran Studies, so it earns a column
    // there and is omitted from the Messenger Audio table rather than shown as all "-".
    const quranStudyColumns = [
        ...audioColumns.slice(0, 3),
        { label: 'From', value: (r) => r.collection },
        ...audioColumns.slice(3),
    ];
    const noteRows = videoRows.filter((r) => r.notes !== '-');

    const md = `# Media Index: Videos and Audios

Generated by \`scripts/generate/build_media_index.mjs\`. Do not edit by hand; re-run the
script instead.

This is a short metadata index only. It carries no transcript text. The machine-readable
companion, with untruncated descriptions and every field, is
[\`data/catalog/media-index.csv\`](../data/catalog/media-index.csv).

**A \`-\` means the value is genuinely unknown, not that it is empty.** Those are the gaps
worth filling.

## Coverage at a glance

| Set | Count | Has a date | Has a description | Has a duration |
|---|---|---|---|---|
| Videos and sermons | ${videoRows.length} | ${coverage(videoRows, 'date')} | ${coverage(videoRows, 'description')} | ${coverage(videoRows, 'duration')} |
| Quran Studies | ${quranStudies.length} | ${coverage(quranStudies, 'date')} | ${coverage(quranStudies, 'description')} | ${coverage(quranStudies, 'duration')} |
| Messenger Audios | ${messengerAudios.length} | ${coverage(messengerAudios, 'date')} | ${coverage(messengerAudios, 'description')} | ${coverage(messengerAudios, 'duration')} |

Two caveats on how to read these values.

**Dates are only as precise, and only as trustworthy, as their source.** The CSV records
both: \`date_precision\` says whether a value is a full day, a month, or a year alone, and
\`date_source\` says where it came from. \`catalog\` is a curated date field. \`title\` was
parsed from a date the title itself states. \`description\` was parsed from a date written
into the curated description, which recovers ${bySource.description} record${bySource.description === 1 ? '' : 's'} that would otherwise read as
unknown. Nothing here is derived from a YouTube upload timestamp, because for an archival
re-upload that can be decades off the recording date.

**Video lengths are the transcribed extent, not the container duration.** They come from
the last timestamp in the transcript, so they can fall a few seconds short of the actual
file. Audio durations are all \`-\`: no local media is probed for runtime.

---

## Videos and Sermons (${videoRows.length})

Ordered by curated playlist position (\`src/lib/playlistOrder.ts\`).

**Two numbering systems are in play, so both are shown.** \`#\` is the display position on
the videos page. \`File\` is the number prefixing the transcript CSV in
\`data/sources/playlists/video-transcripts/\`. They do not match: "Who is GOD?" sits at
position 1.5 but is file 02. **Every cross-reference in the notes below uses File
numbers**, because that is what the transcripts and the review document use.

${mdTable(videoRows, videoColumns)}

### Notes on specific videos

Overlap, trim and speaker-label findings, from
[\`docs/TRANSCRIPT_REVIEW_2026-08-19.md\`](TRANSCRIPT_REVIEW_2026-08-19.md). Numbers in
these notes are **File** numbers.

${noteRows.map((r) => `- **File ${r.file_number} — ${r.title}** ${r.notes}`).join('\n')}

---

## Quran Studies (${quranStudies.length})

The **From** column is the tape collection each study was digitized from, recovered from
the catalog id. It is provenance, not a topic.

${mdTable(quranStudies, quranStudyColumns)}

---

## Messenger Audios (${messengerAudios.length})

No descriptions have been written for this set yet, and none carry a date field; the dates
below are parsed from the recording dates stated in their own titles.

${mdTable(messengerAudios, audioColumns)}
`;

    fs.writeFileSync(OUT_MD, md, 'utf8');
}

function main() {
    const videos = JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, 'videos.json'), 'utf8'));
    const audios = JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, 'audios.json'), 'utf8'));

    const thumbDates = loadQuranStudyThumbnailDates();
    const vttDurations = loadAudioVttDurations();

    const videoRows = buildVideoRows(videos, loadPlaylistOrder(), loadTranscripts());
    const audioRows = buildAudioRows(audios, thumbDates, vttDurations);

    writeCsv([...videoRows, ...audioRows]);
    writeMarkdown(videoRows, audioRows);

    console.log(`videos=${videoRows.length} audios=${audioRows.length}`);
    console.log(`  video dates=${coverage(videoRows, 'date')} descriptions=${coverage(videoRows, 'description')} durations=${coverage(videoRows, 'duration')}`);
    console.log(`  audio dates=${coverage(audioRows, 'date')} descriptions=${coverage(audioRows, 'description')} durations=${coverage(audioRows, 'duration')}`);
    console.log(`wrote ${path.relative(ROOT, OUT_CSV)}`);
    console.log(`wrote ${path.relative(ROOT, OUT_MD)}`);
}

main();
