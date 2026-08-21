/**
 * Builds a description and a verified table of contents for each book in
 * data/catalog / BOOKS_LIST, for the preview modal on /written.
 *
 * The accuracy problem is different from the newsletters. Book records carry only
 * page-level text with `label: "page"` -- no heading structure at all -- so a table of
 * contents has to be derived. Six of the thirteen books do have a printed contents page,
 * but its OCR is noisy ("Phe, Our inland @christianity") and, more importantly, its page
 * numbers are *printed* page numbers, which are offset from the PDF page the reader has to
 * open.
 *
 * So the model is asked only for the heading TEXT. Every page number is then found by
 * searching the book's own page text for that heading, and an entry whose heading cannot be
 * located is dropped rather than shipped. The page number a reader clicks is therefore
 * derived from the document, never from the model, and each entry is known to exist.
 *
 * Output: data/catalog/book-previews.json
 * Run:    node scripts/generate/generate_book_previews.mjs [--only computer-speaks] [--force]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');
const OUT = path.join(ROOT, 'data', 'catalog', 'book-previews.json');

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
if (!API_KEY) { console.error('GEMINI_API not set in .env.local'); process.exit(1); }

const MODELS = (process.env.BOOK_PREVIEW_MODEL || [
    'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.7-flash',
].join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const exhausted = new Set();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- text helpers ---------------- */

// OCR of these scans mangles punctuation and drops spaces, so matching has to be done on
// letters and digits alone.
const words = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
const squash = (s) => words(s).join('');

/**
 * Finds the page a heading appears on, tolerating OCR damage.
 *
 * Exact-ish first: the heading's letters as one run, which survives lost spaces and
 * mangled punctuation. Then a word-overlap fallback, requiring most of the heading's
 * distinctive words on one page. Returns null when neither succeeds, which is the signal
 * to drop the entry.
 *
 * Contents pages are excluded from the search. Every heading in a book is also printed on
 * its contents page, so searching from page 1 resolved almost the whole table to the
 * contents page itself -- seven of ten entries for the 1974 ISLAM journal all pointed at
 * p7. A table of contents whose links go to the table of contents is worse than none.
 */
function locateHeading(heading, pages) {
    const target = squash(heading);
    if (target.length < 6) return null;
    const body = pages.filter((p) => !p.isContents);

    for (const p of body) {
        if (p.squashed.includes(target)) return { page: p.page, how: 'exact' };
    }

    const hw = [...new Set(words(heading))].filter((w) => w.length > 3);
    if (hw.length < 2) return null;
    let best = null;
    for (const p of body) {
        const hits = hw.filter((w) => p.wordSet.has(w)).length;
        const ratio = hits / hw.length;
        // Earliest page wins on a tie: a heading recurring in a running header should
        // resolve to where the section starts, not to its last appearance.
        if (ratio >= 0.75 && (!best || ratio > best.ratio)) best = { page: p.page, ratio, how: 'words' };
    }
    return best;
}

// A heading is a label, not a sentence. The model occasionally returns a line of body
// prose lifted from a page ("Reciting "The Key" in Arabic unifies all Submitters of the
// world, regardless of..."), which is not a table-of-contents entry.
function looksLikeHeading(title) {
    if (title.length > 90) return false;
    if (words(title).length > 14) return false;
    if (/[.!?]$/.test(title) && words(title).length > 6) return false;
    return true;
}

/* ---------------- model ---------------- */

const SYSTEM = `You produce catalog metadata for scanned books in a religious-studies archive.

DESCRIPTION
- One paragraph of continuous prose, 700 to 1,500 characters. No headings or lists.
- Third person, reportorial. Say what the book contains and how it is organised.
- Attribute contested claims to the author ("he argues", "he presents"), never assert them.
- Never open with "This book" or "In this volume". Start with the substance.

TABLE OF CONTENTS
- The chapter, section or article headings, in the order they appear.
- Copy each heading as the book prints it, corrected only for obvious OCR damage
  (restore missing spaces and mangled punctuation; keep the wording).
- If the book has a printed contents page, use its headings.
- Do NOT invent headings, do NOT summarise, do NOT output page numbers: page numbers are
  resolved separately by searching the book text.
- Between 3 and 40 entries. Skip covers, blank pages, copyright pages and indexes.`;

