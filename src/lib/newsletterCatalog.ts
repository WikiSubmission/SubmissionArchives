import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonData = any;

export type NewsletterArticleSummary = {
    page: number;
    title: string;
    subtitle?: string;
    byline?: string;
    summary?: string;
    type?: string;
};

export type NewsletterSummaryData = {
    publication: string;
    publisher: string;
    editor: string;
    writers?: string[];
    hijriDate?: string;
    pageCount: number;
    articles: NewsletterArticleSummary[];
    versesReferenced?: string[];
};

export type NewsletterIssue = {
    id: string;
    title: string;
    date: string;
    fullDate: string;
    monthSort: number;
    year: number;
    filename: string;
    pdfLink: string;
    thumbnailOverride?: string;
    aliases: string[];
    jsonData?: JsonData;
    summary?: NewsletterSummaryData;
};

const NEWSLETTER_DIR = path.join(process.cwd(), 'public', 'content', 'written', 'newsletters');
const JSON_PATH = path.join(process.cwd(), 'data', 'catalog', 'newsletters.json');
const NEWSLETTER_THUMB_DIR = path.join(NEWSLETTER_DIR, 'thumbnails');
const NEWSLETTER_PDF_DIR = path.join(NEWSLETTER_DIR, 'pdfs');

let issueCache: NewsletterIssue[] | null = null;

// Special editions (e.g. the May 1988 Bulletin, the January 1990 Special Bonus
// Issue) share their year/month/monthName with a regular issue, so deriving a
// filename from year/month/monthName for them would resolve to the regular
// issue's file instead of their own. Each gets its own explicit filename here.
const REGULAR_EDITION_TYPES = new Set(['regular_issue', 'regular']);
const SPECIAL_EDITION_ASSET_NAMES: Record<string, string> = {
    SP1988may_bulletin: '1988_05_May_Bulletin',
    SP1990jan_special_bonus: '1990_01_January_Bonus_Issue',
};

function getThumbnailLink(issueId: string, year: number, monthNumber: number, monthName: string, editionType?: string) {
    const baseName = editionType && !REGULAR_EDITION_TYPES.has(editionType)
        ? SPECIAL_EDITION_ASSET_NAMES[issueId]
        : `${year}_${String(monthNumber).padStart(2, '0')}_${monthName}`;
    if (!baseName) return undefined;
    const thumbnailName = `${baseName}.jpg`;
    const thumbnailPath = path.join(NEWSLETTER_THUMB_DIR, thumbnailName);
    return fs.existsSync(thumbnailPath) ? `/content/written/newsletters/thumbnails/${thumbnailName}` : undefined;
}

function getPdfLink(issueId: string, year: number, monthNumber: number, monthName: string, editionType?: string) {
    const baseName = editionType && !REGULAR_EDITION_TYPES.has(editionType)
        ? SPECIAL_EDITION_ASSET_NAMES[issueId]
        : `${year}_${String(monthNumber).padStart(2, '0')}_${monthName}`;
    if (!baseName) return undefined;
    const pdfName = `${baseName}.pdf`;
    const pdfPath = path.join(NEWSLETTER_PDF_DIR, pdfName);
    return fs.existsSync(pdfPath) ? `/content/written/newsletters/pdfs/${pdfName}` : undefined;
}

