# Root Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/quran/roots`, a navigable 3D graph of Quranic Arabic roots and their derived words for chapters 1-10, rendered in the Submission Archives editorial style.

**Architecture:** A build-time script joins the two source CSVs into a static JSON graph (roots, words, verses, edges), validated for referential integrity. The client fetches that JSON, computes three deterministic layouts (constellation, verse-flow, root-tree) as pure functions, and renders them with Three.js using instanced meshes for performance, with a spatial-hash picker instead of per-object raycasting.

**Tech Stack:** Next.js 16 / React 19 (existing), Three.js (new dependency), plain `node:test` for unit tests, Playwright for e2e.

## Global Constraints

- Colors: only `--ed-bg`, `--ed-fg`, `--ed-fg-muted`, `--ed-accent`, `--ed-accent-soft`, `--ed-shadow-glow`. No new colors, no purple/cyan/neon gradients.
- Fonts: reuse `--font-arabic` (Amiri), `--font-display` (Superior Serif), `--font-body`/`--font-ui` (Libre Franklin), `--font-mono`. No new font files.
- No automatic/perpetual camera motion. Motion only in response to user input or explained state changes.
- Respect `prefers-reduced-motion`: inertia/damping disabled when it is set.
- Data scope: chapters 1-10 only (28,115 words in that range from the source CSVs).
- Root filtering: `root_word` values with 3 or 4 space-separated letters get their own root node. Values with 1-2 letters (grammatical particles) and 5-6 letters (data noise) are attached to one shared function-words cluster node instead of spawning individual root nodes.
- Interactive targets minimum 44x44 CSS pixels (existing accessibility rule).
- TDD for all pure logic (CSV parsing, graph building, validation, layouts, picking, camera math). WebGL rendering is verified manually and via Playwright, not unit-tested.

---

### Task 1: Shared CSV parsing utility

**Files:**
- Create: `scripts/lib/csv.mjs`
- Test: `tests/unit/csv.test.ts`

**Interfaces:**
- Produces: `parseCsvRows(text: string): string[][]`, `parseCsvObjects(text: string): Record<string, string>[]` — used by Task 2's generator and by `scripts/generate/generate_root_graph.mjs` in Task 4.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/csv.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCsvObjects, parseCsvRows } from '../../scripts/lib/csv.mjs';

test('splits simple comma-separated rows', () => {
    const rows = parseCsvRows('a,b,c\n1,2,3\n');
    assert.deepEqual(rows, [['a', 'b', 'c'], ['1', '2', '3']]);
});

test('keeps commas inside quoted fields intact', () => {
    const rows = parseCsvRows('name,note\nGod,"(of) God,"\n');
    assert.deepEqual(rows, [['name', 'note'], ['God', '(of) God,']]);
});

test('unescapes doubled quotes inside quoted fields', () => {
    const rows = parseCsvRows('word\n"He said ""stop"" then left"\n');
    assert.deepEqual(rows, [['word'], ['He said "stop" then left']]);
});

test('parses objects keyed by the header row', () => {
    const objects = parseCsvObjects('root_word,arabic\n"ر ح م",رحمة\n');
    assert.deepEqual(objects, [{ root_word: 'ر ح م', arabic: 'رحمة' }]);
});

