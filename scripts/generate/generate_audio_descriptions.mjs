/**
 * Generates the Description and table of contents for the audio transcripts, using the
 * same storage shape the video transcripts use.
 *
 * Why this shape: the video descriptions and TOCs were written by hand straight into the
 * transcript CSV, in `Description` / `TOC Time` / `TOC Title` columns, and
 * enrich_video_catalog.mjs merely harvests them. The decisive property is that all 1,273
 * video TOC entries have `TOC Time` exactly equal to their own row's `Start Time`: a TOC
 * entry is a *pointer to a caption row*, not a computed number, so it cannot drift.
 *
 * This script reproduces that property mechanically. Whatever timestamp the model returns
 * is snapped to the nearest real caption row and written as that row's exact `Start Time`
 * string, so the anchoring invariant holds no matter how the model formats its answer.
 *
 * Contrast with the earlier generate_quran_study_chapters.mjs, which wrote sidecar JSON
 * with model-invented second values and, when the API path failed, fell through to an
 * algorithmic fallback that sliced the timeline into uniform ~308s blocks titled
 * "Study of Sura X:Y". 93% of the 775 chapters it produced are that fallback. There is no
 * fallback here: a record either gets a real generated TOC or is left alone and reported.
 *
 * Usage:
 *   node scripts/generate/generate_audio_descriptions.mjs --list
 *   node scripts/generate/generate_audio_descriptions.mjs --only MA53,MA55
 *   node scripts/generate/generate_audio_descriptions.mjs --range MA53-MA72 [--force]
 *   node scripts/generate/generate_audio_descriptions.mjs --range QS01-QS52
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const AUDIO_DIR = path.join(ROOT, 'data', 'sources', 'playlists', 'audio-transcripts');
const CATALOG = path.join(ROOT, 'data', 'catalog', 'audios.json');
const NEW_COLUMNS = ['Description', 'TOC Time', 'TOC Title'];

// Targets measured off the 50 hand-written video transcripts, so the audio records land
// on the same standard rather than a guessed one:
//   description  median 1,287 chars (462-1,743)
//   TOC entries  median 21 per record (4-63), median gap 60s
//   TOC density   median 54 entries per hour (p25 46, p75 58)
const DESC_MIN = 700;
const DESC_MAX = 2200;
const TOC_PER_HOUR = 54;

function loadEnv() {
    const p = path.join(ROOT, '.env.local');
    if (!fs.existsSync(p)) return;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}
loadEnv();

const API_KEY = process.env.GEMINI_API;
// Quota is per model per day, so a single model runs dry partway through a batch of this
// size. The run walks this list, retiring a model when it reports quota exhaustion and
// carrying on with the next, and records which model produced each record.
const MODELS = (process.env.AUDIO_DESC_MODEL || [
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
].join(',')).split(',').map((m) => m.trim()).filter(Boolean);
const exhausted = new Set();
const PACE_MS = Number(process.env.AUDIO_DESC_PACE_MS || 3000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (!API_KEY) {
    console.error('GEMINI_API is not set in .env.local');
    process.exit(1);
}

/* ---------------- CSV ---------------- */

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

const needsQuote = (s) => /[",\r\n]/.test(s);
const cell = (s) => (needsQuote(s) ? `"${s.replace(/"/g, '""')}"` : s);
const toCsv = (rows) => rows.map((r) => r.map((c) => cell(c ?? '')).join(',')).join('\r\n') + '\r\n';

// Tolerant on purpose. The transcript's own Start Time is always HH:MM:SS.mmm, but a model
// asked to copy a timestamp will sometimes hand back "[00:12:34]" with the brackets it saw
// in the prompt, or drop the hours on a short record. Accepting those costs nothing, and
// rejecting them silently discarded a whole record's TOC (QS07 lost all 73 entries that way).
const toSec = (t) => {
    const s = String(t || '').replace(/[[\]\s]/g, '');
    let m = /^(\d+):(\d+):(\d+)(?:[.,](\d+))?$/.exec(s);
    if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3] + (m[4] ? +`0.${m[4]}` : 0);
    m = /^(\d+):(\d+)(?:[.,](\d+))?$/.exec(s);
    if (m) return +m[1] * 60 + +m[2] + (m[3] ? +`0.${m[3]}` : 0);
    return null;
};
const hms = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
};

/* ---------------- record discovery ---------------- */

const ytId = (l) => {
    const m = /[?&]v=([A-Za-z0-9_-]{6,})/.exec(l || '') || /youtu\.be\/([A-Za-z0-9_-]{6,})/.exec(l || '');
    return m ? m[1] : null;
};

