
import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL as NodeURL } from 'url';

const BASE_URL = 'https://www.masjidtucson.org/publications/books/sp/';
const OUT_DIR_HTML = path.join(process.cwd(), 'public/data/newsletters/html');
const OUT_DIR_IMG = path.join(process.cwd(), 'public/data/newsletters/images_scraped');

// Ensure dirs
if (!fs.existsSync(OUT_DIR_HTML)) fs.mkdirSync(OUT_DIR_HTML, { recursive: true });
if (!fs.existsSync(OUT_DIR_IMG)) fs.mkdirSync(OUT_DIR_IMG, { recursive: true });

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Define target issues
const targets = [
    { year: 1990, months: ['jan', 'jan_2', 'feb', 'mar'] },
    { year: 1989, months: months },
    { year: 1988, months: ['jan', 'feb', 'mar', 'apr', 'may', 'may_2', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] },
    { year: 1987, months: months },
    { year: 1986, months: months },
    { year: 1985, months: months.slice(1) } // Feb-Dec
];

function fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };
        https.get(url, options, (res) => {
            if (res.statusCode !== 200) {
                if (res.statusCode === 404) resolve("");
                else reject(`Status ${res.statusCode} for ${url}`);
                return;
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function downloadImage(url: string, localFilename: string): Promise<boolean> {
    return new Promise((resolve) => {
        const filepath = path.join(OUT_DIR_IMG, localFilename);
        if (fs.existsSync(filepath)) {
            resolve(true); // Skip existing
            return;
        }

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        https.get(url, options, (res) => {
            if (res.statusCode !== 200) {
                resolve(false);
                return;
            }
            const file = fs.createWriteStream(filepath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (e) => {
            console.error(`Error DL image ${url}:`, e);
            resolve(false);
        });
    });
}

// Blocklist of metadata editable regions to IGNORE
const IGNORED_EDITABLES = new Set([
    'doctitle', 'head', 'encoding', 'keywords', 'editNavSection',
    'editMonthVolume', 'EditDate', 'EditVolume', 'EditLunarDate',
    'EditRegion10', 'editPages', 'editTopics', 'editTitle'
]);

async function scrapeLayout(year: number, month: string) {
    const baseUrl = `${BASE_URL}${year}/${month}/`;
    const issueId = `${year}_${month}`;
    const outFile = path.join(OUT_DIR_HTML, `${issueId}.json`);

    // Check if already done? No, we need to fix them.

    // 1. Fetch Page 1
    const p1Url = `${baseUrl}page1.html`;
    console.log(`Scraping ${issueId}...`);

    let p1Html = "";
    try { p1Html = await fetchUrl(p1Url); } catch (e) { console.error(e); return; }
    if (!p1Html) { console.error(`   404: ${p1Url}`); return; }

    // 2. Max Pages
    let maxPage = 1;
    const pageLinkRegex = /href="page(\d+)\.html"/g;
    let match;
    while ((match = pageLinkRegex.exec(p1Html)) !== null) {
        const pNum = parseInt(match[1]);
        if (pNum > maxPage) maxPage = pNum;
    }
    // console.log(`   Pages: ${maxPage}`);

    let fullHtml = "";

    for (let p = 1; p <= maxPage; p++) {
        let pHtml = p === 1 ? p1Html : "";
        if (p > 1) {
            try { pHtml = await fetchUrl(`${baseUrl}page${p}.html`); } catch (e) { }
        }
        if (!pHtml) continue;

        // 3. Extract ALL Editable Regions
        const editRegex = /<!-- InstanceBeginEditable name="([^"]+)" -->([\s\S]*?)<!-- InstanceEndEditable -->/gi;
        let foundContent = false;

        let editMatch;
        while ((editMatch = editRegex.exec(pHtml)) !== null) {
            const regionName = editMatch[1];
            let content = editMatch[2];

            if (IGNORED_EDITABLES.has(regionName)) continue;

            // Heuristic: If content is very short (< 50 chars) and not an image, skip? 
            // Better to keep everything non-metadata.

            // 4. Image Processing
            const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
            let imgMatch;
            const replacements = [];
            while ((imgMatch = imgRegex.exec(content)) !== null) {
                const originalSrc = imgMatch[1];
                try {
                    const absUrl = new NodeURL(originalSrc, `${baseUrl}page${p}.html`).href;
                    const filename = `${issueId}_p${p}_${path.basename(absUrl)}`;

                    // Don't download "bism" or "spacer"?
                    // User wants images for the newsletter. Usually these are diagrams.
                    // We'll filter out common UI elements if needed, but safe to grab all.

                    await downloadImage(absUrl, filename);
                    replacements.push({
                        original: originalSrc,
                        new: `/data/newsletters/images_scraped/${filename}`
                    });
                } catch (e) { }
            }

            for (const r of replacements) {
                content = content.replace(r.original, r.new);
            }

            fullHtml += `\n<!-- Page ${p} Content (${regionName}) -->\n<div class="newsletter-page" id="page-${p}">\n${content}\n</div>\n`;
            foundContent = true;
        }

        if (!foundContent) {
            console.warn(`   Warning: No content extracted for page ${p}`);
        }
    }

    // Save
    const data = {
        id: issueId,
        year,
        month,
        html: fullHtml,
        scrapedAt: new Date().toISOString()
    };
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
}

async function main() {
    for (const t of targets) {
        for (const m of t.months) {
            await scrapeLayout(t.year, m);
            await new Promise(r => setTimeout(r, 100));
        }
    }
    console.log("Scraping Complete.");
}

main().catch(console.error);
