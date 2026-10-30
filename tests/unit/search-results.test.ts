import assert from 'node:assert/strict';
import test from 'node:test';
import {
    countSources,
    documentRelevance,
    formatRecordDate,
    getRecordTime,
    getSourceLabel,
    normalizeSourceFilters,
    parseSort,
    selectResults,
} from '../../src/lib/search/results';

const result = (id: string, type: string, time: number | null) => ({ id, media: { type }, time });

test('normalizes source filters, mapping aliases and dropping unknown names', () => {
    // 'quran' was a source until the Quran left the archive; older links still carry it.
    assert.deepEqual(normalizeSourceFilters(['appendix', 'quran', 'video-program']), ['video', 'appendix']);
    assert.deepEqual(normalizeSourceFilters(['audio', 'sermon']), ['video', 'messenger-audio']);
    assert.deepEqual(normalizeSourceFilters([]), []);
});

test('treats selecting every source the same as selecting none', () => {
    const all = ['video', 'quran-study', 'messenger-audio', 'perspective', 'appendix', 'other'];
    assert.deepEqual(normalizeSourceFilters(all), []);
});

test('labels record types by their source', () => {
    assert.equal(getSourceLabel('video-program'), 'Videos');
    assert.equal(getSourceLabel('other'), 'Books');
    assert.equal(getSourceLabel('unknown'), 'Resource');
});

test('counts results per source, folding aliases into their source', () => {
    const counts = countSources([result('a', 'video'), result('b', 'sermon'), result('c', 'appendix'), result('d', 'nope')]);
    assert.equal(counts.video, 2);
    assert.equal(counts.appendix, 1);
    assert.equal(counts.other, 0);
});

test('accepts only known sort orders', () => {
    assert.equal(parseSort('newest'), 'newest');
    assert.equal(parseSort('oldest'), 'oldest');
    assert.equal(parseSort('sideways'), 'relevance');
    assert.equal(parseSort(null), 'relevance');
});

test('narrows by source while keeping relevance order', () => {
    const ranked = [result('a', 'video', 3), result('b', 'appendix', 1), result('c', 'sermon', 2)];
    assert.deepEqual(selectResults(ranked, ['video'], 'relevance').map((r) => r.id), ['a', 'c']);
    assert.deepEqual(selectResults(ranked, [], 'relevance').map((r) => r.id), ['a', 'b', 'c']);
});

test('sorts by date with undated records last, in relevance order', () => {
    const ranked = [result('u1', 'video', null), result('mid', 'video', 2), result('u2', 'video', null), result('old', 'video', 1), result('new', 'video', 3)];
    assert.deepEqual(selectResults(ranked, [], 'newest').map((r) => r.id), ['new', 'mid', 'old', 'u1', 'u2']);
    assert.deepEqual(selectResults(ranked, [], 'oldest').map((r) => r.id), ['old', 'mid', 'new', 'u1', 'u2']);
});

test('never reorders the cached input', () => {
    const ranked = [result('b', 'video', 1), result('a', 'video', 2)];
    selectResults(ranked, [], 'newest');
    selectResults(ranked, [], 'relevance').reverse();
    assert.deepEqual(ranked.map((r) => r.id), ['b', 'a']);
});

test('breaks passage-score ties by title, then by depth with diminishing returns', () => {
    assert.ok(documentRelevance(65, 1, true) > documentRelevance(65, 200, false));
    assert.ok(documentRelevance(65, 8, false) > documentRelevance(65, 1, false));
    assert.equal(documentRelevance(65, 5000, false), documentRelevance(65, 50000, false));
    assert.ok(documentRelevance(120, 1, false) > documentRelevance(65, 5000, true));
});

test('formats ISO and US dates and passes other formats through', () => {
    assert.equal(formatRecordDate('1989-05-26'), 'May 26, 1989');
    assert.equal(formatRecordDate('10/22/1982'), 'October 22, 1982');
    assert.equal(formatRecordDate(' March 1985 '), 'March 1985');
    assert.equal(formatRecordDate(undefined), '');
});

test('dates a record from its first parseable date, else its year', () => {
    assert.equal(getRecordTime(['10/22/1982'], null), Date.UTC(1982, 9, 22));
    assert.equal(getRecordTime([undefined, 'August 4, 1988'], 1990), Date.parse('August 4, 1988'));
    assert.equal(getRecordTime(['sometime'], 1987), Date.UTC(1987, 0, 1));
    assert.equal(getRecordTime([undefined], null), null);
});
