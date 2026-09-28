import fs from 'node:fs';
import path from 'node:path';
import booksData from '../../../../../../public/data/generated_indices/BOOKS_LIST.json';
import type { ArchiveBookSummary } from '@/types/archive';

type BookWithOcrSource = ArchiveBookSummary & {
    category?: string;
    transcriptionSource?: string;
};

type OcrPage = { page: number; text: string };

const pageCache = new Map<string, OcrPage[]>();

export const dynamic = 'force-static';

export function generateStaticParams() {
    return (booksData as BookWithOcrSource[])
        .filter((book) => book.category === 'Books' && book.transcriptionSource)
        .map((book) => ({ id: book.id }));
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const book = (booksData as BookWithOcrSource[]).find(
        (item) => item.id === id && item.category === 'Books',
    );
    if (!book?.transcriptionSource) {
        return Response.json({ error: 'OCR text not found for this book.' }, { status: 404 });
    }

    let pages = pageCache.get(id);
    if (!pages) {
        const sourceRoot = path.resolve(process.cwd(), 'data', 'sources', 'books');
        const sourcePath = path.resolve(process.cwd(), book.transcriptionSource);
        if (!sourcePath.startsWith(`${sourceRoot}${path.sep}`) || !fs.existsSync(sourcePath)) {
            return Response.json({ error: 'OCR text is unavailable for this book.' }, { status: 404 });
        }

        const transcription = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as {
            pages?: Array<{ pdf_page?: number; transcription_text?: string }>;
        };
        pages = (transcription.pages ?? [])
            .map((page) => ({ page: Number(page.pdf_page), text: String(page.transcription_text ?? '') }))
            .filter((page) => Number.isInteger(page.page) && page.page > 0 && page.text.trim().length > 0);
        pageCache.set(id, pages);
    }

    return Response.json({ pages }, {
        headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    });
}
