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

function getThumbnailLink(year: number, monthNumber: number, monthName: string) {
    const thumbnailName = `${year}_${String(monthNumber).padStart(2, '0')}_${monthName}.jpg`;
    const thumbnailPath = path.join(NEWSLETTER_THUMB_DIR, thumbnailName);
    return fs.existsSync(thumbnailPath) ? `/content/written/newsletters/thumbnails/${thumbnailName}` : undefined;
}

function getPdfLink(year: number, monthNumber: number, monthName: string) {
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
            pdfLink: getPdfLink(issue.year, issue.month_number, issue.month_name) || '',
            thumbnailOverride: getThumbnailLink(issue.year, issue.month_number, issue.month_name),
            aliases: [id],
            jsonData: issue,
        };
    }).sort((a: NewsletterIssue, b: NewsletterIssue) => a.fullDate.localeCompare(b.fullDate) || a.monthSort - b.monthSort);

    return issueCache;
}

export function getNewsletterIssue(id: string): NewsletterIssue | undefined {
    const normalized = decodeURIComponent(id);
    const issues = getNewsletterIssues();
    return issues.find((issue) =>
        issue.id === normalized || issue.aliases.includes(normalized)
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
