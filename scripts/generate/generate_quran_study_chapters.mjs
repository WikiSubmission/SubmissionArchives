/**
 * Step 10: Generate Table of Contents (Chapter Markers) for Quran Study sessions (01-52).
 *
 * Uses Gemini API (with dotenv/.env.local GEMINI_API) and algorithmic fallback
 * to generate ~8-18 concise, timestamped chapters per session.
 *
 * Output: data/catalog/chapters/QS01.json ... QS52.json
 *
 * Run: node scripts/generate/generate_quran_study_chapters.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const TRANSCRIPTS_DIR = path.join(ROOT, 'data', 'sources', 'playlists', 'audio-transcripts');
const CATALOG_PATH = path.join(ROOT, 'data', 'catalog', 'audios.json');
const CHAPTERS_OUT_DIR = path.join(ROOT, 'data', 'catalog', 'chapters');

// Load environment variables from .env.local if present
function loadEnv() {
  const envLocalPath = path.join(ROOT, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}

loadEnv();

const API_KEY = process.env.GEMINI_API;
const MODEL = process.env.CHAPTER_MODEL || 'gemini-2.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Minimal RFC4180 CSV parser
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\r') continue;
    if (char === '\n') {
      row.push(field);
      if (row.some((c) => c.trim().length > 0)) rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim().length > 0)) rows.push(row);
  }
  return rows;
}

function parseTimestamp(value) {
  const match = (value || '').trim().match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (!match) return null;
  const [, h, m, s, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + (ms ? Number(`0.${ms}`) : 0);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

async function callGemini(prompt) {
  if (!API_KEY) return null;

  const generationConfig = {
    temperature: 0.2,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
          await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
          continue;
        }
        return null;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!rawText) return null;
      return JSON.parse(rawText);
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}

/**
 * Heuristic fallback chapter generator if Gemini is offline or rate-limited.
 * Uses verse citations, time windows (every ~3-5 min), and major speaker turns.
 */
function generateHeuristicChapters(segments, sessionTitle) {
  if (!segments.length) return [];

  const chapters = [];
  const totalDuration = segments[segments.length - 1].end;
  const targetCount = Math.max(6, Math.min(16, Math.round(totalDuration / 240))); // ~every 4 mins
  const windowSize = totalDuration / targetCount;

  let currentChapterStart = 0;
  let currentTitle = `Introduction & Opening Recitation`;
  let currentSpeaker = segments[0].speaker || 'Dr. Rashad Khalifa';
  let currentDesc = `Opening discussion and study for ${sessionTitle}.`;
  let lastVerse = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const timeSinceLast = seg.start - currentChapterStart;

    // Track verses
    if (seg.verseRefs) {
      lastVerse = seg.verseRefs;
    }

    if (timeSinceLast >= windowSize || i === segments.length - 1) {
      // Create chapter
      const nextTitle = lastVerse
        ? `Study of Sura ${lastVerse}`
        : seg.speaker && seg.speaker !== currentSpeaker
        ? `Discussion with ${seg.speaker}`
        : `Discussion & Reflections (${formatTime(currentChapterStart)})`;

      chapters.push({
        id: chapters.length + 1,
        startTime: Math.round(currentChapterStart * 10) / 10,
        endTime: Math.round(seg.end * 10) / 10,
        title: currentTitle,
        description: currentDesc,
        speaker: currentSpeaker,
      });

      currentChapterStart = seg.start;
      currentTitle = nextTitle;
      currentSpeaker = seg.speaker || currentSpeaker;
      currentDesc = `Continuation of Quranic study and questions at ${formatTime(seg.start)}.`;
    }
  }

  return chapters;
}