function discover() {
    const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
    const byYt = new Map();
    for (const f of fs.readdirSync(AUDIO_DIR).filter((x) => x.toLowerCase().endsWith('.csv'))) {
        const rows = parseCsv(fs.readFileSync(path.join(AUDIO_DIR, f), 'utf8'));
        if (rows.length < 2) continue;
        const header = rows[0].map((h) => h.trim());
        const link = header.indexOf('Link');
        const id = ytId(rows[1][link]);
        if (!id) continue;
        if (!byYt.has(id)) byYt.set(id, []);
        byYt.get(id).push(f);
    }
    const out = [];
    for (const item of catalog) {
        let key = null;
        if (item.type === 'quran-study') {
            const m = /^quran-study\/(\d+)/i.exec(item.id || '');
            if (m && +m[1] >= 1 && +m[1] <= 52) key = `QS${String(+m[1]).padStart(2, '0')}`;
        } else if (item.type === 'messenger-audio') {
            const n = item.primaryNumber;
            if (n >= 53 && n <= 72) key = `MA${n}`;
        }
        if (!key) continue;
        const files = byYt.get(item.youtubeId) || [];
        if (files.length) out.push({ key, item, files });
    }
    return out.sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }));
}

/* ---------------- prompt ---------------- */

const SYSTEM = `You write catalog metadata for an archive of 1980s religious audio recordings by Dr. Rashad Khalifa and his study circle in Tucson, Arizona.

Match the house style of the archive's existing video entries exactly:

DESCRIPTION
- One single paragraph of continuous prose. No headings, no bullet points, no line breaks.
- Third person, plain past/present tense, reportorial. Describe what the recording contains.
- DENSE AND SPECIFIC. Name the sura and verse numbers discussed, the people who speak, the
  anecdotes told, the arguments made, the objections raised, and who raised them.
- Attribute contested religious claims to the speaker ("he argues", "he states on the
  authority of", "he presents as"), never in the archive's own voice.
- NEVER open with "In this recording", "This audio", "This session" or similar. Start with
  the substance or the speaker.
- No marketing language, no evaluation of whether the content is true, no closing summary
  sentence, no invitation to the listener.
- 900 to 1,600 characters.

TABLE OF CONTENTS
- Roughly one entry every 60 seconds of runtime, placed where the
  subject actually changes rather than at even intervals.
- Each "time" MUST be copied verbatim from the [timestamp] of a line in the transcript I
  give you. Never invent, round or interpolate a timestamp.
- Titles are short noun phrases naming the specific topic, 3 to 8 words. Title Case.
  Good: "Ninety Percent Rejected as Untrustworthy", "The Three Groups in Al-Baqarah".
  Bad: "Continuation of study", "Discussion", "Study of Sura 2:8", "More Questions".
- Do not title an entry with only a verse reference. Say what is argued about it.
- Cover the whole recording, including informal conversation, recitation and Q&A.`;

const SCHEMA = {
    type: 'object',
    properties: {
        description: { type: 'string' },
        toc: {
            type: 'array',
            items: {
                type: 'object',
                properties: { time: { type: 'string' }, title: { type: 'string' } },
                required: ['time', 'title'],
            },
        },
    },
    required: ['description', 'toc'],
};

function retryDelayMs(body) {
    // The API reports how long to wait in a RetryInfo detail; honour it when present.
    const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
    return m ? Math.ceil(Number(m[1]) * 1000) : null;
}

async function callModel(model, prompt, attempt = 1) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': API_KEY },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM }] },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    responseMimeType: 'application/json',
                    responseSchema: SCHEMA,
                    maxOutputTokens: 32768,
                },
            }),
        },
    );
    if (!res.ok) {
        const body = await res.text();
        const quotaGone = res.status === 429 && /quota/i.test(body);
        if (quotaGone) {
            const err = new Error(`quota exhausted for ${model}`);
            err.quota = true;
            throw err;
        }
        if ((res.status === 429 || res.status >= 500) && attempt <= 3) {
            const wait = retryDelayMs(body) ?? 5000 * attempt;
            console.log(`      ${model} HTTP ${res.status}, waiting ${Math.round(wait / 1000)}s`);
            await sleep(wait);
            return callModel(model, prompt, attempt + 1);
        }
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const finish = data?.candidates?.[0]?.finishReason;
    if (!text.trim()) throw new Error(`no content (${finish || 'empty'})`);
    try {
        return { parsed: JSON.parse(text), model };
    } catch (e) {
        // A truncated response is a token-budget problem, not malformed model output.
        throw new Error(finish === 'MAX_TOKENS'
            ? `response truncated at maxOutputTokens (${text.length} chars)`
            : `unparseable JSON (${finish}): ${e.message}`);
    }
}

