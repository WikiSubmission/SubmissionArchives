// Fills in `year`/`fullDate` on audio and video catalog records from their YouTube
// upload date, for records where the title itself states no date (77 of 152 datable
// media, at last count — every newsletter and every title-dated record already has one).
//
// This deliberately uses the official YouTube Data API v3 rather than reading dates off
// the public watch/playlist pages. Scraping YouTube's pages at any volume — even a modest,
// one-time run over ~77 ids — runs against their Terms of Service, which reserve
// automated data extraction for the sanctioned API. The API is free (a generous daily
// quota) and gives the same `publishedAt` field directly; the only cost is that it needs
// a key, which is why this is a standalone script gated on YOUTUBE_API_KEY rather than a
// step wired into `generate:catalog` — it should never make catalog generation depend on
// a network call or a secret that may not be configured.
//
// A YouTube upload date is not the same fact as when something was originally recorded —
// for archival re-uploads the two can differ by years — so this genuinely fills a
// different, narrower gap than "when did this happen." It is still real, sourced
// metadata, not a guess, and is recorded as such.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CATALOG_DIR = path.join(ROOT, 'data', 'catalog');
const CATALOG_FILES = ['audios.json', 'videos.json'];
const BATCH_SIZE = 50; // videos.list's documented max ids per request.

const TITLE_FULL_DATE = /\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])[/-](19[6-9]\d|20[0-2]\d)\b/;
const TITLE_YEAR_ONLY = /\b(19[6-9]\d|20[0-2]\d)\b/;

function hasKnownDate(item) {
    if (item.year !== undefined || item.fullDate !== undefined) return true;
    const title = item.displayTitle || item.title || '';
    return TITLE_FULL_DATE.test(title) || TITLE_YEAR_ONLY.test(title);
}

function chunk(array, size) {
    const out = [];
    for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
    return out;
}

async function fetchPublishedDates(apiKey, youtubeIds) {
    const dates = new Map();
    for (const batch of chunk(youtubeIds, BATCH_SIZE)) {
        const url = new URL('https://www.googleapis.com/youtube/v3/videos');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('id', batch.join(','));
        url.searchParams.set('key', apiKey);

        const response = await fetch(url);
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`YouTube API request failed (${response.status}): ${body.slice(0, 300)}`);
        }
        const payload = await response.json();
        for (const video of payload.items ?? []) {
            const publishedAt = video.snippet?.publishedAt;
            if (publishedAt) dates.set(video.id, publishedAt);
        }
    }
    return dates;
}

async function main() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.log('YOUTUBE_API_KEY is not set — skipping. See .env.example for how to configure it.');
        return;
    }

    let updated = 0;
    let checked = 0;

    for (const filename of CATALOG_FILES) {
        const filePath = path.join(CATALOG_DIR, filename);
        const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const undated = items.filter((item) => item.youtubeId && !hasKnownDate(item));
        checked += undated.length;
        if (undated.length === 0) continue;

        const dates = await fetchPublishedDates(apiKey, undated.map((item) => item.youtubeId));

        for (const item of items) {
            const publishedAt = dates.get(item.youtubeId);
            if (!publishedAt || hasKnownDate(item)) continue;
            item.year = new Date(publishedAt).getUTCFullYear();
            item.fullDate = publishedAt.slice(0, 10);
            item.dateSource = 'youtube_upload_date';
            updated++;
        }

        fs.writeFileSync(filePath, JSON.stringify(items, null, 2) + '\n', 'utf8');
    }

    console.log(`checked=${checked} updated=${updated}`);
    if (checked > updated) {
        console.log(`${checked - updated} record(s) had no matching video on YouTube (deleted/private) — left undated.`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