async function processSession(file, catalogEntry, qsNumber) {
  const outPath = path.join(CHAPTERS_OUT_DIR, `QS${String(qsNumber).padStart(2, '0')}.json`);
  if (fs.existsSync(outPath) && !process.argv.includes('--force')) {
    console.log(`  ⏩ QS ${String(qsNumber).padStart(2, '0')} already has chapters.`);
    return;
  }

  const csvContent = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf8');
  const rows = parseCsv(csvContent);
  if (rows.length < 2) return;

  const [header, ...body] = rows;
  const col = (name) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const startIdx = col('start time');
  const endIdx = col('end time');
  const textIdx = col('text');
  const speakerIdx = col('speaker');
  const verseRefsIdx = col('verserefs');

  const segments = [];
  for (const cells of body) {
    const start = parseTimestamp(cells[startIdx]);
    const end = parseTimestamp(cells[endIdx]);
    const text = (cells[textIdx] || '').trim();
    const speaker = (cells[speakerIdx] || '').trim();
    const verseRefs = verseRefsIdx >= 0 ? (cells[verseRefsIdx] || '').trim() : '';
    if (start !== null && end !== null && text) {
      segments.push({ start, end, text, speaker, verseRefs });
    }
  }

  if (!segments.length) return;

  const title = catalogEntry?.displayTitle || catalogEntry?.title || `Quran Study ${qsNumber}`;
  const totalDuration = segments[segments.length - 1].end;

  // Build condensed outline (sample segments every ~45s) for the prompt
  const sampled = [];
  let lastSampleTime = -999;
  for (const s of segments) {
    if (s.start - lastSampleTime >= 40 || s.verseRefs) {
      sampled.push(
        `[${formatTime(s.start)}] ${s.speaker ? s.speaker + ': ' : ''}${s.verseRefs ? '[Verse: ' + s.verseRefs + '] ' : ''}${s.text.slice(0, 90)}`
      );
      lastSampleTime = s.start;
    }
  }

  const prompt = `You are an expert editor creating a Table of Contents with 8 to 16 chapter markers for a recorded Quran study session by Dr. Rashad Khalifa.

Session Title: "${title}"
Total Duration: ${formatTime(totalDuration)}

Transcript Outline with Timestamps:
${sampled.join('\n')}

Generate a JSON array of 8 to 16 cohesive chapters. Each chapter must have:
- "id": sequential number starting at 1
- "startTime": exact timestamp in seconds (number, matching or close to an outline timestamp)
- "endTime": end timestamp in seconds (number)
- "title": concise, descriptive chapter title (e.g. "Sura 72:19-22 Discussion", "Nature of Jinns", "Question from Catherine", "Closing Reflections")
- "description": 1 concise sentence summarizing what is addressed in this section
- "speaker": main speaker name (e.g. "Dr. Rashad Khalifa", "Kathryn", etc.)

Return ONLY the JSON array.`;

  let chapters = await callGemini(prompt);

  // Validate or fallback
  if (!Array.isArray(chapters) || chapters.length < 4) {
    console.log(`  ℹ Using heuristic chapters for QS ${String(qsNumber).padStart(2, '0')}`);
    chapters = generateHeuristicChapters(segments, title, qsNumber);
  } else {
    // Ensure clean IDs, formatting, and monotonic timestamps
    chapters = chapters.map((c, idx) => ({
      id: idx + 1,
      startTime: typeof c.startTime === 'number' ? Math.max(0, c.startTime) : 0,
      endTime: typeof c.endTime === 'number' ? Math.min(totalDuration, c.endTime) : totalDuration,
      title: String(c.title || `Chapter ${idx + 1}`).trim(),
      description: String(c.description || '').trim(),
      speaker: String(c.speaker || 'Dr. Rashad Khalifa').trim(),
    }));
  }

  const payload = {
    id: catalogEntry?.id || `quran-study/${qsNumber}`,
    qsNumber,
    title,
    totalDuration,
    chapterCount: chapters.length,
    chapters,
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`  ✓ Generated ${chapters.length} chapters for QS ${String(qsNumber).padStart(2, '0')}`);
}

async function main() {
  if (!fs.existsSync(CHAPTERS_OUT_DIR)) {
    fs.mkdirSync(CHAPTERS_OUT_DIR, { recursive: true });
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const qsCatalog = catalog.filter((e) => e.type === 'quran-study');

  const files = fs
    .readdirSync(TRANSCRIPTS_DIR)
    .filter((f) => f.endsWith('.csv'))
    .sort();

  console.log(`Generating chapters for ${files.length} transcripts (1-52)...`);

  for (const file of files) {
    const match = file.match(/^(\d+)\s*-\s*/);
    if (!match) continue;
    const num = Number(match[1]);
    if (num < 1 || num > 52) continue;

    const catalogEntry = qsCatalog.find((e) => {
      const m = e.id.match(/^quran-study\/(\d+)/);
      return m && Number(m[1]) === num;
    });

    await processSession(file, catalogEntry, num);
  }

  console.log(`\nAll chapter sidecars written to ${CHAPTERS_OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
