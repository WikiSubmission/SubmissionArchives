import assert from 'node:assert/strict';
import { test } from 'node:test';

import { countWords, extractHeadings, formatEditorialDate, getEditorials } from '../../src/lib/editorials';

test('extractHeadings collects h2 and h3 with rehype-slug compatible ids', () => {
    const headings = extractHeadings(['## Acquisition', '', 'Body text.', '', '### Why it matters', '', '# Ignored'].join('\n'));

    assert.deepEqual(headings, [
        { id: 'acquisition', text: 'Acquisition', level: 2 },
        { id: 'why-it-matters', text: 'Why it matters', level: 3 },
    ]);
});

test('extractHeadings de-duplicates repeated headings the way rehype-slug does', () => {
    const headings = extractHeadings('## Notes\n\n## Notes\n');

    assert.deepEqual(
        headings.map((heading) => heading.id),
        ['notes', 'notes-1'],
    );
});

test('extractHeadings ignores hashes inside fenced code', () => {
    const headings = extractHeadings('## Real\n\n```\n## Not a heading\n```\n');

    assert.deepEqual(
        headings.map((heading) => heading.text),
        ['Real'],
    );
});

test('countWords ignores fenced code and JSX tags but keeps their prose', () => {
    const count = countWords('<Lead>\nTwo words\n</Lead>\n\n```\nignored code sample here\n```\n');

    assert.equal(count, 2);
});

test('formatEditorialDate renders the calendar date without timezone drift', () => {
    assert.equal(formatEditorialDate('2026-08-25'), 'August 25, 2026');
    assert.equal(formatEditorialDate('2026-01-01'), 'January 1, 2026');
});

test('published editorials parse and are ordered newest first', () => {
    const editorials = getEditorials();

    assert.ok(editorials.length > 0, 'expected at least one editorial on disk');

    for (const editorial of editorials) {
        assert.match(editorial.publishedAt, /^\d{4}-\d{2}-\d{2}$/, `${editorial.slug} has a non-calendar publishedAt`);
        assert.ok(editorial.wordCount > 0, `${editorial.slug} counted no words`);
        assert.ok(editorial.readingMinutes >= 1, `${editorial.slug} has no reading time`);
    }

    const dates = editorials.map((editorial) => editorial.publishedAt);
    assert.deepEqual(dates, [...dates].sort().reverse());
});
