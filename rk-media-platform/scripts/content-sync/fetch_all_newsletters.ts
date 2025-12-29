
import fs from 'fs';
import path from 'path';

// Helper to ensure directory exists
function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Helper to fetch text content
async function fetchUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) return null; // Expected for missing pages
            console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            return null;
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}

async function main() {
    const outputDir = path.join(process.cwd(), 'public/data/newsletters/raw');
    ensureDir(outputDir);

    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // Config: Start May 1985, End March 1990
    for (let year = 1985; year <= 1990; year++) {
        for (let m = 0; m < 12; m++) {
            // Range check
            if (year === 1985 && m < 4) continue; // Start May (index 4)
            if (year === 1990 && m > 2) continue; // End March (index 2)

            const monthStr = months[m];
            const issueId = `${year}_${monthStr}`;

            console.log(`Processing ${issueId}...`);

            // Standard Issue
            await processIssue(year, monthStr, outputDir);

            // Bonus Issues
            if (year === 1988 && monthStr === 'may') {
                console.log(`Processing BONUS issue 1988_may_2...`);
                await processIssue(year, 'may_2', outputDir);
            }
            if (year === 1990 && monthStr === 'jan') {
                console.log(`Processing BONUS issue 1990_jan_2...`);
                await processIssue(year, 'jan_2', outputDir);
            }
        }
    }
}

async function processIssue(year: number, monthStr: string, outputDir: string) {
    for (let page = 1; page <= 4; page++) {
        const url = `https://www.masjidtucson.org/publications/books/sp/${year}/${monthStr}/page${page}.html`;
        const content = await fetchUrl(url);

        if (content) {
            const filename = `${year}_${monthStr}_page${page}.html`;
            const filePath = path.join(outputDir, filename);
            fs.writeFileSync(filePath, content);
            console.log(`Saved: ${filename}`);
        } else {
            // console.log(`Skipped (not found): ${url}`);
        }
    }
}

main().catch(console.error);
