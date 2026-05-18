import fs from 'fs';
import path from 'path';
import { rowsToObjects } from '@/lib/csv';
import { findQueryMatch } from '@/lib/search/queryMatch';

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
};

export type NewsletterSearchResult = {
    issue: NewsletterIssue;
    matches: Array<{
        id: string;
        content: string;
        page: number;
        start_time: number;
        score?: number;
        kind?: string;
        distance?: number;
    }>;
};

const NEWSLETTER_DIR = path.join(process.cwd(), 'public', 'content', 'newsletter');
const NEWSLETTER_PDF_DIR = path.join(NEWSLETTER_DIR, 'pdfs');
const NEWSLETTER_THUMB_DIR = path.join(NEWSLETTER_DIR, 'thumbnails');
const CSV_PATH = path.join(NEWSLETTER_DIR, 'csv', 'newsletters_rows.csv');

const MONTHS: Record<string, { number: number; name: string; abbr: string }> = {
    jan: { number: 1, name: 'January', abbr: 'jan' },
    january: { number: 1, name: 'January', abbr: 'jan' },
    feb: { number: 2, name: 'February', abbr: 'feb' },
    february: { number: 2, name: 'February', abbr: 'feb' },
    mar: { number: 3, name: 'March', abbr: 'mar' },
    march: { number: 3, name: 'March', abbr: 'mar' },
    apr: { number: 4, name: 'April', abbr: 'apr' },
    april: { number: 4, name: 'April', abbr: 'apr' },
    may: { number: 5, name: 'May', abbr: 'may' },
    jun: { number: 6, name: 'June', abbr: 'jun' },
    june: { number: 6, name: 'June', abbr: 'jun' },
    jul: { number: 7, name: 'July', abbr: 'jul' },
    july: { number: 7, name: 'July', abbr: 'jul' },
    aug: { number: 8, name: 'August', abbr: 'aug' },
    august: { number: 8, name: 'August', abbr: 'aug' },
    sep: { number: 9, name: 'September', abbr: 'sep' },
    september: { number: 9, name: 'September', abbr: 'sep' },
    oct: { number: 10, name: 'October', abbr: 'oct' },
    october: { number: 10, name: 'October', abbr: 'oct' },
    nov: { number: 11, name: 'November', abbr: 'nov' },
    november: { number: 11, name: 'November', abbr: 'nov' },
    dec: { number: 12, name: 'December', abbr: 'dec' },
    december: { number: 12, name: 'December', abbr: 'dec' },
};

let issueCache: NewsletterIssue[] | null = null;
let csvRowsCache: Array<Record<string, string>> | null = null;

function getCsvRows() {
    if (csvRowsCache) return csvRowsCache;
    if (!fs.existsSync(CSV_PATH)) return [];

    csvRowsCache = rowsToObjects(fs.readFileSync(CSV_PATH, 'utf8'));
    return csvRowsCache;
}

function issueFromPdf(filename: string): NewsletterIssue | null {
    const match = filename.match(/^(\d{4})_(\d{2})_([A-Za-z]+)(?:_(.+))?\.pdf$/);
    if (!match) return null;

    const year = Number(match[1]);
    const monthNumber = Number(match[2]);
    const month = MONTHS[match[3].toLowerCase()];
    if (!month) return null;

    const suffix = match[4]?.toLowerCase() ?? '';
    const isBonus = suffix.includes('bonus') || suffix.includes('bulletin');
    const id = `${year}_${month.abbr}${suffix.includes('bonus_issue') ? '_2' : isBonus ? '_bonus' : ''}`;
    const titleSuffix = isBonus ? ' Bonus Issue' : '';
    const baseName = filename.replace(/\.pdf$/i, '');

    return {
        id,
        title: `Submitter Perspectives ${month.name}${titleSuffix} ${year}`,
        date: `${month.name.toUpperCase()}${titleSuffix.toUpperCase()} ${year}`,
        fullDate: `${year}-${String(monthNumber).padStart(2, '0')}-01`,
        monthSort: monthNumber + (isBonus ? 0.5 : 0),
        year,
        filename,
        pdfLink: `/content/newsletter/pdfs/${filename}`,
        thumbnailOverride: getThumbnailLink(filename),
        aliases: [id, baseName, `${year}_${month.abbr}`],
    };
}

export function getNewsletterIssues() {
    if (issueCache) return issueCache;
    if (!fs.existsSync(NEWSLETTER_PDF_DIR)) return [];

    issueCache = fs
        .readdirSync(NEWSLETTER_PDF_DIR)
        .filter((name) => name.toLowerCase().endsWith('.pdf'))
        .map(issueFromPdf)
        .filter((issue): issue is NewsletterIssue => issue !== null)
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate) || a.monthSort - b.monthSort);

    return issueCache;
}

function getThumbnailLink(pdfFilename: string) {
    const thumbnailName = `${pdfFilename.replace(/\.pdf$/i, '')}.jpg`;
    const thumbnailPath = path.join(NEWSLETTER_THUMB_DIR, thumbnailName);
    return fs.existsSync(thumbnailPath) ? `/content/newsletter/thumbnails/${thumbnailName}` : undefined;
}

export function getNewsletterIssue(id: string) {
    const normalized = decodeURIComponent(id).replace(/\.pdf$/i, '');
    return getNewsletterIssues().find((issue) =>
        issue.aliases.includes(normalized) || issue.filename.replace(/\.pdf$/i, '') === normalized
    );
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

export function searchNewsletterCsv(query: string, options: { proximityWindow?: number } = {}): NewsletterSearchResult[] {
    const issueByDate = new Map(
        getNewsletterIssues()
            .filter((issue) => !issue.id.endsWith('_bonus') && !issue.id.endsWith('_2'))
            .map((issue) => [issue.fullDate.slice(0, 7), issue])
    );
    const results = new Map<string, NewsletterSearchResult>();

    for (const row of getCsvRows()) {
        const content = row.content ?? '';
        const queryMatch = findQueryMatch(content, query, options);
        if (!queryMatch.matched) continue;

        const year = Number(row.year);
        const month = MONTHS[(row.month ?? '').toLowerCase()];
        const issue = month ? issueByDate.get(`${year}-${String(month.number).padStart(2, '0')}`) : null;
        if (!issue) continue;

        const matches = results.get(issue.id) ?? { issue, matches: [] };
        if (matches.matches.length < 12) {
            matches.matches.push({
                id: `nl-${issue.id}-p${row.page}-${row.index}`,
                content: queryMatch.snippet,
                page: Number(row.page) || 1,
                start_time: 0,
                score: queryMatch.score,
                kind: queryMatch.kind,
                distance: queryMatch.distance,
            });
        }

        results.set(issue.id, matches);
    }

    return Array.from(results.values());
}
