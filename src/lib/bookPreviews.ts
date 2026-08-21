import fs from 'fs';
import path from 'path';

export type BookTocEntry = {
    title: string;
    /** PDF page the heading was located on, not the page printed in the book. */
    page: number;
};

export type BookPreview = {
    description: string;
    pageCount: number;
    toc: BookTocEntry[];
    generated?: {
        model?: string;
        verifiedEntries?: number;
        droppedUnverifiable?: number;
    };
};

/** The subset of a book record the preview modal needs, safe to pass to a client component. */
export type BookSummaryItem = {
    id: string;
    title: string;
    displayTitle?: string;
    author?: string;
    thumbnailOverride?: string;
    transcriptionMethod?: string;
};

const PREVIEWS_PATH = path.join(process.cwd(), 'data', 'catalog', 'book-previews.json');

// Keyed on the file's mtime rather than held forever. A plain module-level cache meant a
// regenerated book-previews.json was ignored until the server restarted, which showed up as
// every book reporting zero sections except the two that happened to exist at first read.
let cache: { mtimeMs: number; data: Record<string, BookPreview> } | null = null;

/**
 * Descriptions and verified tables of contents for the books, produced by
 * scripts/generate/generate_book_previews.mjs and checked by
 * scripts/validate/validate_book_previews.mjs. Every TOC page number was resolved by
 * searching the book's own page text for the heading, so an entry that could not be located
 * was dropped rather than shipped with a guessed page.
 */
export function getBookPreviews(): Record<string, BookPreview> {
    if (!fs.existsSync(PREVIEWS_PATH)) return {};
    const { mtimeMs } = fs.statSync(PREVIEWS_PATH);
    if (cache && cache.mtimeMs === mtimeMs) return cache.data;
    let data: Record<string, BookPreview> = {};
    try {
        data = JSON.parse(fs.readFileSync(PREVIEWS_PATH, 'utf8')) as Record<string, BookPreview>;
    } catch {
        data = {};
    }
    cache = { mtimeMs, data };
    return data;
}