async function callGemini(prompt) {
    let lastErr = null;
    for (const model of MODELS) {
        if (exhausted.has(model)) continue;
        try {
            return await callModel(model, prompt);
        } catch (e) {
            lastErr = e;
            if (e.quota) {
                console.log(`      ${model} out of quota, falling back`);
                exhausted.add(model);
                continue;
            }
            throw e;
        }
    }
    throw lastErr || new Error('all models exhausted');
}

/* ---------------- per-record work ---------------- */

function loadTranscript(files) {
    // A record can span more than one CSV; concatenate in filename order.
    const parts = [];
    for (const f of files) {
        const p = path.join(AUDIO_DIR, f);
        const rows = parseCsv(fs.readFileSync(p, 'utf8'));
        const header = rows[0].map((h) => h.trim());
        parts.push({ file: f, path: p, header, body: rows.slice(1) });
    }
    return parts;
}

function transcriptForPrompt(parts) {
    const lines = [];
    const anchors = [];
    for (const part of parts) {
        const iStart = part.header.indexOf('Start Time');
        const iText = part.header.indexOf('Text');
        const iSpk = part.header.indexOf('Speaker');
        for (const r of part.body) {
            const st = (r[iStart] || '').trim();
            const sec = toSec(st);
            if (sec === null) continue;
            // Strip Arabic script and transliteration duplicates: the English line carries
            // the meaning and the rest triples the token count for nothing.
            const raw = (r[iText] || '').split('\n')
                .filter((l) => l.trim() && !/[؀-ۿ]/.test(l))
                .join(' ').replace(/\s+/g, ' ').trim();
            anchors.push({ sec, label: hms(sec), raw: st });
            if (!raw) continue;
            const spk = (r[iSpk] || '').trim();
            lines.push(`[${hms(sec)}]${spk ? ` ${spk}:` : ''} ${raw}`);
        }
    }
    return { text: lines.join('\n'), anchors };
}

// Snap a model-supplied timestamp onto the nearest real caption row. This is what
// guarantees the anchoring invariant regardless of what the model returned.
function snap(time, anchors) {
    const want = toSec(time);
    if (want === null) return null;
    let best = null, bestD = Infinity;
    for (const a of anchors) {
        const d = Math.abs(a.sec - want);
        if (d < bestD) { bestD = d; best = a; }
    }
    // A model timestamp more than 20s from any caption row is a hallucination, not a slip.
    return bestD <= 20 ? best : null;
}

function applyToCsv(parts, description, toc) {
    // Ensure the three columns exist, appended so existing header-keyed readers are safe.
    for (const part of parts) {
        for (const col of NEW_COLUMNS) {
            if (!part.header.includes(col)) {
                part.header.push(col);
                for (const r of part.body) while (r.length < part.header.length) r.push('');
            }
        }
        for (const r of part.body) while (r.length < part.header.length) r.push('');
    }
    const first = parts[0];
    const iDesc = first.header.indexOf('Description');
    // The description sits on the first data row, exactly as the video files do.
    first.body[0][iDesc] = description;

    let placed = 0;
    for (const { rawTime, title } of toc) {
        for (const part of parts) {
            const iStart = part.header.indexOf('Start Time');
            const iTime = part.header.indexOf('TOC Time');
            const iTitle = part.header.indexOf('TOC Title');
            const row = part.body.find((r) => (r[iStart] || '').trim() === rawTime);
            if (row) {
                row[iTime] = rawTime;   // identical to the row's own Start Time, by construction
                row[iTitle] = title;
                placed += 1;
                break;
            }
        }
    }
    for (const part of parts) {
        fs.writeFileSync(part.path, toCsv([part.header, ...part.body]), 'utf8');
    }
    return placed;
}

function alreadyDone(parts) {
    const p = parts[0];
    const iDesc = p.header.indexOf('Description');
    const iTitle = p.header.indexOf('TOC Title');
    if (iDesc === -1 || iTitle === -1) return false;
    const hasDesc = p.body.some((r) => (r[iDesc] || '').trim());
    const hasToc = parts.some((q) => {
        const i = q.header.indexOf('TOC Title');
        return i !== -1 && q.body.some((r) => (r[i] || '').trim());
    });
    return hasDesc && hasToc;
}

