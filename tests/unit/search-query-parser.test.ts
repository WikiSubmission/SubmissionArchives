import assert from 'node:assert/strict';
import test from 'node:test';
import { hasOperators, parseAdvancedQuery } from '../../src/lib/search/queryParser';

test('passes quoted phrases through untouched for the matcher to handle', () => {
    const parsed = parseAdvancedQuery('"submission alone"');

    assert.equal(parsed.text, '"submission alone"');
    assert.deepEqual(parsed.exclusions, []);
    assert.equal(hasOperators(parsed), false);
});

test('separates exclusions from search text', () => {
    const parsed = parseAdvancedQuery('miracle -number');

    assert.equal(parsed.text, 'miracle');
    assert.deepEqual(parsed.exclusions, ['number']);
    assert.equal(hasOperators(parsed), true);
});

test('reads date scoping and type operators', () => {
    const parsed = parseAdvancedQuery('prayer before:1990 after:1985 type:perspective');

    assert.equal(parsed.text, 'prayer');
    assert.equal(parsed.before, 1990);
    assert.equal(parsed.after, 1985);
    assert.deepEqual(parsed.types, ['perspective']);
});

test('maps natural type words onto catalog type keys', () => {
    assert.deepEqual(parseAdvancedQuery('zakat type:book').types, ['other']);
    assert.deepEqual(parseAdvancedQuery('zakat type:newsletter').types, ['perspective']);
});

test('falls back to plain text for malformed operators', () => {
    const parsed = parseAdvancedQuery('miracle before:soon after: type: -');

    assert.equal(parsed.before, undefined);
    assert.equal(parsed.after, undefined);
    assert.deepEqual(parsed.types, []);
    assert.deepEqual(parsed.exclusions, []);
    assert.equal(parsed.text, 'miracle before:soon after: type: -');
    assert.equal(hasOperators(parsed), false);
});

test('collects multiple exclusions and types', () => {
    const parsed = parseAdvancedQuery('god -idol -statue type:video type:audio');

    assert.equal(parsed.text, 'god');
    assert.deepEqual(parsed.exclusions, ['idol', 'statue']);
    assert.deepEqual(parsed.types, ['video', 'audio']);
});

test('leaves nothing to match when a query is only operators', () => {
    assert.equal(parseAdvancedQuery('type:video before:1990').text, '');
});
