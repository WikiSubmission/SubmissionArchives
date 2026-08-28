import fs from 'fs';
import path from 'path';

const S2G_EDIP_DIR = path.join(process.cwd(), 'S2G&Edip');
const S2G_DIR = path.join(S2G_EDIP_DIR, 'SubmissionToGod');
const EDIP_DIR = path.join(S2G_EDIP_DIR, '19.org-EdipYuksel');

fs.mkdirSync(S2G_DIR, { recursive: true });
fs.mkdirSync(EDIP_DIR, { recursive: true });

// Entity decoder
function decodeEntities(text) {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

// Convert HTML fragment to clean Markdown
function htmlToMarkdown(html) {
  if (!html) return '';

  let content = html;

  // Remove scripts, styles, noscripts, iframes, and unwanted widgets
  content = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*(?:sharedaddy|jp-relatedposts|wpcnt|post-navigation|nav-links|page-links|post-page-numbers)[^"']*["'][\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*id=["'](?:jp-post-flair|comments|respond)[^"']*["'][\s\S]*?<\/div>/gi, '');

  // Preserve pre/code blocks by temporarily tokenizing them
  const codeBlocks = [];
  content = content.replace(/<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push('```\n' + decodeEntities(code.trim()) + '\n```');
    return `___CODEBLOCK_${idx}___`;
  });
  content = content.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push('```\n' + decodeEntities(code.trim()) + '\n```');
    return `___CODEBLOCK_${idx}___`;
  });

  // Inline code
  content = content.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => {
    return '`' + decodeEntities(code.replace(/<[^>]+>/g, '')).trim() + '`';
  });

  // Tables
  content = content.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_, tableHtml) => {
    const rows = [];
    const rowMatches = tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);
    for (const rowMatch of rowMatches) {
      const cells = [];
      const cellMatches = rowMatch[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi);
      for (const cellMatch of cellMatches) {
        const cellText = decodeEntities(cellMatch[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
        cells.push(cellText);
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    if (rows.length === 0) return '';
    const maxCols = Math.max(...rows.map(r => r.length));
    let mdTable = '\n\n| ' + rows[0].map(c => c || ' ').join(' | ') + ' |\n';
    mdTable += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      while (r.length < maxCols) r.push(' ');
      mdTable += '| ' + r.join(' | ') + ' |\n';
    }
    return mdTable + '\n\n';
  });

  // Headings
  content = content.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => '\n\n# ' + decodeEntities(text.replace(/<[^>]+>/g, '')).trim() + '\n\n');
  content = content.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => '\n\n## ' + decodeEntities(text.replace(/<[^>]+>/g, '')).trim() + '\n\n');
  content = content.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => '\n\n### ' + decodeEntities(text.replace(/<[^>]+>/g, '')).trim() + '\n\n');
  content = content.replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, (_, text) => '\n\n#### ' + decodeEntities(text.replace(/<[^>]+>/g, '')).trim() + '\n\n');
  content = content.replace(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi, (_, text) => '\n\n##### ' + decodeEntities(text.replace(/<[^>]+>/g, '')).trim() + '\n\n');
  content = content.replace(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi, (_, text) => '\n\n###### ' + decodeEntities(text.replace(/<[^>]+>/g, '')).trim() + '\n\n');

  // Blockquotes
  content = content.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, quote) => {
    const lines = decodeEntities(quote.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n').replace(/<[^>]+>/g, ' '))
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    return '\n\n' + lines.map(l => '> ' + l).join('\n>\n') + '\n\n';
  });

  // Images
  content = content.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, (_, src, alt) => `\n\n![${decodeEntities(alt)}](${src})\n\n`);
  content = content.replace(/<img\b[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, (_, alt, src) => `\n\n![${decodeEntities(alt)}](${src})\n\n`);
  content = content.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi, (_, src) => `\n\n![](${src})\n\n`);

  // Links
  content = content.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    const cleanText = decodeEntities(text.replace(/<[^>]+>/g, '')).trim();
    if (!cleanText) return '';
    return `[${cleanText}](${href})`;
  });

  // Bold & Italics
  content = content.replace(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, (_, text) => `**${decodeEntities(text.replace(/<[^>]+>/g, '')).trim()}**`);
  content = content.replace(/<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, (_, text) => `*${decodeEntities(text.replace(/<[^>]+>/g, '')).trim()}*`);

  // Lists
  content = content.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => {
    const cleanItem = decodeEntities(item.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    return `\n- ${cleanItem}`;
  });
  content = content.replace(/<\/(?:ul|ol)>/gi, '\n\n');

  // Paragraphs & Line Breaks
  content = content.replace(/<br\s*\/?>/gi, '\n');
  content = content.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');
  content = content.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, p) => {
    const text = decodeEntities(p.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    return text ? `\n\n${text}\n\n` : '';
  });

  // Strip remaining HTML tags
  content = content.replace(/<[^>]+>/g, '');
  content = decodeEntities(content);

  // Restore code blocks
  content = content.replace(/___CODEBLOCK_(\d+)___/g, (_, idx) => codeBlocks[Number(idx)] || '');

  // Normalize consecutive newlines & spaces
  content = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();

  return content;
}

// Fetch helper with headers
async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

