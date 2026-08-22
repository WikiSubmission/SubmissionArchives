import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTimeParam } from '../../src/lib/formatUtils';

test('reads a plain seconds deep link', () => {
    assert.equal(parseTimeParam('342'), 342);
    assert.equal(parseTimeParam('0'), 0);
    assert.equal(parseTimeParam('90.5'), 90.5);
});

test('reads human-readable spans', () => {
    assert.equal(parseTimeParam('5m42s'), 342);
    assert.equal(parseTimeParam('1h2m3s'), 3723);
    assert.equal(parseTimeParam('90s'), 90);
    assert.equal(parseTimeParam('2m'), 120);
    assert.equal(parseTimeParam('1h'), 3600);
});

test('is case and whitespace insensitive', () => {
    assert.equal(parseTimeParam(' 5M42S '), 342);
});

test('returns undefined for anything unparseable', () => {
    for (const input of [null, undefined, '', '   ', 'abc', '5x42', '-30', 'm42s', '5m42s7']) {
        assert.equal(parseTimeParam(input), undefined, `expected undefined for ${JSON.stringify(input)}`);
    }
});
