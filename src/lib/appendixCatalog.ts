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
    editions: Partial<Record<AppendixEdition, AppendixEditionAsset>>;
};

export type AppendixEdition = '1981' | '1989' | '1992';

export type AppendixEditionAsset = {
    pdfLink: string;
    thumbnail?: string;
    startPage?: number;
};

type AppendixEditionConfig = {
    sharedPdf?: string;
    splitPdfs?: boolean;
    startPages?: Record<string, number>;
};

type AppendixEditionManifest = {
    primaryEdition: AppendixEdition;
    editions: Record<AppendixEdition, AppendixEditionConfig>;
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

const APPENDICES_DIR = path.join(process.cwd(), 'public', 'content', 'quran', 'organized_appendices');
const PRIMARY_EDITION_DIR = path.join(APPENDICES_DIR, '1992');
const CSV_PATH = path.join(process.cwd(), 'data', 'catalog', 'quran-appendices.csv');
const EDITION_MANIFEST_PATH = path.join(process.cwd(), 'data', 'catalog', 'appendix-editions.json');

let rowsCache: Array<Record<string, string>> | null = null;
let catalogCache: AppendixItem[] | null = null;
let editionManifestCache: AppendixEditionManifest | null = null;

function getEditionManifest() {
    if (editionManifestCache) return editionManifestCache;
    editionManifestCache = JSON.parse(fs.readFileSync(EDITION_MANIFEST_PATH, 'utf8')) as AppendixEditionManifest;
    return editionManifestCache;
}

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
    if (!fs.existsSync(PRIMARY_EDITION_DIR)) return [];

    const titleById = new Map<string, string>();
    for (const row of getRows()) {
        if (row.id && row.title && !titleById.has(row.id)) {
            titleById.set(row.id, row.title);
        }
    }

    catalogCache = fs
        .readdirSync(PRIMARY_EDITION_DIR)
        .filter((name) => name.toLowerCase().endsWith('.pdf'))
        .map((filename) => {
            const id = filenameToId(filename);
            const editions: AppendixItem['editions'] = {};

            for (const edition of ['1981', '1989', '1992'] as const) {
                const asset = getEditionAsset(id, filename, edition);
                if (asset) editions[edition] = asset;
            }

            const primaryAsset = editions['1992']!;
            
            return {
                id,
                title: titleById.get(id) ?? titleFromFilename(filename),
                filename,
                pdfLink: primaryAsset.pdfLink,
                thumbnailOverride: primaryAsset.thumbnail,
                editions,
            };
        })
        .sort((a, b) => sortValue(a.id) - sortValue(b.id));

    return catalogCache;
}

function getEditionAsset(id: string, primaryFilename: string, edition: AppendixEdition): AppendixEditionAsset | undefined {
    const editionDir = path.join(APPENDICES_DIR, edition);
    const publicBase = `/content/quran/organized_appendices/${edition}`;
    const editionConfig = getEditionManifest().editions[edition];

    if (editionConfig.sharedPdf) {
        const startPage = editionConfig.startPages?.[id];
        const filename = editionConfig.sharedPdf;
        if (startPage === undefined || !fs.existsSync(path.join(editionDir, filename))) return undefined;

        return {
            pdfLink: `${publicBase}/${filename}`,
            thumbnail: getThumbnailLink(path.join(editionDir, 'thumbnails'), `${publicBase}/thumbnails`, `${id}.pdf`),
            startPage,
        };
    }

    const filename = edition === '1992' ? primaryFilename : `${id}.pdf`;
    if (!fs.existsSync(path.join(editionDir, filename))) return undefined;

    return {
        pdfLink: `${publicBase}/${filename}`,
        thumbnail: getThumbnailLink(path.join(editionDir, 'thumbnails'), `${publicBase}/thumbnails`, filename),
    };
}

function getThumbnailLink(thumbnailDir: string, publicBase: string, pdfFilename: string) {
    const baseName = pdfFilename.replace(/\.pdf$/i, '');
    const jpgName = `${baseName}.jpg`;
    const pngName = `${baseName}.png`;
    
    if (fs.existsSync(path.join(thumbnailDir, jpgName))) {
        return `${publicBase}/${jpgName}`;
    }
    if (fs.existsSync(path.join(thumbnailDir, pngName))) {
        return `${publicBase}/${pngName}`;
    }
    return undefined;
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
