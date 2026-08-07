import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import pdfParse from 'pdf-parse';
import { assertValidArchiveRecords } from '../lib/archive-schema.mjs';

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, 'public', 'data', 'generated_indices');
const CATALOG_DIR = path.join(ROOT, 'data', 'catalog');
const VIDEO_LIST = path.join(CATALOG_DIR, 'videos.json');
const AUDIO_LIST = path.join(CATALOG_DIR, 'audios.json');
const MASTER_OUTPUT = path.join(GENERATED_DIR, 'MASTER_INDEX.json');
const ASSET_MANIFEST_OUTPUT = path.join(GENERATED_DIR, 'ASSET_MANIFEST.csv');
const BOOKS_LIST_OUTPUT = path.join(GENERATED_DIR, 'BOOKS_LIST.json');
const VALIDATION_OUTPUT = path.join(GENERATED_DIR, 'CATALOG_VALIDATION.json');
const APPENDIX_DIR = path.join(ROOT, 'public', 'content', 'quran', 'organized_appendices');
const APPENDIX_PDF_DIR = path.join(APPENDIX_DIR, '1992');
const APPENDIX_THUMB_DIR = path.join(APPENDIX_PDF_DIR, 'thumbnails');
const APPENDIX_CSV = path.join(CATALOG_DIR, 'quran-appendices.csv');
const APPENDIX_EDITION_MANIFEST = readJson(path.join(CATALOG_DIR, 'appendix-editions.json'));
const NEWSLETTER_DIR = path.join(ROOT, 'public', 'content', 'written', 'newsletters');
const NEWSLETTER_CATALOG = path.join(CATALOG_DIR, 'newsletters.json');
const NEWSLETTER_THUMB_DIR = path.join(NEWSLETTER_DIR, 'thumbnails');
const NEWSLETTER_PDF_DIR = path.join(NEWSLETTER_DIR, 'pdfs');
const SOURCE_DATA_DIR = path.join(ROOT, 'data', 'sources');
const QURAN_DIR = path.join(SOURCE_DATA_DIR, 'quran');
const QURAN_CHAPTERS_OUTPUT = path.join(GENERATED_DIR, 'QURAN_CHAPTERS.json');
const BOOKS_DIR = path.join(ROOT, 'public', 'content', 'written', 'books');
const BOOKS_TRANSCRIPTION_DIR = path.join(SOURCE_DATA_DIR, 'books');
const BOOKS_THUMB_DIR = path.join(BOOKS_DIR, 'thumbnails');

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

function compactSegments(segments) {
  return segments.map((segment) => ({
    start: segment.start ?? 0,
    end: segment.end ?? segment.start ?? 0,
    text: segment.text ?? segment.content ?? '',
    ...(segment.speaker ? { speaker: segment.speaker } : {}),
    ...(typeof segment.page === 'number' ? { page: segment.page } : {}),
    ...(segment.label ? { label: segment.label } : {}),
  })).filter((segment) => segment.text);
}

const PLAYLIST_DIRS = [
  path.join(ROOT, 'data', 'sources', 'playlists', 'video-transcripts'),
  path.join(ROOT, 'data', 'sources', 'playlists', 'audio-transcripts'),
];

function parsePlaylistTimestamp(value) {
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

function extractYoutubeIdFromLink(link) {
  const match = (link || '').match(/[?&]v=([A-Za-z0-9_-]{6,})/) || (link || '').match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : null;
}

function loadPlaylistSegmentsByYoutubeId() {
  const byId = new Map();
  for (const dir of PLAYLIST_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const filename of fs.readdirSync(dir)) {
      if (!filename.toLowerCase().endsWith('.csv')) continue;
      const isArabic = filename.toLowerCase().includes('- arabic');
      const rows = readCsvRows(path.join(dir, filename));
      for (const row of rows) {
        const youtubeId = extractYoutubeIdFromLink(row.Link);
        const text = (row.Text || '').trim();
        if (!youtubeId || !text) continue;
        
        const entry = byId.get(youtubeId) || { segments: [], segments_ar: [] };
        
        const segment = {
          start: parsePlaylistTimestamp(row['Start Time']),
          end: parsePlaylistTimestamp(row['End Time'] || row['Start Time']),
          text,
          speaker: (row.Speaker || '').trim() || undefined,
        };

        if (isArabic) {
          entry.segments_ar.push(segment);
        } else {
          entry.segments.push(segment);
        }
        byId.set(youtubeId, entry);
      }
    }
  }
  for (const entry of byId.values()) {
    entry.segments.sort((a, b) => a.start - b.start);
    entry.segments_ar.sort((a, b) => a.start - b.start);
  }
  return byId;
}

