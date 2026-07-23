import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { validateArchiveRecords } from '../../scripts/lib/archive-schema.mjs';
import { findQueryMatch } from '../../src/lib/search/queryMatch';
import type { ArchiveBookSummary, ArchiveRecord } from '../../src/types/archive';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const generatedDir = path.join(publicDir, 'data', 'generated_indices');

function readJson<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

const records = readJson<ArchiveRecord[]>(path.join(generatedDir, 'MASTER_INDEX.json'));
const books = readJson<ArchiveBookSummary[]>(path.join(generatedDir, 'BOOKS_LIST.json'));
const quranChapters = readJson<Array<{
    chapterNumber: number;
    verses: Array<{
        verseNumber: number;
        english: string;
        editions?: { '1981'?: { english: string }; '1989'?: { english: string } };
    }>;
}>>(path.join(generatedDir, 'QURAN_CHAPTERS.json'));

test('the generated archive satisfies the canonical runtime contract', () => {
    const report = validateArchiveRecords(records, { publicDir });

    assert.equal(report.valid, true, report.errors.join('\n'));
    assert.equal(report.recordCount, 383);
    const categoryCounts = report.categoryCounts as Record<string, number>;
    assert.equal(categoryCounts.Quran, 114);
    assert.equal(categoryCounts.Books, 13);
    assert.equal(categoryCounts['Submitter Perspectives'], 64);
});

test('every newsletter is searchable', () => {
    const newsletters = records.filter((record) => record.type === 'perspective');

    assert.equal(newsletters.length, 64);
    assert.equal(newsletters.every((record) => record.transcriptStatus === 'available'), true);
    assert.equal(newsletters.every((record) => record.segmentCount > 0), true);
});

