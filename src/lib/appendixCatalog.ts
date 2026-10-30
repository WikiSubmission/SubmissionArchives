import fs from 'fs';
import path from 'path';
import { rowsToObjects } from '@/lib/csv';

export type AppendixItem = {
    id: string;
    title: string;
    filename: string;
    pdfLink: string;
    thumbnailOverride?: string;
};

// The appendices of the 1992 edition of Quran: The Final Testament.
const APPENDICES_DIR = path.join(process.cwd(), 'public', 'content', 'quran', 'organized_appendices', '1992');
const APPENDICES_PUBLIC_PATH = '/content/quran/organized_appendices/1992';
const CSV_PATH = path.join(process.cwd(), 'data', 'catalog', 'quran-appendices.csv');

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

    const appendixNumber = filename.match(/^appendix[_-](\d+)\.pdf$/)?.[1];
    return appendixNumber ? `Appendix ${appendixNumber}` : filename.replace(/\.pdf$/i, '');
}

export function getAppendixCatalog() {
    if (catalogCache) return catalogCache;
    if (!fs.existsSync(APPENDICES_DIR)) return [];

    const titleById = new Map<string, string>();
    for (const row of getRows()) {
        if (row.id && row.title && !titleById.has(row.id)) {
            titleById.set(row.id, row.title);
        }
    }

    catalogCache = fs
        .readdirSync(APPENDICES_DIR)
        .filter((name) => name.toLowerCase().endsWith('.pdf'))
        .map((filename) => {
            const id = filenameToId(filename);
            return {
                id,
                title: titleById.get(id) ?? titleFromFilename(filename),
                filename,
                pdfLink: `${APPENDICES_PUBLIC_PATH}/${filename}`,
                thumbnailOverride: getThumbnailLink(filename),
            };
        })
        .sort((a, b) => sortValue(a.id) - sortValue(b.id));

    return catalogCache;
}

function getThumbnailLink(pdfFilename: string) {
    const baseName = pdfFilename.replace(/\.pdf$/i, '');
    const match = [`${baseName}.jpg`, `${baseName}.png`].find((name) => fs.existsSync(path.join(APPENDICES_DIR, 'thumbnails', name)));
    return match ? `${APPENDICES_PUBLIC_PATH}/thumbnails/${match}` : undefined;
}

export function getAppendixItem(id: string) {
    const normalized = filenameToId(decodeURIComponent(id));
    return getAppendixCatalog().find((item) => item.id === normalized || filenameToId(item.filename) === normalized);
}

function filenameToId(filename: string) {
    return filename
        .replace(/\.pdf$/i, '')
        .replace(/^appendix[_-]0*(\d+)$/i, 'appendix-$1')
        .toLowerCase();
}

function sortValue(id: string) {
    if (id === 'proclamation') return -2;
    if (id === 'introduction') return -1;
    const appendixNumber = id.match(/^appendix-(\d+)$/)?.[1];
    return appendixNumber ? Number(appendixNumber) : 999;
}
