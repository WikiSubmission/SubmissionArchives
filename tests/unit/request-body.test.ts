import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBodyWithLimit } from '../../src/lib/requestBody';

function chunkedRequest(chunks: string[]) {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
            controller.close();
        },
    });
    // No Content-Length header, as with a chunked upload.
    return new Request('http://localhost/api', { method: 'POST', body, duplex: 'half' } as RequestInit);
}

test('reads a body within the limit, including multi-byte text', async () => {
    assert.equal(await readBodyWithLimit(chunkedRequest(['{"q":', '"שלום"}']), 64), '{"q":"שלום"}');
    assert.equal(await readBodyWithLimit(new Request('http://localhost/api', { method: 'POST' }), 64), '');
});

test('stops at the byte limit even without a Content-Length header', async () => {
    assert.equal(await readBodyWithLimit(chunkedRequest(['a'.repeat(40), 'b'.repeat(40)]), 64), null);
    assert.equal(await readBodyWithLimit(chunkedRequest(['a'.repeat(64)]), 64), 'a'.repeat(64));
});
