/**
 * Derives a short topic phrase for each Messenger Audio from the description already
 * generated for it, so the uniform title can carry a TOPIC segment like the Quran Studies
 * do. The topic is pulled from the description rather than invented, and every record in
 * one request so the phrasing stays consistent across the set.
 *
 * Writes data/catalog/audio-topics.json. Applying the titles is a separate step.
 *
 * Run: node scripts/generate/derive_audio_topics.mjs [--from 53] [--to 72]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, 'data', 'catalog', 'audios.json');
const OUT = path.join(ROOT, 'data', 'catalog', 'audio-topics.json');

function loadEnv() {
    const p = path.join(ROOT, '.env.local');
    if (!fs.existsSync(p)) return;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}
loadEnv();
const API_KEY = process.env.GEMINI_API;
if (!API_KEY) { console.error('GEMINI_API not set'); process.exit(1); }
const MODELS = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.7-flash'];

const arg = (name, dflt) => {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 ? Number(process.argv[i + 1]) : dflt;
};
const FROM = arg('from', 53);
const TO = arg('to', 72);

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const records = catalog
    .filter((x) => x.type === 'messenger-audio'
        && x.primaryNumber >= FROM && x.primaryNumber <= TO
        && (x.description || '').trim())
    .sort((a, b) => a.primaryNumber - b.primaryNumber);

if (!records.length) { console.error('no records with descriptions in range'); process.exit(1); }

const SYSTEM = `You name the single dominant subject of a recording, for use inside a catalog title.

Rules:
- 2 to 6 words. Title Case. A noun phrase, never a sentence.
- Draw it ONLY from the description given. Do not introduce anything the description
  does not state.
- Name the specific substantive theme, not the format. The format ("Friday Sermon",
  "Quran Study", "Zikr") is already elsewhere in the title, so never repeat it.
- Prefer the argument or claim over a bare verse reference. "Quran Times Hadith Equals
  Zero" is good; "Sura 9:120" is not.
- No trailing punctuation. No quotation marks.`;

const SCHEMA = {
    type: 'object',
    properties: {
        topics: {
            type: 'array',
            items: {
                type: 'object',
                properties: { number: { type: 'integer' }, topic: { type: 'string' } },
                required: ['number', 'topic'],
            },
        },
    },
    required: ['topics'],
};

const prompt = [
    'Give one topic for each numbered description below.',
    '',
    ...records.map((r) => `### ${r.primaryNumber}\n${r.description}`),
].join('\n');

async function call() {
    let last = null;
    for (const model of MODELS) {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-goog-api-key': API_KEY },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM }] },
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        responseMimeType: 'application/json',
                        responseSchema: SCHEMA,
                        maxOutputTokens: 8192,
                    },
                }),
            },
        );
        if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
            return { parsed: JSON.parse(text), model };
        }
        last = `${model}: HTTP ${res.status}`;
        console.log(`  ${last}, trying next model`);
    }
    throw new Error(last || 'all models failed');
}

const { parsed, model } = await call();
const byNum = new Map(parsed.topics.map((t) => [t.number, (t.topic || '').trim()]));

const out = {};
const missing = [];
for (const r of records) {
    const topic = byNum.get(r.primaryNumber);
    if (!topic) { missing.push(r.primaryNumber); continue; }
    out[`MA${r.primaryNumber}`] = topic;
}
fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`\nmodel ${model} | ${Object.keys(out).length} topic(s) -> ${path.relative(ROOT, OUT)}`);
for (const [k, v] of Object.entries(out)) console.log(`  ${k.padEnd(6)} ${v}`);
if (missing.length) console.error(`\nno topic returned for: ${missing.join(', ')}`);
