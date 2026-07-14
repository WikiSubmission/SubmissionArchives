import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanText, parseTimestamp, parseVttToSegments } from '../../src/lib/transcriptUtils';

test('parses minute and hour timestamps', () => {
    assert.equal(parseTimestamp('01:30.500'), 90.5);
    assert.equal(parseTimestamp('01:02:03.250'), 3723.25);
    assert.equal(parseTimestamp(''), 0);
});

test('cleans common HTML entities and VTT tags', () => {
    assert.equal(cleanText('&lt;b&gt;God&nbsp;alone&lt;/b&gt; <c>now</c>'), 'God alone now');
});

test('parses a basic VTT cue with a named speaker', () => {
    const segments = parseVttToSegments(`WEBVTT

00:00:01.000 --> 00:00:03.500
Dr. Khalifa: Worship God alone.
`);

    assert.equal(segments.length, 1);
    assert.equal(segments[0].start_time, 1);
    assert.equal(segments[0].end_time, 3.5);
    assert.equal(segments[0].speaker, 'Dr. Khalifa');
    assert.equal(segments[0].content, 'Worship God alone.');
});
