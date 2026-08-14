// Phase 1, production run: contextualizes all chunks in video-chunks.json via
// Gemini (Anthropic's Contextual Retrieval technique) and writes
// video-chunks-contextualized.json alongside it.
//
// Model/config choices are load-bearing, not arbitrary — see
// contextualize_chunk_poc.mjs for how they were determined:
// - gemini-3.5-flash-lite, not 3.6-flash: the latter's mandatory "thinking" floor
//   burns ~285-480 tokens per call on a task that needs no reasoning, making it
//   ~18x more expensive here for no quality gain on the sampled chunks.
// - Interactive, not Batch API: batch is ~50% cheaper but has a SLA of up to 24h;
//   the absolute saving (~$0.22 across the whole corpus) isn't worth trading
//   predictable minutes-scale completion for an unbounded wait.
//
// Resumable by design: output is written incrementally, and a chunk already
// present in the output file is skipped on a re-run — so an interrupted run
// (network blip, Ctrl-C, rate-limit exhaustion) costs nothing to resume, it just
// picks up where it left off rather than re-paying for already-contextualized chunks.
import fs from 'node:fs';

const API_KEY = process.env.GEMINI_API;
const MODEL = process.env.CONTEXT_MODEL || 'gemini-3.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const CONCURRENCY = Number(process.env.CONTEXT_CONCURRENCY) || 4;
const LIMIT = process.env.CONTEXT_LIMIT ? Number(process.env.CONTEXT_LIMIT) : Infinity;

const INPUT_PATH = 'data/sources/playlists/video-chunks.json';
const OUTPUT_PATH = 'data/sources/playlists/video-chunks-contextualized.json';

if (!API_KEY) {
    console.error('GEMINI_API is not set in the environment.');
    process.exit(1);
}

function buildPrompt({ videoTitle, previousTail, chunkText }) {
    return `You are writing a short context note for a search index chunk, so that the
chunk is understandable in isolation. In 1-2 sentences, describe what this excerpt is
about and where it sits in the source. Do not summarize the whole video, just this
excerpt. Do not add information that is not in the text.

Video: "${videoTitle}"
${previousTail ? `Immediately preceding text: "...${previousTail}"\n` : '(This is the start of the video.)\n'}
Excerpt to contextualize:
"""
${chunkText}
"""

Write only the context note, nothing else.`;
}

async function contextualize(chunk, previousTail) {
    const prompt = buildPrompt({ videoTitle: chunk.video_title, previousTail, chunkText: chunk.text });
    const generationConfig = { temperature: 0.2, maxOutputTokens: 300 };

    let response;
    for (let attempt = 0; attempt < 5; attempt++) {
        response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
        });
        if (response.ok || (response.status !== 429 && response.status !== 503)) break;
        await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const finishReason = data.candidates?.[0]?.finishReason;
    if (!text || finishReason !== 'STOP') {
        throw new Error(`No usable text (finishReason=${finishReason})`);
    }

    const usage = data.usageMetadata;
    return { text, inputTokens: usage?.promptTokenCount ?? 0, outputTokens: usage?.candidatesTokenCount ?? 0 };
}

// A minimal concurrency-limited runner: `limit` workers pull from `items` until
// exhausted, rather than firing all requests at once (which just trades into the
// same 429s already observed) or running fully sequential (needlessly slow).
async function runWithConcurrency(items, limit, worker) {
    let cursor = 0;
    let completed = 0;
    const errors = [];

    async function runNext() {
        while (cursor < items.length) {
            const index = cursor++;
            try {
                await worker(items[index], index);
            } catch (error) {
                errors.push({ item: items[index], error: error.message });
            }
            completed++;
            if (completed % 50 === 0 || completed === items.length) {
                console.log(`progress: ${completed}/${items.length} (${errors.length} errors so far)`);
            }
        }
    }

    await Promise.all(Array.from({ length: limit }, runNext));
    return errors;
}

function loadExistingResults() {
    if (!fs.existsSync(OUTPUT_PATH)) return new Map();
    const { chunks } = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    return new Map(chunks.map((c) => [c.id, c]));
}

function main() {
    const { chunks: sourceChunks } = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
    const byVideo = new Map();
    for (const c of sourceChunks) {
        if (!byVideo.has(c.video_id)) byVideo.set(c.video_id, []);
        byVideo.get(c.video_id).push(c);
    }
    // Previous-chunk lookup for the "immediately preceding text" prompt field.
    const previousTextById = new Map();
    for (const rows of byVideo.values()) {
        rows.sort((a, b) => a.chunk_index - b.chunk_index);
        for (let i = 1; i < rows.length; i++) previousTextById.set(rows[i].id, rows[i - 1].text.slice(-150));
    }

    const results = loadExistingResults();
    const pending = sourceChunks.filter((c) => !results.has(c.id)).slice(0, LIMIT);

    console.log(`total=${sourceChunks.length} already-done=${results.size} pending=${pending.length} model=${MODEL} concurrency=${CONCURRENCY}`);
    if (pending.length === 0) {
        console.log('nothing to do.');
        return;
    }

    let inputTokens = 0;
    let outputTokens = 0;
    let sinceFlush = 0;

    const flush = () => {
        const chunks = sourceChunks
            .map((c) => results.get(c.id))
            .filter(Boolean);
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ chunks }, null, 2) + '\n', 'utf8');
    };

    return runWithConcurrency(pending, CONCURRENCY, async (chunk) => {
        const result = await contextualize(chunk, previousTextById.get(chunk.id) ?? null);
        inputTokens += result.inputTokens;
        outputTokens += result.outputTokens;

        results.set(chunk.id, {
            ...chunk,
            context_note: result.text,
            contextualized_text: `${result.text} ${chunk.text}`,
        });

        // Periodic flush rather than one write per chunk (1,911 disk writes is
        // wasteful) or only at the very end (an interruption would lose everything).
        sinceFlush++;
        if (sinceFlush >= 25) { flush(); sinceFlush = 0; }
    }).then((errors) => {
        flush();
        const inCost = (inputTokens / 1e6) * 0.30;
        const outCost = (outputTokens / 1e6) * 2.50;
        console.log(`done. contextualized=${pending.length - errors.length} errors=${errors.length}`);
        console.log(`tokens: in=${inputTokens} out=${outputTokens} | est. cost this run: $${(inCost + outCost).toFixed(3)}`);
        if (errors.length) {
            console.log('chunks that failed (re-run this script to retry just these):');
            errors.slice(0, 20).forEach((e) => console.log(`  ${e.item.id}: ${e.error}`));
        }
    });
}

main();