test('drops a trailing blank line', () => {
    const rows = parseCsvRows('a,b\n1,2\n\n');
    assert.deepEqual(rows, [['a', 'b'], ['1', '2']]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --node-options=--import=tsx node --import tsx --test tests/unit/csv.test.ts`
Expected: FAIL with "Cannot find module '../../scripts/lib/csv.mjs'"

- [ ] **Step 3: Write the implementation**

```js
// scripts/lib/csv.mjs
export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((item) => item !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((item) => item !== '')) rows.push(row);
  return rows;
}

export function parseCsvObjects(text) {
  const rows = parseCsvRows(text.replace(/^﻿/, ''));
  if (!rows.length) return [];
  const headers = rows[0].map((value) => value.trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/csv.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/csv.mjs tests/unit/csv.test.ts
git commit -m "feat: add shared csv parsing utility"
```

---

### Task 2: Root graph builder (pure function)

**Files:**
- Create: `scripts/lib/root-graph-builder.mjs`
- Test: `tests/unit/root-graph-builder.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (takes plain row objects shaped like `parseCsvObjects` output).
- Produces: `buildRootGraph({ wordRows, chapterRange: { min, max } }): { roots, words, verses, edges, functionWordsRootId }` and the constant `FUNCTION_WORDS_ROOT_ID`. Every downstream task (generator in Task 4, TS types in Task 5) mirrors this exact shape:
  - `roots[]`: `{ id: string, rootWord: string | null, meanings: string | null, wordIds: string[] }`
  - `words[]`: `{ id: string, rootId: string, verseId: string, wordIndex: number, arabic: string, english: string, transliterated: string, chapterNumber: number, verseNumber: number }`
  - `verses[]`: `{ id: string, chapterNumber: number, verseNumber: number, wordIds: string[] }`
  - `edges[]`: `{ kind: 'root-word' | 'verse-sequence', from: string, to: string }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/root-graph-builder.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRootGraph, FUNCTION_WORDS_ROOT_ID } from '../../scripts/lib/root-graph-builder.mjs';

function row(overrides) {
    return {
        index: '1',
        verse_index: '1',
        verse_id: '1:1',
        word_index: '1',
        root_word: 'ر ح م',
        arabic: 'ٱلرَّحْمَـٰنِ',
        english: 'Most Gracious',
        transliterated: 'al-rahmani',
        meanings: 'to love; have mercy',
        chapter_number: '1',
        verse_number: '1',
        ...overrides,
    };
}

test('groups words by root word within the chapter range', () => {
    const rows = [
        row({ index: '1', word_index: '1', root_word: 'ر ح م' }),
        row({ index: '2', word_index: '2', root_word: 'ر ح م' }),
        row({ index: '3', word_index: '3', root_word: 'ع ل م' }),
    ];

    const graph = buildRootGraph({ wordRows: rows, chapterRange: { min: 1, max: 10 } });

    assert.equal(graph.roots.length, 2);
    const rahma = graph.roots.find((r) => r.id === 'ر ح م');
    assert.deepEqual(rahma.wordIds, ['1', '2']);
});

test('excludes chapters outside the requested range', () => {
    const rows = [row({ index: '1', chapter_number: '1' }), row({ index: '2', chapter_number: '25' })];

    const graph = buildRootGraph({ wordRows: rows, chapterRange: { min: 1, max: 10 } });

    assert.equal(graph.words.length, 1);
    assert.equal(graph.words[0].id, '1');
});

test('routes 1-2 letter grammatical particles to the shared function-words cluster', () => {
    const rows = [row({ index: '1', root_word: 'ف' }), row({ index: '2', root_word: 'ا ل' })];

    const graph = buildRootGraph({ wordRows: rows, chapterRange: { min: 1, max: 10 } });

    assert.equal(graph.roots.length, 1);
    assert.equal(graph.roots[0].id, FUNCTION_WORDS_ROOT_ID);
    assert.deepEqual(graph.roots[0].wordIds, ['1', '2']);
});

test('routes 5-6 letter noise entries to the shared function-words cluster', () => {
    const rows = [row({ index: '1', root_word: 'ا ب ج د هـ و' })];

    const graph = buildRootGraph({ wordRows: rows, chapterRange: { min: 1, max: 10 } });

    assert.equal(graph.roots[0].id, FUNCTION_WORDS_ROOT_ID);
});

test("orders each verse's word ids by word_index", () => {
    const rows = [
        row({ index: '10', verse_id: '1:2', word_index: '2' }),
        row({ index: '9', verse_id: '1:2', word_index: '1' }),
    ];

    const graph = buildRootGraph({ wordRows: rows, chapterRange: { min: 1, max: 10 } });

    const verse = graph.verses.find((v) => v.id === '1:2');
    assert.deepEqual(verse.wordIds, ['9', '10']);
});

test('produces root-word and verse-sequence edges', () => {
    const rows = [
        row({ index: '1', verse_id: '1:1', word_index: '1', root_word: 'ر ح م' }),
        row({ index: '2', verse_id: '1:1', word_index: '2', root_word: 'ر ح م' }),
    ];

    const graph = buildRootGraph({ wordRows: rows, chapterRange: { min: 1, max: 10 } });

    assert.deepEqual(
        graph.edges.filter((e) => e.kind === 'root-word'),
        [
            { kind: 'root-word', from: 'ر ح م', to: '1' },
            { kind: 'root-word', from: 'ر ح م', to: '2' },
        ],
    );
    assert.deepEqual(graph.edges.filter((e) => e.kind === 'verse-sequence'), [
        { kind: 'verse-sequence', from: '1', to: '2' },
    ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/root-graph-builder.test.ts`
Expected: FAIL with "Cannot find module '../../scripts/lib/root-graph-builder.mjs'"

- [ ] **Step 3: Write the implementation**

```js
// scripts/lib/root-graph-builder.mjs
const FUNCTION_WORDS_ROOT_ID = '__function_words__';

function rootLetterCount(rootWord) {
  return rootWord.trim().split(/\s+/).filter(Boolean).length;
}

export function buildRootGraph({ wordRows, chapterRange }) {
  const { min, max } = chapterRange;
  const rootsById = new Map();
  const words = [];
  const versesById = new Map();

  const scopedRows = wordRows
    .filter((row) => {
      const chapter = Number(row.chapter_number);
      return chapter >= min && chapter <= max;
    })
    .sort((a, b) => {
      if (a.verse_index !== b.verse_index) return Number(a.verse_index) - Number(b.verse_index);
      return Number(a.word_index) - Number(b.word_index);
    });

  for (const row of scopedRows) {
    const rootWord = row.root_word.trim();
    const letterCount = rootLetterCount(rootWord);
    const rootId = letterCount === 3 || letterCount === 4 ? rootWord : FUNCTION_WORDS_ROOT_ID;

    if (!rootsById.has(rootId)) {
      rootsById.set(rootId, {
        id: rootId,
        rootWord: rootId === FUNCTION_WORDS_ROOT_ID ? null : rootWord,
        meanings: rootId === FUNCTION_WORDS_ROOT_ID ? null : row.meanings,
        wordIds: [],
      });
    }

    const wordId = row.index;
    rootsById.get(rootId).wordIds.push(wordId);

    words.push({
      id: wordId,
      rootId,
      verseId: row.verse_id,
      wordIndex: Number(row.word_index),
      arabic: row.arabic,
      english: row.english,
      transliterated: row.transliterated,
      chapterNumber: Number(row.chapter_number),
      verseNumber: Number(row.verse_number),
    });

    if (!versesById.has(row.verse_id)) {
      versesById.set(row.verse_id, {
        id: row.verse_id,
        chapterNumber: Number(row.chapter_number),
        verseNumber: Number(row.verse_number),
        wordIds: [],
      });
    }
    versesById.get(row.verse_id).wordIds.push(wordId);
  }

  const roots = Array.from(rootsById.values());
  const verses = Array.from(versesById.values());
  const edges = [];

  for (const root of roots) {
    for (const wordId of root.wordIds) {
      edges.push({ kind: 'root-word', from: root.id, to: wordId });
    }
  }
  for (const verse of verses) {
    for (let i = 0; i < verse.wordIds.length - 1; i += 1) {
      edges.push({ kind: 'verse-sequence', from: verse.wordIds[i], to: verse.wordIds[i + 1] });
    }
  }

  return { roots, words, verses, edges, functionWordsRootId: FUNCTION_WORDS_ROOT_ID };
}

export { FUNCTION_WORDS_ROOT_ID };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/root-graph-builder.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/root-graph-builder.mjs tests/unit/root-graph-builder.test.ts
git commit -m "feat: add root graph builder"
```

---

### Task 3: Root graph validator (pure function)

**Files:**
- Create: `scripts/lib/validate-root-graph.mjs`
- Test: `tests/unit/validate-root-graph.test.ts`

**Interfaces:**
- Consumes: the graph shape produced by Task 2's `buildRootGraph`.
- Produces: `validateRootGraph(graph): { valid: boolean, errors: string[] }` — used by the validator script in Task 4.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/validate-root-graph.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRootGraph } from '../../scripts/lib/validate-root-graph.mjs';

function validGraph() {
    return {
        roots: [{ id: 'ر ح م', rootWord: 'ر ح م', meanings: 'mercy', wordIds: ['1'] }],
        words: [
            {
                id: '1',
                rootId: 'ر ح م',
                verseId: '1:1',
                wordIndex: 1,
                arabic: 'x',
                english: 'y',
                transliterated: 'z',
                chapterNumber: 1,
                verseNumber: 1,
            },
        ],
        verses: [{ id: '1:1', chapterNumber: 1, verseNumber: 1, wordIds: ['1'] }],
        edges: [{ kind: 'root-word', from: 'ر ح م', to: '1' }],
        functionWordsRootId: '__function_words__',
    };
}

test('accepts a well-formed graph', () => {
    const report = validateRootGraph(validGraph());
    assert.deepEqual(report, { valid: true, errors: [] });
});

test('flags a word that references a root that does not exist', () => {
    const graph = validGraph();
    graph.words[0].rootId = 'missing-root';

    const report = validateRootGraph(graph);

    assert.equal(report.valid, false);
    assert.match(report.errors[0], /missing root/);
});

test('flags duplicate word ids', () => {
    const graph = validGraph();
    graph.words.push({ ...graph.words[0] });

    const report = validateRootGraph(graph);

    assert.equal(report.valid, false);
    assert.match(report.errors.join(' '), /Duplicate word ids/);
});

test('flags an edge pointing at a missing node', () => {
    const graph = validGraph();
    graph.edges.push({ kind: 'verse-sequence', from: '1', to: '999' });

    const report = validateRootGraph(graph);

    assert.equal(report.valid, false);
    assert.match(report.errors.join(' '), /missing node/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/validate-root-graph.test.ts`
Expected: FAIL with "Cannot find module '../../scripts/lib/validate-root-graph.mjs'"

- [ ] **Step 3: Write the implementation**

```js
// scripts/lib/validate-root-graph.mjs
export function validateRootGraph(graph) {
  const errors = [];
  const rootIds = new Set(graph.roots.map((r) => r.id));
  const wordIds = new Set(graph.words.map((w) => w.id));
  const verseIds = new Set(graph.verses.map((v) => v.id));

  if (wordIds.size !== graph.words.length) errors.push('Duplicate word ids found.');
  if (rootIds.size !== graph.roots.length) errors.push('Duplicate root ids found.');
  if (verseIds.size !== graph.verses.length) errors.push('Duplicate verse ids found.');

  for (const word of graph.words) {
    if (!rootIds.has(word.rootId)) errors.push(`Word ${word.id} references missing root ${word.rootId}.`);
    if (!verseIds.has(word.verseId)) errors.push(`Word ${word.id} references missing verse ${word.verseId}.`);
  }

  for (const root of graph.roots) {
    for (const wordId of root.wordIds) {
      if (!wordIds.has(wordId)) errors.push(`Root ${root.id} references missing word ${wordId}.`);
    }
  }

  for (const verse of graph.verses) {
    for (const wordId of verse.wordIds) {
      if (!wordIds.has(wordId)) errors.push(`Verse ${verse.id} references missing word ${wordId}.`);
    }
  }

  for (const edge of graph.edges) {
    const fromExists = rootIds.has(edge.from) || wordIds.has(edge.from);
    const toExists = wordIds.has(edge.to);
    if (!fromExists || !toExists) errors.push(`Edge ${edge.kind} ${edge.from}->${edge.to} references a missing node.`);
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/validate-root-graph.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/validate-root-graph.mjs tests/unit/validate-root-graph.test.ts
git commit -m "feat: add root graph validator"
```

---

### Task 4: Generator and validator scripts, source data, package wiring

**Files:**
- Create: `data/corpus/quran_words.csv` (copy of `ws_quran_word_by_word_rows.csv`)
- Create: `data/corpus/quran_verses.csv` (copy of `ws_quran_text_rows.csv`)
- Create: `scripts/generate/generate_root_graph.mjs`
- Create: `scripts/validate/validate_root_graph.mjs`
- Create: `public/data/root-graph/ch1-10.json` (generated output, committed)
- Test: `tests/integration/root-graph.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `parseCsvObjects` (Task 1), `buildRootGraph` (Task 2), `validateRootGraph` (Task 3).
- Produces: the committed file `public/data/root-graph/ch1-10.json`, fetched by the client in Task 16 at `/data/root-graph/ch1-10.json`.

- [ ] **Step 1: Copy the source CSVs into the repo**

```bash
mkdir -p data/corpus
cp "/c/Users/Jonathan/Downloads/ws_quran_word_by_word_rows.csv" data/corpus/quran_words.csv
cp "/c/Users/Jonathan/Downloads/ws_quran_text_rows.csv" data/corpus/quran_verses.csv
```

- [ ] **Step 2: Write the generator script**

```js
// scripts/generate/generate_root_graph.mjs
import fs from 'node:fs';
import path from 'node:path';
import { parseCsvObjects } from '../lib/csv.mjs';
import { buildRootGraph } from '../lib/root-graph-builder.mjs';

const ROOT = process.cwd();
const WORDS_CSV = path.join(ROOT, 'data', 'corpus', 'quran_words.csv');
const OUTPUT_DIR = path.join(ROOT, 'public', 'data', 'root-graph');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ch1-10.json');
const CHAPTER_RANGE = { min: 1, max: 10 };

function main() {
  const wordRows = parseCsvObjects(fs.readFileSync(WORDS_CSV, 'utf8'));
  const graph = buildRootGraph({ wordRows, chapterRange: CHAPTER_RANGE });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graph));

  console.log(
    `Wrote ${path.relative(ROOT, OUTPUT_FILE)}: ${graph.roots.length} roots, ${graph.words.length} words, ` +
      `${graph.verses.length} verses, ${graph.edges.length} edges.`,
  );
}

main();
```

- [ ] **Step 3: Write the validator runner script**

```js
// scripts/validate/validate_root_graph.mjs
import fs from 'node:fs';
import path from 'node:path';
import { validateRootGraph } from '../lib/validate-root-graph.mjs';

const ROOT = process.cwd();
const GRAPH_PATH = path.join(ROOT, 'public', 'data', 'root-graph', 'ch1-10.json');

if (!fs.existsSync(GRAPH_PATH)) {
  throw new Error(
    `Missing generated root graph: ${path.relative(ROOT, GRAPH_PATH)}. Run npm run generate:root-graph first.`,
  );
}

const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
const report = validateRootGraph(graph);

if (!report.valid) {
  throw new Error(`Root graph failed validation:\n${report.errors.join('\n')}`);
}

console.log(`Root graph valid: ${graph.roots.length} roots, ${graph.words.length} words, ${graph.verses.length} verses.`);
```

- [ ] **Step 4: Add package.json scripts**

In `package.json`, inside `"scripts"`, add two entries (alongside the existing `"generate:catalog"` and `"validate:catalog"`-style entries):

```json
    "generate:root-graph": "node scripts/generate/generate_root_graph.mjs",
    "validate:root-graph": "node scripts/validate/validate_root_graph.mjs",
```

Also extend the `"test:unit"` script (it lists files explicitly) to include every new test file introduced in this plan:

```json
    "test:unit": "node --import tsx --test tests/unit/search-query.test.ts tests/unit/media-assets.test.ts tests/unit/transcript-utils.test.ts tests/unit/web-vitals.test.ts tests/unit/next-config-redirects.test.ts tests/unit/csv.test.ts tests/unit/root-graph-builder.test.ts tests/unit/validate-root-graph.test.ts tests/unit/rootGraph/parseRootGraph.test.ts tests/unit/rootGraph/prng.test.ts tests/unit/rootGraph/constellation.test.ts tests/unit/rootGraph/verseFlow.test.ts tests/unit/rootGraph/rootTree.test.ts tests/unit/rootGraph/picking.test.ts tests/unit/rootGraph/cameraMath.test.ts tests/integration/catalog.test.ts tests/integration/root-graph.test.ts",
```

And extend `"verify:deploy"` to validate the root graph alongside the catalog:

```json
    "verify:deploy": "npm ci --dry-run && npm run lint && npm run typecheck && npm test && npm run verify:catalog && npm run validate:root-graph && npm audit --omit=dev --audit-level=high && npm run build",
```

- [ ] **Step 5: Run the generator**

```bash
npm run generate:root-graph
```

Expected output: `Wrote public/data/root-graph/ch1-10.json: <N> roots, 28115 words, 1479 verses, <M> edges.`

- [ ] **Step 6: Write the integration test**

```ts
// tests/integration/root-graph.test.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { validateRootGraph } from '../../scripts/lib/validate-root-graph.mjs';

const graphPath = path.join(process.cwd(), 'public', 'data', 'root-graph', 'ch1-10.json');

if (!fs.existsSync(graphPath)) {
    throw new Error(`Missing generated root graph: ${path.relative(process.cwd(), graphPath)}`);
}

const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

test('the generated root graph passes referential integrity validation', () => {
    const report = validateRootGraph(graph);
    assert.equal(report.valid, true, report.errors.join('\n'));
});

test('covers exactly the words in chapters 1 through 10', () => {
    assert.equal(graph.words.length, 28115);
    assert.ok(graph.words.every((word) => word.chapterNumber >= 1 && word.chapterNumber <= 10));
});

test('collapses grammatical particles into a single function-words root', () => {
    const functionRoot = graph.roots.find((root) => root.id === graph.functionWordsRootId);
    assert.ok(functionRoot, 'expected a function-words root node');
    assert.equal(functionRoot.rootWord, null);
});

test('keeps root count well below the raw unique root_word count (particles collapsed)', () => {
    assert.ok(graph.roots.length > 100 && graph.roots.length < 1133);
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `node --import tsx --test tests/integration/root-graph.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 8: Commit**

```bash
git add data/corpus/quran_words.csv data/corpus/quran_verses.csv scripts/generate/generate_root_graph.mjs scripts/validate/validate_root_graph.mjs public/data/root-graph/ch1-10.json tests/integration/root-graph.test.ts package.json
git commit -m "feat: generate and validate the chapters 1-10 root graph"
```

---

### Task 5: Root graph TypeScript types and runtime parser

**Files:**
- Create: `src/lib/rootGraph/types.ts`
- Create: `src/lib/rootGraph/parseRootGraph.ts`
- Test: `tests/unit/rootGraph/parseRootGraph.test.ts`

**Interfaces:**
- Consumes: nothing (mirrors the JSON shape produced in Task 4).
- Produces: `RootNode`, `WordNode`, `VerseNode`, `GraphEdge`, `RootGraph` types, and `parseRootGraph(input: unknown): RootGraph`. Used by every remaining TypeScript task (layouts in Tasks 6-8, `RootExplorerClient` in Task 16).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/rootGraph/parseRootGraph.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRootGraph } from '../../../src/lib/rootGraph/parseRootGraph';

function validPayload() {
    return {
        roots: [{ id: 'ر ح م', rootWord: 'ر ح م', meanings: 'mercy', wordIds: ['1'] }],
        words: [
            {
                id: '1',
                rootId: 'ر ح م',
                verseId: '1:1',
                wordIndex: 1,
                arabic: 'x',
                english: 'y',
                transliterated: 'z',
                chapterNumber: 1,
                verseNumber: 1,
            },
        ],
        verses: [{ id: '1:1', chapterNumber: 1, verseNumber: 1, wordIds: ['1'] }],
        edges: [{ kind: 'root-word', from: 'ر ح م', to: '1' }],
        functionWordsRootId: '__function_words__',
    };
}

test('parses a well-formed payload', () => {
    const graph = parseRootGraph(validPayload());
    assert.equal(graph.roots.length, 1);
    assert.equal(graph.words[0].wordIndex, 1);
});

test('rejects a payload missing the roots array', () => {
    const payload = validPayload() as Record<string, unknown>;
    delete payload.roots;
    assert.throws(() => parseRootGraph(payload), /missing roots array/);
});

test('rejects a word node with a non-numeric wordIndex', () => {
    const payload = validPayload();
    // @ts-expect-error deliberately invalid for the test
    payload.words[0].wordIndex = 'first';
    assert.throws(() => parseRootGraph(payload), /numeric wordIndex/);
});

test('rejects an edge with an unknown kind', () => {
    const payload = validPayload();
    // @ts-expect-error deliberately invalid for the test
    payload.edges[0].kind = 'mystery';
    assert.throws(() => parseRootGraph(payload), /unknown kind/);
});

test('rejects a non-object input', () => {
    assert.throws(() => parseRootGraph(null), /must be an object/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/rootGraph/parseRootGraph.test.ts`
Expected: FAIL with "Cannot find module '../../../src/lib/rootGraph/parseRootGraph'"

- [ ] **Step 3: Write the types**

```ts
// src/lib/rootGraph/types.ts
export interface RootNode {
    id: string;
    rootWord: string | null;
    meanings: string | null;
    wordIds: string[];
}

export interface WordNode {
    id: string;
    rootId: string;
    verseId: string;
    wordIndex: number;
    arabic: string;
    english: string;
    transliterated: string;
    chapterNumber: number;
    verseNumber: number;
}

export interface VerseNode {
    id: string;
    chapterNumber: number;
    verseNumber: number;
    wordIds: string[];
}

export type GraphEdge =
    | { kind: 'root-word'; from: string; to: string }
    | { kind: 'verse-sequence'; from: string; to: string };

export interface RootGraph {
    roots: RootNode[];
    words: WordNode[];
    verses: VerseNode[];
    edges: GraphEdge[];
    functionWordsRootId: string;
}
```

- [ ] **Step 4: Write the parser**

```ts
// src/lib/rootGraph/parseRootGraph.ts
import type { GraphEdge, RootGraph, RootNode, VerseNode, WordNode } from './types';

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function isStringOrNull(value: unknown): value is string | null {
    return value === null || typeof value === 'string';
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(isString);
}

function parseRootNode(value: unknown): RootNode {
    if (typeof value !== 'object' || value === null) throw new Error('Root node must be an object.');
    const node = value as Record<string, unknown>;
    if (!isString(node.id)) throw new Error('Root node missing string id.');
    if (!isStringOrNull(node.rootWord)) throw new Error(`Root ${node.id} has an invalid rootWord.`);
    if (!isStringOrNull(node.meanings)) throw new Error(`Root ${node.id} has invalid meanings.`);
    if (!isStringArray(node.wordIds)) throw new Error(`Root ${node.id} has invalid wordIds.`);
    return { id: node.id, rootWord: node.rootWord, meanings: node.meanings, wordIds: node.wordIds };
}

function parseWordNode(value: unknown): WordNode {
    if (typeof value !== 'object' || value === null) throw new Error('Word node must be an object.');
    const node = value as Record<string, unknown>;
    if (!isString(node.id)) throw new Error('Word node missing string id.');
    if (!isString(node.rootId)) throw new Error(`Word ${node.id} missing rootId.`);
    if (!isString(node.verseId)) throw new Error(`Word ${node.id} missing verseId.`);
    if (!isNumber(node.wordIndex)) throw new Error(`Word ${node.id} missing numeric wordIndex.`);
    if (!isString(node.arabic)) throw new Error(`Word ${node.id} missing arabic text.`);
    if (!isString(node.english)) throw new Error(`Word ${node.id} missing english text.`);
    if (!isString(node.transliterated)) throw new Error(`Word ${node.id} missing transliterated text.`);
    if (!isNumber(node.chapterNumber)) throw new Error(`Word ${node.id} missing chapterNumber.`);
    if (!isNumber(node.verseNumber)) throw new Error(`Word ${node.id} missing verseNumber.`);
    return {
        id: node.id,
        rootId: node.rootId,
        verseId: node.verseId,
        wordIndex: node.wordIndex,
        arabic: node.arabic,
        english: node.english,
        transliterated: node.transliterated,
        chapterNumber: node.chapterNumber,
        verseNumber: node.verseNumber,
    };
}

function parseVerseNode(value: unknown): VerseNode {
    if (typeof value !== 'object' || value === null) throw new Error('Verse node must be an object.');
    const node = value as Record<string, unknown>;
    if (!isString(node.id)) throw new Error('Verse node missing string id.');
    if (!isNumber(node.chapterNumber)) throw new Error(`Verse ${node.id} missing chapterNumber.`);
    if (!isNumber(node.verseNumber)) throw new Error(`Verse ${node.id} missing verseNumber.`);
    if (!isStringArray(node.wordIds)) throw new Error(`Verse ${node.id} has invalid wordIds.`);
    return { id: node.id, chapterNumber: node.chapterNumber, verseNumber: node.verseNumber, wordIds: node.wordIds };
}

function parseEdge(value: unknown): GraphEdge {
    if (typeof value !== 'object' || value === null) throw new Error('Edge must be an object.');
    const edge = value as Record<string, unknown>;
    if (edge.kind !== 'root-word' && edge.kind !== 'verse-sequence') {
        throw new Error(`Edge has unknown kind: ${String(edge.kind)}.`);
    }
    if (!isString(edge.from) || !isString(edge.to)) throw new Error('Edge missing from/to.');
    return { kind: edge.kind, from: edge.from, to: edge.to };
}

export function parseRootGraph(input: unknown): RootGraph {
    if (typeof input !== 'object' || input === null) throw new Error('Root graph must be an object.');
    const value = input as Record<string, unknown>;
    if (!Array.isArray(value.roots)) throw new Error('Root graph missing roots array.');
    if (!Array.isArray(value.words)) throw new Error('Root graph missing words array.');
    if (!Array.isArray(value.verses)) throw new Error('Root graph missing verses array.');
    if (!Array.isArray(value.edges)) throw new Error('Root graph missing edges array.');
    if (!isString(value.functionWordsRootId)) throw new Error('Root graph missing functionWordsRootId.');

    return {
        roots: value.roots.map(parseRootNode),
        words: value.words.map(parseWordNode),
        verses: value.verses.map(parseVerseNode),
        edges: value.edges.map(parseEdge),
        functionWordsRootId: value.functionWordsRootId,
    };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/rootGraph/parseRootGraph.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/rootGraph/types.ts src/lib/rootGraph/parseRootGraph.ts tests/unit/rootGraph/parseRootGraph.test.ts
git commit -m "feat: add root graph types and runtime parser"
```

---

### Task 6: Seeded PRNG and constellation layout

**Files:**
- Create: `src/lib/rootGraph/prng.ts`
- Create: `src/lib/rootGraph/layouts/types.ts`
- Create: `src/lib/rootGraph/layouts/constellation.ts`
- Test: `tests/unit/rootGraph/prng.test.ts`
- Test: `tests/unit/rootGraph/constellation.test.ts`

**Interfaces:**
- Consumes: `RootGraph` from Task 5.
- Produces: `createSeededRandom(seed: number): () => number`; `Vec3`, `LayoutResult` types; `computeConstellationLayout(graph: RootGraph): LayoutResult`. `LayoutResult` (`{ rootPositions: Record<string, Vec3>, wordPositions: Record<string, Vec3> }`) is the shape every layout in Tasks 7-8 and `RootScene` (Task 13) consumes.

**Note on scale:** the repulsion pass below is O(roots²) per iteration. At ~900 roots (chapters 1-10) this is fast. At the full-corpus scale (~6,000 roots) this would need a spatial partitioning approach instead of pairwise comparison — out of scope for this plan, but worth knowing before naively raising `CHAPTER_RANGE` later.

- [ ] **Step 1: Write the failing PRNG test**

```ts
// tests/unit/rootGraph/prng.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeededRandom } from '../../../src/lib/rootGraph/prng';

test('produces the same sequence for the same seed', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test('produces values within [0, 1)', () => {
    const random = createSeededRandom(7);
    for (let i = 0; i < 100; i += 1) {
        const value = random();
        assert.ok(value >= 0 && value < 1);
    }
});

test('produces a different sequence for a different seed', () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);
    assert.notEqual(a(), b());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/rootGraph/prng.test.ts`
Expected: FAIL with "Cannot find module '../../../src/lib/rootGraph/prng'"

- [ ] **Step 3: Write the PRNG**

```ts
// src/lib/rootGraph/prng.ts
export function createSeededRandom(seed: number): () => number {
    let state = seed >>> 0 || 1;
    return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        return state / 4294967296;
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/rootGraph/prng.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the shared layout types**

```ts
// src/lib/rootGraph/layouts/types.ts
export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface LayoutResult {
    rootPositions: Record<string, Vec3>;
    wordPositions: Record<string, Vec3>;
}
```

- [ ] **Step 6: Write the failing constellation layout test**

```ts
// tests/unit/rootGraph/constellation.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { computeConstellationLayout } from '../../../src/lib/rootGraph/layouts/constellation';
import type { RootGraph } from '../../../src/lib/rootGraph/types';

function sampleGraph(): RootGraph {
    return {
        roots: [
            { id: 'root-a', rootWord: 'ر ح م', meanings: 'mercy', wordIds: ['w1', 'w2'] },
            { id: 'root-b', rootWord: 'ع ل م', meanings: 'knowledge', wordIds: ['w3'] },
        ],
        words: [
            {
                id: 'w1',
                rootId: 'root-a',
                verseId: '1:1',
                wordIndex: 1,
                arabic: 'a',
                english: 'a',
                transliterated: 'a',
                chapterNumber: 1,
                verseNumber: 1,
            },
            {
                id: 'w2',
                rootId: 'root-a',
                verseId: '1:1',
                wordIndex: 2,
                arabic: 'b',
                english: 'b',
                transliterated: 'b',
                chapterNumber: 1,
                verseNumber: 1,
            },
            {
                id: 'w3',
                rootId: 'root-b',
                verseId: '1:2',
                wordIndex: 1,
                arabic: 'c',
                english: 'c',
                transliterated: 'c',
                chapterNumber: 1,
                verseNumber: 2,
            },
        ],
        verses: [
            { id: '1:1', chapterNumber: 1, verseNumber: 1, wordIds: ['w1', 'w2'] },
            { id: '1:2', chapterNumber: 1, verseNumber: 2, wordIds: ['w3'] },
        ],
        edges: [],
        functionWordsRootId: '__function_words__',
    };
}

test('places every root and word', () => {
    const layout = computeConstellationLayout(sampleGraph());
    assert.equal(Object.keys(layout.rootPositions).length, 2);
    assert.equal(Object.keys(layout.wordPositions).length, 3);
});

test('produces finite coordinates for every node', () => {
    const layout = computeConstellationLayout(sampleGraph());
    for (const position of [...Object.values(layout.rootPositions), ...Object.values(layout.wordPositions)]) {
        assert.ok(Number.isFinite(position.x));
        assert.ok(Number.isFinite(position.y));
        assert.ok(Number.isFinite(position.z));
    }
});

test('is deterministic across runs', () => {
    const first = computeConstellationLayout(sampleGraph());
    const second = computeConstellationLayout(sampleGraph());
    assert.deepEqual(first, second);
});

test('keeps a word closer to its own root than to an unrelated root', () => {
    const layout = computeConstellationLayout(sampleGraph());
    const distanceTo = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

    const distanceToOwnRoot = distanceTo(layout.wordPositions.w1, layout.rootPositions['root-a']);
    const distanceToOtherRoot = distanceTo(layout.wordPositions.w1, layout.rootPositions['root-b']);

    assert.ok(distanceToOwnRoot < distanceToOtherRoot);
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/rootGraph/constellation.test.ts`
Expected: FAIL with "Cannot find module '../../../src/lib/rootGraph/layouts/constellation'"

- [ ] **Step 8: Write the constellation layout**

```ts
// src/lib/rootGraph/layouts/constellation.ts
import type { RootGraph } from '../types';
import { createSeededRandom } from '../prng';
import type { LayoutResult, Vec3 } from './types';

const ROOT_SHELL_RADIUS = 40;
const WORD_ORBIT_RADIUS = 6;
const REPULSION_ITERATIONS = 30;
const REPULSION_STRENGTH = 4;
const SEED = 20260722;

function goldenSpherePoint(index: number, total: number): Vec3 {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (index / Math.max(total - 1, 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * index;
    return { x: Math.cos(theta) * radiusAtY, y, z: Math.sin(theta) * radiusAtY };
}

function scale(vector: Vec3, factor: number): Vec3 {
    return { x: vector.x * factor, y: vector.y * factor, z: vector.z * factor };
}

function add(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtract(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function length(vector: Vec3): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

function applyRootRepulsion(positions: Vec3[]): Vec3[] {
    let next = positions;
    for (let iteration = 0; iteration < REPULSION_ITERATIONS; iteration += 1) {
        const displacements = next.map(() => ({ x: 0, y: 0, z: 0 }));
        for (let i = 0; i < next.length; i += 1) {
            for (let j = i + 1; j < next.length; j += 1) {
                const delta = subtract(next[i], next[j]);
                const distance = Math.max(length(delta), 0.01);
                const push = scale(delta, REPULSION_STRENGTH / (distance * distance * distance));
                displacements[i] = add(displacements[i], push);
                displacements[j] = subtract(displacements[j], push);
            }
        }
        next = next.map((position, index) => add(position, scale(displacements[index], 0.02)));
    }
    return next;
}

export function computeConstellationLayout(graph: RootGraph): LayoutResult {
    const random = createSeededRandom(SEED);
    const rootIds = graph.roots.map((root) => root.id);

    const initialRootPositions = rootIds.map((_, index) =>
        scale(goldenSpherePoint(index, rootIds.length), ROOT_SHELL_RADIUS),
    );
    const settledRootPositions = applyRootRepulsion(initialRootPositions);

    const rootPositions: Record<string, Vec3> = {};
    rootIds.forEach((id, index) => {
        rootPositions[id] = settledRootPositions[index];
    });

    const wordPositions: Record<string, Vec3> = {};
    for (const root of graph.roots) {
        const center = rootPositions[root.id];
        root.wordIds.forEach((wordId, wordOrder) => {
            const direction = goldenSpherePoint(wordOrder, Math.max(root.wordIds.length, 1));
            const jitter = { x: (random() - 0.5) * 0.6, y: (random() - 0.5) * 0.6, z: (random() - 0.5) * 0.6 };
            wordPositions[wordId] = add(center, add(scale(direction, WORD_ORBIT_RADIUS), jitter));
        });
    }

    return { rootPositions, wordPositions };
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/rootGraph/constellation.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 10: Commit**

```bash
git add src/lib/rootGraph/prng.ts src/lib/rootGraph/layouts/types.ts src/lib/rootGraph/layouts/constellation.ts tests/unit/rootGraph/prng.test.ts tests/unit/rootGraph/constellation.test.ts
git commit -m "feat: add seeded prng and constellation layout"
```

---

### Task 7: Verse-flow layout

**Files:**
- Create: `src/lib/rootGraph/layouts/verseFlow.ts`
- Test: `tests/unit/rootGraph/verseFlow.test.ts`

**Interfaces:**
- Consumes: `RootGraph` (Task 5), `LayoutResult`/`Vec3` (Task 6).
- Produces: `computeVerseFlowLayout(graph: RootGraph): LayoutResult`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/rootGraph/verseFlow.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { computeVerseFlowLayout } from '../../../src/lib/rootGraph/layouts/verseFlow';
import type { RootGraph } from '../../../src/lib/rootGraph/types';

function sampleGraph(): RootGraph {
    return {
        roots: [{ id: 'root-a', rootWord: 'ر ح م', meanings: 'mercy', wordIds: ['w1', 'w2', 'w3'] }],
        words: [
            {
                id: 'w1',
                rootId: 'root-a',
                verseId: '1:1',
                wordIndex: 1,
                arabic: 'a',
                english: 'a',
                transliterated: 'a',
                chapterNumber: 1,
                verseNumber: 1,
            },
            {
                id: 'w2',
                rootId: 'root-a',
                verseId: '1:1',
                wordIndex: 2,
                arabic: 'b',
                english: 'b',
                transliterated: 'b',
                chapterNumber: 1,
                verseNumber: 1,
            },
            {
                id: 'w3',
                rootId: 'root-a',
                verseId: '1:2',
                wordIndex: 1,
                arabic: 'c',
                english: 'c',
                transliterated: 'c',
                chapterNumber: 1,
                verseNumber: 2,
            },
        ],
        verses: [
            { id: '1:1', chapterNumber: 1, verseNumber: 1, wordIds: ['w1', 'w2'] },
            { id: '1:2', chapterNumber: 1, verseNumber: 2, wordIds: ['w3'] },
        ],
        edges: [],
        functionWordsRootId: '__function_words__',
    };
}

test('orders words within a verse left to right by word index', () => {
    const layout = computeVerseFlowLayout(sampleGraph());
    assert.ok(layout.wordPositions.w1.x < layout.wordPositions.w2.x);
});

test('stacks later verses below earlier ones', () => {
    const layout = computeVerseFlowLayout(sampleGraph());
    assert.ok(layout.wordPositions.w3.y < layout.wordPositions.w1.y);
});

test('places every root and word with finite coordinates', () => {
    const layout = computeVerseFlowLayout(sampleGraph());
    for (const position of [...Object.values(layout.rootPositions), ...Object.values(layout.wordPositions)]) {
        assert.ok(Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z));
    }
});

test('is deterministic across runs', () => {
    const first = computeVerseFlowLayout(sampleGraph());
    const second = computeVerseFlowLayout(sampleGraph());
    assert.deepEqual(first, second);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/rootGraph/verseFlow.test.ts`
Expected: FAIL with "Cannot find module '../../../src/lib/rootGraph/layouts/verseFlow'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/rootGraph/layouts/verseFlow.ts
import type { RootGraph } from '../types';
import type { LayoutResult, Vec3 } from './types';

const VERSE_SPACING = 8;
const WORD_SPACING = 3;
const ARC_DEPTH = 2;

export function computeVerseFlowLayout(graph: RootGraph): LayoutResult {
    const wordById = new Map(graph.words.map((word) => [word.id, word]));
    const orderedVerses = [...graph.verses].sort((a, b) =>
        a.chapterNumber !== b.chapterNumber ? a.chapterNumber - b.chapterNumber : a.verseNumber - b.verseNumber,
    );

    const wordPositions: Record<string, Vec3> = {};
    const rootWordPositions = new Map<string, Vec3[]>();

    orderedVerses.forEach((verse, verseOrder) => {
        const y = -verseOrder * VERSE_SPACING;
        const wordCount = Math.max(verse.wordIds.length - 1, 1);
        verse.wordIds.forEach((wordId, wordOrder) => {
            const progress = verse.wordIds.length > 1 ? wordOrder / wordCount : 0.5;
            const x = (progress - 0.5) * WORD_SPACING * verse.wordIds.length;
            const z = Math.sin(progress * Math.PI) * ARC_DEPTH;
            const position = { x, y, z };
            wordPositions[wordId] = position;

            const word = wordById.get(wordId);
            if (word) {
                const bucket = rootWordPositions.get(word.rootId) ?? [];
                bucket.push(position);
                rootWordPositions.set(word.rootId, bucket);
            }
        });
    });

    const rootPositions: Record<string, Vec3> = {};
    for (const root of graph.roots) {
        const positions = rootWordPositions.get(root.id) ?? [{ x: 0, y: 0, z: 0 }];
        const centroid = positions.reduce(
            (sum, position) => ({ x: sum.x + position.x, y: sum.y + position.y, z: sum.z + position.z }),
            { x: 0, y: 0, z: 0 },
        );
        rootPositions[root.id] = {
            x: centroid.x / positions.length,
            y: centroid.y / positions.length,
            z: centroid.z / positions.length - ARC_DEPTH,
        };
    }

    return { rootPositions, wordPositions };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/rootGraph/verseFlow.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/rootGraph/layouts/verseFlow.ts tests/unit/rootGraph/verseFlow.test.ts
git commit -m "feat: add verse-flow layout"
```

---

### Task 8: Root-tree layout

**Files:**
- Create: `src/lib/rootGraph/layouts/rootTree.ts`
- Test: `tests/unit/rootGraph/rootTree.test.ts`

**Interfaces:**
- Consumes: `RootGraph`, `RootNode` (Task 5), `LayoutResult`/`Vec3` (Task 6).
- Produces: `computeRootTreeLayout(graph: RootGraph): LayoutResult`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/rootGraph/rootTree.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { computeRootTreeLayout } from '../../../src/lib/rootGraph/layouts/rootTree';
import type { RootGraph } from '../../../src/lib/rootGraph/types';

function sampleGraph(): RootGraph {
    return {
        roots: [
            { id: 'ر ح م', rootWord: 'ر ح م', meanings: 'mercy', wordIds: ['w1'] },
            { id: 'ر ز ق', rootWord: 'ر ز ق', meanings: 'provision', wordIds: ['w2'] },
            { id: 'ع ل م', rootWord: 'ع ل م', meanings: 'knowledge', wordIds: ['w3'] },
        ],
        words: [
            {
                id: 'w1',
                rootId: 'ر ح م',
                verseId: '1:1',
                wordIndex: 1,
                arabic: 'a',
                english: 'a',
                transliterated: 'a',
                chapterNumber: 1,
                verseNumber: 1,
            },
            {
                id: 'w2',
                rootId: 'ر ز ق',
                verseId: '1:1',
                wordIndex: 2,
                arabic: 'b',
                english: 'b',
                transliterated: 'b',
                chapterNumber: 1,
                verseNumber: 1,
            },
            {
                id: 'w3',
                rootId: 'ع ل م',
                verseId: '1:1',
                wordIndex: 3,
                arabic: 'c',
                english: 'c',
                transliterated: 'c',
                chapterNumber: 1,
                verseNumber: 1,
            },
        ],
        verses: [{ id: '1:1', chapterNumber: 1, verseNumber: 1, wordIds: ['w1', 'w2', 'w3'] }],
        edges: [],
        functionWordsRootId: '__function_words__',
    };
}

test('places every root and word with finite coordinates', () => {
    const layout = computeRootTreeLayout(sampleGraph());
    for (const position of [...Object.values(layout.rootPositions), ...Object.values(layout.wordPositions)]) {
        assert.ok(Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z));
    }
});

test('groups roots that share a first radical closer together than roots that do not', () => {
    const layout = computeRootTreeLayout(sampleGraph());
    const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

    const withinGroup = distance(layout.rootPositions['ر ح م'], layout.rootPositions['ر ز ق']);
    const acrossGroup = distance(layout.rootPositions['ر ح م'], layout.rootPositions['ع ل م']);

    assert.ok(withinGroup < acrossGroup);
});

test('is deterministic across runs', () => {
    const first = computeRootTreeLayout(sampleGraph());
    const second = computeRootTreeLayout(sampleGraph());
    assert.deepEqual(first, second);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/rootGraph/rootTree.test.ts`
Expected: FAIL with "Cannot find module '../../../src/lib/rootGraph/layouts/rootTree'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/rootGraph/layouts/rootTree.ts
import type { RootGraph, RootNode } from '../types';
import type { LayoutResult, Vec3 } from './types';

const GROUP_RADIUS = 50;
const ROOT_BRANCH_LENGTH = 12;
const WORD_LEAF_LENGTH = 5;

function firstRadical(root: RootNode, functionWordsRootId: string): string {
    if (root.id === functionWordsRootId || !root.rootWord) return 'فنون';
    return root.rootWord.trim().split(/\s+/)[0] ?? root.id;
}

export function computeRootTreeLayout(graph: RootGraph): LayoutResult {
    const groups = new Map<string, RootNode[]>();
    for (const root of graph.roots) {
        const key = firstRadical(root, graph.functionWordsRootId);
        const bucket = groups.get(key) ?? [];
        bucket.push(root);
        groups.set(key, bucket);
    }

    const groupKeys = Array.from(groups.keys()).sort();
    const rootPositions: Record<string, Vec3> = {};
    const wordPositions: Record<string, Vec3> = {};

    groupKeys.forEach((key, groupIndex) => {
        const angle = (groupIndex / groupKeys.length) * Math.PI * 2;
        const trunk = { x: Math.cos(angle) * GROUP_RADIUS, y: 0, z: Math.sin(angle) * GROUP_RADIUS };
        const rootsInGroup = groups.get(key) ?? [];

        rootsInGroup.forEach((root, rootIndex) => {
            const branchY = (rootIndex - (rootsInGroup.length - 1) / 2) * ROOT_BRANCH_LENGTH;
            const rootPosition = {
                x: trunk.x + Math.cos(angle) * ROOT_BRANCH_LENGTH,
                y: branchY,
                z: trunk.z + Math.sin(angle) * ROOT_BRANCH_LENGTH,
            };
            rootPositions[root.id] = rootPosition;

            root.wordIds.forEach((wordId, wordIndex) => {
                const leafAngle = angle + ((wordIndex + 1) / (root.wordIds.length + 1) - 0.5) * 0.6;
                wordPositions[wordId] = {
                    x: rootPosition.x + Math.cos(leafAngle) * WORD_LEAF_LENGTH,
                    y: rootPosition.y + (wordIndex % 2 === 0 ? 1 : -1) * 1.5,
                    z: rootPosition.z + Math.sin(leafAngle) * WORD_LEAF_LENGTH,
                };
            });
        });
    });

    return { rootPositions, wordPositions };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/rootGraph/rootTree.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/rootGraph/layouts/rootTree.ts tests/unit/rootGraph/rootTree.test.ts
git commit -m "feat: add root-tree layout"
```

---

### Task 9: Spatial-hash picking

**Files:**
- Create: `src/lib/rootGraph/picking.ts`
- Test: `tests/unit/rootGraph/picking.test.ts`

**Interfaces:**
- Produces: `ScreenPoint` (`{ id: string, x: number, y: number }`), `SpatialHash`, `buildSpatialHash(points: ScreenPoint[], cellSize: number): SpatialHash`, `pickNearest(hash: SpatialHash, target: { x: number, y: number }, maxDistance: number): string | null`. Used by `RootScene` in Task 13.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/rootGraph/picking.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSpatialHash, pickNearest } from '../../../src/lib/rootGraph/picking';

test('finds the nearest point within range', () => {
    const hash = buildSpatialHash(
        [
            { id: 'a', x: 10, y: 10 },
            { id: 'b', x: 100, y: 100 },
        ],
        20,
    );

    assert.equal(pickNearest(hash, { x: 12, y: 11 }, 15), 'a');
});

test('returns null when nothing is within maxDistance', () => {
    const hash = buildSpatialHash([{ id: 'a', x: 10, y: 10 }], 20);
    assert.equal(pickNearest(hash, { x: 500, y: 500 }, 15), null);
});

test('picks the closer of two candidates in neighboring cells', () => {
    const hash = buildSpatialHash(
        [
            { id: 'near', x: 19, y: 19 },
            { id: 'far', x: 21, y: 21 },
        ],
        20,
    );

    assert.equal(pickNearest(hash, { x: 20, y: 20 }, 5), 'near');
});

test('scales to thousands of points without throwing', () => {
    const points = Array.from({ length: 5000 }, (_, index) => ({
        id: `p${index}`,
        x: (index * 37) % 2000,
        y: (index * 53) % 2000,
    }));
    const hash = buildSpatialHash(points, 25);
    const result = pickNearest(hash, { x: 1000, y: 1000 }, 30);
    assert.ok(result === null || points.some((p) => p.id === result));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/rootGraph/picking.test.ts`
Expected: FAIL with "Cannot find module '../../../src/lib/rootGraph/picking'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/rootGraph/picking.ts
export interface ScreenPoint {
    id: string;
    x: number;
    y: number;
}

export interface SpatialHash {
    cellSize: number;
    cells: Map<string, ScreenPoint[]>;
}

function cellKey(x: number, y: number, cellSize: number): string {
    return `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;
}

export function buildSpatialHash(points: ScreenPoint[], cellSize: number): SpatialHash {
    const cells = new Map<string, ScreenPoint[]>();
    for (const point of points) {
        const key = cellKey(point.x, point.y, cellSize);
        const bucket = cells.get(key) ?? [];
        bucket.push(point);
        cells.set(key, bucket);
    }
    return { cellSize, cells };
}

export function pickNearest(hash: SpatialHash, target: { x: number; y: number }, maxDistance: number): string | null {
    const centerCellX = Math.floor(target.x / hash.cellSize);
    const centerCellY = Math.floor(target.y / hash.cellSize);

    let bestId: string | null = null;
    let bestDistance = maxDistance;

    for (let cellX = centerCellX - 1; cellX <= centerCellX + 1; cellX += 1) {
        for (let cellY = centerCellY - 1; cellY <= centerCellY + 1; cellY += 1) {
            const bucket = hash.cells.get(`${cellX}:${cellY}`);
            if (!bucket) continue;
            for (const point of bucket) {
                const distance = Math.hypot(point.x - target.x, point.y - target.y);
                if (distance <= bestDistance) {
                    bestDistance = distance;
                    bestId = point.id;
                }
            }
        }
    }

    return bestId;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/rootGraph/picking.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/rootGraph/picking.ts tests/unit/rootGraph/picking.test.ts
git commit -m "feat: add spatial-hash node picking"
```

---

### Task 10: Camera orbit math

**Files:**
- Create: `src/lib/rootGraph/cameraMath.ts`
- Test: `tests/unit/rootGraph/cameraMath.test.ts`

**Interfaces:**
- Produces: `OrbitState` (`{ azimuth, polar, azimuthVelocity, polarVelocity }`), `applyOrbitDrag(state, deltaX, deltaY, sensitivity): OrbitState`, `stepOrbitInertia(state): OrbitState`, `isOrbitSettled(state, threshold?): boolean`, `clampZoom(distance, min, max): number`. Used by `RootScene` in Task 13.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/rootGraph/cameraMath.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { applyOrbitDrag, clampZoom, isOrbitSettled, stepOrbitInertia } from '../../../src/lib/rootGraph/cameraMath';

test('a drag sets velocity proportional to sensitivity', () => {
    const state = { azimuth: 0, polar: 1, azimuthVelocity: 0, polarVelocity: 0 };
    const next = applyOrbitDrag(state, 10, -4, 0.01);
    assert.equal(next.azimuthVelocity, 0.1);
    assert.equal(next.polarVelocity, -0.04);
});

test('inertia decays velocity each step and eventually settles', () => {
    let state = { azimuth: 0, polar: 1, azimuthVelocity: 0.5, polarVelocity: 0 };
    for (let i = 0; i < 200; i += 1) {
        state = stepOrbitInertia(state);
    }
    assert.ok(isOrbitSettled(state));
});

test('clamps polar angle away from the poles', () => {
    const state = { azimuth: 0, polar: 3, azimuthVelocity: 0, polarVelocity: 10 };
    const next = stepOrbitInertia(state);
    assert.ok(next.polar <= Math.PI - 0.15);
});

test('clamps zoom distance within bounds', () => {
    assert.equal(clampZoom(500, 10, 100), 100);
    assert.equal(clampZoom(-5, 10, 100), 10);
    assert.equal(clampZoom(50, 10, 100), 50);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/rootGraph/cameraMath.test.ts`
Expected: FAIL with "Cannot find module '../../../src/lib/rootGraph/cameraMath'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/rootGraph/cameraMath.ts
export interface OrbitState {
    azimuth: number;
    polar: number;
    azimuthVelocity: number;
    polarVelocity: number;
}

const DAMPING = 0.9;
const MIN_POLAR = 0.15;
const MAX_POLAR = Math.PI - 0.15;

export function applyOrbitDrag(state: OrbitState, deltaX: number, deltaY: number, sensitivity: number): OrbitState {
    return {
        ...state,
        azimuthVelocity: deltaX * sensitivity,
        polarVelocity: deltaY * sensitivity,
    };
}

export function stepOrbitInertia(state: OrbitState): OrbitState {
    const azimuth = state.azimuth + state.azimuthVelocity;
    const polar = Math.min(MAX_POLAR, Math.max(MIN_POLAR, state.polar + state.polarVelocity));
    return {
        azimuth,
        polar,
        azimuthVelocity: state.azimuthVelocity * DAMPING,
        polarVelocity: state.polarVelocity * DAMPING,
    };
}

export function isOrbitSettled(state: OrbitState, threshold = 0.0001): boolean {
    return Math.abs(state.azimuthVelocity) < threshold && Math.abs(state.polarVelocity) < threshold;
}

export function clampZoom(distance: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, distance));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/rootGraph/cameraMath.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/rootGraph/cameraMath.ts tests/unit/rootGraph/cameraMath.test.ts
git commit -m "feat: add camera orbit inertia math"
```

---

### Task 11: Add the Three.js dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the dependency**

```bash
npm install three@^0.180.0
npm install --save-dev @types/three@^0.180.0
```

- [ ] **Step 2: Verify the project still typechecks and builds**

Run: `npm run typecheck`
Expected: PASS, no errors related to `three`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three.js dependency"
```

---

### Task 12: Theme color resolution helper

**Files:**
- Create: `src/app/quran/roots/theme.ts`

**Interfaces:**
- Produces: `ThemeColors` (`{ accent, accentSoft, fg, fgMuted, bg }`, each `[number, number, number]` in the 0-1 range), `resolveThemeColors(): ThemeColors`. Used by `RootScene` in Task 13.
- This module reads `getComputedStyle` and a `<canvas>` element, so it only runs in the browser. It has no unit test — verified manually in Task 13's manual check and by the Playwright test in Task 18.

- [ ] **Step 1: Write the implementation**

```ts
// src/app/quran/roots/theme.ts
export interface ThemeColors {
    accent: [number, number, number];
    accentSoft: [number, number, number];
    fg: [number, number, number];
    fgMuted: [number, number, number];
    bg: [number, number, number];
}

function resolveCssColor(cssValue: string): [number, number, number] {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) return [1, 1, 1];
    context.fillStyle = cssValue;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
}

function readCssVariable(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function resolveThemeColors(): ThemeColors {
    return {
        accent: resolveCssColor(readCssVariable('--ed-accent')),
        accentSoft: resolveCssColor(readCssVariable('--ed-accent-soft')),
        fg: resolveCssColor(readCssVariable('--ed-fg')),
        fgMuted: resolveCssColor(readCssVariable('--ed-fg-muted')),
        bg: resolveCssColor(readCssVariable('--ed-bg')),
    };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/quran/roots/theme.ts
git commit -m "feat: resolve archive theme colors for the root scene"
```

---

### Task 13: RootScene Three.js component

**Files:**
- Create: `src/app/quran/roots/RootScene.tsx`

**Interfaces:**
- Consumes: `RootGraph` (Task 5), `LayoutResult` (Task 6), `buildSpatialHash`/`pickNearest`/`ScreenPoint` (Task 9), `applyOrbitDrag`/`stepOrbitInertia`/`clampZoom`/`OrbitState` (Task 10), `resolveThemeColors` (Task 12).
- Produces: `HoveredNode` (`{ id: string, kind: 'root' | 'word', screenX: number, screenY: number }`) and the default-exported `RootScene` component with props `{ graph, layout, reducedMotion, onHoverNode, onSelectNode }`. Consumed by `RootExplorerClient` in Task 16.

This component has no unit test (it requires a live WebGL canvas). It is verified manually in Step 2 below and by the Playwright test in Task 18.

- [ ] **Step 1: Write the implementation**

```tsx
// src/app/quran/roots/RootScene.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { RootGraph } from '@/lib/rootGraph/types';
import type { LayoutResult } from '@/lib/rootGraph/layouts/types';
import { buildSpatialHash, pickNearest, type ScreenPoint } from '@/lib/rootGraph/picking';
import { applyOrbitDrag, clampZoom, stepOrbitInertia, type OrbitState } from '@/lib/rootGraph/cameraMath';
import { resolveThemeColors } from './theme';

export interface HoveredNode {
    id: string;
    kind: 'root' | 'word';
    screenX: number;
    screenY: number;
}

interface RootSceneProps {
    graph: RootGraph;
    layout: LayoutResult;
    reducedMotion: boolean;
    onHoverNode: (node: HoveredNode | null) => void;
    onSelectNode: (nodeId: string, kind: 'root' | 'word') => void;
}

const ORBIT_SENSITIVITY = 0.005;
const MIN_ZOOM = 20;
const MAX_ZOOM = 220;
const PICK_RADIUS = 18;
const DRAG_CLICK_THRESHOLD = 6;

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

export default function RootScene({ graph, layout, reducedMotion, onHoverNode, onSelectNode }: RootSceneProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const colors = resolveThemeColors();
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const wordIds = graph.words.map((word) => word.id);
        const rootIds = graph.roots.map((root) => root.id);

        const wordGeometry = new THREE.SphereGeometry(0.6, 8, 8);
        const wordMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 });
        const wordMesh = new THREE.InstancedMesh(wordGeometry, wordMaterial, wordIds.length);

        const rootGeometry = new THREE.SphereGeometry(1.6, 16, 16);
        const rootMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(...colors.accent) });
        const rootMesh = new THREE.InstancedMesh(rootGeometry, rootMaterial, rootIds.length);

        const rootHaloGeometry = new THREE.SphereGeometry(2.6, 16, 16);
        const rootHaloMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(...colors.accentSoft),
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
        });
        const rootHaloMesh = new THREE.InstancedMesh(rootHaloGeometry, rootHaloMaterial, rootIds.length);

        const dummy = new THREE.Object3D();
        const verseTintPalette = [colors.accent, colors.accentSoft, colors.fgMuted];

        wordIds.forEach((id, index) => {
            const position = layout.wordPositions[id];
            if (!position) return;
            dummy.position.set(position.x, position.y, position.z);
            dummy.updateMatrix();
            wordMesh.setMatrixAt(index, dummy.matrix);
            const word = graph.words[index];
            const tint = verseTintPalette[Math.abs(hashString(word.verseId)) % verseTintPalette.length];
            wordMesh.setColorAt(index, new THREE.Color(...tint));
        });
        wordMesh.instanceMatrix.needsUpdate = true;
        if (wordMesh.instanceColor) wordMesh.instanceColor.needsUpdate = true;

        rootIds.forEach((id, index) => {
            const position = layout.rootPositions[id];
            if (!position) return;
            dummy.position.set(position.x, position.y, position.z);
            dummy.updateMatrix();
            rootMesh.setMatrixAt(index, dummy.matrix);
            rootHaloMesh.setMatrixAt(index, dummy.matrix);
        });
        rootMesh.instanceMatrix.needsUpdate = true;
        rootHaloMesh.instanceMatrix.needsUpdate = true;

        const edgePositions = new Float32Array(graph.edges.length * 6);
        let edgeCount = 0;
        for (const edge of graph.edges) {
            const from = layout.rootPositions[edge.from] ?? layout.wordPositions[edge.from];
            const to = layout.wordPositions[edge.to];
            if (!from || !to) continue;
            const offset = edgeCount * 6;
            edgePositions[offset] = from.x;
            edgePositions[offset + 1] = from.y;
            edgePositions[offset + 2] = from.z;
            edgePositions[offset + 3] = to.x;
            edgePositions[offset + 4] = to.y;
            edgePositions[offset + 5] = to.z;
            edgeCount += 1;
        }
        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions.subarray(0, edgeCount * 6), 3));
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(...colors.fgMuted),
            transparent: true,
            opacity: 0.25,
        });
        const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);

        // Three.js frustum-culls each mesh as a whole automatically; at chapters-1-10 scale that's
        // sufficient. Per-instance distance fade is the mechanism to add before lifting CHAPTER_RANGE
        // toward the full corpus (see Task 6's note on the constellation layout's O(roots^2) pass).
        scene.add(wordMesh, rootHaloMesh, rootMesh, edgeLines);

        let orbit: OrbitState = { azimuth: Math.PI / 4, polar: Math.PI / 3, azimuthVelocity: 0, polarVelocity: 0 };
        let zoomDistance = 120;
        let isDragging = false;
        let dragDistance = 0;
        let lastPointer = { x: 0, y: 0 };

        function updateCameraFromOrbit() {
            camera.position.set(
                zoomDistance * Math.sin(orbit.polar) * Math.cos(orbit.azimuth),
                zoomDistance * Math.cos(orbit.polar),
                zoomDistance * Math.sin(orbit.polar) * Math.sin(orbit.azimuth),
            );
            camera.lookAt(0, 0, 0);
        }
        updateCameraFromOrbit();

        function resize() {
            const width = container.clientWidth;
            const height = container.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / Math.max(height, 1);
            camera.updateProjectionMatrix();
        }
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        function screenPointFor(id: string, position: { x: number; y: number; z: number }): ScreenPoint | null {
            const projected = new THREE.Vector3(position.x, position.y, position.z).project(camera);
            if (projected.z > 1) return null;
            const width = container.clientWidth;
            const height = container.clientHeight;
            return {
                id,
                x: (projected.x * 0.5 + 0.5) * width,
                y: (-projected.y * 0.5 + 0.5) * height,
            };
        }

        function buildPickHash() {
            const points: ScreenPoint[] = [];
            for (const root of graph.roots) {
                const position = layout.rootPositions[root.id];
                if (!position) continue;
                const point = screenPointFor(`root:${root.id}`, position);
                if (point) points.push(point);
            }
            for (const word of graph.words) {
                const position = layout.wordPositions[word.id];
                if (!position) continue;
                const point = screenPointFor(`word:${word.id}`, position);
                if (point) points.push(point);
            }
            return buildSpatialHash(points, PICK_RADIUS);
        }

        function pickAt(clientX: number, clientY: number): HoveredNode | null {
            const rect = container.getBoundingClientRect();
            const target = { x: clientX - rect.left, y: clientY - rect.top };
            const hash = buildPickHash();
            const hit = pickNearest(hash, target, PICK_RADIUS);
            if (!hit) return null;
            const [kind, id] = hit.split(':') as ['root' | 'word', string];
            return { id, kind, screenX: target.x, screenY: target.y };
        }

        function handlePointerDown(event: PointerEvent) {
            isDragging = true;
            dragDistance = 0;
            lastPointer = { x: event.clientX, y: event.clientY };
            container.setPointerCapture(event.pointerId);
        }

        function handlePointerMove(event: PointerEvent) {
            if (isDragging) {
                const deltaX = event.clientX - lastPointer.x;
                const deltaY = event.clientY - lastPointer.y;
                dragDistance += Math.hypot(deltaX, deltaY);
                orbit = applyOrbitDrag(orbit, -deltaX, -deltaY, ORBIT_SENSITIVITY);
                orbit = {
                    ...orbit,
                    azimuth: orbit.azimuth + orbit.azimuthVelocity,
                    polar: orbit.polar + orbit.polarVelocity,
                };
                if (reducedMotion) orbit = { ...orbit, azimuthVelocity: 0, polarVelocity: 0 };
                updateCameraFromOrbit();
                lastPointer = { x: event.clientX, y: event.clientY };
                onHoverNode(null);
                return;
            }
            onHoverNode(pickAt(event.clientX, event.clientY));
        }

        function handlePointerUp(event: PointerEvent) {
            isDragging = false;
            container.releasePointerCapture(event.pointerId);
            if (dragDistance < DRAG_CLICK_THRESHOLD) {
                const hit = pickAt(event.clientX, event.clientY);
                if (hit) onSelectNode(hit.id, hit.kind);
            }
            if (reducedMotion) orbit = { ...orbit, azimuthVelocity: 0, polarVelocity: 0 };
        }

        function handleWheel(event: WheelEvent) {
            event.preventDefault();
            zoomDistance = clampZoom(zoomDistance + event.deltaY * 0.1, MIN_ZOOM, MAX_ZOOM);
            updateCameraFromOrbit();
        }

        container.addEventListener('pointerdown', handlePointerDown);
        container.addEventListener('pointermove', handlePointerMove);
        container.addEventListener('pointerup', handlePointerUp);
        container.addEventListener('wheel', handleWheel, { passive: false });

        let animationFrame = 0;
        function animate() {
            if (!isDragging && !reducedMotion) {
                orbit = stepOrbitInertia(orbit);
                updateCameraFromOrbit();
            }
            renderer.render(scene, camera);
            animationFrame = requestAnimationFrame(animate);
        }
        animate();

        return () => {
            cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            container.removeEventListener('pointerdown', handlePointerDown);
            container.removeEventListener('pointermove', handlePointerMove);
            container.removeEventListener('pointerup', handlePointerUp);
            container.removeEventListener('wheel', handleWheel);
            wordGeometry.dispose();
            wordMaterial.dispose();
            rootGeometry.dispose();
            rootMaterial.dispose();
            rootHaloGeometry.dispose();
            rootHaloMaterial.dispose();
            edgeGeometry.dispose();
            edgeMaterial.dispose();
            renderer.dispose();
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [graph, layout, reducedMotion, onHoverNode, onSelectNode]);

    return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
```

- [ ] **Step 2: Manual verification (no automated test for this step)**

This step is completed once `RootExplorerClient` (Task 16) and `page.tsx` (Task 17) exist and wire this component in. Revisit it then:

```bash
npm run dev
```

Navigate to `http://localhost:3000/quran/roots` and confirm: a canvas renders with visible root and word points, dragging rotates the view with inertia, scrolling zooms, hovering a node calls back (visible once Task 14's tooltip is wired), and no errors appear in the browser console.

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/quran/roots/RootScene.tsx
git commit -m "feat: render the root graph with instanced three.js meshes"
```

---

### Task 14: NodeTooltip and DetailPanel components

**Files:**
- Create: `src/app/quran/roots/NodeTooltip.tsx`
- Create: `src/app/quran/roots/DetailPanel.tsx`

**Interfaces:**
- Consumes: `RootGraph`, `RootNode` (Task 5), `HoveredNode` (Task 13).
- Produces: default-exported `NodeTooltip` (props `{ node: HoveredNode | null, graph: RootGraph }`) and `DetailPanel` (props `{ root: RootNode, graph: RootGraph, onClose: () => void }`). Consumed by `RootExplorerClient` in Task 16.

- [ ] **Step 1: Write NodeTooltip**

```tsx
// src/app/quran/roots/NodeTooltip.tsx
'use client';

import type { RootGraph } from '@/lib/rootGraph/types';
import type { HoveredNode } from './RootScene';

interface NodeTooltipProps {
    node: HoveredNode | null;
    graph: RootGraph;
}

export default function NodeTooltip({ node, graph }: NodeTooltipProps) {
    if (!node) return null;

    if (node.kind === 'root') {
        const root = graph.roots.find((candidate) => candidate.id === node.id);
        if (!root) return null;
        return (
            <div
                className="pointer-events-none absolute z-10 max-w-[220px] border border-ed-rule bg-ed-bg px-3 py-2 text-sm shadow-[var(--ed-shadow-glow)]"
                style={{ left: node.screenX + 12, top: node.screenY + 12 }}
            >
                <p dir="rtl" className="font-arabic text-lg text-ed-fg">
                    {root.rootWord ?? 'Function words'}
                </p>
                <p className="mt-1 font-body text-xs text-ed-fg-muted">{root.wordIds.length} derived words</p>
            </div>
        );
    }

    const word = graph.words.find((candidate) => candidate.id === node.id);
    if (!word) return null;
    return (
        <div
            className="pointer-events-none absolute z-10 max-w-[220px] border border-ed-rule bg-ed-bg px-3 py-2 text-sm shadow-[var(--ed-shadow-glow)]"
            style={{ left: node.screenX + 12, top: node.screenY + 12 }}
        >
            <p dir="rtl" className="font-arabic text-lg text-ed-fg">
                {word.arabic}
            </p>
            <p className="mt-1 font-body text-xs text-ed-fg-muted">{word.english}</p>
            <p className="font-mono text-[11px] text-ed-fg-muted">{word.transliterated}</p>
        </div>
    );
}
```

- [ ] **Step 2: Write DetailPanel**

```tsx
// src/app/quran/roots/DetailPanel.tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { RootGraph, RootNode } from '@/lib/rootGraph/types';

interface DetailPanelProps {
    root: RootNode;
    graph: RootGraph;
    onClose: () => void;
}

export default function DetailPanel({ root, graph, onClose }: DetailPanelProps) {
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        closeButtonRef.current?.focus();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const words = graph.words.filter((word) => word.rootId === root.id);
    const verseIds = Array.from(new Set(words.map((word) => word.verseId)));

    return (
        <aside className="absolute inset-y-0 right-0 z-20 w-full max-w-sm overflow-y-auto border-l border-ed-rule bg-ed-bg p-6">
            <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close root detail panel"
                className="flex h-11 w-11 items-center justify-center border border-ed-rule text-ed-fg hover:border-ed-accent hover:text-ed-accent"
            >
                <X className="h-5 w-5" />
            </button>

            <h2 dir="rtl" className="mt-4 font-display font-arabic text-3xl text-ed-fg">
                {root.rootWord ?? 'Function words'}
            </h2>
            {root.meanings && <p className="mt-3 font-body text-sm leading-7 text-ed-fg-muted">{root.meanings}</p>}

            <h3 className="mt-6 font-ui text-xs font-semibold uppercase tracking-wide text-ed-fg-muted">
                Derived words ({words.length})
            </h3>
            <ul className="mt-3 space-y-3">
                {words.map((word) => (
                    <li key={word.id} className="border-b border-ed-rule pb-3">
                        <p dir="rtl" className="font-arabic text-xl text-ed-fg">
                            {word.arabic}
                        </p>
                        <p className="font-body text-sm text-ed-fg-muted">{word.english}</p>
                        <p className="font-mono text-[11px] text-ed-fg-muted">{word.transliterated}</p>
                    </li>
                ))}
            </ul>

            <h3 className="mt-6 font-ui text-xs font-semibold uppercase tracking-wide text-ed-fg-muted">
                Appears in ({verseIds.length} verses)
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
                {verseIds.map((verseId) => {
                    const [chapter, verse] = verseId.split(':');
                    return (
                        <li key={verseId}>
                            <Link
                                href={`/quran/${chapter}?verse=${verse}`}
                                className="inline-flex min-h-11 items-center border border-ed-rule px-3 font-mono text-xs text-ed-fg hover:border-ed-accent hover:text-ed-accent"
                            >
                                {verseId}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/quran/roots/NodeTooltip.tsx src/app/quran/roots/DetailPanel.tsx
git commit -m "feat: add node tooltip and root detail panel"
```

---

### Task 15: LayoutSwitcher and AccessibleNodeList components

**Files:**
- Create: `src/app/quran/roots/LayoutSwitcher.tsx`
- Create: `src/app/quran/roots/AccessibleNodeList.tsx`

**Interfaces:**
- Produces: `LayoutMode` (`'constellation' | 'verse-flow' | 'root-tree'`), default-exported `LayoutSwitcher` (props `{ mode: LayoutMode, onChange: (mode: LayoutMode) => void }`) and `AccessibleNodeList` (props `{ graph: RootGraph, onSelectRoot: (rootId: string) => void }`). Consumed by `RootExplorerClient` in Task 16.

- [ ] **Step 1: Write LayoutSwitcher**

```tsx
// src/app/quran/roots/LayoutSwitcher.tsx
'use client';

export type LayoutMode = 'constellation' | 'verse-flow' | 'root-tree';

interface LayoutSwitcherProps {
    mode: LayoutMode;
    onChange: (mode: LayoutMode) => void;
}

const OPTIONS: Array<{ mode: LayoutMode; label: string }> = [
    { mode: 'constellation', label: 'Constellation' },
    { mode: 'verse-flow', label: 'Verse flow' },
    { mode: 'root-tree', label: 'Root tree' },
];

export default function LayoutSwitcher({ mode, onChange }: LayoutSwitcherProps) {
    return (
        <div
            role="group"
            aria-label="Layout mode"
            className="absolute left-4 top-4 z-10 flex gap-1 border border-ed-rule bg-ed-bg/90 p-1"
        >
            {OPTIONS.map((option) => (
                <button
                    key={option.mode}
                    type="button"
                    aria-pressed={mode === option.mode}
                    onClick={() => onChange(option.mode)}
                    className={`min-h-11 px-3 font-ui text-xs ${
                        mode === option.mode ? 'bg-ed-accent text-ed-bg' : 'text-ed-fg-muted hover:text-ed-fg'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
```

- [ ] **Step 2: Write AccessibleNodeList**

```tsx
// src/app/quran/roots/AccessibleNodeList.tsx
'use client';

import type { RootGraph } from '@/lib/rootGraph/types';

interface AccessibleNodeListProps {
    graph: RootGraph;
    onSelectRoot: (rootId: string) => void;
}

export default function AccessibleNodeList({ graph, onSelectRoot }: AccessibleNodeListProps) {
    return (
        <ul className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:inset-0 focus-within:z-30 focus-within:overflow-y-auto focus-within:bg-ed-bg focus-within:p-6">
            {graph.roots.map((root) => (
                <li key={root.id}>
                    <button
                        type="button"
                        onClick={() => onSelectRoot(root.id)}
                        className="block min-h-11 w-full border-b border-ed-rule px-2 py-2 text-left font-arabic text-lg text-ed-fg hover:text-ed-accent"
                    >
                        {root.rootWord ?? 'Function words'} ({root.wordIds.length})
                    </button>
                </li>
            ))}
        </ul>
    );
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/quran/roots/LayoutSwitcher.tsx src/app/quran/roots/AccessibleNodeList.tsx
git commit -m "feat: add layout switcher and keyboard-accessible node list"
```

---

### Task 16: RootExplorerClient wiring

**Files:**
- Create: `src/app/quran/roots/RootExplorerClient.tsx`

**Interfaces:**
- Consumes: `parseRootGraph` (Task 5), `computeConstellationLayout`/`computeVerseFlowLayout`/`computeRootTreeLayout` (Tasks 6-8), `RootScene`/`HoveredNode` (Task 13), `NodeTooltip`/`DetailPanel` (Task 14), `LayoutSwitcher`/`LayoutMode`/`AccessibleNodeList` (Task 15).
- Produces: default-exported `RootExplorerClient` (no props). Consumed by `page.tsx` in Task 17.

- [ ] **Step 1: Write the implementation**

```tsx
// src/app/quran/roots/RootExplorerClient.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { parseRootGraph } from '@/lib/rootGraph/parseRootGraph';
import type { RootGraph } from '@/lib/rootGraph/types';
import { computeConstellationLayout } from '@/lib/rootGraph/layouts/constellation';
import { computeVerseFlowLayout } from '@/lib/rootGraph/layouts/verseFlow';
import { computeRootTreeLayout } from '@/lib/rootGraph/layouts/rootTree';
import type { LayoutResult } from '@/lib/rootGraph/layouts/types';
import RootScene, { type HoveredNode } from './RootScene';
import NodeTooltip from './NodeTooltip';
import DetailPanel from './DetailPanel';
import LayoutSwitcher, { type LayoutMode } from './LayoutSwitcher';
import AccessibleNodeList from './AccessibleNodeList';

const GRAPH_URL = '/data/root-graph/ch1-10.json';

function useNearViewport<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [isNear, setIsNear] = useState(false);

    useEffect(() => {
        if (isNear) return;
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            setIsNear(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setIsNear(true);
                        observer.disconnect();
                    }
                }
            },
            { rootMargin: '200px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [isNear]);

    return { ref, isNear };
}

function usePrefersReducedMotion(): boolean {
    const [prefersReduced, setPrefersReduced] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReduced(query.matches);
        const handleChange = () => setPrefersReduced(query.matches);
        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, []);

    return prefersReduced;
}

export default function RootExplorerClient() {
    const { ref: containerRef, isNear } = useNearViewport<HTMLDivElement>();
    const reducedMotion = usePrefersReducedMotion();
    const [graph, setGraph] = useState<RootGraph | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('constellation');
    const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);
    const [selectedRootId, setSelectedRootId] = useState<string | null>(null);

    useEffect(() => {
        if (!isNear || graph) return;
        let cancelled = false;

        fetch(GRAPH_URL)
            .then((response) => {
                if (!response.ok) throw new Error(`Failed to load root graph: ${response.status}`);
                return response.json();
            })
            .then((payload: unknown) => {
                if (cancelled) return;
                setGraph(parseRootGraph(payload));
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setLoadError(error instanceof Error ? error.message : 'Failed to load the root graph.');
            });

        return () => {
            cancelled = true;
        };
    }, [isNear, graph]);

    const layouts = useMemo<Record<LayoutMode, LayoutResult> | null>(() => {
        if (!graph) return null;
        return {
            constellation: computeConstellationLayout(graph),
            'verse-flow': computeVerseFlowLayout(graph),
            'root-tree': computeRootTreeLayout(graph),
        };
    }, [graph]);

    const selectedRoot = useMemo(() => {
        if (!graph || !selectedRootId) return null;
        return graph.roots.find((root) => root.id === selectedRootId) ?? null;
    }, [graph, selectedRootId]);

    return (
        <div ref={containerRef} className="relative mt-10 h-[70vh] min-h-[480px] border border-ed-rule bg-ed-surface">
            {loadError && (
                <p role="alert" className="p-6 text-sm text-ed-fg-muted">
                    {loadError}
                </p>
            )}

            {!loadError && !graph && <p className="p-6 text-sm text-ed-fg-muted">Loading the root map…</p>}

            {graph && layouts && (
                <>
                    <LayoutSwitcher mode={layoutMode} onChange={setLayoutMode} />
                    <RootScene
                        graph={graph}
                        layout={layouts[layoutMode]}
                        reducedMotion={reducedMotion}
                        onHoverNode={setHoveredNode}
                        onSelectNode={(nodeId, kind) => {
                            if (kind === 'root') {
                                setSelectedRootId(nodeId);
                                return;
                            }
                            const word = graph.words.find((candidate) => candidate.id === nodeId);
                            if (word) setSelectedRootId(word.rootId);
                        }}
                    />
                    <NodeTooltip node={hoveredNode} graph={graph} />
                    <AccessibleNodeList graph={graph} onSelectRoot={setSelectedRootId} />
                    {selectedRoot && (
                        <DetailPanel root={selectedRoot} graph={graph} onClose={() => setSelectedRootId(null)} />
                    )}
                </>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/quran/roots/RootExplorerClient.tsx
git commit -m "feat: wire the root explorer client"
```

---

### Task 17: Route page and navigation entry

**Files:**
- Create: `src/app/quran/roots/page.tsx`
- Modify: `src/config/navigation.ts`

**Interfaces:**
- Consumes: `RootExplorerClient` (Task 16).

- [ ] **Step 1: Write the page**

```tsx
// src/app/quran/roots/page.tsx
import type { Metadata } from 'next';
import RootExplorerClient from './RootExplorerClient';

export const metadata: Metadata = {
    title: 'Root Explorer',
    description:
        "A navigable map of Qur'an Arabic roots and the words derived from them, for chapters 1 through 10.",
};

export default function RootExplorerPage() {
    return (
        <div className="min-h-screen bg-ed-bg font-body text-ed-fg">
            <main id="main-content" className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <header className="space-y-6 border-y border-ed-rule py-10 sm:py-12">
                    <h1 className="max-w-[16ch] font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] text-ed-fg">
                        Root Explorer
                    </h1>
                    <p className="max-w-[58ch] text-base leading-8 text-ed-fg-muted sm:text-lg">
                        Every root connects to the words derived from it, across the first ten chapters of the
                        Qur&apos;an. Drag to rotate, scroll to zoom, and select a root to see its full meaning and
                        every place it appears.
                    </p>
                </header>
                <RootExplorerClient />
            </main>
        </div>
    );
}
```

- [ ] **Step 2: Add the navigation entry**

In `src/config/navigation.ts`, add an entry to `PRIMARY_NAV` right after `"Qur'an"`:

```ts
export const PRIMARY_NAV = [
    { name: 'Home', href: '/' },
    { name: 'Videos', href: '/videos' },
    { name: 'Audios', href: '/audios' },
    { name: 'Written', href: '/written' },
    { name: "Qur'an", href: '/quran' },
    { name: 'Root Explorer', href: '/quran/roots' },
    { name: 'Search', href: '/search' },
];
```

- [ ] **Step 3: Verify the route builds and renders**

```bash
npm run typecheck
npm run dev
```

Navigate to `http://localhost:3000/quran/roots` and confirm the page loads, the nav shows "Root Explorer", the graph loads and renders (this closes out Task 13's manual verification step too), the layout switcher changes the arrangement, hovering shows a tooltip, and clicking a node opens the detail panel with working verse links.

- [ ] **Step 4: Commit**

```bash
git add src/app/quran/roots/page.tsx src/config/navigation.ts
git commit -m "feat: add the root explorer route and nav entry"
```

---

### Task 18: Playwright smoke test and accessibility coverage

**Files:**
- Create: `tests/e2e/root-explorer.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`

- [ ] **Step 1: Write the smoke test**

```ts
// tests/e2e/root-explorer.spec.ts
import { expect, test } from '@playwright/test';

test('root explorer loads the graph, renders the canvas, and opens a detail panel on click', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/quran/roots');
    await expect(page.getByRole('heading', { name: 'Root Explorer' })).toBeVisible();

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Root tree' }).click();
    await expect(page.getByRole('button', { name: 'Root tree' })).toHaveAttribute('aria-pressed', 'true');

    expect(consoleErrors).toEqual([]);
});
```

- [ ] **Step 2: Add the route to the accessibility sweep**

In `tests/e2e/accessibility.spec.ts`, add `/quran/roots` to the `routes` array:

```ts
const routes = [
    '/',
    '/search',
    '/quran/1',
    '/quran/roots',
    '/media/video-program/what-is-life-all-about',
    '/library/salat-booklet',
];
```

- [ ] **Step 3: Run the e2e suite**

```bash
npm run build
npx playwright test tests/e2e/root-explorer.spec.ts tests/e2e/accessibility.spec.ts
```

Expected: both files PASS. If the accessibility sweep flags the canvas itself, confirm `RootScene`'s container div still has `aria-hidden="true"` (Task 13) — the `AccessibleNodeList` from Task 15 is the accessible equivalent, so the canvas is presentational.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/root-explorer.spec.ts tests/e2e/accessibility.spec.ts
git commit -m "test: add root explorer e2e smoke and accessibility coverage"
```

---

### Task 19: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full check**

```bash
npm run lint
npm run typecheck
npm test
npm run validate:root-graph
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Fix anything that fails**

Address any lint, type, or test failures surfaced above before considering the feature complete. Do not skip or suppress a failing check.

- [ ] **Step 3: Final commit (only if Step 2 produced changes)**

```bash
git add -A
git commit -m "fix: address full verification pass findings"
```
