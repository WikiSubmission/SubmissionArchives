import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonData = any;

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
};

const NEWSLETTER_DIR = path.join(process.cwd(), 'public', 'content', 'written', 'newsletters');
const JSON_PATH = path.join(process.cwd(), 'data', 'catalog', 'newsletters.json');
const NEWSLETTER_THUMB_DIR = path.join(NEWSLETTER_DIR, 'thumbnails');
const NEWSLETTER_PDF_DIR = path.join(NEWSLETTER_DIR, 'pdfs');

let issueCache: NewsletterIssue[] | null = null;

// Special editions (e.g. the May 1988 Bulletin, the January 1990 Special Bonus
// Issue) share their year/month/monthName with a regular issue but have no
// scanned PDF of their own. Deriving a filename from year/month/monthName for
// them would resolve to the regular issue's file, so only regular editions
// get a filesystem-derived link; special editions fall back to the
// transcription-based viewer.
const REGULAR_EDITION_TYPES = new Set(['regular_issue', 'regular']);

function getThumbnailLink(year: number, monthNumber: number, monthName: string, editionType?: string) {
    if (editionType && !REGULAR_EDITION_TYPES.has(editionType)) return undefined;
    const thumbnailName = `${year}_${String(monthNumber).padStart(2, '0')}_${monthName}.jpg`;
    const thumbnailPath = path.join(NEWSLETTER_THUMB_DIR, thumbnailName);
    return fs.existsSync(thumbnailPath) ? `/content/written/newsletters/thumbnails/${thumbnailName}` : undefined;
}

function getPdfLink(year: number, monthNumber: number, monthName: string, editionType?: string) {
    if (editionType && !REGULAR_EDITION_TYPES.has(editionType)) return undefined;
    const pdfName = `${year}_${String(monthNumber).padStart(2, '0')}_${monthName}.pdf`;
    const pdfPath = path.join(NEWSLETTER_PDF_DIR, pdfName);
    return fs.existsSync(pdfPath) ? `/content/written/newsletters/pdfs/${pdfName}` : undefined;
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
            pdfLink: getPdfLink(issue.year, issue.month_number, issue.month_name, issue.edition_type) || '',
            thumbnailOverride: getThumbnailLink(issue.year, issue.month_number, issue.month_name, issue.edition_type),
            aliases: [id],
            jsonData: issue,
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
