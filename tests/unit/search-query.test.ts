import assert from 'node:assert/strict';
import test from 'node:test';
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