function readPlaylistSegments(playlistIndex, youtubeId, startWindow, endWindow) {
  if (!youtubeId) return { segments: [], segments_ar: [] };
  const all = playlistIndex.get(youtubeId);
  if (!all) return { segments: [], segments_ar: [] };
  const lo = startWindow ?? 0;
  const hi = endWindow ?? Infinity;
  return {
    segments: all.segments.filter((segment) => segment.start >= lo - 0.5 && segment.start < hi),
    segments_ar: all.segments_ar.filter((segment) => segment.start >= lo - 0.5 && segment.start < hi)
  };
}

// Some catalog items play a standalone re-upload of a clip that was originally
// transcribed as part of a longer combined recording. `transcriptYoutubeId` /
// `transcriptStartTime` / `transcriptEndTime` point back at that combined
// recording's playlist transcript, and `transcriptOffset` rebases each
// matched segment onto the standalone video's own zero-based timeline.
function resolveTranscriptSegments(item, playlistIndex) {
  const sourceId = item.transcriptYoutubeId || item.youtubeId;
  const startWindow = item.transcriptYoutubeId ? item.transcriptStartTime : item.youtubeStartTime;
  const endWindow = item.transcriptYoutubeId ? item.transcriptEndTime : item.youtubeEndTime;
  const { segments, segments_ar } = readPlaylistSegments(playlistIndex, sourceId, startWindow, endWindow);

  const offset = item.transcriptOffset ?? 0;
  if (!offset) return { segments, segments_ar };

  return {
    segments: segments.map((segment) => ({
      ...segment,
      start: segment.start - offset,
      end: segment.end - offset,
    })),
    segments_ar: segments_ar.map((segment) => ({
      ...segment,
      start: segment.start - offset,
      end: segment.end - offset,
    }))
  };
}

function getThumbnailLink(thumbnailDir, publicBase, pdfFilename) {
  const baseName = pdfFilename.replace(/\.pdf$/i, '');
  for (const extension of ['jpg', 'jpeg', 'png', 'webp']) {
    const thumbnailName = `${baseName}.${extension}`;
    if (fs.existsSync(path.join(thumbnailDir, thumbnailName))) {
      return `${publicBase}/${thumbnailName}`;
    }
  }
  return undefined;
}

// Special editions (e.g. the May 1988 Bulletin, the January 1990 Special
// Bonus Issue) share their year/month/monthName with a regular issue, so
// deriving a filename from year/month/monthName for them would resolve to
// the regular issue's file instead of their own. Each gets its own explicit
// filename here.
const REGULAR_EDITION_TYPES = new Set(['regular_issue', 'regular']);
const SPECIAL_EDITION_ASSET_NAMES = {
  SP1988may_bulletin: '1988_05_May_Bulletin',
  SP1990jan_special_bonus: '1990_01_January_Bonus_Issue',
};

function getNewsletterThumbnailLink(issueId, year, monthNumber, monthName, editionType) {
  const baseName = editionType && !REGULAR_EDITION_TYPES.has(editionType)
    ? SPECIAL_EDITION_ASSET_NAMES[issueId]
    : `${year}_${String(monthNumber).padStart(2, '0')}_${monthName}`;
  if (!baseName) return undefined;
  const thumbnailName = `${baseName}.jpg`;
  return fs.existsSync(path.join(NEWSLETTER_THUMB_DIR, thumbnailName))
    ? `/content/written/newsletters/thumbnails/${thumbnailName}`
    : undefined;
}

function getNewsletterPdfLink(issueId, year, monthNumber, monthName, editionType) {
  const baseName = editionType && !REGULAR_EDITION_TYPES.has(editionType)
    ? SPECIAL_EDITION_ASSET_NAMES[issueId]
    : `${year}_${String(monthNumber).padStart(2, '0')}_${monthName}`;
  if (!baseName) return undefined;
  const pdfName = `${baseName}.pdf`;
  return fs.existsSync(path.join(NEWSLETTER_PDF_DIR, pdfName))
    ? `/content/written/newsletters/pdfs/${pdfName}`
    : undefined;
}

function titleFromAppendixFilename(filename) {
  if (filename === 'introduction.pdf') return 'Introduction';
  if (filename === 'proclamation.pdf') return 'Proclamation';

  const appendixNumber = filename.match(/^appendix[_-](\d+)\.pdf$/)?.[1];
  return appendixNumber ? `Appendix ${appendixNumber}` : filename.replace(/\.pdf$/i, '');
}

