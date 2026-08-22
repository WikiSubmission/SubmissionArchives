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

// The pages are not consistently encoded: most declare iso-8859-1 and genuinely are,
// but some (e.g. 1988/apr) declare utf-8 and genuinely are. Forcing one decoder on both
// mangles whichever it's wrong for — a UTF-8 non-breaking space (bytes 0xC2 0xA0) read as
// windows-1252 becomes two garbage characters, "Â " repeated everywhere that spacing was
// used. So the declared charset is read from the bytes themselves before decoding the body.
function detectCharset(bytes) {
    // The meta tag lives in the first few hundred bytes and is pure ASCII up to the
    // charset value, so a naive latin1 read of just the head is always safe here.
    const head = Buffer.from(bytes.subarray(0, 512)).toString('latin1');
    const match = head.match(/charset=["']?([\w-]+)/i);
    const declared = match ? match[1].toLowerCase() : 'iso-8859-1';
    return declared === 'utf-8' || declared === 'utf8' ? 'utf-8' : 'windows-1252';
}

async function main() {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    const pages = collectPages(manifest);
    console.log(`issues=${manifest.length} uniquePages=${pages.size}`);

    let fetched = 0, cached = 0, failed = 0;
    const charsetCounts = {};
    for (const [url] of pages) {
        const dest = localPathFor(url);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { cached++; continue; }

        let ok = false;
        for (let attempt = 0; attempt < 2 && !ok; attempt++) {
            try {
                const response = await fetch(url, { headers: { 'User-Agent': 'SubmissionArchives/1.0 (archival preservation)' } });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const bytes = new Uint8Array(await response.arrayBuffer());
                const charset = detectCharset(bytes);
                charsetCounts[charset] = (charsetCounts[charset] || 0) + 1;
                const text = new TextDecoder(charset).decode(bytes);
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
    console.log(`fetched=${fetched} cached=${cached} failed=${failed} charsets=${JSON.stringify(charsetCounts)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
