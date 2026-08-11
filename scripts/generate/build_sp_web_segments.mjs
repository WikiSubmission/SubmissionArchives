// Builds search-grade segments for the Submitters Perspective from the cached HTML
// editions. The words are preserved exactly as published; this only changes how the text
// is divided, because the existing index stores whole pages (and in 48 of 64 issues a
// single segment over 3,000 chars, worst case 15,749) which makes proximity ranking
// meaningless and caps how many distinct passages an issue can ever surface.
import fs from 'node:fs';
import path from 'node:path';
import { readIssuePages, listIssueDirs } from './parse_sp_html.mjs';

const OUT = path.join(process.cwd(), 'data', 'sources', 'sp-web-segments.json');

// Directory names that do not map to SP<year><month> by convention.
const SPECIAL_IDS = {
    '1990/jan_2': 'SP1990jan_special_bonus',
    '1988/may_2': 'SP1988may_2',
};

// Masthead lines that repeat on every page and are not article content.
const MASTHEAD = [
    /^Editor:/i,
    /^[A-Z][a-z]+ \d{4}$/,
    /^No \d+$/i,
    /^\[?No \d+\]?$/i,
];

function isMasthead(text) {
    return MASTHEAD.some((pattern) => pattern.test(text.trim()));
}

// Paragraph-level blocks alone are too fine: the median is 79 characters, which splits
// sentences apart and breaks the proximity matching the ranker depends on. Consecutive
// paragraphs are merged within an article until a chunk is substantial enough to stand
// on its own, and never across an article or page boundary. Joining with a newline keeps
// the text exactly as published.
const MIN_CHUNK_CHARS = 300;

function buildIssue(dir) {
    const pages = readIssuePages(dir);
    const out = [];

    for (const page of pages) {
        let article = null;
        let buffer = [];

        const flush = () => {
            if (buffer.length === 0) return;
            out.push({
                page_number: page.page_number,
                article,
                type: 'body',
                text: buffer.join('\n'),
            });
            buffer = [];
        };

        for (const block of page.blocks) {
            if (isMasthead(block.text)) continue;

            if (block.type === 'heading') {
                flush();
                article = block.text;
                // Emitted separately so a title-only match is still findable.
                out.push({ page_number: page.page_number, article, type: 'heading', text: block.text });
                continue;
            }

            buffer.push(block.text);
            if (buffer.join('\n').length >= MIN_CHUNK_CHARS) flush();
        }

        flush();
    }

    return out;
}

function main() {
    const issues = [];
    let totalSegments = 0;

    for (const { year, month, dir } of listIssueDirs()) {
        const key = `${year}/${month}`;
        const issueId = SPECIAL_IDS[key] ?? `SP${year}${month}`;
        const segments = buildIssue(dir);
        totalSegments += segments.length;
        issues.push({
            issue_id: issueId,
            year,
            source: `https://www.masjidtucson.org/publications/books/sp/${year}/${month}/`,
            page_count: new Set(segments.map((s) => s.page_number)).size,
            segments,
        });
    }

    issues.sort((a, b) => a.issue_id.localeCompare(b.issue_id));
    fs.writeFileSync(OUT, JSON.stringify({ issues }, null, 2) + '\n', 'utf8');

    const lengths = issues.flatMap((i) => i.segments.map((s) => s.text.length));
    console.log(`issues=${issues.length} segments=${totalSegments} avgPerIssue=${Math.round(totalSegments / issues.length)}`);
    console.log(`segment chars: max=${Math.max(...lengths)} median=${lengths.sort((a, b) => a - b)[Math.floor(lengths.length / 2)]}`);
    console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
}

main();
