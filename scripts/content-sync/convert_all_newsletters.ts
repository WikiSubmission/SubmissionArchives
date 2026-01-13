import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const RAW_DIR = path.join(process.cwd(), 'public/data/newsletters/raw');
const JSON_DIR = path.join(process.cwd(), 'public/data/newsletters/html');

if (!fs.existsSync(JSON_DIR)) fs.mkdirSync(JSON_DIR, { recursive: true });

function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8216;/g, "'")
        .replace(/&#8230;/g, "...")
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&rsquo;/g, "'")
        .replace(/&hellip;/g, '...')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .trim();
}

function extractHeader(html: string): any {
    const $ = cheerio.load(html);
    const header: any = {
        basmala_arabic: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
    };

    const title = $('p.sp').first().text();
    if (title) header.title = cleanText(title).toUpperCase();

    const subtitle = $('.published').first().text();
    if (subtitle) header.subtitle = cleanText(subtitle);

    header.publisher = "MASJID TUCSON";

    const dateText = $('td.volume').first().text();
    if (dateText) {
        const cleaned = cleanText(dateText).replace(/:\s*Page.*$/i, '');
        if (cleaned) header.date = cleaned;
    }

    const volumeLink = $('a[href*="index.html"]').filter((i, el) => {
        return $(el).text().match(/No\s+\d+/i) !== null;
    });
    if (volumeLink.length > 0) {
        const volMatch = volumeLink.text().match(/No\s+(\d+)/i);
        if (volMatch) header.volume = parseInt(volMatch[1]);
    }

    const editorText = $('td[colspan="3"]').text();
    if (editorText && editorText.includes('Editor:')) {
        header.editor = cleanText(editorText.replace('Editor:', '').trim());
    }

    return header;
}

function isNavigationText(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes('continued from page') ||
        lower.includes('continued on page') ||
        lower.match(/^page \d+$/) !== null ||
        lower.match(/^pages? \d+,?\s*\d*,?\s*\d*,?\s*\d*$/) !== null ||
        lower.includes('masjidtucson.org home page') ||
        lower.includes('view other submitters') ||
        lower.includes('submitters pespectives') ||
        // Match patterns like "March 1990: Page 1, 2, 3, 4"
        /^\w+\s+\d{4}:\s*page\s+\d+/.test(lower) ||
        // Match "Submitters Perspective Page 2" etc
        /(muslim|submission|submitters)\s+perspective\s+page\s+\d+/.test(lower);
}

function extractPageContent($: cheerio.CheerioAPI): any[] {
    const sections: any[] = [];

    // Process all headers
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = cleanText($(el).text());
        if (text && !isNavigationText(text) && text.length > 3) {
            sections.push({ title: text, content: [] });
        }
    });

    // Process all paragraphs
    $('p').each((i, el) => {
        const $el = $(el);

        // Skip header/footer paragraphs
        if ($el.hasClass('sp') || $el.hasClass('basmala') ||
            $el.hasClass('volume') || $el.hasClass('published') ||
            $el.hasClass('address') || $el.hasClass('issn') ||
            $el.hasClass('subscribe') || $el.hasClass('happiness')) {
            return;
        }

        // Handle quotes
        if ($el.hasClass('verse')) {
            const text = cleanText($el.text());
            if (text && !isNavigationText(text)) {
                sections.push({ quotes: [{ text }] });
            }
            return;
        }

        // Check for images
        const img = $el.find('img').first();
        if (img.length > 0) {
            const src = img.attr('src');
            if (src && !src.includes('bism.png')) {
                const filename = path.basename(src);
                sections.push({
                    image: {
                        src: `/data/newsletters/images/${filename}`,
                        alt: img.attr('alt') || "Newsletter Image"
                    }
                });
            }
        }

        // Get text
        const text = cleanText($el.text());
        if (text && !isNavigationText(text) && text.length > 3) {
            const lastSection = sections[sections.length - 1];
            if (lastSection && lastSection.content && Array.isArray(lastSection.content)) {
                lastSection.content.push(text);
            } else {
                sections.push({ content: [text] });
            }
        }
    });

    // Process tables
    $('table').each((i, el) => {
        const $table = $(el);

        // Skip layout tables
        if ($table.attr('border') === '1' || $table.find('p.sp').length > 0 || $table.find('table').length > 0) {
            return;
        }

        // Extract table rows
        const rows: string[] = [];
        $table.find('tr').each((j, tr) => {
            const cells: string[] = [];
            $(tr).find('td, th').each((k, cell) => {
                const cellText = cleanText($(cell).text());
                if (cellText) cells.push(cellText);
            });
            if (cells.length > 0) {
                const rowText = cells.join(' ');
                if (rowText && !isNavigationText(rowText)) {
                    rows.push(rowText);
                }
            }
        });

        if (rows.length > 0) {
            const lastSection = sections[sections.length - 1];
            if (lastSection && lastSection.content && Array.isArray(lastSection.content)) {
                lastSection.content.push(...rows);
            } else {
                sections.push({ content: rows });
            }
        }
    });

    // Process standalone images
    $('img').each((i, el) => {
        const $el = $(el);
        if ($el.parent().is('p')) return; // Already processed

        const src = $el.attr('src');
        if (src && !src.includes('bism.png')) {
            const filename = path.basename(src);
            sections.push({
                image: {
                    src: `/data/newsletters/images/${filename}`,
                    alt: $el.attr('alt') || "Newsletter Image"
                }
            });
        }
    });

    return sections;
}

async function main() {
    const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.html'));

    const issues = new Set<string>();
    files.forEach(f => {
        const parts = f.split('_page');
        if (parts.length > 0) issues.add(parts[0]);
    });

    for (const issueKey of Array.from(issues).sort()) {
        console.log(`Processing ${issueKey}...`);
        const [year, month, variant] = issueKey.split('_');
        const properMonth = variant ? `${month}_${variant}` : month;

        let firstPageHtml = '';
        const allSections: any[] = [];

        // Process each page separately
        for (let p = 1; p <= 4; p++) {
            const filename = `${issueKey}_page${p}.html`;
            const filePath = path.join(RAW_DIR, filename);

            if (!fs.existsSync(filePath)) continue;

            const pageHtml = fs.readFileSync(filePath, 'utf-8');
            if (p === 1) firstPageHtml = pageHtml;

            const $ = cheerio.load(pageHtml);
            const pageSections = extractPageContent($);

            allSections.push(...pageSections);
        }

        const header = extractHeader(firstPageHtml);
        header.pdf_link = `https://www.masjidtucson.org/publications/books/sp/${year}/${properMonth}/${properMonth}${year}.pdf`;

        const doc: any = {
            header: header,
            section_divider: "***************************************",
            sections: allSections
        };

        const output = {
            id: issueKey,
            year: parseInt(year),
            month: properMonth,
            document: doc,
            scrapedAt: new Date().toISOString()
        };

        fs.writeFileSync(
            path.join(JSON_DIR, `${issueKey}.json`),
            JSON.stringify(output, null, 2)
        );
    }
}

main().catch(console.error);
