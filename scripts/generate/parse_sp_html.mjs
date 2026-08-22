// Turns the cached SP HTML editions into clean, searchable text.
//
// Content is preserved verbatim — this only removes markup and site chrome (page
// navigation, the repeated masthead, footer links). No spelling, punctuation, or
// wording is altered, because this is an archival source, not copy to be edited.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'data', 'sources', 'sp-html');

const ENTITIES = {
    nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
    ldquo: '\u201c', rdquo: '\u201d', lsquo: '\u2018', rsquo: '\u2019',
    mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', eacute: '\u00e9',
    uuml: '\u00fc', auml: '\u00e4', ouml: '\u00f6', deg: '\u00b0', middot: '\u00b7',
};

function decodeEntities(text) {
    return text
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
        .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

// Site furniture that repeats on every page and would otherwise pollute every search.
const CHROME_PATTERNS = [
    /<p class="volume"[^>]*>[\s\S]*?<\/p>/gi,
    /<p class="basmala"[^>]*>[\s\S]*?<\/p>/gi,
    /<p class="sp"[^>]*>[\s\S]*?<\/p>/gi,
    /<td[^>]*class="published"[^>]*>[\s\S]*?<\/td>/gi,
];

const CHROME_LINES = new Set([
    'masjid tucson', 'home page', 'submitters perspective', 'muslim perspective',
    'in the name of god, most gracious, most merciful',
    'monthly bulletin of united submitters international',
    'proclaiming the only religion acceptable to god',
    'united submitters international', 'all rights reserved',
]);

function isChromeLine(line) {
    const normalized = line.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
    if (!normalized) return true;
    if (CHROME_LINES.has(normalized)) return true;
    if (/^page \d+(,? \d+)*$/.test(normalized)) return true;
    if (/^(previous|next|back|top|index|contents)$/.test(normalized)) return true;
    return false;
}

export function parsePage(html) {
    let body = html.slice(html.indexOf('<body'));
    body = body
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');

    for (const pattern of CHROME_PATTERNS) body = body.replace(pattern, ' ');

    // Mark headings before tags are flattened so article titles survive as structure.
    body = body.replace(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi, (_, inner) => `\n\n\u0001${inner}\u0001\n\n`);

    body = body
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|td|tr|table|li|blockquote)>/gi, '\n\n')
        .replace(/<li[^>]*>/gi, '\n\u2022 ')
        .replace(/<[^>]+>/g, '');

    body = decodeEntities(body);

    const blocks = [];
    for (const chunk of body.split(/\n{2,}/)) {
        const isHeading = chunk.includes('\u0001');
        const text = chunk
            .replace(/\u0001/g, '')
            .split('\n')
            .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
            .filter((line) => line.length > 0)
            .join(isHeading ? ' ' : '\n')
            .trim();

        if (!text || isChromeLine(text)) continue;
        blocks.push({ type: isHeading ? 'heading' : 'paragraph', text });
    }

    return blocks;
}

export function readIssuePages(issueDir) {
    const files = fs.readdirSync(issueDir)
        .filter((f) => /^page\d+\.html$/.test(f))
        .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

    return files.map((file) => ({
        page_number: Number(file.match(/\d+/)[0]),
        blocks: parsePage(fs.readFileSync(path.join(issueDir, file), 'utf8')),
    }));
}

export function listIssueDirs() {
    const out = [];
    for (const year of fs.readdirSync(ROOT).sort()) {
        const yearDir = path.join(ROOT, year);
        if (!fs.statSync(yearDir).isDirectory()) continue;
        for (const month of fs.readdirSync(yearDir).sort()) {
            out.push({ year: Number(year), month, dir: path.join(yearDir, month) });
        }
    }
    return out;
}
