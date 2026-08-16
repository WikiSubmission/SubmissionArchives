// Fix 4 of the Quran Study transcript normalization pass (see
// data/sources/playlists/audio-transcripts/FIX-PLAN.md, Step 4) -- the
// structurally risky one, run after Steps 1-3 so the text being split is
// already clean.
//
// Every row remaining with an embedded line break at this point (5,515 of
// them, confirmed against the corpus before writing this) has at least one
// line starting with a recognized "Speaker: " prefix. Two different things
// hide behind that:
//
//   1. A genuine multi-speaker exchange in one cell, e.g. Speaker="Dr.
//      Khalifa", Text="Dr. Khalifa: No.\r\nCatherine: No, absolutely not."
//   2. A false trigger: the only prefixed line just redundantly repeats the
//      row's own already-correct Speaker value, with no real speaker
//      change (surveyed: 2,347 of the 5,515 rows are this case). These
//      resolve to a single turn and do NOT produce extra rows.
//
// The algorithm below doesn't special-case either -- it walks the lines,
// tracks the currently-attributed speaker, and only starts a new output
// turn when the attributed speaker actually changes. That handles both
// cases correctly by construction, including cells with 3-4 turns (found:
// up to 4 recognized prefixes in one cell) and cells where a turn's first
// line is just "Speaker: " with the actual content on the following
// (unprefixed) line.
//
// Timestamp accuracy: every row split out of one original row shares that
// row's exact Start Time and End Time. There is no finer-grained timing
// in the source for where the second speaker actually started, so nothing
// is fabricated -- see FIX-PLAN.md for why a proportional/character-count
// split (as done elsewhere in this codebase for unrelated content) is the
// wrong model here. Rows produced by a real split (2+ output rows from one
// input row) get a SplitFromRow marker; a false-trigger row that resolves
// to a single turn does not, since its timing is exactly as precise as any
// ordinary unsplit row.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data', 'sources', 'playlists', 'audio-transcripts');

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
            else field += char;
            continue;
        }
        if (char === '"') { inQuotes = true; continue; }
        if (char === ',') { row.push(field); field = ''; continue; }
        if (char === '\r') continue;
        if (char === '\n') { row.push(field); if (row.some((c) => c.trim())) rows.push(row); row = []; field = ''; continue; }
        field += char;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); if (row.some((c) => c.trim())) rows.push(row); }
    return rows;
}

function csvField(value) {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
}

function isInScope(filename) {
    const match = filename.match(/^(\d+)\s*-/);
    if (!match) return false;
    const num = Number(match[1]);
    return num >= 1 && num <= 52;
}

function loadAllRows(files) {
    const perFile = new Map();
    for (const file of files) {
        perFile.set(file, parseCsv(fs.readFileSync(path.join(DIR, file), 'utf8')));
    }
    return perFile;
}

function collectKnownSpeakers(perFile) {
    const speakers = new Set();
    for (const rows of perFile.values()) {
        const [header, ...body] = rows;
        const speakerIdx = header.findIndex((h) => h.trim().toLowerCase() === 'speaker');
        for (const row of body) {
            const value = (row[speakerIdx] ?? '').trim();
            if (value) speakers.add(value);
        }
    }
    return speakers;
}

// Captures which known speaker matched, unlike Step 3's yes/no version.
function buildSpeakerLineRegex(speakers) {
    const escaped = [...speakers]
        .sort((a, b) => b.length - a.length)
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`^(${escaped.join('|')}):\\s*`);
}

function splitLines(text) {
    return text.split(/\r\n|\n|\r/);
}

// Returns an array of { speaker, text } turns. A row with no real speaker
// change produces exactly one turn.
function resolveTurns(text, rowSpeaker, speakerLineRegex) {
    const lines = splitLines(text);
    const turns = [];
    let currentSpeaker = rowSpeaker;
    let currentParts = [];

    function flush() {
        if (currentParts.length === 0) return;
        const joined = currentParts.join(' ').replace(/\s{2,}/g, ' ').trim();
        if (joined) turns.push({ speaker: currentSpeaker, text: joined });
        currentParts = [];
    }

    for (const rawLine of lines) {
        const stripped = rawLine.replace(/^[\s ]+/, '');
        const match = stripped.match(speakerLineRegex);
        if (match) {
            const newSpeaker = match[1];
            if (newSpeaker !== currentSpeaker) {
                flush();
                currentSpeaker = newSpeaker;
            }
            currentParts.push(stripped.slice(match[0].length));
        } else {
            currentParts.push(rawLine);
        }
    }
    flush();

    // Defensive fallback: should not trigger on real data (every flagged row
    // has non-empty content), but never silently drop a row if it does.
    if (turns.length === 0) {
        return [{ speaker: rowSpeaker, text: text.replace(/\r\n|\n|\r/g, ' ').replace(/\s{2,}/g, ' ').trim() }];
    }
    return turns;
}