const SCHEMA = {
    type: 'object',
    properties: {
        description: { type: 'string' },
        headings: { type: 'array', items: { type: 'string' } },
    },
    required: ['description', 'headings'],
};

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
                    temperature: 0.3,
                    responseMimeType: 'application/json',
                    responseSchema: SCHEMA,
                    maxOutputTokens: 16384,
                },
            }),
        },
    );
    if (!res.ok) {
        const body = await res.text();
        if (res.status === 429 && /quota/i.test(body)) {
            const e = new Error(`quota exhausted for ${model}`);
            e.quota = true;
            throw e;
        }
        // "high demand" 503s are transient and common on the newest models; back off
        // rather than failing the book, which is what left one volume ungenerated.
        if (res.status >= 500 && attempt <= 4) {
            const wait = 6000 * attempt;
            console.log(`      ${model} HTTP ${res.status}, retrying in ${wait / 1000}s`);
            await sleep(wait);
            return callModel(model, prompt, attempt + 1);
        }
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 180)}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const finish = data?.candidates?.[0]?.finishReason;
    if (!text.trim()) throw new Error(`no content (${finish})`);
    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error(finish === 'MAX_TOKENS' ? 'response truncated' : `bad JSON: ${e.message}`);
    }
}

async function callGemini(prompt) {
    let last = null;
    for (const model of MODELS) {
        if (exhausted.has(model)) continue;
        try {
            return { parsed: await callModel(model, prompt), model };
        } catch (e) {
            last = e;
            if (e.quota) { console.log(`      ${model} out of quota`); exhausted.add(model); continue; }
            throw e;
        }
    }
    throw last || new Error('all models exhausted');
}

/* ---------------- per book ---------------- */

const CONTENTS_RE = /\b(table of contents|contents)\b/i;

function buildPrompt(book, pages) {
    // A printed contents page is the author's own answer, so hand it over whole.
    const contentsPages = pages
        .filter((p) => p.page <= 20 && CONTENTS_RE.test(p.text) && /\.{3,}|…/.test(p.text))
        .slice(0, 2);

    // Front matter in full, then the opening of every later page. Headings live at the top
    // of a page, so the first slice of each carries them without shipping the whole book.
    const front = pages.filter((p) => p.page <= 24)
        .map((p) => `[p${p.page}] ${p.text.slice(0, 700)}`);
    const rest = pages.filter((p) => p.page > 24)
        .map((p) => `[p${p.page}] ${p.text.slice(0, 260)}`);

    const parts = [
        `Book: ${book.displayTitle || book.title}`,
        `Author: ${book.author || 'unknown'}`,
        `Pages: ${pages.length}`,
        '',
    ];
    if (contentsPages.length) {
        parts.push('--- PRINTED CONTENTS PAGE (OCR, use these headings) ---');
        contentsPages.forEach((p) => parts.push(`[p${p.page}] ${p.text.slice(0, 2500)}`));
        parts.push('');
    }
    parts.push('--- FRONT MATTER ---', ...front, '', '--- PAGE OPENINGS ---', ...rest);
    return parts.join('\n');
}

