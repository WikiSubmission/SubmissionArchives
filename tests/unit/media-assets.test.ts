import assert from 'node:assert/strict';
import test from 'node:test';
import { getAssetKey, getMediaPlaybackWindow, getPublicAssetUrl } from '../../src/lib/mediaAssets';

test('normalizes public asset keys', () => {
    assert.equal(getAssetKey('public\\content\\books\\Example.pdf'), 'content/books/Example.pdf');
    assert.equal(getAssetKey('/public/images/example.png'), 'images/example.png');
});

test('encodes each local path segment without double encoding', () => {
    assert.equal(
        getPublicAssetUrl('/content/books/Quran, Hadith, and Islam.pdf'),
        '/content/books/Quran%2C%20Hadith%2C%20and%20Islam.pdf',
    );
    assert.equal(
        getPublicAssetUrl("/content/books/The Computer Speaks God's Message.pdf"),
        '/content/books/The%20Computer%20Speaks%20God%27s%20Message.pdf',
    );
    assert.equal(getPublicAssetUrl('/content/already%20encoded.pdf'), '/content/already%20encoded.pdf');
});

test('preserves remote URLs', () => {
    assert.equal(getPublicAssetUrl('https://example.com/archive image.jpg'), 'https://example.com/archive image.jpg');
});

test('derives playback windows from explicit values and YouTube URLs', () => {
    assert.deepEqual(
        getMediaPlaybackWindow({ youtubeUrl: 'https://youtube.com/watch?v=x&t=1m30s', youtubeEndTime: 120 }),
        { startTime: 90, endTime: 120 },
    );
    assert.deepEqual(
        getMediaPlaybackWindow({ youtubeUrl: 'https://youtube.com/watch?v=x&t=20', youtubeStartTime: 45 }),
        { startTime: 45, endTime: 0 },
    );
});
