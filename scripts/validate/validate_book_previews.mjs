/**
 * Independent audit of the generated book tables of contents.
 *
 * Re-checks, from the book text alone, that every TOC entry is real:
 *   1. the heading's text actually occurs on the page the entry points at,
 *   2. that page is not the book's own contents page,
 *   3. pages are in ascending order and inside the book,
 *   4. no duplicate headings.
 *
 * Deliberately does not share code with generate_book_previews.mjs beyond the notion of
 * "letters only" comparison, so a bug in the generator's matcher cannot hide here.
 *
 * Exits non-zero on any failure. Run: node scripts/validate/validate_book_previews.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');
const PREVIEWS = path.join(ROOT, 'data', 'catalog', 'book-previews.json');

if (!fs.existsSync(PREVIEWS)) {
    console.log('No book-previews.json; nothing to validate.');
    process.exit(0);
}

const letters = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const wordList = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

const master = JSON.parse(fs.readFileSync(MASTER, 'utf8'));
const previews = JSON.parse(fs.readFileSync(PREVIEWS, 'utf8'));
const books = new Map(master.filter((b) => b.category === 'Books').map((b) => [b.id, b]));

const problems = [];
let entries = 0;
let exact = 0;
let partial = 0;

for (const [id, preview] of Object.entries(previews)) {
    const book = books.get(id);
    if (!book) { problems.push(`${id}: no such book in MASTER_INDEX`); continue; }

    const byPage = new Map();
    for (const s of book.segments || []) {
        const p = Number(s.page) || 0;
        if (p) byPage.set(p, `${byPage.get(p) || ''} ${s.text || ''}`);
    }
    const maxPage = Math.max(...byPage.keys());
    const contentsPages = new Set(
        [...byPage.entries()]
            .filter(([p, t]) => p <= 20 && /\bcontents\b/i.test(t) && /\.{3,}|…/.test(t))
            .map(([p]) => p),
    );

    let lastPage = 0;
    const seen = new Set();
    for (const entry of preview.toc || []) {
        entries += 1;
        const label = `${id} p${entry.page} "${String(entry.title).slice(0, 48)}"`;

        if (!Number.isInteger(entry.page) || entry.page < 1 || entry.page > maxPage) {
            problems.push(`${label}: page outside 1..${maxPage}`);
            continue;
        }
        if (entry.page < lastPage) problems.push(`${label}: page goes backwards (previous ${lastPage})`);
        lastPage = entry.page;

        const key = letters(entry.title);
        if (seen.has(key)) problems.push(`${label}: duplicate heading`);
        seen.add(key);

        if (contentsPages.has(entry.page)) {
            problems.push(`${label}: points at the book's own contents page`);
            continue;
        }

        const pageText = byPage.get(entry.page) || '';
        if (letters(pageText).includes(key)) {
            exact += 1;
            continue;
        }
        // Fall back to word overlap, the same allowance the generator makes for OCR damage.
        const hw = [...new Set(wordList(entry.title))].filter((w) => w.length > 3);
        const pageWords = new Set(wordList(pageText));
        const hits = hw.filter((w) => pageWords.has(w)).length;
        if (hw.length >= 2 && hits / hw.length >= 0.75) {
            partial += 1;
        } else {
            problems.push(`${label}: heading text not found on that page (${hits}/${hw.length} words)`);
        }
    }
}

// A page holding a large share of a book's table is a contents or index page that the
// entries were wrongly resolved to. This is the check that caught the 1989 Quran, whose
// 111 sura headings all pointed at its sura list.
for (const [id, preview] of Object.entries(previews)) {
    const toc = preview.toc || [];
    if (toc.length < 5) continue;
    const perPage = new Map();
    for (const t of toc) perPage.set(t.page, (perPage.get(t.page) || 0) + 1);
    const [page, count] = [...perPage.entries()].sort((a, b) => b[1] - a[1])[0];
    const pageCount = preview.pageCount || 0;
    const frontMatterList = pageCount > 40 && page <= 20 && count >= 3;
    if (count / toc.length > 0.3 && count > 3) {
        problems.push(`${id}: p${page} holds ${count} of ${toc.length} entries, so it is a contents or index page`);
    } else if (frontMatterList) {
        problems.push(`${id}: p${page} is front matter holding ${count} entries, so it is a contents or index page`);
    }
}

console.log(`books ${Object.keys(previews).length} | TOC entries ${entries} | exact ${exact} | fuzzy ${partial}`);
if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    problems.slice(0, 40).forEach((p) => console.error(`  ${p}`));
    if (problems.length > 40) console.error(`  ... ${problems.length - 40} more`);
    process.exit(1);
}
console.log('Every TOC entry verified against the page it points at.');
