// Downloads the Submitters Perspective HTML editions once and caches them under
// data/sources/sp-html/. Parsing runs off the cache so it is reproducible offline and
// the source server is only ever hit once per page.
import fs from 'node:fs';
import path from 'node:path';

const MANIFEST = process.argv[2];
const OUT_ROOT = path.join(process.cwd(), 'data', 'sources', 'sp-html');
const DELAY_MS = 250;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The page manifest lists 1986 March and August twice against identical URLs, so
// dedupe on the URL itself rather than trusting the entry count.
function collectPages(manifest) {
    const seen = new Map();
    for (const issue of manifest) {
        for (const url of issue.page_links) {
            if (!seen.has(url)) seen.set(url, issue);
        }
    }
    return seen;
}

function localPathFor(url) {
    const rel = new URL(url).pathname.replace('/publications/books/sp/', '');
    return path.join(OUT_ROOT, rel);
}

async function main() {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    const pages = collectPages(manifest);
    console.log(`issues=${manifest.length} uniquePages=${pages.size}`);

    let fetched = 0, cached = 0, failed = 0;
    for (const [url] of pages) {
        const dest = localPathFor(url);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { cached++; continue; }

        let ok = false;
        for (let attempt = 0; attempt < 2 && !ok; attempt++) {
            try {
                const response = await fetch(url, { headers: { 'User-Agent': 'SubmissionArchives/1.0 (archival preservation)' } });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                // Pages declare iso-8859-1; decode as windows-1252, a superset that also
                // gets the smart quotes right, so the preserved text is byte-faithful.
                const text = new TextDecoder('windows-1252').decode(await response.arrayBuffer());
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.writeFileSync(dest, text, 'utf8');
                fetched++; ok = true;
            } catch (error) {
                if (attempt === 1) { console.error('FAIL', url, error.message); failed++; }
                else await sleep(1000);
            }
        }
        await sleep(DELAY_MS);
    }
    console.log(`fetched=${fetched} cached=${cached} failed=${failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
