// Kept free of `server-only` (like rateLimit.ts) so it can be unit-tested directly.

// Returns the body as UTF-8 text, or null once it exceeds maxBytes. Content-Length is
// absent on chunked requests, so the cap is enforced on the bytes actually received
// instead of buffering the whole body first.
export async function readBodyWithLimit(request: Request, maxBytes: number): Promise<string | null> {
    if (!request.body) return '';

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }

    return Buffer.concat(chunks).toString('utf8');
}
