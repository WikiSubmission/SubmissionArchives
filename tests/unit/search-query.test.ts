import assert from 'node:assert/strict';
import test from 'node:test';
import { highlightSearchText } from '../../src/lib/search/highlight';
import { findQueryMatch, getHighlightTerms, parseSearchQuery } from '../../src/lib/search/queryMatch';

test('parses quoted phrases, meaningful terms, and bounded proximity', () => {
    const parsed = parseSearchQuery('"God alone" and messenger near/99');

    assert.deepEqual(parsed.phrases, ['god alone']);
    assert.deepEqual(parsed.terms, ['messenger']);
    assert.equal(parsed.proximityWindow, 40);
    assert.deepEqual(parsed.highlightTerms, ['god alone', 'messenger']);
});

test('ranks an exact phrase above broader matches', () => {
    const exact = findQueryMatch('All worship is directed to God alone.', 'God alone');
    const broad = findQueryMatch('God sent a messenger whose work stood alone.', 'God alone');

    assert.equal(exact.matched, true);
    assert.equal(exact.kind, 'phrase');
    assert.equal(exact.score, 120);
    assert.equal(broad.matched, true);
    assert.ok(exact.score > broad.score);
});

test('keeps quoted excerpts aligned with source text after apostrophes are normalized', () => {
    const source = `${'can’t '.repeat(100)}The citation says God’s message was preserved.`;
    const result = findQueryMatch(source, '"Gods message"');

    assert.equal(result.matched, true);
    assert.match(result.snippet, /God’s message/);
});

test('requires every meaningful term and respects proximity windows', () => {
    const nearby = findQueryMatch('The mathematical code confirms the Quran miracle.', 'mathematical miracle', {
        proximityWindow: 8,
    });
    const missing = findQueryMatch('The mathematical code is explained here.', 'mathematical miracle');

    assert.equal(nearby.matched, true);
    assert.equal(nearby.kind, 'proximity');
    assert.equal(missing.matched, false);
});

test('normalizes highlight terms without stopwords or duplicates', () => {
    assert.deepEqual(getHighlightTerms('The covenant covenant of God'), ['covenant', 'god']);
});

test('highlights meaningful terms only', () => {
    assert.equal(
        highlightSearchText('Your god is one god', 'god is one'),
        'Your <mark class="qs-highlight">god</mark> is <mark class="qs-highlight">one</mark> <mark class="qs-highlight">god</mark>',
    );
    assert.equal(highlightSearchText('Those who disbelieve', 'god is one'), 'Those who disbelieve');
});

test('scores the same without building a snippet', () => {
    const cases: Array<[string, string, { proximityWindow?: number }?]> = [
        ['All worship is directed to God alone.', 'God alone'],
        ['God sent a messenger whose work stood alone.', 'God alone'],
        ['The citation says God’s message was preserved.', '"Gods message"'],
        ['The mathematical code confirms the Quran miracle.', 'mathematical miracle', { proximityWindow: 8 }],
        [`mathematical ${'filler '.repeat(60)}miracle`, 'mathematical miracle', { proximityWindow: 8 }],
        ['The mathematical code is explained here.', 'mathematical miracle'],
        ['Crème brûlée and the Qur’an', 'creme quran'],
        ['قُلْ هُوَ اللَّهُ أَحَدٌ', 'الله'],
        ['שְׁמַע יִשְׂרָאֵל', 'ישראל'],
        ['A "quoted phrase" next to messenger', '"quoted phrase" messenger'],
    ];
    for (const [text, query, options] of cases) {
        const full = findQueryMatch(text, query, options);
        const lean = findQueryMatch(text, query, { ...options, snippet: false });
        assert.deepEqual(
            [lean.matched, lean.score, lean.kind, lean.distance],
            [full.matched, full.score, full.kind, full.distance],
            `${query} in ${text.slice(0, 40)}`,
        );
        assert.equal(lean.snippet, '');
    }
});