function getAppendixEditions(id, primaryFilename) {
  return Object.fromEntries(
    Object.entries(APPENDIX_EDITION_MANIFEST.editions).flatMap(([edition, config]) => {
      const editionDir = path.join(APPENDIX_DIR, edition);
      const publicBase = `/content/quran/organized_appendices/${edition}`;
      const startPage = config.startPages?.[id];
      const filename = config.sharedPdf || primaryFilename;
      if (config.sharedPdf && startPage === undefined) return [];
      if (!fs.existsSync(path.join(editionDir, filename))) return [];

      return [[edition, {
        pdfLink: `${publicBase}/${filename}`,
        thumbnailOverride: getThumbnailLink(
          path.join(editionDir, 'thumbnails'),
          `${publicBase}/thumbnails`,
          config.sharedPdf ? `${id}.pdf` : filename,
        ),
        startPage,
      }]];
    }),
  );
}

function appendixSortValue(id) {
  if (id === 'proclamation') return -2;
  if (id === 'introduction') return -1;
  const appendixNumber = id.match(/^appendix-(\d+)$/)?.[1];
  return appendixNumber ? Number(appendixNumber) : 999;
}

function buildVideoIndex({ includeEmpty = false } = {}, playlistIndex) {
  const videos = readJson(VIDEO_LIST);
  return videos.map((item) => {
    const resolved = resolveTranscriptSegments(item, playlistIndex);
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
      youtubeId: item.youtubeId,
      youtubeUrl: item.youtubeUrl,
      youtubeStartTime: item.youtubeStartTime,
      youtubeEndTime: item.youtubeEndTime,
      transcriptStatus: resolved.segments.length > 0 ? 'available' : item.youtubeId ? 'empty' : 'missing',
      segments: resolved.segments,
      segments_ar: resolved.segments_ar,
    };
  }).filter((item) => includeEmpty || item.segments.length > 0);
}

function buildAudioIndex({ includeEmpty = false } = {}, playlistIndex) {
  const audios = readJson(AUDIO_LIST);
  return audios.map((item) => {
    const resolved = resolveTranscriptSegments(item, playlistIndex);
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
      youtubeStartTime: item.youtubeStartTime,
      youtubeEndTime: item.youtubeEndTime,
      transcriptStatus: resolved.segments.length > 0 ? 'available' : item.youtubeId ? 'empty' : 'missing',
      segments: resolved.segments,
      segments_ar: resolved.segments_ar,
    };
  }).filter((item) => includeEmpty || item.segments.length > 0);
}

function normalizeForPageMatch(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function extractPageTexts(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const pageTexts = [];
  await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const content = await pageData.getTextContent();
      pageTexts.push(normalizeForPageMatch(content.items.map((item) => item.str).join(' ')));
      return '';
    },
  });
  return pageTexts;
}

// Sections read sequentially, so once a section's page is found, later sections
// can only be on that page or later. Sections whose content doesn't match cleanly
// (tables, images, short headings) inherit the current page rather than guessing.
function findSectionPage(content, pageTexts, searchFromPage) {
  const words = normalizeForPageMatch(content).split(' ').filter(Boolean);
  const fragment = words.slice(0, 15).join(' ');
  if (fragment.length > 8) {
    for (let p = searchFromPage - 1; p < pageTexts.length; p++) {
      if (pageTexts[p].includes(fragment)) return p + 1;
    }
  }
  return null;
}

async function buildAppendixIndex() {
  if (!fs.existsSync(APPENDIX_PDF_DIR)) return [];

  const rows = readCsvRows(APPENDIX_CSV);
  const titleById = new Map();
  for (const row of rows) {
    if (row.id && row.title && !titleById.has(row.id)) {
      titleById.set(row.id, row.title);
    }
  }

  const segmentsById = new Map();
  const rowsById = new Map();
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
    rowsById.set(row.id, [...(rowsById.get(row.id) ?? []), row]);
  }

  const filenames = fs.readdirSync(APPENDIX_PDF_DIR).filter((name) => name.toLowerCase().endsWith('.pdf'));

  for (const filename of filenames) {
    const id = filename.replace(/\.pdf$/i, '').replace(/^appendix[_-]0*(\d+)$/, 'appendix-$1');
    const segments = segmentsById.get(id);
    if (!segments) continue;

    const pageTexts = await extractPageTexts(path.join(APPENDIX_PDF_DIR, filename));
    let currentPage = 1;
    for (const segment of segments) {
      const found = findSectionPage(segment.text, pageTexts, currentPage);
      currentPage = found ?? currentPage;
      segment.page = currentPage;
    }
  }

  return filenames
    .map((filename) => {
      const id = filename.replace(/\.pdf$/i, '').replace(/^appendix[_-]0*(\d+)$/, 'appendix-$1');
      const editions = getAppendixEditions(id, filename);
      return {
        id,
        title: titleById.get(id) ?? titleFromAppendixFilename(filename),
        displayTitle: titleById.get(id) ?? titleFromAppendixFilename(filename),
        type: 'appendix',
        author: 'Dr. Rashad Khalifa',
        filename,
        pdfLink: `/content/quran/organized_appendices/1992/${filename}`,
        thumbnailOverride: getThumbnailLink(
          APPENDIX_THUMB_DIR,
          '/content/quran/organized_appendices/1992/thumbnails',
          filename,
        ),
        editions,
        transcriptStatus: segmentsById.has(id) ? 'available' : 'missing',
        segments: segmentsById.get(id) ?? [],
      };
    })
    .sort((a, b) => appendixSortValue(a.id) - appendixSortValue(b.id));
}

