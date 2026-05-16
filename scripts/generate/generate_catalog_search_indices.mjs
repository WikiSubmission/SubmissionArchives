import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, 'public', 'data', 'generated_indices');
const VIDEO_LIST = path.join(GENERATED_DIR, 'VIDEO_PROGRAMS_LIST.json');
const AUDIO_LIST = path.join(GENERATED_DIR, 'AUDIOS_LIST.json');
const VIDEO_OUTPUT = path.join(GENERATED_DIR, 'ALL_VIDEO_PROGRAMS.json');
const AUDIO_OUTPUT = path.join(GENERATED_DIR, 'ALL_AUDIOS.json');
const MASTER_OUTPUT = path.join(GENERATED_DIR, 'MASTER_INDEX.json');
const ASSET_MANIFEST_OUTPUT = path.join(GENERATED_DIR, 'ASSET_MANIFEST.csv');
const TRANSCRIPTS_MASTER_OUTPUT = path.join(GENERATED_DIR, 'TRANSCRIPTS_MASTER.csv');
const APPENDIX_DIR = path.join(ROOT, 'public', 'content', 'appendix');
const APPENDIX_PDF_DIR = path.join(APPENDIX_DIR, 'pdfs');
const APPENDIX_THUMB_DIR = path.join(APPENDIX_DIR, 'thumbnails');
const APPENDIX_CSV = path.join(APPENDIX_DIR, 'csv', 'quran_appendices_rows.csv');
const NEWSLETTER_DIR = path.join(ROOT, 'public', 'content', 'newsletter');
const NEWSLETTER_PDF_DIR = path.join(NEWSLETTER_DIR, 'pdfs');
const NEWSLETTER_THUMB_DIR = path.join(NEWSLETTER_DIR, 'thumbnails');
const NEWSLETTER_CSV = path.join(NEWSLETTER_DIR, 'csv', 'newsletters_rows.csv');