test('September and October 1989 have complete reader assets', () => {
    for (const id of ['SP1989sep', 'SP1989oct']) {
        const issue = records.find((record) => record.id === id && record.type === 'perspective');
        assert.ok(issue, `Missing newsletter record: ${id}`);
        assert.ok(issue.pdfLink, `Missing PDF link: ${id}`);
        assert.ok(issue.thumbnailOverride, `Missing thumbnail: ${id}`);

        const pdfPath = path.join(publicDir, issue.pdfLink.replace(/^\//, ''));
        const thumbnailPath = path.join(publicDir, issue.thumbnailOverride.replace(/^\//, ''));
        assert.equal(fs.existsSync(pdfPath), true, pdfPath);
        assert.equal(fs.existsSync(thumbnailPath), true, thumbnailPath);

        const pdf = fs.readFileSync(pdfPath);
        assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-', `Invalid PDF header: ${id}`);
        assert.match(pdf.subarray(-2048).toString('latin1'), /%%EOF/, `Incomplete PDF: ${id}`);
    }
});

test('book summaries resolve to real PDFs and match master records', () => {
    const scanOnlyBookIds = books
        .filter((book) => book.transcriptStatus === 'missing')
        .map((book) => book.id)
        .sort();

    assert.equal(books.length, 13);
    assert.equal(books.filter((book) => book.transcriptStatus === 'available').length, 13);
    assert.deepEqual(scanOnlyBookIds, []);

    for (const book of books) {
        assert.equal(fs.existsSync(path.join(publicDir, book.pdfLink.replace(/^\//, ''))), true, book.pdfLink);
        const master = records.find((record) => record.id === book.id && record.type === 'other');
        assert.ok(master, `Missing master record for ${book.id}`);
        assert.equal(master.segmentCount, book.segmentCount);
    }
});

test('canonical transcription sources take precedence for every book', () => {
    const searchableBooks = books.filter((book) => book.transcriptStatus === 'available');
    assert.equal(searchableBooks.every((book) => book.transcriptionSource?.startsWith('data/sources/')), true);
    assert.match(books.find((book) => book.id === 'quran-hadith-islam')?.transcriptionSource ?? '', /data\/sources\/books/);
    assert.match(books.find((book) => book.id === 'quran1981')?.transcriptionSource ?? '', /data\/sources\/quran\/1981/);
    assert.match(books.find((book) => book.id === 'hard-cover-1989')?.transcriptionSource ?? '', /data\/sources\/quran\/1989/);
});

test('the complete 1981 page transcription is searchable', () => {
    const quran1981 = records.find((record) => record.id === 'quran1981');
    assert.ok(quran1981, 'Missing 1981 Quran book record');
    assert.equal(quran1981.segmentCount > 500, true);
    assert.equal(
        quran1981.segments.some((segment) => findQueryMatch(segment.text, 'authorized english version').matched),
        true,
    );
});

test('Quran search contains complete, edition-labeled 1992 and 1989 verse text', () => {
    const quranRecords = records.filter((record) => record.type === 'quran');
    const labels = quranRecords.flatMap((record) => record.segments.map((segment) => segment.label));

    assert.equal(labels.filter((label) => label === 'verse-1992').length, 6234);
    assert.equal(labels.filter((label) => label === 'verse-1989').length, 6234);
});

test('the 1981 edition preserves Chapter 9 verses 128 and 129', () => {
    const chapter9 = quranChapters.find((chapter) => chapter.chapterNumber === 9);
    assert.ok(chapter9, 'Missing Quran Chapter 9');

    for (const verseNumber of [128, 129]) {
        const targetVerse: {
            verseNumber: number;
            english: string;
            editions?: { '1981'?: { english: string }; '1989'?: { english: string } };
        } | undefined = chapter9.verses.find((candidate) => candidate.verseNumber === verseNumber);
        assert.ok(targetVerse, `Missing 9:${verseNumber}`);
        assert.equal(targetVerse.english, '', `9:${verseNumber} should not be attributed to the primary edition`);
        assert.ok(targetVerse.editions?.['1981']?.english, `Missing 1981 text for 9:${verseNumber}`);
        assert.equal(targetVerse.editions?.['1989'], undefined, `9:${verseNumber} should not be attributed to the 1989 edition`);
    }

    const quranRecords = records.filter((record) => record.type === 'quran');
    const verse1981Count = quranRecords
        .flatMap((record) => record.segments)
        .filter((segment) => segment.label === 'verse-1981').length;
    assert.equal(verse1981Count, 6236);
});

test('the 1989 Chapter 9 heading and footnotes are free of OCR rule debris', () => {
    const chapter9 = quranChapters.find((chapter) => chapter.chapterNumber === 9);
    assert.ok(chapter9, 'Missing Quran Chapter 9');
    const verse1 = chapter9.verses.find((verse) => verse.verseNumber === 1);
    assert.ok(verse1?.editions?.['1989'], 'Missing 1989 text for 9:1');

    const edition = verse1.editions['1989'] as { subtitle?: string; footnote?: string };
    assert.equal(edition.subtitle, 'No Basmalah');
    assert.doesNotMatch(edition.subtitle, /_{3,}|-{5,}|✓/);
    assert.match(edition.footnote ?? '', /absence of (the )?Basmalah/i);
    assert.match(edition.footnote ?? '', /& \*?9:127/);
    assert.doesNotMatch(edition.footnote ?? '', /repre sents/);
});

test('legacy book slugs resolve to their current filenames', () => {
    // The source PDFs are stored under slug-based filenames (matching each
    // book's id + .pdf), which the catalog records verbatim in `filename` and
    // uses to build `pdfLink`. Assert both stay in sync for the known slugs.
    const expected = new Map([
        ['salat-booklet', 'salat-booklet.pdf'],
        ['quran-hadith-islam', 'quran-hadith-islam.pdf'],
        ['computer-speaks', 'computer-speaks.pdf'],
        ['perpetual-miracle', 'perpetual-miracle.pdf'],
        ['miracle-of-quran-alphabets', 'miracle-of-quran-alphabets.pdf'],
        ['quran-visual-presentation', 'quran-visual-presentation.pdf'],
    ]);

    for (const [id, filename] of expected) {
        const book = books.find((candidate) => candidate.id === id);
        assert.equal(book?.filename, filename);
        assert.equal(book?.pdfLink, `/content/written/books/${filename}`);
    }
});

test('promoted search queries have at least one corpus match', () => {
    for (const query of ['God alone', 'messenger covenant', 'mathematical miracle']) {
        const matched = records.some((record) =>
            record.segments.some((segment) => findQueryMatch(segment.text, query).matched),
        );
        assert.equal(matched, true, `Promoted query has no corpus match: ${query}`);
    }
});
