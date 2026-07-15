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

test('the generated archive satisfies the canonical runtime contract', () => {
    const report = validateArchiveRecords(records, { publicDir });

    assert.equal(report.valid, true, report.errors.join('\n'));
    assert.equal(report.recordCount, 382);
    assert.equal(report.categoryCounts.Quran, 114);
    assert.equal(report.categoryCounts.Books, 13);
    assert.equal(report.categoryCounts['Submitter Perspectives'], 64);
});

test('every newsletter is searchable', () => {
    const newsletters = records.filter((record) => record.type === 'perspective');

    assert.equal(newsletters.length, 64);
    assert.equal(newsletters.every((record) => record.transcriptStatus === 'available'), true);
    assert.equal(newsletters.every((record) => record.segmentCount > 0), true);
});

test('book summaries resolve to real PDFs and match master records', () => {
    const scanOnlyBookIds = books
        .filter((book) => book.transcriptStatus === 'missing')
        .map((book) => book.id)
        .sort();

    assert.equal(books.length, 13);
    assert.equal(books.filter((book) => book.transcriptStatus === 'available').length, 11);
    assert.deepEqual(scanOnlyBookIds, [
        'islam-volume-1-number-2-july-1974',
        'islam-volume-1-number-3-4-january-1975',
    ]);

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

test('legacy book slugs resolve to their current filenames', () => {
    const expected = new Map([
        ['salat-booklet', 'The Contact Prayers.pdf'],
        ['quran-hadith-islam', 'Quran, Hadith, and Islam.pdf'],
        ['computer-speaks', "The Computer Speaks God's Message to the World.pdf"],
        ['perpetual-miracle', 'The Perpetual Miracle of Muhammad.pdf'],
        ['miracle-of-quran-alphabets', 'Miracle of Quran - Significance of the Mysterious Alphabets.pdf'],
        ['quran-visual-presentation', 'Quran - Visual Presentation of the Miracle.pdf'],
    ]);

    for (const [id, filename] of expected) {
        assert.equal(books.find((book) => book.id === id)?.filename, filename);
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
