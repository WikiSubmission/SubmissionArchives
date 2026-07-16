import type { AskStreamEvent } from '@/lib/rag/streamTypes';

export class AskRequestError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'AskRequestError';
        this.status = status;
    }
}

function parseSseBlock(block: string): AskStreamEvent | null {
    const normalized = block.replace(/\r/g, '');
    const lines = normalized.split('\n');

    const dataLines = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).replace(/^ /, ''));

    if (dataLines.length === 0) return null;

    const payload = dataLines.join('\n');
    const parsed = JSON.parse(payload) as AskStreamEvent;

    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
        throw new Error('The archive returned an invalid stream event.');
    }

    return parsed;
}

async function readErrorMessage(response: Response): Promise<string> {
    const raw = await response.text().catch(() => '');
    if (!raw) return `Request failed (${response.status})`;

    try {
        const parsed = JSON.parse(raw) as { error?: unknown };
        if (typeof parsed.error === 'string' && parsed.error.trim()) {
            return parsed.error;
        }
    } catch {
        // Fall through to the plain-text response.
    }

    return raw.slice(0, 500);
}

export async function streamAsk(
    question: string,
    onEvent: (event: AskStreamEvent) => void,
    signal: AbortSignal,
): Promise<void> {
    const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        cache: 'no-store',
        signal,
    });

    if (!response.ok || !response.body) {
        throw new AskRequestError(await readErrorMessage(response), response.status);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('text/event-stream')) {
        throw new AskRequestError('The archive returned an unexpected response format.', response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
                const block = buffer.slice(0, boundary);
                buffer = buffer.slice(boundary + 2);

                const event = parseSseBlock(block);
                if (event) onEvent(event);

                boundary = buffer.indexOf('\n\n');
            }
        }

        buffer += decoder.decode();

        if (buffer.trim()) {
            const event = parseSseBlock(buffer);
            if (event) onEvent(event);
        }
    } finally {
        reader.releaseLock();
    }
}
