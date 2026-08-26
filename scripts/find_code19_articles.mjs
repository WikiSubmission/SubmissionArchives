import fs from 'fs';
import https from 'https';

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchJson(res.headers.location));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

async function getAllPosts() {
    let offset = 0;
    let allPosts = [];
    while (true) {
        try {
            const data = await fetchJson(`https://public-api.wordpress.com/rest/v1.1/sites/qurantalkblog.com/posts?number=100&offset=${offset}`);
            if (!data || !data.posts || data.posts.length === 0) break;
            allPosts.push(...data.posts);
            if (allPosts.length >= data.found || data.posts.length < 100) break;
            offset += data.posts.length;
        } catch (err) {
            console.error(`Error at offset ${offset}: ${err.message}`);
            break;
        }
    }
    return allPosts;
}

const KEYWORDS = [
    /\b19\b/i,
    /nineteen/i,
    /code\s*19/i,
    /mathematical miracle/i,
    /mathematical code/i,
    /mathematical structure/i,
    /rashad/i,
    /khalifa/i,
    /74:30/i,
    /74:31/i,
    /muddath-?thir/i,
    /muddat-?thir/i,
    /9:128/i,
    /9:129/i,
    /two false verses/i,
    /false verses/i,
    /quranic initials/i,
    /mysterious letters/i,
    /muqatta'?at/i,
    /gematria/i,
    /abjad/i,
    /deedat/i,
    /ultimate miracle/i,
    /numerical verification/i,
    /numerical miracle/i,
    /numerical structure/i,
    /over it is nineteen/i,
    /365 times/i,
    /day mentioned 365/i,
    /word count/i
];

async function main() {
    console.log('Fetching all 1523 posts with content and tags...');
    const posts = await getAllPosts();
    console.log(`Fetched ${posts.length} posts. Scanning for Code 19 references...`);

    const matches = [];

    for (const post of posts) {
        const title = (post.title || '').replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&#038;/g, '&').replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&#8212;/g, '—').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
        const content = post.content || '';
        const tags = Object.keys(post.tags || {}).join(' ');
        const categories = Object.keys(post.categories || {}).join(' ');
        const slug = post.slug || '';
        const date = post.date ? post.date.slice(0, 10) : '';
        const url = post.URL || post.link;

        const fullText = `${title} ${slug} ${tags} ${categories} ${content}`;

        const matchedKeywords = [];
        for (const kw of KEYWORDS) {
            if (kw.test(fullText)) {
                matchedKeywords.push(kw.source.replace(/\\b/g, '').replace(/\\s\*/g, ' ').replace(/\\/g, ''));
            }
        }

        // Title matches get special prominence
        const titleMatches = [];
        for (const kw of KEYWORDS) {
            if (kw.test(`${title} ${slug} ${tags} ${categories}`)) {
                titleMatches.push(kw.source.replace(/\\b/g, '').replace(/\\s\*/g, ' ').replace(/\\/g, ''));
            }
        }

        if (matchedKeywords.length >= 2 || titleMatches.length >= 1) {
            // Determine relevance level
            let relevance = 'High';
            if (titleMatches.length >= 1) relevance = 'Direct (In Title/Topic)';
            else if (matchedKeywords.length >= 4) relevance = 'High (Core Theme)';
            else relevance = 'Moderate (Discusses/Cites)';

            matches.push({
                title,
                url,
                date,
                relevance,
                titleMatches,
                matchedKeywords
            });
        }
    }

    // Sort by date descending
    matches.sort((a, b) => b.date.localeCompare(a.date));

    console.log(`Found ${matches.length} matching articles.`);

    let md = `# Quran Talk Blog — Code 19 & Mathematical Miracle Directory\n\n`;
    md += `Total Identified Articles: **${matches.length}** out of 1,523 total posts.\n\n`;
    md += `*Methodology: Full-text, title, tag, and category analysis covering Code 19, Dr. Rashad Khalifa, Quranic initials, mathematical composition, Surah 74:30-31, 9:128-129, Deedat, and numerical verification.*\n\n---\n\n`;

    md += `## 1. Direct & Dedicated Code 19 Articles (Featured / In-Depth)\n\n`;
    const direct = matches.filter(m => m.relevance.startsWith('Direct'));
    for (const item of direct) {
        md += `- **[${item.title}](${item.url})** — *${item.date}*\n`;
        md += `  - *Matched Topics*: \`${item.matchedKeywords.slice(0, 6).join('`, `')}\`\n`;
    }

    md += `\n---\n\n## 2. In-Depth Context & Analysis Articles (High Relevance)\n\n`;
    const high = matches.filter(m => m.relevance.startsWith('High'));
    for (const item of high) {
        md += `- **[${item.title}](${item.url})** — *${item.date}*\n`;
        md += `  - *Matched Topics*: \`${item.matchedKeywords.slice(0, 6).join('`, `')}\`\n`;
    }

    md += `\n---\n\n## 3. Related Articles & Commentary (Citations & Supporting Context)\n\n`;
    const moderate = matches.filter(m => m.relevance.startsWith('Moderate'));
    for (const item of moderate) {
        md += `- [${item.title}](${item.url}) — *${item.date}*\n`;
        md += `  - *Matched Topics*: \`${item.matchedKeywords.slice(0, 5).join('`, `')}\`\n`;
    }

    const outPath = './qurantalk-code19-articles.md';
    fs.writeFileSync(outPath, md, 'utf8');
    console.log(`Saved directory to ${outPath}`);
}

main().catch(console.error);
