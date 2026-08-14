// Proof-of-concept for Phase 1's contextualization step (Anthropic's Contextual
// Retrieval). Runs a handful of real chunks through Gemini Flash to check the
// blurb quality and exact latency/cost *before* committing to all 1,911 chunks.
import fs from 'node:fs';

const API_KEY = process.env.GEMINI_API;
// flash-lite has zero thinking-token overhead for this task (verified: gemini-3.6-flash
// spends ~285-480 mandatory tokens "thinking" about a task with no reasoning in it,
// making it ~18x more expensive here for no quality gain on this sample).
const MODEL = process.env.CONTEXT_MODEL || 'gemini-3.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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
    const prompt = buildPrompt({
        videoTitle: chunk.video_title,
        previousTail,
        chunkText: chunk.text,
    });

    // Gemini 3.x Flash thinks by default and can't fully disable it (thinkingLevel
    // 'low' is the floor, not off — the legacy thinkingBudget:0 is rejected outright
    // on this model family). Observed a near-fixed ~285-290 thinking tokens regardless
    // of task triviality, so the budget is sized well past that floor plus the answer.
    const generationConfig = { temperature: 0.2, maxOutputTokens: 700 };
    if (process.env.CONTEXT_THINKING_LEVEL) {
        generationConfig.thinkingConfig = { thinkingLevel: process.env.CONTEXT_THINKING_LEVEL };
    }

    const started = Date.now();
    // 429 (rate limit) and 503 (transient overload) both showed up within a 5-call
    // test — the real run over 1,911 chunks needs to ride these out, not abort on
    // the first one it hits.
    let response;
    for (let attempt = 0; attempt < 4; attempt++) {
        response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
        });
        if (response.ok || (response.status !== 429 && response.status !== 503)) break;
        await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    }
    const elapsedMs = Date.now() - started;

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '(no text returned)';
    const usage = data.usageMetadata;
    return {
        text,
        elapsedMs,
        promptTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
        thoughtsTokens: usage?.thoughtsTokenCount,
        finishReason: data.candidates?.[0]?.finishReason,
    };
}

async function main() {
    const { chunks } = JSON.parse(fs.readFileSync('data/sources/playlists/video-chunks.json', 'utf8'));
    const byVideo = new Map();
    for (const c of chunks) {
        if (!byVideo.has(c.video_id)) byVideo.set(c.video_id, []);
        byVideo.get(c.video_id).push(c);
    }

    // Deliberately varied sample: a video's first chunk (no prior context), a
    // middle chunk (has one), and the Arabic-heavy debate's opening chunk.
    const shortest = [...byVideo.values()].sort((a, b) => a.length - b.length)[0];
    const debate = [...byVideo.values()].find((v) => v[0].video_title.includes('Great Debate'));
    const lifeVideo = byVideo.get('video-program/what-is-life-all-about');

    const samples = [
        { chunk: lifeVideo[0], previousTail: null },
        { chunk: lifeVideo[2], previousTail: lifeVideo[1].text.slice(-150) },
        { chunk: shortest[shortest.length - 1], previousTail: shortest[shortest.length - 2]?.text.slice(-150) ?? null },
        { chunk: debate[0], previousTail: null },
        { chunk: debate[50], previousTail: debate[49].text.slice(-150) },
    ];

    for (const { chunk, previousTail } of samples) {
        // The free/subscription tier's per-minute rate limit is easy to hit back to
        // back; this is a 5-call POC, not the throughput the real run needs to manage.
        await new Promise((r) => setTimeout(r, 4000));
        const result = await contextualize(chunk, previousTail);
        console.log('='.repeat(70));
        console.log(`VIDEO: ${chunk.video_title}  (chunk ${chunk.chunk_index}, ${chunk.start_time}s)`);
        console.log(`ORIGINAL: ${chunk.text.slice(0, 160)}...`);
        console.log(`CONTEXT NOTE: ${result.text}`);
        console.log(`(${result.elapsedMs}ms, ${result.promptTokens} in / ${result.outputTokens} out / ${result.thoughtsTokens} thinking tokens, finish=${result.finishReason})`);
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
