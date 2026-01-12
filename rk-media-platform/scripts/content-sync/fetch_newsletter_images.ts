
import fs from 'fs';
import path from 'path';

// Config
const RAW_DIR = path.join(process.cwd(), 'public/data/newsletters/raw');
const IMG_DIR = path.join(process.cwd(), 'public/data/newsletters/images');
const BASE_URL = 'https://www.masjidtucson.org'; // Root for absolute resolution

// Ensure dirs
if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
}

// Helper to delay (prevent rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url: string, filename: string) {
    const destPath = path.join(IMG_DIR, filename);
    if (fs.existsSync(destPath)) {
        // console.log(`Skipping (exists): ${filename}`);
        return;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`Failed to fetch image: ${url} (${res.status})`);
            return;
        }
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(buffer));
        console.log(`Downloaded: ${filename}`);
        await delay(200); // Be nice to the server
    } catch (e) {
        console.error(`Error downloading ${url}:`, e);
    }
}

async function main() {
    if (!fs.existsSync(RAW_DIR)) {
        console.error("Raw directory not found.");
        return;
    }

    const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.html'));

    // Set to track processed URLs to avoid re-downloading same image multiple times (many pages share header images)
    const processedUrls = new Set<string>();

    for (const file of files) {
        const filePath = path.join(RAW_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Regex to find img src
        // Matches src="..." or src='...'
        const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
        let match;

        // Parse year/month/page from filename to resolve relative paths if needed
        // Format: YYYY_month_pageN.html -> implies URL .../YYYY/month/pageN.html
        // But looking at the HTML, src is usually "../../../../../images/..." which resolves to root.
        // Let's handle relative paths properly.
        const parts = file.replace('.html', '').split('_');
        // parts[0] = year, parts[1] = month (or month_2), parts[last] = pageN

        // We really just need to know the depth to resolve "../"
        // Most files are in /publications/books/sp/YYYY/MONTH/pageN.html
        // So depth is pretty constant.

        while ((match = imgRegex.exec(content)) !== null) {
            const src = match[1];
            if (!src) continue;

            // Resolve URL
            let fullUrl = '';
            if (src.startsWith('http')) {
                fullUrl = src;
            } else if (src.startsWith('/')) {
                fullUrl = BASE_URL + src;
            } else {
                // Relative path
                // logic: stack relative to /publications/books/sp/YYYY/MONTH/
                // e.g. ../../../../../images/SP/bism.png
                // 5 dots up from .../MONTH/ -> .../YYYY/ -> .../sp/ -> .../books/ -> .../publications/ -> ROOT
                // So ../../../../../ lands at root.
                // To be safe, let's just use URL constructor with a dummy base.
                // Assuming depth logic holds: 
                // URL of page: https://www.masjidtucson.org/publications/books/sp/YYYY/MONTH/pageN.html
                // We don't strictly need exact YYYY/MONTH for resolution if we just use a base.
                const dummyBase = `https://www.masjidtucson.org/publications/books/sp/YYYY/MONTH/page.html`;
                try {
                    fullUrl = new URL(src, dummyBase).href;
                } catch (e) {
                    console.warn(`Invalid URL construct: ${src} relative to ${dummyBase}`);
                    continue;
                }
            }

            if (processedUrls.has(fullUrl)) continue;
            processedUrls.add(fullUrl);

            // Determine filename
            // Use the basename of the URL
            const urlObj = new URL(fullUrl);
            const basename = path.basename(urlObj.pathname);

            // Avoid collisions if different paths have same basename? Unlikely for this site structure (images/SP/...)
            // but just in case, we can prepend checksum or just trust basename for now.
            // Let's trust basename but maybe clean it.
            const safeFilename = basename.replace(/[^a-zA-Z0-9._-]/g, '_');

            if (!safeFilename || safeFilename.length === 0) continue;

            await downloadImage(fullUrl, safeFilename);
        }
    }
}

main().catch(console.error);