const STRUCTURED_TEXT_IGNORED_KEYS = new Set([
  'type',
  'id',
  'issue_id',
  'source_pdf',
  'source_pdf_page',
  'source_position',
  'source_spread_index',
  'source_spread_side',
  'continued_on_page',
  'page_number',
  'pdf_page',
]);

function collectStructuredText(value, key = '') {
  if (typeof value === 'string') {
    return STRUCTURED_TEXT_IGNORED_KEYS.has(key) ? [] : [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStructuredText(item, key));
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([childKey, childValue]) => {
    if (STRUCTURED_TEXT_IGNORED_KEYS.has(childKey)) return [];
    return collectStructuredText(childValue, childKey);
  });
}

function normalizeSearchText(parts) {
  return parts
    .map((part) => String(part || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

function buildNewsletterIndex() {
  const jsonPath = NEWSLETTER_CATALOG;
  if (!fs.existsSync(jsonPath)) return [];

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const issuesData = data.issues || [];

  return issuesData.map(issue => {
    const id = issue.issue_id;
    const segments = [];

    const pages = issue.transcription?.pages || issue.pages || [];
    if (pages.length > 0) {
      pages.forEach(page => {
        const pageNum = page.page_number;
        const pageText = page.transcription || page.transcription_text;
        if (typeof pageText === 'string' && pageText.trim()) {
          segments.push({
            start: 0,
            end: 0,
            text: pageText.trim(),
            page: pageNum,
            index: segments.length + 1,
            htmlTag: 'page',
          });
        } else {
          const blocks = page.blocks || page.sections || [];
          blocks.forEach((block) => {
            const text = normalizeSearchText(collectStructuredText(block));

            if (text) {
              segments.push({
                start: 0,
                end: 0,
                text,
                page: pageNum,
                index: segments.length + 1,
                htmlTag: block.type
              });
            }
          });
        }
      });
    }

    const monthStr = String(issue.month_number).padStart(2, '0');
    return {
      id: id,
      title: `Submitter Perspectives ${issue.date_label}`,
      displayTitle: `Submitter Perspectives ${issue.date_label}`,
      type: 'perspective',
      author: 'Submitters',
      date: issue.date_label,
      fullDate: `${issue.year}-${monthStr}-01`,
      year: issue.year,
      filename: issue.source_file,
      pdfLink: getNewsletterPdfLink(id, issue.year, issue.month_number, issue.month_name, issue.edition_type) || '',
      thumbnailOverride: getNewsletterThumbnailLink(id, issue.year, issue.month_number, issue.month_name, issue.edition_type),
      aliases: [id],
      transcriptStatus: segments.length > 0 ? 'available' : 'missing',
      segments: segments,
    };
  });
}

const LEGACY_BOOK_IDS = new Map([
  ['The Contact Prayers.pdf', 'salat-booklet'],
  ['Quran, Hadith, and Islam.pdf', 'quran-hadith-islam'],
  ["The Computer Speaks God's Message to the World.pdf", 'computer-speaks'],
  ['The Perpetual Miracle of Muhammad.pdf', 'perpetual-miracle'],
  ['Miracle of Quran - Significance of the Mysterious Alphabets.pdf', 'miracle-of-quran-alphabets'],
  ['Quran - Visual Presentation of the Miracle.pdf', 'quran-visual-presentation'],
]);

function slugifyBookName(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildBookSegments(transcription) {
  if (!transcription) return [];

  const pageSegments = (transcription.pages || [])
    .map((page, index) => ({
      start: 0,
      end: 0,
      text: normalizeSearchText([
        page.transcribed_text,
        page.transcription,
        page.transcription_text,
        page.reading_text,
        page.content,
      ]),
      page: Number(page.pdf_page ?? page.page_number ?? index + 1),
      label: 'page',
    }))
    .filter((segment) => segment.text);

  if (pageSegments.length > 0) return pageSegments;

  return (transcription.sections || [])
    .map((section, index) => ({
      start: 0,
      end: 0,
      text: normalizeSearchText([section.title, section.content]),
      page: Number(section.pdf_pages?.[0] ?? index + 1),
      label: 'section',
    }))
    .filter((segment) => segment.text);
}

function canonicalBookSourceKey(value) {
  return path.basename(String(value || ''))
    .replace(/\(\d+\)(?=\.pdf$)/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function bookSourceFiles(transcription) {
  const metadata = transcription?.metadata || transcription?.manifest || {};
  return metadata.source_files || (metadata.source_file ? [metadata.source_file] : metadata.source_pdf ? [metadata.source_pdf] : []);
}

function loadBookTranscriptions() {
  const transcriptionBySourceFile = new Map();

  const corpusManifestPath = path.join(BOOKS_TRANSCRIPTION_DIR, 'corpus_manifest.json');
  if (fs.existsSync(corpusManifestPath)) {
    const corpusManifest = readJson(corpusManifestPath);
    for (const entry of corpusManifest) {
      const completePath = path.join(BOOKS_TRANSCRIPTION_DIR, entry.slug, `${entry.slug}_complete.json`);
      if (!fs.existsSync(completePath)) {
        throw new Error(`Canonical book transcription is missing: ${path.relative(ROOT, completePath)}`);
      }
      const data = readJson(completePath);
      transcriptionBySourceFile.set(canonicalBookSourceKey(entry.source_pdf), {
        data,
        source: path.relative(ROOT, completePath).replace(/\\/g, '/'),
        method: data.metadata?.transcription_method,
        quality: {
          meanOcrConfidence: entry.mean_ocr_confidence,
          lowConfidencePages: entry.low_confidence_pages,
          unverifiedArabicSegments: entry.unverified_arabic_segments,
        },
      });
    }
  }

  // The two historical Quran volumes are also books in the public catalog.
  // Their complete page transcriptions provide full-text PDF search even where
  // an edition does not contain safe verse-level boundaries (notably 1981).
  for (const edition of ['1981', '1989']) {
    const completePath = path.join(QURAN_DIR, edition, `Quran${edition}_complete.json`);
    if (!fs.existsSync(completePath)) continue;
    const data = readJson(completePath);
    for (const sourceFile of bookSourceFiles(data)) {
      transcriptionBySourceFile.set(canonicalBookSourceKey(sourceFile), {
        data,
        source: path.relative(ROOT, completePath).replace(/\\/g, '/'),
        method: data.manifest?.method,
        editionYear: Number(data.manifest?.edition_year) || Number(edition),
      });
    }
  }

  return transcriptionBySourceFile;
}

// The PDFs are authoritative for the readable catalog. Canonical private source
// transcriptions enrich them with page-level search text and provenance.
function buildBooksIndex() {
  if (!fs.existsSync(BOOKS_DIR)) return [];

  const transcriptionBySourceFile = loadBookTranscriptions();

  return fs.readdirSync(BOOKS_DIR)
    .filter((filename) => filename.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => a.localeCompare(b))
    .map((filename) => {
      const transcriptionRecord = transcriptionBySourceFile.get(canonicalBookSourceKey(filename));
      const transcription = transcriptionRecord?.data;
      const fallbackTitle = filename.replace(/\.pdf$/i, '');
      const title = transcription?.metadata?.title || transcription?.manifest?.title || fallbackTitle;
      const segments = buildBookSegments(transcription);
      return {
        id: LEGACY_BOOK_IDS.get(filename) || slugifyBookName(fallbackTitle),
        title,
        displayTitle: title,
        type: 'other',
        author: 'Dr. Rashad Khalifa',
        filename,
        pdfLink: `/content/written/books/${filename}`,
        thumbnailOverride: getThumbnailLink(BOOKS_THUMB_DIR, '/content/written/books/thumbnails', filename),
        aliases: LEGACY_BOOK_IDS.has(filename) ? [slugifyBookName(fallbackTitle)] : [],
        segments,
        transcriptStatus: segments.length > 0 ? 'available' : 'missing',
        transcriptionSource: transcriptionRecord?.source,
        transcriptionMethod: transcriptionRecord?.method,
        transcriptionQuality: transcriptionRecord?.quality,
        editionYear: transcriptionRecord?.editionYear,
      };
    });
}

// Reads the raw Quran CSVs (verses, chapters, footnotes, subtitles — word-by-word
// is intentionally not used here) and joins them by verse_id into one record per
// chapter. Footnotes and subtitles are folded into each verse's searchable text
// so a search hit inside commentary still surfaces the verse it belongs to.
function buildQuranIndex() {
  const primaryDir = path.join(QURAN_DIR, '1992');
  const chapterRows = readCsvRows(path.join(primaryDir, 'ws_quran_chapters_rows.csv'));
  const textRows = readCsvRows(path.join(primaryDir, 'ws_quran_text_rows.csv'));
  const footnoteRows = readCsvRows(path.join(primaryDir, 'ws_quran_footnotes_rows.csv'));
  const subtitleRows = readCsvRows(path.join(primaryDir, 'ws_quran_subtitles_rows.csv'));

  if (chapterRows.length === 0 || textRows.length === 0) {
    return { quranMasterItems: [], quranChapters: [] };
  }

  function loadEdition(dirName) {
    if (dirName !== '1989' && dirName !== '1981') return new Map();
    const editionDir = path.join(QURAN_DIR, dirName);
    const t = readCsvRows(path.join(editionDir, `Quran${dirName}_verse_index.csv`)).map((row) => ({
      verse_id: row.verse_id,
      english: row[`english_${dirName}`],
    }));
    const f = readCsvRows(path.join(editionDir, `Quran${dirName}_footnotes.csv`)).flatMap((row) => {
      const ref = row.verse_reference || row.verse_id;
      const match = ref?.match(/^(\d+):(\d+)(?:-(\d+))?$/);
      if (!match) return [];
      const chapter = Number(match[1]);
      const start = Number(match[2]);
      let end = Number(match[3] || match[2]);
      if (end < start && match[3]) {
        const magnitude = 10 ** match[3].length;
        end = Math.floor(start / magnitude) * magnitude + end;
        if (end < start) end += magnitude;
      }
      return Array.from({ length: end - start + 1 }, (_, index) => ({
        verse_id: `${chapter}:${start + index}`,
        english: row.text,
      }));
    });
    const s = readCsvRows(path.join(editionDir, `Quran${dirName}_subheadings.csv`)).map((row) => ({
      verse_id: row.verse_id || (row.chapter_number && row.placement_before_verse
        ? `${row.chapter_number}:${row.placement_before_verse}`
        : ''),
      english: row.text,
    }));

    const fMap = new Map();
    for (const row of f) {
      if (row.verse_id && row.english) fMap.set(row.verse_id, row.english.replace(/^±\d+:\d+(-\d+)?\s*/, '').trim());
    }
    const sMap = new Map();
    for (const row of s) {
      if (row.verse_id && row.english) sMap.set(row.verse_id, row.english.replace(/\*+$/, '').trim());
    }
    const vMap = new Map();
    for (const row of t) {
      if (row.verse_id && row.english) {
        vMap.set(row.verse_id, {
          english: row.english.replace(/±/g, '').trim(),
          subtitle: sMap.get(row.verse_id) || undefined,
          footnote: fMap.get(row.verse_id) || undefined,
        });
      }
    }
    return vMap;
  }

  const ed1989 = loadEdition('1989');
  const ed1981 = loadEdition('1981');
  const expectedVerseIds = textRows
    .filter((row) => Number(row.chapter_number) > 0 && Number(row.verse_number) > 0)
    .map((row) => row.verse_id);
  const missing1989VerseIds = expectedVerseIds.filter((verseId) => !ed1989.has(verseId));
  if (missing1989VerseIds.length > 0) {
    throw new Error(`1989 Quran edition is missing ${missing1989VerseIds.length} numbered verses (first: ${missing1989VerseIds.slice(0, 5).join(', ')})`);
  }

  const footnoteByVerseId = new Map();
  for (const row of footnoteRows) {
    if (!row.verse_id || !row.english) continue;
    footnoteByVerseId.set(row.verse_id, row.english.replace(/^±\d+:\d+(-\d+)?\s*/, '').trim());
  }

  const subtitleByVerseId = new Map();
  for (const row of subtitleRows) {
    if (!row.verse_id || !row.english) continue;
    subtitleByVerseId.set(row.verse_id, row.english.replace(/\*+$/, '').trim());
  }

  const versesByChapter = new Map();
  for (const row of textRows) {
    const chapterNumber = Number(row.chapter_number);
    const verseNumber = Number(row.verse_number);
    if (!chapterNumber || !verseNumber) continue;

    const verse = {
      verseNumber,
      verseId: row.verse_id,
      arabic: row.arabic,
      arabicClean: row.arabic_clean,
      transliterated: row.transliterated,
      english: (row.english || '').replace(/±/g, '').trim(),
      subtitle: subtitleByVerseId.get(row.verse_id) || undefined,
      footnote: footnoteByVerseId.get(row.verse_id) || undefined,
      editions: {},
    };

    if (ed1989.has(row.verse_id)) verse.editions['1989'] = ed1989.get(row.verse_id);
    if (ed1981.has(row.verse_id)) verse.editions['1981'] = ed1981.get(row.verse_id);
    if (Object.keys(verse.editions).length === 0) delete verse.editions;

    const list = versesByChapter.get(chapterNumber) ?? [];
    list.push(verse);
    versesByChapter.set(chapterNumber, list);
  }
  for (const list of versesByChapter.values()) {
    list.sort((a, b) => a.verseNumber - b.verseNumber);
  }

  // Ensure verses present in historical editions but missing in 1992 (e.g. 9:128, 9:129) are added
  for (const edition of [{ year: '1989', ed: ed1989 }, { year: '1981', ed: ed1981 }]) {
    for (const [verseId, edVerse] of edition.ed) {
      const match = verseId.match(/^(\d+):(\d+)$/);
      if (!match) continue;
      const chapterNumber = Number(match[1]);
      const verseNumber = Number(match[2]);
      if (!chapterNumber || !verseNumber) continue;
      
      let list = versesByChapter.get(chapterNumber);
      if (!list) {
        list = [];
        versesByChapter.set(chapterNumber, list);
      }
      
      let verse = list.find(v => v.verseNumber === verseNumber);
      if (!verse) {
        verse = {
          verseNumber,
          verseId,
          english: '',
          editions: {}
        };
        list.push(verse);
        // Resort if we added a new verse
        list.sort((a, b) => a.verseNumber - b.verseNumber);
      }
      
      if (!verse.editions[edition.year]) {
        verse.editions[edition.year] = edVerse;
      }
    }
  }

  const quranChapters = [];
  const quranMasterItems = [];

  for (const row of chapterRows) {
    const chapterNumber = Number(row.chapter_number);
    if (!chapterNumber) continue;

    const verses = versesByChapter.get(chapterNumber) ?? [];
    const displayTitle = `${chapterNumber}. ${row.title_english}`;

    quranChapters.push({
      chapterNumber,
      verseCount: Number(row.chapter_verses) || verses.length,
      revelationOrder: Number(row.revelation_order) || undefined,
      titleEnglish: row.title_english,
      titleArabic: row.title_arabic,
      titleTransliterated: row.title_transliterated,
      verses,
    });

    // One segment per content kind (rather than one combined blob per verse) so a
    // search hit can be labeled as coming from the verse text, its heading, or its
    // footnote — otherwise a footnote match reads as an unexplained Quran result.
    const segments = [];
    for (const verse of verses) {
      if (verse.subtitle) {
        segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.subtitle, page: verse.verseNumber, label: 'heading-1992' });
      }
      if (verse.english) {
        segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.english, page: verse.verseNumber, label: 'verse-1992' });
      }
      if (verse.footnote) {
        segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.footnote, page: verse.verseNumber, label: 'footnote-1992' });
      }

      if (verse.editions?.['1989']) {
        if (verse.editions['1989'].subtitle) segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.editions['1989'].subtitle, page: verse.verseNumber, label: 'heading-1989' });
        if (verse.editions['1989'].english) segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.editions['1989'].english, page: verse.verseNumber, label: 'verse-1989' });
        if (verse.editions['1989'].footnote) segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.editions['1989'].footnote, page: verse.verseNumber, label: 'footnote-1989' });
      }

      if (verse.editions?.['1981']) {
        if (verse.editions['1981'].subtitle) segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.editions['1981'].subtitle, page: verse.verseNumber, label: 'heading-1981' });
        if (verse.editions['1981'].english) segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.editions['1981'].english, page: verse.verseNumber, label: 'verse-1981' });
        if (verse.editions['1981'].footnote) segments.push({ start: verse.verseNumber, end: verse.verseNumber, text: verse.editions['1981'].footnote, page: verse.verseNumber, label: 'footnote-1981' });
      }
    }

    quranMasterItems.push({
      id: `quran/${chapterNumber}`,
      title: displayTitle,
      displayTitle,
      type: 'quran',
      author: 'Dr. Rashad Khalifa',
      thumbnailOverride: '/images/placeholders/rashad-khalifa.png',
      segments,
      transcriptStatus: segments.length > 0 ? 'available' : 'missing',
    });
  }

  return { quranMasterItems, quranChapters };
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
    youtubeStartTime: item.youtubeStartTime,
    youtubeEndTime: item.youtubeEndTime,
    aliases: item.aliases,
    transcriptionSource: item.transcriptionSource,
    transcriptionMethod: item.transcriptionMethod,
    transcriptionQuality: item.transcriptionQuality,
    editionYear: item.editionYear,
    editions: item.editions,
    transcriptStatus: item.transcriptStatus ?? ((item.segments?.length ?? 0) > 0 ? 'available' : 'missing'),
    segmentCount: item.segments?.length ?? 0,
    segments: compactSegments(item.segments ?? []),
    segments_ar: item.segments_ar ? compactSegments(item.segments_ar) : undefined,
  };
}

