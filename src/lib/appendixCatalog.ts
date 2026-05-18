import fs from 'fs';
import path from 'path';
import { rowsToObjects } from '@/lib/csv';
import { findQueryMatch } from '@/lib/search/queryMatch';

export type AppendixItem = {
    id: string;
    title: string;
    filename: string;
    pdfLink: string;
    thumbnailOverride?: string;
};

export type AppendixSearchResult = {
    appendix: AppendixItem;
    matches: Array<{
        id: string;
        content: string;
        start_time: number;
        score?: number;
        kind?: string;
        distance?: number;
    }>;
};

const APPENDICES_DIR = path.join(process.cwd(), 'public', 'content', 'appendix');
const APPENDICES_PDF_DIR = path.join(APPENDICES_DIR, 'pdfs');
const APPENDICES_THUMB_DIR = path.join(APPENDICES_DIR, 'thumbnails');
const CSV_PATH = path.join(APPENDICES_DIR, 'csv', 'quran_appendices_rows.csv');

let rowsCache: Array<Record<string, string>> | null = null;
let catalogCache: AppendixItem[] | null = null;

function getRows() {
    if (rowsCache) return rowsCache;
    if (!fs.existsSync(CSV_PATH)) return [];
    rowsCache = rowsToObjects(fs.readFileSync(CSV_PATH, 'utf8'));
    return rowsCache;
}

function titleFromFilename(filename: string) {
    if (filename === 'introduction.pdf') return 'Introduction';
    if (filename === 'proclamation.pdf') return 'Proclamation';

    const appendixNumber = filename.match(/^appendix_(\d+)\.pdf$/)?.[1];
    return appendixNumber ? `Appendix ${appendixNumber}` : filename.replace(/\.pdf$/i, '');
}

export function getAppendixCatalog() {
    if (catalogCache) return catalogCache;
    if (!fs.existsSync(APPENDICES_PDF_DIR)) return [];

    const titleById = new Map<string, string>();
    for (const row of getRows()) {
        if (row.id && row.title && !titleById.has(row.id)) {
            titleById.set(row.id, row.title);
        }
    }

    catalogCache = fs
        .readdirSync(APPENDICES_PDF_DIR)
        .filter((name) => name.toLowerCase().endsWith('.pdf'))
        .map((filename) => {
            const id = filename.replace(/\.pdf$/i, '').replace(/^appendix_(\d+)$/, 'appendix-$1');
            return {
                id,
                title: titleById.get(id) ?? titleFromFilename(filename),
                filename,
                pdfLink: `/content/appendix/pdfs/${filename}`,
                thumbnailOverride: getThumbnailLink(APPENDICES_THUMB_DIR, '/content/appendix/thumbnails', filename),
            };
        })
        .sort((a, b) => sortValue(a.id) - sortValue(b.id));

    return catalogCache;
}

function getThumbnailLink(thumbnailDir: string, publicBase: string, pdfFilename: string) {
    const thumbnailName = `${pdfFilename.replace(/\.pdf$/i, '')}.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailName);
    return fs.existsSync(thumbnailPath) ? `${publicBase}/${thumbnailName}` : undefined;
}

export function getAppendixItem(id: string) {
    const normalized = decodeURIComponent(id).replace(/\.pdf$/i, '').replace(/^appendix_(\d+)$/, 'appendix-$1');
    return getAppendixCatalog().find((item) => item.id === normalized || item.filename.replace(/\.pdf$/i, '') === normalized);
}

export function searchAppendixCsv(query: string, options: { proximityWindow?: number } = {}): AppendixSearchResult[] {
    const catalog = new Map(getAppendixCatalog().map((item) => [item.id, item]));
    const results = new Map<string, AppendixSearchResult>();

    for (const row of getRows()) {
        const appendix = catalog.get(row.id);
        const content = row.content ?? '';
        const queryMatch = findQueryMatch(content, query, options);
        if (!appendix || !queryMatch.matched) continue;

        const result = results.get(appendix.id) ?? { appendix, matches: [] };
        if (result.matches.length < 12) {
            result.matches.push({
                id: `ap-${appendix.id}-${row.section_index}`,
                content: queryMatch.snippet,
                start_time: 0,
                score: queryMatch.score,
                kind: queryMatch.kind,
                distance: queryMatch.distance,
            });
        }

        results.set(appendix.id, result);
    }

    return Array.from(results.values());
}

function sortValue(id: string) {
    if (id === 'proclamation') return -2;
    if (id === 'introduction') return -1;
    const appendixNumber = id.match(/^appendix-(\d+)$/)?.[1];
    return appendixNumber ? Number(appendixNumber) : 999;
}