async function processRecord(rec, force) {
    const parts = loadTranscript(rec.files);
    if (!force && alreadyDone(parts)) return { key: rec.key, status: 'skipped (already has both)' };

    const { text, anchors } = transcriptForPrompt(parts);
    if (!anchors.length) return { key: rec.key, status: 'no timestamped rows' };
    const runtime = anchors[anchors.length - 1].sec;
    const target = Math.max(8, Math.min(70, Math.round((runtime / 3600) * TOC_PER_HOUR)));

    const prompt = [
        `Record: ${rec.item.title}`,
        `Runtime: ${hms(runtime)}`,
        `Produce a description and about ${target} table-of-contents entries.`,
        '',
        'Every "time" you return must be copied verbatim from a [timestamp] below.',
        '',
        '--- TRANSCRIPT ---',
        text,
    ].join('\n');

    const { parsed: out, model } = await callGemini(prompt);
    const description = (out.description || '').replace(/\s+/g, ' ').trim();
    if (description.length < DESC_MIN || description.length > DESC_MAX) {
        return { key: rec.key, status: `description length ${description.length} outside ${DESC_MIN}-${DESC_MAX}` };
    }

    // Snap, dedupe and order.
    const seen = new Set();
    const toc = [];
    let dropped = 0;
    const dbg = process.env.AUDIO_DESC_DEBUG === '1';
    if (dbg) console.log(`
      anchors=${anchors.length} firstAnchor=${JSON.stringify(anchors[0])} lastAnchor=${JSON.stringify(anchors[anchors.length-1])}`);
    for (const e of out.toc || []) {
        const a = snap(e.time, anchors);
        if (dbg && toc.length + dropped < 5) {
            console.log(`      time=${JSON.stringify(e.time)} -> ${a ? a.raw : 'NO SNAP'} title=${JSON.stringify((e.title||'').slice(0,30))}`);
        }
        const title = (e.title || '').replace(/\s+/g, ' ').trim();
        if (!a || !title) { dropped += 1; continue; }
        if (seen.has(a.raw)) { dropped += 1; continue; }
        seen.add(a.raw);
        toc.push({ sec: a.sec, rawTime: a.raw, title });
    }
    toc.sort((x, y) => x.sec - y.sec);
    if (toc.length < 5) {
        return {
            key: rec.key,
            status: `only ${toc.length} usable TOC entries (model returned ${(out.toc || []).length}, `
                + `${dropped} dropped; first returned time ${JSON.stringify((out.toc || [])[0]?.time ?? null)})`,
        };
    }

    const placed = applyToCsv(parts, description, toc);
    return {
        key: rec.key, status: 'ok', desc: description.length,
        toc: placed, dropped, runtime: hms(runtime), model,
    };
}

/* ---------------- cli ---------------- */

function selection(records, argv) {
    const only = argv.find((a) => a.startsWith('--only='))?.split('=')[1]
        || (argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null);
    if (only) {
        const want = new Set(only.split(',').map((s) => s.trim().toUpperCase()));
        return records.filter((r) => want.has(r.key.toUpperCase()));
    }
    const range = argv.find((a) => a.startsWith('--range='))?.split('=')[1]
        || (argv.includes('--range') ? argv[argv.indexOf('--range') + 1] : null);
    if (range) {
        const [a, b] = range.split('-').map((s) => s.trim().toUpperCase());
        const keys = records.map((r) => r.key.toUpperCase());
        const i = keys.indexOf(a), j = keys.indexOf(b);
        if (i === -1 || j === -1) throw new Error(`range endpoints not found: ${range}`);
        return records.slice(Math.min(i, j), Math.max(i, j) + 1);
    }
    return records;
}

const argv = process.argv.slice(2);
const records = discover();

if (argv.includes('--list')) {
    for (const r of records) {
        const parts = loadTranscript(r.files);
        console.log(`${r.key.padEnd(6)} ${alreadyDone(parts) ? 'done   ' : 'pending'} ${r.files[0]}`);
    }
    process.exit(0);
}

const chosen = selection(records, argv);
const force = argv.includes('--force');
console.log(`models ${MODELS.join(' > ')} | ${chosen.length} record(s)${force ? ' | force' : ''}\n`);

const results = [];
for (const [i, rec] of chosen.entries()) {
    process.stdout.write(`[${i + 1}/${chosen.length}] ${rec.key} ... `);
    try {
        const r = await processRecord(rec, force);
        results.push(r);
        console.log(r.status === 'ok'
            ? `ok  desc ${r.desc}c  toc ${r.toc}${r.dropped ? ` (${r.dropped} dropped)` : ''}  runtime ${r.runtime}  [${r.model}]`
            : r.status);
    } catch (e) {
        results.push({ key: rec.key, status: `ERROR ${e.message}` });
        console.log(`ERROR ${e.message.slice(0, 160)}`);
    }
    if (i < chosen.length - 1) await sleep(PACE_MS);
}

const ok = results.filter((r) => r.status === 'ok');
console.log(`\n${ok.length}/${chosen.length} generated.`);
const bad = results.filter((r) => r.status !== 'ok' && !r.status.startsWith('skipped'));
if (bad.length) {
    console.log('Not generated:');
    for (const b of bad) console.log(`  ${b.key}: ${b.status}`);
}