function addAsset(assets, item, category, assetKind, localPath) {
  if (!localPath || /^https?:\/\//i.test(localPath)) return;
  const normalizedLocalPath = normalizePublicPath(localPath);
  const absolutePath = toAbsolutePublicPath(normalizedLocalPath);
  assets.push({
    record_id: item.id,
    category,
    type: item.type,
    title: item.displayTitle || item.title,
    asset_kind: assetKind,
    local_path: normalizedLocalPath,
    absolutePath,
    exists: fs.existsSync(absolutePath),
    content_type: contentTypeFor(normalizedLocalPath),
  });
}

async function buildAssetManifest(masterIndex) {
  const assets = [];
  for (const item of masterIndex) {
    if (item.category === 'Videos') {
      if (!item.youtubeId && !item.youtubeUrl && item.videoFile) {
        addAsset(assets, item, item.category, 'media', toPublicLocalPath('content', 'videos', item.folder, item.videoFile));
      }
    } else if (item.category === 'Quran Studies' || item.category === 'Messenger Audios') {
      // Audio media plays from YouTube; no local media asset to track.
    } else if (item.category === 'Appendices' && item.editions) {
      for (const [edition, asset] of Object.entries(item.editions)) {
        addAsset(assets, item, item.category, `pdf-${edition}`, asset.pdfLink);
        addAsset(assets, item, item.category, `thumbnail-${edition}`, asset.thumbnailOverride);
      }
    } else if (item.category === 'Submitter Perspectives' || item.category === 'Books') {
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

async function main() {
  const playlistIndex = loadPlaylistSegmentsByYoutubeId();
  const fullVideoIndex = buildVideoIndex({ includeEmpty: true }, playlistIndex);
  const fullAudioIndex = buildAudioIndex({ includeEmpty: true }, playlistIndex);
  const appendixIndex = await buildAppendixIndex();
  const newsletterIndex = buildNewsletterIndex();
  const { quranMasterItems, quranChapters } = buildQuranIndex();
  const booksIndex = buildBooksIndex();
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
    ...quranMasterItems.map((item) => masterRecord(item, 'Quran')),
    ...booksIndex.map((item) => masterRecord(item, 'Books')),
  ];

  const validationReport = assertValidArchiveRecords(masterIndex, {
    publicDir: path.join(ROOT, 'public'),
  });
  const assetManifest = await buildAssetManifest(masterIndex);
  const booksList = masterIndex
    .filter((item) => item.category === 'Books')
    .map((item) => {
      const summary = { ...item };
      delete summary.segments;
      return summary;
    });

  function normalizeLineEndings(key, value) {
    return typeof value === 'string'
      ? value.replace(/\r\n?/g, '\n')
      : value;
  }

  fs.writeFileSync(QURAN_CHAPTERS_OUTPUT, `${JSON.stringify(quranChapters, normalizeLineEndings, 2)}\n`);
  fs.writeFileSync(MASTER_OUTPUT, `${JSON.stringify(masterIndex, normalizeLineEndings, 2)}\n`);
  fs.writeFileSync(BOOKS_LIST_OUTPUT, `${JSON.stringify(booksList, normalizeLineEndings, 2)}\n`);
  fs.writeFileSync(VALIDATION_OUTPUT, `${JSON.stringify(validationReport, normalizeLineEndings, 2)}\n`);
  fs.writeFileSync(ASSET_MANIFEST_OUTPUT, `${toCsv(assetManifest, [
    'record_id',
    'category',
    'type',
    'title',
    'asset_kind',
    'local_path',
    'size_bytes',
    'sha256',
    'content_type',
  ])}\n`);

  console.log(`Wrote ${masterIndex.length} master records to ${path.relative(ROOT, MASTER_OUTPUT)}`);
  console.log(`Wrote ${booksList.length} book records to ${path.relative(ROOT, BOOKS_LIST_OUTPUT)}`);
  console.log(`Wrote ${assetManifest.length} asset rows to ${path.relative(ROOT, ASSET_MANIFEST_OUTPUT)}`);
  console.log(`Wrote ${quranChapters.length} Quran chapters to ${path.relative(ROOT, QURAN_CHAPTERS_OUTPUT)}`);
  for (const warning of validationReport.warnings) console.warn(`Warning: ${warning}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