// Extract article body container from HTML
function extractArticleHtml(html) {
  // Try entry-content first
  const entryMatch = html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?:<!-- \.entry-content -->|<footer|<div id=["']comments|<nav)/i)
    || html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (entryMatch) return entryMatch[1];

  const postContentMatch = html.match(/<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (postContentMatch) return postContentMatch[1];

  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) return articleMatch[1];

  return html;
}

// Extract pagination URLs for 19.org
function extractPaginationUrls(baseUrl, html) {
  const urls = [];
  const cleanBase = baseUrl.replace(/\/+$/, '');
  
  // Check page-links container
  const pageLinksMatch = html.match(/class=["'][^"']*(?:page-links|post-page-numbers)[^"']*["'][\s\S]*?<\/div>/i);
  if (pageLinksMatch) {
    const hrefMatches = pageLinksMatch[0].matchAll(/href=["']([^"']+)["']/gi);
    for (const m of hrefMatches) {
      let pageUrl = m[1].trim();
      if (!pageUrl.startsWith('http')) {
        pageUrl = cleanBase + '/' + pageUrl.replace(/^\/+/, '');
      }
      if (pageUrl !== baseUrl && !urls.includes(pageUrl)) {
        urls.push(pageUrl);
      }
    }
  }

  // Also check numeric pagination links like /blog/slug/2/, /blog/slug/3/
  const numLinks = html.matchAll(new RegExp(`href=["'](${cleanBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/(\\d+)\\/?)[#\"']`, 'gi'));
  for (const m of numLinks) {
    const pageUrl = m[1];
    if (pageUrl !== baseUrl && !urls.includes(pageUrl)) {
      urls.push(pageUrl);
    }
  }

  return urls;
}

// Scrape single URL
async function scrapeUrl(url) {
  console.log(`\nFetching: ${url}`);
  const is19Org = url.includes('19.org');
  const sourceName = is19Org ? '19.org (Edip Yüksel)' : 'Submission to God (WordPress)';
  const targetDir = is19Org ? EDIP_DIR : S2G_DIR;

  const html = await fetchHtml(url);

  // Extract Title
  let title = '';
  const titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)
    || html.match(/<h1[^>]*class=["'][^"']*post-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)
    || html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
    || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = decodeEntities(titleMatch[1].replace(/<[^>]+>/g, '')).replace(/\s*–\s*19\.org.*$/i, '').replace(/\s*\|\s*Submission to God.*$/i, '').trim();
  }

  // Extract Author
  let author = is19Org ? 'Edip Yüksel' : 'Submission to God';
  const authorMatch = html.match(/<a\b[^>]*rel=["']author["'][^>]*>([\s\S]*?)<\/a>/i)
    || html.match(/class=["'][^"']*author[^"']*["'][^>]*>([\s\S]*?)<\/[a-z0-9]+>/i);
  if (authorMatch) {
    const cleanAuthor = decodeEntities(authorMatch[1].replace(/<[^>]+>/g, '')).trim();
    if (cleanAuthor) author = cleanAuthor;
  }

  // Extract Date
  let date = '';
  const dateMatch = html.match(/<time\b[^>]*datetime=["']([^"']+)["'][^>]*>/i)
    || html.match(/class=["'][^"']*(?:entry-date|published)[^"']*["'][^>]*>([\s\S]*?)<\/time>/i);
  if (dateMatch) {
    const rawDate = dateMatch[1].trim();
    const isoMatch = rawDate.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      date = isoMatch[0];
    } else {
      date = rawDate;
    }
  }
  if (!date) {
    const urlDateMatch = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
    if (urlDateMatch) {
      date = `${urlDateMatch[1]}-${urlDateMatch[2]}-${urlDateMatch[3]}`;
    }
  }

  // Slug for filename
  const urlParts = url.replace(/\/+$/, '').split('/');
  let slug = urlParts[urlParts.length - 1];
  if (!slug || slug === 'blog') {
    slug = urlParts[urlParts.length - 2] || 'post';
  }
  // Remove query params if any
  slug = slug.split('?')[0];

  // Extract main body content
  let bodyHtml = extractArticleHtml(html);
  let markdownBody = htmlToMarkdown(bodyHtml);

  // Handle Multi-Page Posts on 19.org
  if (is19Org) {
    const additionalPages = extractPaginationUrls(url, html);
    if (additionalPages.length > 0) {
      console.log(`  Found ${additionalPages.length} additional pages:`, additionalPages);
      for (let i = 0; i < additionalPages.length; i++) {
        const pageUrl = additionalPages[i];
        try {
          console.log(`    Fetching subpage (${i + 2}): ${pageUrl}`);
          const subHtml = await fetchHtml(pageUrl);
          const subBodyHtml = extractArticleHtml(subHtml);
          const subMarkdown = htmlToMarkdown(subBodyHtml);
          if (subMarkdown) {
            markdownBody += `\n\n---\n\n## Part ${i + 2}\n\n${subMarkdown}`;
          }
        } catch (subErr) {
          console.warn(`    Failed to fetch subpage ${pageUrl}:`, subErr.message);
        }
      }
    }
  }

  const finalMarkdown = `---
title: "${title.replace(/"/g, '\\"')}"
author: "${author.replace(/"/g, '\\"')}"
date: "${date}"
original_url: "${url}"
source: "${sourceName}"
---

# ${title}

${markdownBody}
`;

  const fileName = `${slug}.md`;
  const filePath = path.join(targetDir, fileName);
  fs.writeFileSync(filePath, finalMarkdown, 'utf8');
  console.log(`  Saved: ${filePath} (${finalMarkdown.length} bytes)`);
}

// Main execution
async function run() {
  const rawLinksFile = path.join(process.cwd(), 'cont', 'submission-to-god-wordpress-reference-links.txt');
  const lines = fs.readFileSync(rawLinksFile, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const urls = lines.map(line => {
    if (line.startsWith('http://') || line.startsWith('https://')) {
      return line;
    }
    return 'https://' + line;
  });

  console.log(`Starting scrape of ${urls.length} articles...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}]`);
    try {
      await scrapeUrl(url);
      successCount++;
    } catch (err) {
      console.error(`  FAILED to scrape ${url}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Scraping complete!`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Output directory: ${S2G_EDIP_DIR}`);
  console.log(`========================================`);
}

run().catch(console.error);