function processFile(file, rows, speakerLineRegex) {
    const [header, ...body] = rows;
    const textIdx = header.findIndex((h) => h.trim().toLowerCase() === 'text');
    const speakerIdx = header.findIndex((h) => h.trim().toLowerCase() === 'speaker');
    if (textIdx === -1 || speakerIdx === -1) throw new Error(`Missing Text/Speaker column in ${file}`);

    const newHeader = [...header, 'SplitFromRow'];
    const outRows = [newHeader];

    let flagged = 0;
    let realSplits = 0;
    let falseTriggersResolved = 0;
    let outputRowsFromFlagged = 0;
    let splitGroupCounter = 0;

    for (const row of body) {
        const text = row[textIdx] ?? '';
        if (!/\r\n|\n|\r/.test(text)) {
            outRows.push([...row, '']);
            continue;
        }

        flagged++;
        const rowSpeaker = (row[speakerIdx] ?? '').trim();
        const turns = resolveTurns(text, rowSpeaker, speakerLineRegex);
        outputRowsFromFlagged += turns.length;

        if (turns.length === 1) {
            falseTriggersResolved++;
            const nextRow = [...row];
            nextRow[textIdx] = turns[0].text;
            nextRow[speakerIdx] = turns[0].speaker;
            outRows.push([...nextRow, '']);
        } else {
            realSplits++;
            splitGroupCounter++;
            const groupId = `${file.match(/^\d+/)[0]}-${splitGroupCounter}`;
            for (const turn of turns) {
                const nextRow = [...row];
                nextRow[textIdx] = turn.text;
                nextRow[speakerIdx] = turn.speaker;
                outRows.push([...nextRow, groupId]);
            }
        }
    }

    const csv = outRows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
    fs.writeFileSync(path.join(DIR, file), csv, 'utf8');

    return {
        rowsBefore: body.length,
        rowsAfter: outRows.length - 1,
        flagged,
        realSplits,
        falseTriggersResolved,
        outputRowsFromFlagged,
    };
}

function main() {
    const files = fs.readdirSync(DIR).filter(isInScope).sort((a, b) => parseInt(a) - parseInt(b));
    const perFile = loadAllRows(files);
    const speakers = collectKnownSpeakers(perFile);
    console.log(`Known speaker labels loaded: ${speakers.size}`);
    const speakerLineRegex = buildSpeakerLineRegex(speakers);

    let totals = { rowsBefore: 0, rowsAfter: 0, flagged: 0, realSplits: 0, falseTriggersResolved: 0, outputRowsFromFlagged: 0 };

    for (const file of files) {
        const result = processFile(file, perFile.get(file), speakerLineRegex);
        for (const key of Object.keys(totals)) totals[key] += result[key];
        const num = file.match(/^\d+/)[0].padStart(2);
        console.log(
            `${num} before=${String(result.rowsBefore).padStart(5)} after=${String(result.rowsAfter).padStart(5)} `
            + `flagged=${String(result.flagged).padStart(4)} realSplits=${String(result.realSplits).padStart(3)} falseTriggers=${String(result.falseTriggersResolved).padStart(4)}`,
        );
    }

    console.log(`\nProcessed ${files.length} files.`);
    console.log(`Total rows before: ${totals.rowsBefore}, after: ${totals.rowsAfter}, delta: ${totals.rowsAfter - totals.rowsBefore}`);
    console.log(`Flagged rows: ${totals.flagged} (expected 5515)`);
    console.log(`Genuine splits (2+ turns): ${totals.realSplits}, false triggers resolved to 1 turn: ${totals.falseTriggersResolved}`);
    console.log(`Output rows from flagged rows: ${totals.outputRowsFromFlagged} (should equal ${totals.flagged} + row delta = ${totals.flagged + (totals.rowsAfter - totals.rowsBefore)})`);
}

main();
