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
                    reject(new Error(`Failed to parse JSON from ${url}: ${e.message} (status: ${res.statusCode})`));
                }
            });
        }).on('error', reject);
    });
}

async function getAllPostsFromWPCom() {
    let offset = 0;
    let allPosts = [];
    while (true) {
        try {
            console.log(`Fetching offset ${offset}...`);
            const data = await fetchJson(`https://public-api.wordpress.com/rest/v1.1/sites/qurantalkblog.com/posts?number=100&offset=${offset}`);
            if (!data || !data.posts || data.posts.length === 0) break;
            allPosts.push(...data.posts);
            console.log(`Fetched ${data.posts.length} posts (total: ${allPosts.length} / ${data.found})`);
            if (allPosts.length >= data.found || data.posts.length < 100) break;
            offset += data.posts.length;
        } catch (err) {
            console.log(`Finished or error at offset ${offset}: ${err.message}`);
            break;
        }
    }
    return allPosts;
}

async function main() {
    console.log('Fetching all posts from WordPress.com API for qurantalkblog.com...');
    const posts = await getAllPostsFromWPCom();
    console.log(`Fetched ${posts.length} posts.`);

    if (posts.length > 0) {
        const byYear = {};
        for (const post of posts) {
            const date = post.date ? post.date.slice(0, 10) : 'Unknown';
            const year = date.slice(0, 4);
            const title = post.title ? post.title
                .replace(/&#8217;/g, "'")
                .replace(/&#8216;/g, "'")
                .replace(/&#8220;/g, '"')
                .replace(/&#8221;/g, '"')
                .replace(/&#038;/g, '&')
                .replace(/&amp;/g, '&')
                .replace(/&#8211;/g, '–')
                .replace(/&#8212;/g, '—')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'") : post.slug;
            const link = post.URL || post.link;
            
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push({ title, link, date });
        }

        let md = `# Quran Talk Blog — Complete Directory of Articles\n\n`;
        md += `Total Published Articles: **${posts.length}**\n\n`;
        md += `*Source: [Quran Talk Blog](https://qurantalkblog.com/)*\n\n---\n\n`;

        const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));
        for (const year of years) {
            md += `## ${year} (${byYear[year].length} Articles)\n\n`;
            for (const item of byYear[year]) {
                md += `- [${item.title}](${item.link}) — *${item.date}*\n`;
            }
            md += `\n`;
        }

        const outPath = './qurantalk-blog-directory.md';
        fs.writeFileSync(outPath, md, 'utf8');
        console.log(`Saved directory to ${outPath}`);
    }
}

main().catch(console.error);
