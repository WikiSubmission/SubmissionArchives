import assert from 'node:assert/strict';
import test from 'node:test';
import {
    findActiveChapterIndex,
    findActiveCueIndex,
    formatSeconds,
    parseMediaReference,
    parseRecordCode,
    parseTimestamp,
    resolveReference,
    type MediaItem,
    type TranscriptCue,
} from '../../studio/src/lib/mediaCatalog';
import { buildMediaQuoteMarkdown, mediaDeepLink } from '../../studio/src/lib/mediaBus';
import { serializeMediaTimestamp } from '../../studio/src/components/extensions/MediaTimestampExtension';

const ITEMS: MediaItem[] = [
    {
        id: 'video-program/what-is-life-all-about',
        slug: 'video-program-what-is-life-all-about',
        title: 'What is Life All About?',
        displayTitle: 'What is Life All About?',
        type: 'video-program',
        author: 'Dr. Rashad Khalifa',
        youtubeId: 'tNqQJR5LyXo',
        chapters: [
            { id: 1, startTime: 64.11, endTime: 99.29, title: 'The Biggest Problem in the World' },
            { id: 2, startTime: 99.29, endTime: 119.9, title: 'The Body as a Garment' },
        ],
    },
    {
        id: 'quran-study/01 Quran Study From Azhar 1',
        slug: 'quran-study-01-quran-study-from-azhar-1',
        title: 'Quran Study 01',
        displayTitle: 'Quran Study 01',
        type: 'quran-study',
        author: 'Dr. Rashad Khalifa',
        primaryNumber: 1,
        chapters: [],
    },
];

const CUES: TranscriptCue[] = [
    { id: 0, startTime: 64.11, endTime: 68.13, text: 'The biggest problem in the world today is not war.' },
    { id: 1, startTime: 68.13, endTime: 75.27, text: 'It is not disease, cancer, AIDS, and so on.' },
    { id: 2, startTime: 99.29, endTime: 110.0, text: 'The body you see in the mirror is just a garment.' },
];

test('formats seconds as a citation timestamp', () => {
    assert.equal(formatSeconds(0), '00:00');
    assert.equal(formatSeconds(99), '01:39');
    assert.equal(formatSeconds(3723), '1:02:03');
    assert.equal(formatSeconds(-5), '00:00');
});

test('parses the timestamp forms that turn up in prose', () => {
    assert.equal(parseTimestamp('01:39'), 99);
    assert.equal(parseTimestamp('1:02:03'), 3723);
    assert.equal(parseTimestamp('99'), 99);
    assert.equal(parseTimestamp('5m42s'), 342);
    assert.equal(parseTimestamp('nonsense'), null);
    assert.equal(parseTimestamp(''), null);
});

test('round-trips a formatted timestamp', () => {
    for (const seconds of [0, 7, 99, 600, 3723]) {
        assert.equal(parseTimestamp(formatSeconds(seconds)), seconds);
    }
});

test('parses sa:// deep links', () => {
    assert.deepEqual(parseMediaReference('sa://media/video-program/what-is-life-all-about?t=99'), {
        id: 'video-program/what-is-life-all-about',
        timestamp: 99,
    });
});

test('parses archive and YouTube URLs', () => {
    assert.deepEqual(parseMediaReference('https://submissionarchives.com/media/video-program/what-is-life-all-about'), {
        id: 'video-program/what-is-life-all-about',
        timestamp: undefined,
    });
    assert.deepEqual(parseMediaReference('https://www.youtube.com/watch?v=tNqQJR5LyXo&t=99s'), {
        id: null,
        youtubeId: 'tNqQJR5LyXo',
        timestamp: 99,
    });
    assert.deepEqual(parseMediaReference('https://youtu.be/tNqQJR5LyXo?t=99'), {
        id: null,
        youtubeId: 'tNqQJR5LyXo',
        timestamp: 99,
    });
});

test('reads short record codes', () => {
    assert.deepEqual(parseRecordCode('QS-01'), { type: 'quran-study', number: 1 });
    assert.deepEqual(parseRecordCode('ma 72'), { type: 'messenger-audio', number: 72 });
    assert.equal(parseRecordCode('what-is-life-all-about'), null);
});

test('resolves references against the catalog', () => {
    const byId = resolveReference(ITEMS, parseMediaReference('video-program/what-is-life-all-about'));
    assert.equal(byId?.id, ITEMS[0].id);

    const byYoutube = resolveReference(ITEMS, parseMediaReference('https://youtu.be/tNqQJR5LyXo'));
    assert.equal(byYoutube?.id, ITEMS[0].id);

    const byCode = resolveReference(ITEMS, parseMediaReference('QS-01'));
    assert.equal(byCode?.id, ITEMS[1].id);

    const bySlug = resolveReference(ITEMS, parseMediaReference('video-program-what-is-life-all-about'));
    assert.equal(bySlug?.id, ITEMS[0].id);

    assert.equal(resolveReference(ITEMS, parseMediaReference('no-such-lecture')), null);
});

test('finds the cue and chapter under the playhead', () => {
    assert.equal(findActiveCueIndex(CUES, 0), -1);
    assert.equal(findActiveCueIndex(CUES, 65), 0);
    assert.equal(findActiveCueIndex(CUES, 70), 1);
    assert.equal(findActiveCueIndex(CUES, 105), 2);
    // A gap wider than a second between cues should clear the highlight.
    assert.equal(findActiveCueIndex(CUES, 90), -1);
    assert.equal(findActiveCueIndex([], 10), -1);

    assert.equal(findActiveChapterIndex(ITEMS[0].chapters, 10), -1);
    assert.equal(findActiveChapterIndex(ITEMS[0].chapters, 70), 0);
    assert.equal(findActiveChapterIndex(ITEMS[0].chapters, 200), 1);
});

test('builds the academic blockquote citation', () => {
    const markdown = buildMediaQuoteMarkdown(ITEMS[0], {
        id: 2,
        startTime: 99.29,
        endTime: 110,
        text: '  The body you see in the mirror\n is just a garment.  ',
        speaker: 'Dr. Rashad Khalifa',
    });

    assert.equal(
        markdown,
        '> "The body you see in the mirror is just a garment."\n' +
            '> — *Dr. Rashad Khalifa, [01:39](sa://media/video-program/what-is-life-all-about?t=99)*\n\n'
    );
});

test('falls back to the record author when a cue is unattributed', () => {
    const markdown = buildMediaQuoteMarkdown(ITEMS[0], CUES[0]);
    assert.match(markdown, /— \*Dr\. Rashad Khalifa, \[01:04\]/);
});

test('deep links floor to whole seconds', () => {
    assert.equal(mediaDeepLink('video-program/x', 99.9), 'sa://media/video-program/x?t=99');
    assert.equal(mediaDeepLink('video-program/x', -3), 'sa://media/video-program/x?t=0');
});

test('serializes timestamp nodes back to markdown', () => {
    assert.equal(
        serializeMediaTimestamp({ label: '01:39', seconds: 99, mediaId: 'video-program/what-is-life-all-about' }),
        '[01:39](sa://media/video-program/what-is-life-all-about?t=99)'
    );
    assert.equal(serializeMediaTimestamp({ label: '01:39', seconds: 99, mediaId: null }), '[01:39](#t=99)');
});