async function processBook(book) {
    const segs = (book.segments || []).filter((s) => (s.text || '').trim());
    if (!segs.length) return { id: book.id, status: 'no text' };

    const pages = segs.map((s) => {
        const text = String(s.text || '').replace(/\s+/g, ' ').trim();
        return {
            page: Number(s.page) || 0,
            text,
            squashed: squash(text),
            wordSet: new Set(words(text)),
            // A contents page: says so, and carries the dot leaders of a printed list.
            isContents: CONTENTS_RE.test(text) && /\.{3,}|…/.test(text),
        };
    }).filter((p) => p.page > 0);

    const out = await callGemini(buildPrompt(book, pages));
    const description = String(out.parsed.description || '').replace(/\s+/g, ' ').trim();
    if (description.length < 400) return { id: book.id, status: `description too short (${description.length})` };

    const candidates = [];
    const seen = new Set();
    for (const raw of out.parsed.headings || []) {
        const title = String(raw || '').replace(/\s+/g, ' ').replace(/[.…\s]+$/, '').trim();
        if (!title || title.length < 3 || !looksLikeHeading(title)) continue;
        const key = squash(title);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        candidates.push(title);
    }

    /**
     * Resolve, then move entries off list pages.
     *
     * Every heading in a book is also printed on its contents page, so a naive search
     * resolves much of the table to that one page. An earlier version excluded the whole
     * page and re-resolved, but that chased the cluster down the book: excluding p13 moved
     * it to p14, then p15, and eight legitimate pages were suppressed before it settled.
     *
     * So the correction is per entry, not per page. A page that several entries claim is a
     * list; for each of those entries look for a different page carrying the same heading,
     * which is where the section actually begins. An entry that exists only in the list has
     * no body page to point at, so it is dropped rather than aimed at the list.
     */
    const LIST_PAGE_MIN = 3;
    const listPages = new Set();
    let toc = [];
    let unverified = 0;

    // A list can span several pages (the visual presentation prints its index across four,
    // the screenplay its scene list across one dense page), so relocating once only moves a
    // cluster from the first list page to the second. Recompute which pages are lists after
    // each round, up to a bound, then drop anything still stuck on one: an entry that
    // appears nowhere but a list has no body page to point at.
    for (let round = 0; round < 4; round += 1) {
        const usable = pages.filter((p) => !listPages.has(p.page));
        const resolved = new Map();
        unverified = 0;
        for (const title of candidates) {
            const found = locateHeading(title, usable);
            if (!found) { unverified += 1; continue; }
            resolved.set(title, found);
        }
        const perPage = new Map();
        for (const f of resolved.values()) perPage.set(f.page, (perPage.get(f.page) || 0) + 1);
        const fresh = [...perPage.entries()]
            .filter(([, n]) => n >= LIST_PAGE_MIN)
            .map(([pg]) => pg)
            .filter((pg) => !listPages.has(pg));

        toc = [...resolved].map(([title, f]) => ({ title, page: f.page, match: f.how }));
        if (!fresh.length) break;
        fresh.forEach((pg) => listPages.add(pg));
        console.log(`      list page(s) ${fresh.join(', ')}: relocating their entries`);

        if (round === 3) {
            // Final round: anything still on a list page is unanchorable, so drop it.
            const before = toc.length;
            toc = toc.filter((t) => !listPages.has(t.page));
            unverified += before - toc.length;
        }
    }
    toc.sort((a, b) => a.page - b.page);
    if (toc.length < 3) {
        return { id: book.id, status: `only ${toc.length} verified heading(s), ${unverified} unverifiable` };
    }
    return {
        id: book.id,
        status: 'ok',
        model: out.model,
        pageCount: pages.length,
        description,
        toc,
        unverified,
    };
}

/* ---------------- main ---------------- */

const master = JSON.parse(fs.readFileSync(MASTER, 'utf8'));
let books = master.filter((x) => x.category === 'Books');
const onlyIdx = process.argv.indexOf('--only');
if (onlyIdx !== -1 && process.argv[onlyIdx + 1]) {
    const want = new Set(process.argv[onlyIdx + 1].split(',').map((s) => s.trim()));
    books = books.filter((b) => want.has(b.id));
}
const force = process.argv.includes('--force');
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

console.log(`models ${MODELS.join(' > ')} | ${books.length} book(s)\n`);
const results = [];
for (const [i, book] of books.entries()) {
    process.stdout.write(`[${i + 1}/${books.length}] ${book.id} ... `);
    if (!force && existing[book.id]) { console.log('skipped (already present)'); continue; }
    try {
        const r = await processBook(book);
        results.push(r);
        if (r.status === 'ok') {
            existing[book.id] = {
                description: r.description,
                pageCount: r.pageCount,
                toc: r.toc.map(({ title, page }) => ({ title, page })),
                generated: { model: r.model, verifiedEntries: r.toc.length, droppedUnverifiable: r.unverified },
            };
            const exact = r.toc.filter((t) => t.match === 'exact').length;
            console.log(`ok  desc ${r.description.length}c  toc ${r.toc.length} `
                + `(${exact} exact, ${r.toc.length - exact} fuzzy, ${r.unverified} dropped)  [${r.model}]`);
        } else {
            console.log(r.status);
        }
    } catch (e) {
        results.push({ id: book.id, status: `ERROR ${e.message}` });
        console.log(`ERROR ${e.message.slice(0, 140)}`);
    }
    if (i < books.length - 1) await sleep(2500);
}

fs.writeFileSync(OUT, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
const ok = results.filter((r) => r.status === 'ok').length;
console.log(`\n${ok}/${books.length} generated -> ${path.relative(ROOT, OUT)}`);
const bad = results.filter((r) => r.status !== 'ok');
if (bad.length) {
    console.log('Not generated:');
    bad.forEach((b) => console.log(`  ${b.id}: ${b.status}`));
}