function cleanText(text?: string | null): string {
    if (!text) return '';
    return text
        .replace(/\s+/g, ' ')
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractNewsletterSummary(issue: any): NewsletterSummaryData {
    const pages = issue.pages || issue.transcription?.pages || [];
    const source = issue.transcription?.source || {};
    const meta = issue.issue_metadata || issue.transcription?.issue_metadata || issue.transcription || {};

    const publication = meta.masthead || meta.publication || source.publication_title_printed || issue.publication || 'Submitters Perspective';
    const publisher = meta.publisher || source.publisher_printed || 'Masjid Tucson / United Submitters International';
    const editor = meta.editor || (issue.year >= 1990 ? 'United Submitters International' : 'Dr. Rashad Khalifa, Ph.D.');
    const dateLabel = issue.date_label || meta.date || source.date_printed || '';
    const hijriDate = meta.hijri_date || source.hijri_date_printed || '';
    const pageCount = issue.page_count || pages.length || 4;

    const articles: NewsletterArticleSummary[] = [];
    const seenTitles = new Set<string>();
    const verseMatches = new Set<string>();
    const writersSet = new Set<string>();

    if (editor) writersSet.add(editor);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pages.forEach((page: any) => {
        const pageNum = page.page_number;
        const blocksList = page.blocks || page.sections;

        // 1. Structured blocks or sections
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (blocksList && Array.isArray(blocksList) && blocksList.some((b: any) => b.title && b.title.toLowerCase() !== 'masthead')) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            blocksList.forEach((block: any) => {
                const title = cleanText(block.title);
                if (!title || ['MUSLIM PERSPECTIVE', 'SUBMITTERS PERSPECTIVE', 'SUBMISSION PERSPECTIVE', 'MASTHEAD'].includes(title.toUpperCase())) {
                    return;
                }

                const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (seenTitles.has(normalizedTitle)) return;
                seenTitles.add(normalizedTitle);

                let paragraphText = '';
                if (block.paragraphs && block.paragraphs.length > 0) {
                    paragraphText = block.paragraphs.join(' ');
                } else if (block.columns && block.columns.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    paragraphText = block.columns.map((c: any) => (c.paragraphs || []).join(' ')).join(' ');
                } else if (block.text) {
                    paragraphText = block.text;
                }

                paragraphText = cleanText(paragraphText);
                if (paragraphText) {
                    const verses = paragraphText.match(/\b\d{1,3}:\d{1,3}\b/g);
                    if (verses) verses.forEach((v) => verseMatches.add(v));
                }

                const byline = block.byline || block.author ? cleanText(block.byline || block.author) : undefined;
                if (byline) writersSet.add(byline.replace(/^by\s+/i, ''));

                let summary = '';
                if (paragraphText) {
                    const sentences = paragraphText.match(/[^.!?]+[.!?]+/g) || [paragraphText];
                    summary = sentences.slice(0, 2).join(' ');
                    if (summary.length < 50 && sentences.length > 2) {
                        summary = sentences.slice(0, 3).join(' ');
                    }
                    if (summary.length > 280) {
                        summary = summary.slice(0, 277) + '...';
                    }
                }

                articles.push({
                    page: pageNum,
                    title,
                    subtitle: block.subtitle ? cleanText(block.subtitle) : undefined,
                    byline,
                    summary: summary || undefined,
                    type: block.type || 'article',
                });
            });
        } 
        // 2. Unstructured pages or raw text
        else {
            const rawText = cleanText(page.transcription_text || page.raw_pdf_text_layer || page.plain_text || '');
            if (rawText) {
                const verses = rawText.match(/\b\d{1,3}:\d{1,3}\b/g);
                if (verses) verses.forEach((v) => verseMatches.add(v));
            }

            if (page.page_title) {
                const pTitles = page.page_title.split(/\s*[\/|;]\s*/);
                pTitles.forEach((t: string) => {
                    const cleanT = cleanText(t);
                    if (!cleanT) return;
                    const normalizedTitle = cleanT.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (seenTitles.has(normalizedTitle)) return;
                    seenTitles.add(normalizedTitle);

                    const sentences = rawText.match(/[^.!?]+[.!?]+/g) || [rawText];
                    let summary = sentences.slice(0, 2).join(' ');
                    if (summary.length > 280) summary = summary.slice(0, 277) + '...';

                    articles.push({
                        page: pageNum,
                        title: cleanT,
                        summary: summary || `Analysis and reports from Page ${pageNum} of the ${dateLabel} issue.`,
                        type: 'article',
                    });
                });
            } else if (rawText) {
                const lines = (page.transcription_text || page.raw_pdf_text_layer || '')
                    .split('\n')
                    .map((l: string) => cleanText(l))
                    .filter((l: string) => l.length > 3 && !l.startsWith('http') && !l.startsWith('Masjid') && !l.startsWith('United Submitters'));

                const headingCandidates = lines.filter((l: string) => l.length < 90 && (l === l.toUpperCase() || /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*/.test(l)));
                const mainHeading = headingCandidates[0] || `Articles & Insights (Page ${pageNum})`;

                const normalizedTitle = mainHeading.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!seenTitles.has(normalizedTitle)) {
                    seenTitles.add(normalizedTitle);
                    const sentences = rawText.match(/[^.!?]+[.!?]+/g) || [rawText];
                    let summary = sentences.slice(0, 2).join(' ');
                    if (summary.length > 280) summary = summary.slice(0, 277) + '...';

                    articles.push({
                        page: pageNum,
                        title: mainHeading,
                        summary: summary || `Reports and research from Page ${pageNum}.`,
                        type: 'article',
                    });
                }
            }
        }
    });

    // If still no articles, fallback to issue.page_titles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (articles.length === 0 && Array.isArray(issue.page_titles)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        issue.page_titles.forEach((pt: any, idx: number) => {
            if (!pt) return;
            const pNum = typeof pt === 'object' && pt.page_number ? pt.page_number : idx + 1;
            const pTitle = typeof pt === 'object' && pt.title ? pt.title : String(pt);
            articles.push({
                page: pNum,
                title: pTitle,
                summary: `Content from page ${pNum} of the ${dateLabel} issue.`,
                type: 'article',
            });
        });
    }

    return {
        publication,
        publisher,
        editor,
        writers: Array.from(writersSet).filter(Boolean),
        hijriDate: hijriDate || undefined,
        pageCount,
        articles,
        versesReferenced: Array.from(verseMatches).slice(0, 10),
    };
}