const MONTHS = {
  jan: { number: 1, name: 'January', abbr: 'jan' },
  january: { number: 1, name: 'January', abbr: 'jan' },
  feb: { number: 2, name: 'February', abbr: 'feb' },
  february: { number: 2, name: 'February', abbr: 'feb' },
  mar: { number: 3, name: 'March', abbr: 'mar' },
  march: { number: 3, name: 'March', abbr: 'mar' },
  apr: { number: 4, name: 'April', abbr: 'apr' },
  april: { number: 4, name: 'April', abbr: 'apr' },
  may: { number: 5, name: 'May', abbr: 'may' },
  jun: { number: 6, name: 'June', abbr: 'jun' },
  june: { number: 6, name: 'June', abbr: 'jun' },
  jul: { number: 7, name: 'July', abbr: 'jul' },
  july: { number: 7, name: 'July', abbr: 'jul' },
  aug: { number: 8, name: 'August', abbr: 'aug' },
  august: { number: 8, name: 'August', abbr: 'aug' },
  sep: { number: 9, name: 'September', abbr: 'sep' },
  september: { number: 9, name: 'September', abbr: 'sep' },
  oct: { number: 10, name: 'October', abbr: 'oct' },
  october: { number: 10, name: 'October', abbr: 'oct' },
  nov: { number: 11, name: 'November', abbr: 'nov' },
  november: { number: 11, name: 'November', abbr: 'nov' },
  dec: { number: 12, name: 'December', abbr: 'dec' },
  december: { number: 12, name: 'December', abbr: 'dec' },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stripPublicPrefix(localPath) {
  return localPath.replace(/\\/g, '/').replace(/^\/?public\//, '').replace(/^\/+/, '');
}

function toPublicLocalPath(...parts) {
  return stripPublicPrefix(path.join('public', ...parts));
}

function toAbsolutePublicPath(localPath) {
  return path.join(ROOT, 'public', stripPublicPrefix(localPath));
}

function normalizePublicPath(value) {
  if (!value) return '';
  return stripPublicPrefix(value);
}

function publicUrlForKey(r2Key) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL
    || process.env.R2_PUBLIC_URL
    || process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL
    || process.env.NEXT_PUBLIC_R2_PUBLIC_URL
    || '';
  if (!baseUrl) return '';
  const encodedKey = r2Key.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${baseUrl.replace(/\/+$/, '')}/${encodedKey}`;
}

function csvEscape(value) {
  if (value === undefined || value === null) return '';
  const text = Array.isArray(value) ? value.join('|') : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, columns) {
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n');
}

function contentTypeFor(localPath) {
  const ext = path.extname(localPath).toLowerCase();
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.mp3':
      return 'audio/mpeg';
    case '.m4a':
      return 'audio/mp4';
    case '.vtt':
      return 'text/vtt; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      field = '';
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function rowsToObjects(text) {
  const [headers, ...rows] = parseCsv(text);
  if (!headers) return [];

  return rows.map((row) =>
    headers.reduce((acc, header, index) => {
      acc[header.trim()] = row[index]?.trim() ?? '';
      return acc;
    }, {})
  );
}

function readCsvRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return rowsToObjects(fs.readFileSync(filePath, 'utf8'));
}

function parseVttTimestamp(timestamp) {
  const parts = timestamp.trim().split(':');
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number.parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number.parseFloat(parts[1]);
  }
  return Number.parseFloat(parts[0]) || 0;
}

function parseVTT(vttContent) {
  const segments = [];
  const normalized = vttContent.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    if (lines[0].startsWith('WEBVTT')) continue;
    if (lines[0].startsWith('NOTE')) continue;
    if (lines[0].startsWith('Kind:')) continue;
    if (lines[0].startsWith('Language:')) continue;

    const timeLineIndex = lines.findIndex((line) => line.includes('-->'));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const [startRaw, endRaw] = timeLine.split('-->').map((part) => part.trim());
    const end = endRaw ? endRaw.split(' ')[0] : startRaw;
    const text = lines
      .slice(timeLineIndex + 1)
      .join(' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();

    if (!text) continue;

    segments.push({
      start: parseVttTimestamp(startRaw),
      end: parseVttTimestamp(end),
      text,
    });
  }

  return segments;
}

function readSegments(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];

  const body = fs.readFileSync(transcriptPath, 'utf8');
  if (transcriptPath.endsWith('.vtt')) return parseVTT(body);

  const json = JSON.parse(body);
  const segments = Array.isArray(json) ? json : json.segments || [];
  return segments.map((segment) => ({
    start: segment.start_time ?? segment.start ?? 0,
    end: segment.end_time ?? segment.end ?? segment.start_time ?? segment.start ?? 0,
    text: segment.content ?? segment.text ?? '',
  })).filter((segment) => segment.text);
}

function compactSegments(segments) {
  return segments.map((segment) => ({
    start: segment.start ?? 0,
    end: segment.end ?? segment.start ?? 0,
    text: segment.text ?? segment.content ?? '',
  })).filter((segment) => segment.text);
}

function getThumbnailLink(thumbnailDir, publicBase, pdfFilename) {
  const thumbnailName = `${pdfFilename.replace(/\.pdf$/i, '')}.jpg`;
  return fs.existsSync(path.join(thumbnailDir, thumbnailName)) ? `${publicBase}/${thumbnailName}` : undefined;
}

function titleFromAppendixFilename(filename) {
  if (filename === 'introduction.pdf') return 'Introduction';
  if (filename === 'proclamation.pdf') return 'Proclamation';

  const appendixNumber = filename.match(/^appendix_(\d+)\.pdf$/)?.[1];
  return appendixNumber ? `Appendix ${appendixNumber}` : filename.replace(/\.pdf$/i, '');
}

function appendixSortValue(id) {
  if (id === 'proclamation') return -2;
  if (id === 'introduction') return -1;
  const appendixNumber = id.match(/^appendix-(\d+)$/)?.[1];
  return appendixNumber ? Number(appendixNumber) : 999;
}

function newsletterIssueFromPdf(filename) {
  const match = filename.match(/^(\d{4})_(\d{2})_([A-Za-z]+)(?:_(.+))?\.pdf$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  const month = MONTHS[match[3].toLowerCase()];
  if (!month) return null;

  const suffix = match[4]?.toLowerCase() ?? '';
  const isBonus = suffix.includes('bonus') || suffix.includes('bulletin');
  const id = `${year}_${month.abbr}${suffix.includes('bonus_issue') ? '_2' : isBonus ? '_bonus' : ''}`;
  const titleSuffix = isBonus ? ' Bonus Issue' : '';
  const baseName = filename.replace(/\.pdf$/i, '');

  return {
    id,
    title: `Submitter Perspectives ${month.name}${titleSuffix} ${year}`,
    displayTitle: `Submitter Perspectives ${month.name}${titleSuffix} ${year}`,
    type: 'perspective',
    author: 'Submitters',
    date: `${month.name.toUpperCase()}${titleSuffix.toUpperCase()} ${year}`,
    fullDate: `${year}-${String(monthNumber).padStart(2, '0')}-01`,
    monthSort: monthNumber + (isBonus ? 0.5 : 0),
    year,
    filename,
    pdfLink: `/content/newsletter/pdfs/${filename}`,
    thumbnailOverride: getThumbnailLink(NEWSLETTER_THUMB_DIR, '/content/newsletter/thumbnails', filename),
    aliases: [id, baseName, `${year}_${month.abbr}`],
  };
}

function buildVideoIndex({ includeEmpty = false } = {}) {
  const videos = readJson(VIDEO_LIST);
  return videos.map((item) => {
    const transcriptPath = path.join(ROOT, 'public', 'content', 'video', item.folder, item.vttFile || '');
    const segments = readSegments(transcriptPath);
    return {
      id: item.id,
      title: item.displayTitle || item.title,
      displayTitle: item.displayTitle || item.title,
      type: item.type,
      author: item.author,
      thumbnailOverride: item.thumbnailOverride,
      folder: item.folder,
      videoFile: item.videoFile,
      vttFile: item.vttFile,
      transcriptStatus: segments.length > 0 ? 'available' : item.vttFile ? 'empty' : 'missing',
      segments,
    };
  }).filter((item) => includeEmpty || item.segments.length > 0);
}

function buildAudioIndex({ includeEmpty = false } = {}) {
  const audios = readJson(AUDIO_LIST);
  return audios.map((item) => {
    const subFolder = item.type === 'quran-study' ? 'quran-studies' : 'messenger-audios';
    const transcriptPath = path.join(ROOT, 'public', 'content', 'audio', subFolder, item.folder, item.vttFile || '');
    const segments = readSegments(transcriptPath);
    return {
      id: item.id,
      title: item.displayTitle || item.title,
      displayTitle: item.displayTitle || item.title,
      type: item.type,
      author: item.author,
      thumbnailOverride: item.thumbnailOverride,
      folder: item.folder,
      audioFile: item.audioFile,
      vttFile: item.vttFile,
      primaryNumber: item.primaryNumber,
      alternateNumbers: item.alternateNumbers,
      alternateNumberLabel: item.alternateNumberLabel,
      youtubeId: item.youtubeId,
      youtubeUrl: item.youtubeUrl,
      transcriptStatus: segments.length > 0 ? 'available' : item.vttFile ? 'empty' : 'missing',
      segments,
    };
  }).filter((item) => includeEmpty || item.segments.length > 0);
}

function buildAppendixIndex() {
  if (!fs.existsSync(APPENDIX_PDF_DIR)) return [];

  const rows = readCsvRows(APPENDIX_CSV);
  const titleById = new Map();
  for (const row of rows) {
    if (row.id && row.title && !titleById.has(row.id)) {
      titleById.set(row.id, row.title);
    }
  }

  const segmentsById = new Map();
  for (const row of rows) {
    if (!row.id || !row.content) continue;
    const segments = segmentsById.get(row.id) ?? [];
    segments.push({
      start: 0,
      end: 0,
      text: row.content,
      sectionIndex: Number(row.section_index) || segments.length + 1,
      sectionType: row.section_type || undefined,
      headingLevel: Number(row.heading_level) || undefined,
      sourceUrl: row.source_url || undefined,
    });
    segmentsById.set(row.id, segments);
  }

  return fs
    .readdirSync(APPENDIX_PDF_DIR)
    .filter((name) => name.toLowerCase().endsWith('.pdf'))
    .map((filename) => {
      const id = filename.replace(/\.pdf$/i, '').replace(/^appendix_(\d+)$/, 'appendix-$1');
      return {
        id,
        title: titleById.get(id) ?? titleFromAppendixFilename(filename),
        displayTitle: titleById.get(id) ?? titleFromAppendixFilename(filename),
        type: 'appendix',
        author: 'Dr. Rashad Khalifa',
        filename,
        pdfLink: `/content/appendix/pdfs/${filename}`,
        thumbnailOverride: getThumbnailLink(APPENDIX_THUMB_DIR, '/content/appendix/thumbnails', filename),
        transcriptStatus: segmentsById.has(id) ? 'available' : 'missing',
        segments: segmentsById.get(id) ?? [],
      };
    })
    .sort((a, b) => appendixSortValue(a.id) - appendixSortValue(b.id));
}

function buildNewsletterIndex() {
  if (!fs.existsSync(NEWSLETTER_PDF_DIR)) return [];

  const issues = fs
    .readdirSync(NEWSLETTER_PDF_DIR)
    .filter((name) => name.toLowerCase().endsWith('.pdf'))
    .map(newsletterIssueFromPdf)
    .filter(Boolean)
    .sort((a, b) => a.fullDate.localeCompare(b.fullDate) || a.monthSort - b.monthSort);

  const regularIssueByMonth = new Map(
    issues
      .filter((issue) => !issue.id.endsWith('_bonus') && !issue.id.endsWith('_2'))
      .map((issue) => [issue.fullDate.slice(0, 7), issue])
  );

  const segmentsById = new Map();
  for (const row of readCsvRows(NEWSLETTER_CSV)) {
    const year = Number(row.year);
    const month = MONTHS[(row.month ?? '').toLowerCase()];
    const issue = month ? regularIssueByMonth.get(`${year}-${String(month.number).padStart(2, '0')}`) : null;
    if (!issue || !row.content) continue;

    const segments = segmentsById.get(issue.id) ?? [];
    const page = Number(row.page) || 1;
    segments.push({
      start: 0,
      end: 0,
      text: row.content,
      page,
      index: Number(row.index) || segments.length + 1,
      htmlTag: row.html_tag || undefined,
    });
    segmentsById.set(issue.id, segments);
  }

  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    displayTitle: issue.displayTitle,
    type: issue.type,
    author: issue.author,
    date: issue.date,
    fullDate: issue.fullDate,
    year: issue.year,
    filename: issue.filename,
    pdfLink: issue.pdfLink,
    thumbnailOverride: issue.thumbnailOverride,
    aliases: issue.aliases,
    transcriptStatus: segmentsById.has(issue.id) ? 'available' : 'empty',
    segments: segmentsById.get(issue.id) ?? [],
  }));
}

function masterRecord(item, category) {
  return {
    id: item.id,
    title: item.title,
    displayTitle: item.displayTitle,
    type: item.type,
    category,
    author: item.author,
    date: item.date,
    fullDate: item.fullDate,
    year: item.year,
    thumbnailOverride: item.thumbnailOverride,
    folder: item.folder,
    filename: item.filename,
    pdfLink: item.pdfLink,
    videoFile: item.videoFile,
    audioFile: item.audioFile,
    vttFile: item.vttFile,
    primaryNumber: item.primaryNumber,
    alternateNumbers: item.alternateNumbers,
    alternateNumberLabel: item.alternateNumberLabel,
    youtubeId: item.youtubeId,
    youtubeUrl: item.youtubeUrl,
    aliases: item.aliases,
    transcriptStatus: item.transcriptStatus ?? ((item.segments?.length ?? 0) > 0 ? 'available' : 'missing'),
    segmentCount: item.segments?.length ?? 0,
    segments: compactSegments(item.segments ?? []),
  };
}

function addAsset(assets, item, category, assetKind, localPath) {
  if (!localPath) return;
  const normalizedLocalPath = normalizePublicPath(localPath);
  const absolutePath = toAbsolutePublicPath(normalizedLocalPath);
  assets.push({
    record_id: item.id,
    category,
    type: item.type,
    title: item.displayTitle || item.title,
    asset_kind: assetKind,
    local_path: normalizedLocalPath,
    r2_key: normalizedLocalPath,
    public_url: publicUrlForKey(normalizedLocalPath),
    absolutePath,
    exists: fs.existsSync(absolutePath),
    content_type: contentTypeFor(normalizedLocalPath),
    upload_status: 'pending',
  });
}

async function buildAssetManifest(masterIndex) {
  const assets = [];
  for (const item of masterIndex) {
    if (item.category === 'Videos') {
      addAsset(assets, item, item.category, 'media', toPublicLocalPath('content', 'video', item.folder, item.videoFile || ''));
      addAsset(assets, item, item.category, 'transcript', toPublicLocalPath('content', 'video', item.folder, item.vttFile || ''));
    } else if (item.category === 'Quran Studies') {
      addAsset(assets, item, item.category, 'media', item.audioFile ? toPublicLocalPath('content', 'audio', 'quran-studies', item.folder, item.audioFile) : '');
      addAsset(assets, item, item.category, 'transcript', toPublicLocalPath('content', 'audio', 'quran-studies', item.folder, item.vttFile || ''));
    } else if (item.category === 'Messenger Audios') {
      addAsset(assets, item, item.category, 'media', item.audioFile ? toPublicLocalPath('content', 'audio', 'messenger-audios', item.folder, item.audioFile) : '');
      addAsset(assets, item, item.category, 'transcript', toPublicLocalPath('content', 'audio', 'messenger-audios', item.folder, item.vttFile || ''));
    } else if (item.category === 'Submitter Perspectives' || item.category === 'Appendices') {
      addAsset(assets, item, item.category, 'pdf', item.pdfLink);
    }

    addAsset(assets, item, item.category, 'thumbnail', item.thumbnailOverride);
  }

  for (const asset of assets) {
    asset.size_bytes = asset.exists ? fs.statSync(asset.absolutePath).size : 0;
    asset.sha256 = asset.exists ? await sha256File(asset.absolutePath) : '';
    delete asset.absolutePath;
    delete asset.exists;
  }

  return assets;
}

function buildTranscriptRows(masterIndex) {
  const rows = [];
  for (const item of masterIndex) {
    const sourceFile = sourceTranscriptPath(item);
    const segments = item.segments ?? [];
    if (segments.length === 0) {
      rows.push({
        record_id: item.id,
        category: item.category,
        type: item.type,
        title: item.displayTitle || item.title,
        primary_number: item.primaryNumber,
        alternate_numbers: item.alternateNumbers,
        transcript_status: item.transcriptStatus || 'empty',
        segment_index: '',
        start: '',
        end: '',
        page: '',
        section_index: '',
        source_file: sourceFile,
        text: '',
      });
      continue;
    }

    segments.forEach((segment, index) => {
      rows.push({
        record_id: item.id,
        category: item.category,
        type: item.type,
        title: item.displayTitle || item.title,
        primary_number: item.primaryNumber,
        alternate_numbers: item.alternateNumbers,
        transcript_status: item.transcriptStatus || 'available',
        segment_index: index + 1,
        start: segment.start ?? '',
        end: segment.end ?? '',
        page: segment.page ?? '',
        section_index: segment.sectionIndex ?? segment.index ?? '',
        source_file: sourceFile,
        text: segment.text ?? '',
      });
    });
  }
  return rows;
}

function sourceTranscriptPath(item) {
  if (item.category === 'Videos') return toPublicLocalPath('content', 'video', item.folder, item.vttFile || '');
  if (item.category === 'Quran Studies') return toPublicLocalPath('content', 'audio', 'quran-studies', item.folder, item.vttFile || '');
  if (item.category === 'Messenger Audios') return toPublicLocalPath('content', 'audio', 'messenger-audios', item.folder, item.vttFile || '');
  if (item.category === 'Submitter Perspectives') return 'public/content/newsletter/csv/newsletters_rows.csv';
  if (item.category === 'Appendices') return 'public/content/appendix/csv/quran_appendices_rows.csv';
  return '';
}

async function main() {
const videoSearchIndex = buildVideoIndex();
const audioSearchIndex = buildAudioIndex();
const fullVideoIndex = buildVideoIndex({ includeEmpty: true });
const fullAudioIndex = buildAudioIndex({ includeEmpty: true });
const appendixIndex = buildAppendixIndex();
const newsletterIndex = buildNewsletterIndex();
const masterIndex = [
  ...fullVideoIndex.map((item) => masterRecord(item, 'Videos')),
  ...fullAudioIndex
    .filter((item) => item.type === 'quran-study')
    .map((item) => masterRecord(item, 'Quran Studies')),
  ...fullAudioIndex
    .filter((item) => item.type === 'messenger-audio')
    .map((item) => masterRecord(item, 'Messenger Audios')),
  ...newsletterIndex.map((item) => masterRecord(item, 'Submitter Perspectives')),
  ...appendixIndex.map((item) => masterRecord(item, 'Appendices')),
];
const assetManifest = await buildAssetManifest(masterIndex);
const transcriptRows = buildTranscriptRows(masterIndex);

fs.writeFileSync(VIDEO_OUTPUT, `${JSON.stringify(videoSearchIndex, null, 2)}\n`);
fs.writeFileSync(AUDIO_OUTPUT, `${JSON.stringify(audioSearchIndex, null, 2)}\n`);
fs.writeFileSync(MASTER_OUTPUT, `${JSON.stringify(masterIndex, null, 2)}\n`);
fs.writeFileSync(ASSET_MANIFEST_OUTPUT, `${toCsv(assetManifest, [
  'record_id',
  'category',
  'type',
  'title',
  'asset_kind',
  'local_path',
  'r2_key',
  'public_url',
  'size_bytes',
  'sha256',
  'content_type',
  'upload_status',
])}\n`);
fs.writeFileSync(TRANSCRIPTS_MASTER_OUTPUT, `${toCsv(transcriptRows, [
  'record_id',
  'category',
  'type',
  'title',
  'primary_number',
  'alternate_numbers',
  'transcript_status',
  'segment_index',
  'start',
  'end',
  'page',
  'section_index',
  'source_file',
  'text',
])}\n`);

console.log(`Wrote ${videoSearchIndex.length} video records to ${path.relative(ROOT, VIDEO_OUTPUT)}`);
console.log(`Wrote ${audioSearchIndex.length} audio records to ${path.relative(ROOT, AUDIO_OUTPUT)}`);
console.log(`Wrote ${masterIndex.length} master records to ${path.relative(ROOT, MASTER_OUTPUT)}`);
console.log(`Wrote ${assetManifest.length} asset rows to ${path.relative(ROOT, ASSET_MANIFEST_OUTPUT)}`);
console.log(`Wrote ${transcriptRows.length} transcript rows to ${path.relative(ROOT, TRANSCRIPTS_MASTER_OUTPUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
