import fs from 'node:fs';
import path from 'node:path';

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += char;
      continue;
    }
    if (char === '"') { inQuotes = true; continue; }
    if (char === ',') { row.push(field); field = ''; continue; }
    if (char === '\r') continue;
    if (char === '\n') {
      row.push(field);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }
  return rows;
}

function parseTimestamp(value) {
  if (!value) return 0;
  const parts = value.trim().split(':');
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number.parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number.parseFloat(parts[1]);
  }
  return Number.parseFloat(parts[0]) || 0;
}

function extractYoutubeId(link) {
  const m = (link || '').match(/[?&]v=([A-Za-z0-9_-]{6,})/) || (link || '').match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

const ROOT = process.cwd();
const TRANSCRIPTS_DIR = path.join(ROOT, 'data', 'sources', 'playlists', 'video-transcripts');
const VIDEOS_PATH = path.join(ROOT, 'data', 'catalog', 'videos.json');

// Map youtubeId -> { description, chapters }
const videoMetaByYtId = new Map();

for (const file of fs.readdirSync(TRANSCRIPTS_DIR)) {
  if (!file.endsWith('.csv') || /- arabic\.csv$/i.test(file)) continue;
  const filePath = path.join(TRANSCRIPTS_DIR, file);
  const rows = parseCsv(fs.readFileSync(filePath, 'utf8'));
  const [header, ...body] = rows;
  const linkIdx = header.findIndex(h => h.trim() === 'Link');
  const descIdx = header.findIndex(h => h.trim() === 'Description');
  const tocTimeIdx = header.findIndex(h => h.trim() === 'TOC Time');
  const tocTitleIdx = header.findIndex(h => h.trim() === 'TOC Title');
  const speakerIdx = header.findIndex(h => h.trim() === 'Speaker');

  let desc = '';
  const rawTocs = [];
  let ytId = null;

  for (const row of body) {
    if (!ytId && linkIdx >= 0 && row[linkIdx]) {
      ytId = extractYoutubeId(row[linkIdx]);
    }
    if (descIdx >= 0 && row[descIdx] && !desc) {
      desc = row[descIdx].trim();
    }
    if (tocTimeIdx >= 0 && tocTitleIdx >= 0 && row[tocTimeIdx]?.trim() && row[tocTitleIdx]?.trim()) {
      rawTocs.push({
        startTime: parseTimestamp(row[tocTimeIdx].trim()),
        title: row[tocTitleIdx].trim(),
        speaker: speakerIdx >= 0 ? row[speakerIdx]?.trim() || undefined : undefined,
      });
    }
  }

  if (ytId) {
    rawTocs.sort((a, b) => a.startTime - b.startTime);
    const chapters = [];
    const seenTimes = new Set();
    for (let i = 0; i < rawTocs.length; i++) {
      const toc = rawTocs[i];
      if (seenTimes.has(toc.startTime)) continue;
      seenTimes.add(toc.startTime);
      const nextToc = rawTocs.find((t, j) => j > i && t.startTime > toc.startTime);
      chapters.push({
        id: chapters.length + 1,
        startTime: Math.round(toc.startTime * 100) / 100,
        endTime: nextToc ? Math.round(nextToc.startTime * 100) / 100 : undefined,
        title: toc.title,
        ...(toc.speaker ? { speaker: toc.speaker } : {}),
      });
    }

    videoMetaByYtId.set(ytId, {
      file,
      description: desc,
      chapters,
    });
  }
}

const videos = JSON.parse(fs.readFileSync(VIDEOS_PATH, 'utf8'));
const enrichedVideos = videos.map((v) => {
  const targetYtId = v.transcriptYoutubeId || v.youtubeId;
  const meta = videoMetaByYtId.get(targetYtId);
  if (!meta) {
    console.warn(`No metadata found for video ${v.id}`);
    return v;
  }

  return {
    ...v,
    description: meta.description || v.description,
    chapters: meta.chapters && meta.chapters.length > 0 ? meta.chapters : v.chapters,
  };
});

fs.writeFileSync(VIDEOS_PATH, JSON.stringify(enrichedVideos, null, 2) + '\n', 'utf8');
console.log(`Updated ${VIDEOS_PATH} with descriptions and chapters for all ${enrichedVideos.length} videos.`);