export function getNewsletterIssues(): NewsletterIssue[] {
    if (issueCache) return issueCache;
    if (!fs.existsSync(JSON_PATH)) return [];

    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issuesData: any[] = data.issues || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    issueCache = issuesData.map((issue: any): NewsletterIssue => {
        const id = issue.issue_id;
        const monthStr = String(issue.month_number).padStart(2, '0');
        
        return {
            id,
            title: `Submitter Perspectives ${issue.date_label}`,
            date: issue.date_label,
            fullDate: `${issue.year}-${monthStr}-01`,
            monthSort: issue.month_number,
            year: issue.year,
            filename: issue.source_file,
            pdfLink: getPdfLink(id, issue.year, issue.month_number, issue.month_name, issue.edition_type) || '',
            thumbnailOverride: getThumbnailLink(id, issue.year, issue.month_number, issue.month_name, issue.edition_type),
            aliases: [id],
            jsonData: issue,
            summary: extractNewsletterSummary(issue),
        };
    }).sort((a: NewsletterIssue, b: NewsletterIssue) => a.fullDate.localeCompare(b.fullDate) || a.monthSort - b.monthSort);

    return issueCache;
}

export function getNewsletterIssue(id: string): NewsletterIssue | undefined {
    const normalized = decodeURIComponent(id).trim();
    const issues = getNewsletterIssues();
    
    // Exact or direct alias match
    const direct = issues.find((issue) =>
        issue.id === normalized || issue.aliases.includes(normalized)
    );
    if (direct) return direct;

    const cleanId = normalized.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Flexible match by year + month (e.g. sp-1985_02_February -> 198502 or sp1985feb)
    return issues.find((issue) => {
        const issueClean = issue.id.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (issueClean === cleanId) return true;

        const monthStr = String(issue.monthSort).padStart(2, '0');
        const ymCode = `${issue.year}${monthStr}`;
        if (cleanId.includes(ymCode)) return true;

        const monthShort = issue.date.slice(0, 3).toLowerCase();
        const ymShort = `${issue.year}${monthShort}`;
        return cleanId.includes(ymShort);
    });
}

export function getAdjacentNewsletterIssues(id: string) {
    const issues = getNewsletterIssues();
    const current = getNewsletterIssue(id);
    const index = current ? issues.findIndex((issue) => issue.id === current.id) : -1;

    return {
        prevId: index > 0 ? issues[index - 1].id : null,
        nextId: index >= 0 && index < issues.length - 1 ? issues[index + 1].id : null,
    };
}
