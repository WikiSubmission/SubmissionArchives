#!/usr/bin/env node

/**
 * AskArchives corpus migration utility, v2.
 *
 * Commands:
 *   audit   - read-only analysis of the repo and extracted corpus package
 *   stage   - safely copy new metadata/enrichment into canonical repo locations
 *   verify  - validate corpus placement and optionally run the project's checks
 *   cleanup - move the extracted package outside the repository after verification
 *
 * This script never deletes or replaces an existing transcript automatically.
 */

import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const COMMAND = process.argv[2] || 'audit';
const ARGS = new Set(process.argv.slice(3));
const PACKAGE_PREFIX = 'askarchives_complete_corpus_three_quran_editions_windows';
const REPORT_DIR = path.join(ROOT, 'reports', 'corpus-migration');
const STATE_PATH = path.join(ROOT, '.corpus-migration-state.json');

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function slash(value) {
  return value.replace(/\\/g, '/');
}

function relative(value) {
  return slash(path.relative(ROOT, value));
}

function ensureDir(value) {
  mkdirSync(value, { recursive: true });
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256File(filePath) {
  return sha256Buffer(readFileSync(filePath));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function jsonHash(value) {
  return sha256Buffer(Buffer.from(stableJson(value), 'utf8'));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function listFilesRecursive(root, predicate = () => true) {
  if (!existsSync(root)) return [];
  const output = [];
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && predicate(full)) output.push(full);
    }
  }
  return output.sort();
}

function parseCsv(text) {
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

function csvObjects(filePath) {
  const rows = parseCsv(readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  if (!rows.length) return [];
  const headers = rows[0].map((value) => value.trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
}

function extractYoutubeId(link) {
  const value = String(link || '');
  return (
    value.match(/[?&]v=([A-Za-z0-9_-]{6,})/)?.[1]
    || value.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/)?.[1]
    || ''
  );
}

function normalizedTranscriptHash(filePath) {
  const rows = csvObjects(filePath).map((row) => ({
    title: String(row['Video Title'] || '').replace(/\s+/g, ' ').trim(),
    link: String(row.Link || '').trim(),
    start: String(row['Start Time'] || '').trim(),
    end: String(row['End Time'] || '').trim(),
    speaker: String(row.Speaker || '').replace(/\s+/g, ' ').trim(),
    text: String(row.Text || '').replace(/\s+/g, ' ').trim(),
  }));
  return jsonHash(rows);
}

function transcriptIdentity(filePath, kind, originalName = path.basename(filePath)) {
  const rows = csvObjects(filePath);
  const youtubeIds = [...new Set(rows.map((row) => extractYoutubeId(row.Link)).filter(Boolean))].sort();
  const titles = [...new Set(rows.map((row) => String(row['Video Title'] || '').trim()).filter(Boolean))].sort();
  const isArabic = /arabic/i.test(originalName);

  return {
    filePath,
    rel: relative(filePath),
    kind,
    originalName,
    isArabic,
    youtubeIds,
    titles,
    rowCount: rows.length,
    normalizedHash: normalizedTranscriptHash(filePath),
    byteHash: sha256File(filePath),
    identityKey: `${kind}:${isArabic ? 'ar' : 'default'}:${youtubeIds.join('|') || titles.join('|')}`,
  };
}

function findPackage(explicitPath) {
  if (explicitPath) {
    const resolved = path.resolve(ROOT, explicitPath);
    if (!existsSync(resolved)) throw new Error(`Package folder not found: ${resolved}`);
    return resolved;
  }

  const candidates = readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(PACKAGE_PREFIX))
    .map((entry) => path.join(ROOT, entry.name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

  if (!candidates.length) {
    throw new Error(
      `No extracted package folder beginning with "${PACKAGE_PREFIX}" was found in the repo root.`,
    );
  }

  if (candidates.length > 1) {
    console.warn(`Found multiple package folders. Using newest: ${path.basename(candidates[0])}`);
  }

  return candidates[0];
}

function findArgValue(name) {
  const prefix = `${name}=`;
  const raw = process.argv.slice(3).find((value) => value.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : null;
}

function assertRepoRoot() {
  const required = [
    'package.json',
    'data/catalog',
    'data/sources',
    'scripts/generate/generate_catalog_search_indices.mjs',
  ];

  const missing = required.filter((item) => !existsSync(path.join(ROOT, item)));
  if (missing.length) {
    throw new Error(`Run this from the SubmissionArchives repo root. Missing: ${missing.join(', ')}`);
  }
}

function gitStatus() {
  try {
    return execFileSync('git', ['status', '--short'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return ['Git status unavailable'];
  }
}

function readFileMap(packageRoot) {
  const mapPath = path.join(packageRoot, 'FILE_MAP.csv');
  if (!existsSync(mapPath)) throw new Error(`Package FILE_MAP.csv is missing: ${mapPath}`);
  return csvObjects(mapPath);
}

function packageTranscriptRecords(packageRoot, fileMap) {
  const categories = new Map([
    ['canonical_audio_transcript', 'audio'],
    ['canonical_video_transcript', 'video'],
    ['canonical_parallel_transcript', 'parallel'],
  ]);

  return fileMap
    .filter((row) => categories.has(row.category))
    .map((row) => {
      const filePath = path.join(packageRoot, ...row.package_path.split('/'));
      const originalName = path.basename(row.original_name_or_path || row.package_path);
      return transcriptIdentity(filePath, categories.get(row.category), originalName);
    });
}

function existingTranscriptRecords() {
  const roots = [
    ['audio', path.join(ROOT, 'data', 'sources', 'playlists', 'audio-transcripts')],
    ['video', path.join(ROOT, 'data', 'sources', 'playlists', 'video-transcripts')],
  ];

  const output = [];
  for (const [kind, dir] of roots) {
    for (const filePath of listFilesRecursive(dir, (item) => item.toLowerCase().endsWith('.csv'))) {
      output.push(transcriptIdentity(filePath, kind, path.basename(filePath)));
    }
  }
  return output;
}

function compareTranscripts(packageRecords, existingRecords) {
  const byHash = new Map();
  const byIdentity = new Map();

  for (const record of existingRecords) {
    const hashList = byHash.get(record.normalizedHash) || [];
    hashList.push(record);
    byHash.set(record.normalizedHash, hashList);

    const identityList = byIdentity.get(record.identityKey) || [];
    identityList.push(record);
    byIdentity.set(record.identityKey, identityList);
  }

  return packageRecords.map((record) => {
    const exact = byHash.get(record.normalizedHash) || [];
    const sameIdentity = byIdentity.get(record.identityKey) || [];

    let status = 'missing';
    if (exact.length) status = 'exact-duplicate';
    else if (sameIdentity.length) status = 'content-conflict';

    return {
      package: record,
      status,
      exactMatches: exact.map((item) => item.rel),
      identityMatches: sameIdentity.map((item) => ({
        path: item.rel,
        rows: item.rowCount,
        normalizedHash: item.normalizedHash,
      })),
    };
  });
}


function transcriptsAbsentFromPackage(packageRecords, existingRecords) {
  const packageHashes = new Set(packageRecords.map((record) => record.normalizedHash));
  return existingRecords
    .filter((record) => !packageHashes.has(record.normalizedHash))
    .map((record) => ({
      path: record.rel,
      kind: record.kind,
      originalName: record.originalName,
      youtubeIds: record.youtubeIds,
      titles: record.titles,
      rowCount: record.rowCount,
      normalizedHash: record.normalizedHash,
      identityKey: record.identityKey,
    }));
}

function duplicateTranscriptGroups(records) {
  const byHash = new Map();
  for (const record of records) {
    const list = byHash.get(record.normalizedHash) || [];
    list.push(record);
    byHash.set(record.normalizedHash, list);
  }

  return [...byHash.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([normalizedHash, list]) => ({
      normalizedHash,
      count: list.length,
      paths: list.map((record) => record.rel),
      identityKeys: [...new Set(list.map((record) => record.identityKey))],
    }));
}

function transcriptIdentityConflictGroups(records) {
  const byIdentity = new Map();
  for (const record of records) {
    const list = byIdentity.get(record.identityKey) || [];
    list.push(record);
    byIdentity.set(record.identityKey, list);
  }

  return [...byIdentity.entries()]
    .filter(([, list]) => new Set(list.map((record) => record.normalizedHash)).size > 1)
    .map(([identityKey, list]) => ({
      identityKey,
      count: list.length,
      variants: list.map((record) => ({
        path: record.rel,
        rowCount: record.rowCount,
        normalizedHash: record.normalizedHash,
      })),
    }));
}

function archiveNumberFromEnrichment(data, documentId) {
  const explicit = Number(data.archive_number);
  if (Number.isInteger(explicit) && explicit > 0) return explicit;

  const candidates = [
    String(documentId || ''),
    String(data.title || ''),
    String(data.source_file || ''),
  ];

  for (const value of candidates) {
    const patterns = [
      /(?:azhar|behrouz|parivash|roxana)[^\d]{0,4}(\d{1,3})(?:-|:|\s)/i,
      /(?:study|sermon|zikr)[^\d]{0,4}(\d{1,3})(?:-|:|\s)/i,
      /(?:^|[\\/])(\d{1,3})\s*-/,
    ];
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) return Number(match[1]);
    }
  }

  return null;
}

function archiveNumberFromTranscript(record) {
  const match = String(record.originalName || '').match(/^(\d{1,3})\s*-/);
  return match ? Number(match[1]) : null;
}

function canonicalTranscriptPath(record, existingRecords) {
  const exact = existingRecords.find(
    (candidate) => candidate.normalizedHash === record.normalizedHash,
  );
  return exact?.rel || null;
}

function enrichmentCoverage(chosen, catalog, packageTranscripts = [], existingTranscripts = []) {
  const byId = new Map(catalog.map((record) => [record.id, record]));
  const byYoutube = new Map();
  for (const record of catalog) {
    if (!record.youtubeId) continue;
    const list = byYoutube.get(record.youtubeId) || [];
    list.push(record);
    byYoutube.set(record.youtubeId, list);
  }

  const audioByNumber = new Map();
  for (const record of packageTranscripts.filter((item) => item.kind === 'audio')) {
    const number = archiveNumberFromTranscript(record);
    if (number) audioByNumber.set(number, record);
  }

  return chosen.map(({ documentId, record, duplicateCopies }) => {
    const exact = byId.get(documentId);
    const declaredYoutubeId = String(record.data.youtube_id || '').trim();
    const declaredYoutubeMatches = declaredYoutubeId && declaredYoutubeId !== 'unknown'
      ? (byYoutube.get(declaredYoutubeId) || [])
      : [];

    let mapping = exact
      ? 'exact-document-id'
      : declaredYoutubeMatches.length
        ? 'youtube-id'
        : 'unmatched';
    let catalogMatches = exact ? [exact] : declaredYoutubeMatches;
    let resolvedYoutubeId = declaredYoutubeId && declaredYoutubeId !== 'unknown'
      ? declaredYoutubeId
      : '';
    let resolvedYoutubeUrl = String(record.data.youtube_url || '').trim();
    let canonicalTranscript = null;
    let archiveNumber = null;

    if (mapping === 'unmatched' && String(documentId).startsWith('audio-program/')) {
      archiveNumber = archiveNumberFromEnrichment(record.data, documentId);
      const transcript = archiveNumber ? audioByNumber.get(archiveNumber) : null;
      const transcriptYoutubeId = transcript?.youtubeIds?.[0] || '';
      const fallbackMatches = transcriptYoutubeId
        ? (byYoutube.get(transcriptYoutubeId) || [])
        : [];

      if (transcript && fallbackMatches.length) {
        mapping = 'archive-number-to-canonical-youtube';
        catalogMatches = fallbackMatches;
        resolvedYoutubeId = transcriptYoutubeId;
        resolvedYoutubeUrl = `https://www.youtube.com/watch?v=${transcriptYoutubeId}`;
        canonicalTranscript = canonicalTranscriptPath(transcript, existingTranscripts);
      }
    }

    if (!canonicalTranscript && resolvedYoutubeId) {
      const transcript = packageTranscripts.find(
        (candidate) => candidate.youtubeIds.includes(resolvedYoutubeId),
      );
      if (transcript) {
        canonicalTranscript = canonicalTranscriptPath(transcript, existingTranscripts);
        archiveNumber = archiveNumber || archiveNumberFromTranscript(transcript);
      }
    }

    return {
      documentId,
      title: record.data.title || '',
      reviewStatus: record.data.review_status || '',
      sectionCount: Array.isArray(record.data.sections) ? record.data.sections.length : 0,
      duplicateCopies,
      mapping,
      catalogIds: catalogMatches.map((item) => item.id),
      declaredYoutubeId,
      resolvedYoutubeId,
      resolvedYoutubeUrl,
      canonicalTranscriptPath: canonicalTranscript,
      archiveNumber,
      sourceFile: slash(path.relative(ROOT, record.filePath)),
    };
  });
}

function normalizedEnrichmentData(data, coverage) {
  const normalized = JSON.parse(JSON.stringify(data));
  normalized.canonical_document_id = coverage.catalogIds[0] || null;
  normalized.canonical_catalog_ids = coverage.catalogIds;
  normalized.canonical_mapping = coverage.mapping;

  if (coverage.resolvedYoutubeId) {
    normalized.youtube_id = coverage.resolvedYoutubeId;
    normalized.youtube_url = coverage.resolvedYoutubeUrl
      || `https://www.youtube.com/watch?v=${coverage.resolvedYoutubeId}`;
  }

  if (coverage.canonicalTranscriptPath) {
    normalized.source_file = coverage.canonicalTranscriptPath;
  }

  if (
    coverage.archiveNumber
    && (!Number.isInteger(Number(normalized.archive_number)) || Number(normalized.archive_number) < 1)
  ) {
    normalized.archive_number = coverage.archiveNumber;
  }

  normalized.canonical_evidence_rule = (
    'Enrichment is draft retrieval metadata. Quote only the canonical source identified '
    + 'by canonical_document_id and source_file.'
  );

  return normalized;
}

function writeNormalizedJson(destination, value, stamp, operations) {
  ensureDir(path.dirname(destination));
  const serialized = `${JSON.stringify(value, null, 2)}\n`;

  if (existsSync(destination)) {
    const existing = readFileSync(destination, 'utf8');
    if (existing === serialized) {
      operations.push({ action: 'unchanged', destination: relative(destination) });
      return;
    }
    backupFile(destination, stamp);
  }

  writeFileSync(destination, serialized, 'utf8');
  operations.push({
    action: 'created-or-updated',
    destination: relative(destination),
  });
}

function enrichmentGroups(packageRoot, folderName) {
  const root = path.join(packageRoot, folderName);
  const groups = new Map();

  for (const filePath of listFilesRecursive(root, (item) => item.toLowerCase().endsWith('.json'))) {
    const data = readJson(filePath);
    const id = String(data.document_id || '').trim();
    if (!id) continue;
    const list = groups.get(id) || [];
    list.push({ filePath, data, hash: jsonHash(data) });
    groups.set(id, list);
  }

  return groups;
}

function chooseDeduplicated(groups) {
  const chosen = [];
  const conflicts = [];

  for (const [documentId, records] of groups) {
    const hashes = new Set(records.map((record) => record.hash));
    if (hashes.size === 1) {
      chosen.push({
        documentId,
        record: records[0],
        duplicateCopies: records.length - 1,
      });
      continue;
    }

    const ranked = [...records].sort((a, b) => {
      const aSections = Array.isArray(a.data.sections) ? a.data.sections.length : 0;
      const bSections = Array.isArray(b.data.sections) ? b.data.sections.length : 0;
      if (bSections !== aSections) return bSections - aSections;
      return String(b.data.schema_version || '').localeCompare(String(a.data.schema_version || ''));
    });

    conflicts.push({
      documentId,
      candidates: ranked.map((record) => ({
        path: slash(path.relative(ROOT, record.filePath)),
        hash: record.hash,
        schemaVersion: record.data.schema_version,
        sectionCount: Array.isArray(record.data.sections) ? record.data.sections.length : 0,
      })),
    });
  }

  return { chosen, conflicts };
}

function catalogRecords() {
  const master = path.join(ROOT, 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');
  if (!existsSync(master)) return [];
  return readJson(master);
}

function inspectCanonicalSources(packageRoot) {
  const checks = [
    {
      package: path.join(packageRoot, 'written', 'quran1981', 'Q1981.json'),
      canonical: path.join(ROOT, 'data', 'sources', 'quran', '1981', 'Quran1981_complete.json'),
      label: '1981 Quran complete JSON',
    },
    {
      package: path.join(packageRoot, 'written', 'quran1989', 'Q1989.json'),
      canonical: path.join(ROOT, 'data', 'sources', 'quran', '1989', 'Quran1989_complete.json'),
      label: '1989 Quran complete JSON',
    },
  ];

  return checks.map((check) => {
    const packageExists = existsSync(check.package);
    const canonicalExists = existsSync(check.canonical);
    const sameBytes = packageExists && canonicalExists
      ? sha256File(check.package) === sha256File(check.canonical)
      : false;

    return {
      label: check.label,
      packagePath: relative(check.package),
      canonicalPath: relative(check.canonical),
      packageExists,
      canonicalExists,
      sameBytes,
      action: !canonicalExists && packageExists
        ? 'copy-missing-only'
        : sameBytes
          ? 'leave-canonical'
          : 'manual-review-no-overwrite',
    };
  });
}

function textReferencesToPackage(packageRoot) {
  const packageName = path.basename(packageRoot);
  const searchableRoots = ['src', 'scripts', 'data/catalog', 'tests']
    .map((item) => path.join(ROOT, item))
    .filter(existsSync);
  const matches = [];

  for (const searchRoot of searchableRoots) {
    for (const filePath of listFilesRecursive(searchRoot, (item) =>
      /\.(?:ts|tsx|js|mjs|cjs|json|md|sql|csv)$/i.test(item),
    )) {
      const relPath = relative(filePath);
      if (relPath === 'scripts/corpus/integrate-complete-corpus.mjs') continue;

      const text = readFileSync(filePath, 'utf8');
      if (text.includes(packageName) || text.includes(PACKAGE_PREFIX)) {
        matches.push(relPath);
      }
    }
  }

  return matches;
}

function currentRagSnapshot() {
  const files = [
    'scripts/rag/build-and-ingest.ts',
    'scripts/rag/lib/chunking.ts',
    'src/lib/rag/retrieval.ts',
    'src/lib/rag/prompt.ts',
    'src/lib/rag/mistral.ts',
    'src/app/api/ask/route.ts',
    '.env.example',
  ];

  return files.map((relPath) => {
    const filePath = path.join(ROOT, relPath);
    return {
      path: relPath,
      exists: existsSync(filePath),
      sha256: existsSync(filePath) ? sha256File(filePath) : null,
      modifiedInGit: gitStatus().some((line) => line.slice(3).trim() === relPath),
    };
  });
}

function audit(packageRoot) {
  const fileMap = readFileMap(packageRoot);
  const packageTranscripts = packageTranscriptRecords(packageRoot, fileMap);
  const existingTranscripts = existingTranscriptRecords();
  const transcriptComparison = compareTranscripts(packageTranscripts, existingTranscripts);
  const existingOnlyTranscripts = transcriptsAbsentFromPackage(
    packageTranscripts,
    existingTranscripts,
  );
  const existingDuplicateGroups = duplicateTranscriptGroups(existingTranscripts);
  const existingIdentityConflicts = transcriptIdentityConflictGroups(existingTranscripts);

  const enrichment = chooseDeduplicated(enrichmentGroups(packageRoot, 'enrichment'));
  const evaluation = chooseDeduplicated(enrichmentGroups(packageRoot, 'evaluation'));
  const catalog = catalogRecords();
  const coverage = enrichmentCoverage(
    enrichment.chosen,
    catalog,
    packageTranscripts,
    existingTranscripts,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    command: 'audit',
    repoRoot: ROOT,
    packageRoot,
    gitStatus: gitStatus(),
    importantFindings: [
      'The canonical transcript directories must remain in place because the catalog generator reads them directly.',
      'The extracted root package is not a live application route or build input.',
      'Package transcript copies must not be added beside canonical CSVs unless a transcript is genuinely missing.',
      'The current RAG ingester reads MASTER_INDEX.json; enrichment JSON requires a separate ingestion upgrade.',
      'Version 2 repairs stale or unknown enrichment YouTube IDs through the canonical numbered transcript.',
    ],
    transcriptSummary: {
      packageCount: packageTranscripts.length,
      existingCount: existingTranscripts.length,
      exactDuplicates: transcriptComparison.filter((item) => item.status === 'exact-duplicate').length,
      contentConflicts: transcriptComparison.filter((item) => item.status === 'content-conflict').length,
      missing: transcriptComparison.filter((item) => item.status === 'missing').length,
      existingOnly: existingOnlyTranscripts.length,
      duplicateGroupsInsideCanonicalFolders: existingDuplicateGroups.length,
      identityConflictsInsideCanonicalFolders: existingIdentityConflicts.length,
    },
    transcriptComparison,
    existingOnlyTranscripts,
    existingDuplicateGroups,
    existingIdentityConflicts,
    enrichmentSummary: {
      packageFiles: [...enrichmentGroups(packageRoot, 'enrichment').values()].reduce((sum, list) => sum + list.length, 0),
      uniqueDocuments: enrichment.chosen.length,
      duplicateCopiesRemoved: enrichment.chosen.reduce((sum, item) => sum + item.duplicateCopies, 0),
      conflicts: enrichment.conflicts.length,
      exactCatalogMappings: coverage.filter((item) => item.mapping === 'exact-document-id').length,
      youtubeMappings: coverage.filter((item) => item.mapping === 'youtube-id').length,
      repairedArchiveMappings: coverage.filter(
        (item) => item.mapping === 'archive-number-to-canonical-youtube',
      ).length,
      unmatched: coverage.filter((item) => item.mapping === 'unmatched').length,
    },
    enrichmentCoverage: coverage,
    enrichmentConflicts: enrichment.conflicts,
    evaluationSummary: {
      uniqueDocuments: evaluation.chosen.length,
      duplicateCopiesRemoved: evaluation.chosen.reduce((sum, item) => sum + item.duplicateCopies, 0),
      conflicts: evaluation.conflicts.length,
    },
    canonicalSourceChecks: inspectCanonicalSources(packageRoot),
    packageReferencesInLiveCode: textReferencesToPackage(packageRoot),
    ragSnapshot: currentRagSnapshot(),
  };

  return report;
}

function markdownReport(report) {
  const lines = [
    '# Corpus Migration Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Immediate conclusion',
    '',
    '- **Keep** `data/sources/playlists/audio-transcripts`.',
    '- **Keep** `data/sources/playlists/video-transcripts`.',
    '- Treat the extracted complete-corpus folder as an import package only.',
    '- Do not copy its shortened transcript files into the live transcript directories.',
    '',
    '## Transcript comparison',
    '',
    `- Package transcripts: ${report.transcriptSummary.packageCount}`,
    `- Existing canonical transcripts: ${report.transcriptSummary.existingCount}`,
    `- Exact duplicates: ${report.transcriptSummary.exactDuplicates}`,
    `- Same source but different content: ${report.transcriptSummary.contentConflicts}`,
    `- Missing from canonical folders: ${report.transcriptSummary.missing}`,
    `- Existing canonical CSVs not represented in the package: ${report.transcriptSummary.existingOnly}`,
    `- Exact duplicate groups already inside canonical folders: ${report.transcriptSummary.duplicateGroupsInsideCanonicalFolders}`,
    `- Same recording identity with conflicting canonical content: ${report.transcriptSummary.identityConflictsInsideCanonicalFolders}`,
    '',
    '## Enrichment',
    '',
    `- Package enrichment files: ${report.enrichmentSummary.packageFiles}`,
    `- Unique enrichment documents: ${report.enrichmentSummary.uniqueDocuments}`,
    `- Duplicate copies removed: ${report.enrichmentSummary.duplicateCopiesRemoved}`,
    `- Conflicting enrichment documents: ${report.enrichmentSummary.conflicts}`,
    `- Exact catalog mappings: ${report.enrichmentSummary.exactCatalogMappings}`,
    `- YouTube fallback mappings: ${report.enrichmentSummary.youtubeMappings}`,
    `- Repaired archive-number mappings: ${report.enrichmentSummary.repairedArchiveMappings}`,
    `- Unmatched after repair: ${report.enrichmentSummary.unmatched}`,
    '',
    '## Git state',
    '',
    '```text',
    ...(report.gitStatus.length ? report.gitStatus : ['clean']),
    '```',
    '',
    '## RAG files',
    '',
    ...report.ragSnapshot.map((item) =>
      `- \`${item.path}\`: ${item.exists ? item.sha256 : 'missing'}${item.modifiedInGit ? ' — locally modified' : ''}`,
    ),
    '',
    '## Next safe action',
    '',
    'Run the `stage` command only after reviewing the JSON report. Staging imports enrichment, evaluation metadata, guides, and corpus comparison files. It does not delete or replace canonical transcripts.',
  ];

  return `${lines.join('\n')}\n`;
}

function backupFile(filePath, stamp) {
  if (!existsSync(filePath)) return null;
  const relPath = path.relative(ROOT, filePath);
  const backupPath = path.join(ROOT, '.corpus-migration-backup', stamp, relPath);
  ensureDir(path.dirname(backupPath));
  copyFileSync(filePath, backupPath);
  return backupPath;
}

function safeCopy(source, destination, stamp, operations, { overwrite = false } = {}) {
  if (!existsSync(source)) return { status: 'missing-source' };

  ensureDir(path.dirname(destination));
  if (existsSync(destination)) {
    if (sha256File(source) === sha256File(destination)) {
      operations.push({ action: 'unchanged', destination: relative(destination) });
      return { status: 'unchanged' };
    }
    if (!overwrite) {
      operations.push({
        action: 'conflict-not-overwritten',
        source: relative(source),
        destination: relative(destination),
      });
      return { status: 'conflict' };
    }
    backupFile(destination, stamp);
  }

  copyFileSync(source, destination);
  operations.push({
    action: existsSync(destination) ? 'copied' : 'created',
    source: relative(source),
    destination: relative(destination),
  });
  return { status: 'copied' };
}

function appendGitignoreEntries(stamp, operations) {
  const gitignore = path.join(ROOT, '.gitignore');
  const entries = [
    `/${PACKAGE_PREFIX}*/`,
    '/.corpus-migration-backup/',
    '/.corpus-migration-state.json',
  ];
  const original = readFileSync(gitignore, 'utf8');
  const missing = entries.filter((entry) => !original.includes(entry));
  if (!missing.length) return;

  backupFile(gitignore, stamp);
  const block = `\n# Local corpus import and rollback artifacts\n${missing.join('\n')}\n`;
  writeFileSync(gitignore, original.replace(/\s*$/, '\n') + block, 'utf8');
  operations.push({ action: 'updated', destination: '.gitignore', added: missing });
}

function stage(packageRoot, report) {
  if (report.enrichmentConflicts.length) {
    throw new Error(
      `Refusing to stage: ${report.enrichmentConflicts.length} enrichment document(s) have non-identical duplicates.`,
    );
  }

  const stamp = nowStamp();
  const operations = [];

  appendGitignoreEntries(stamp, operations);

  // Guides become documentation, not runtime input.
  const packageGuides = path.join(packageRoot, 'guides');
  if (existsSync(packageGuides)) {
    const destination = path.join(ROOT, 'docs', 'corpus');
    ensureDir(destination);
    for (const source of listFilesRecursive(packageGuides)) {
      const dest = path.join(destination, path.basename(source));
      safeCopy(source, dest, stamp, operations);
    }
  }

  // Small corpus metadata and edition comparison files.
  const selectedDataFiles = [
    'all_source_inventory.csv',
    'corpus_manifest.json',
    'quran_edition_comparison_stats.json',
    'quran_three_edition_comparison.csv',
    'quran_three_edition_comparison.jsonl',
    'source_priority_rules.json',
    'sura9_128_129_dossier.json',
    'written_document_index.csv',
    'written_relationships.csv',
  ];

  for (const name of selectedDataFiles) {
    safeCopy(
      path.join(packageRoot, 'data', name),
      path.join(ROOT, 'data', 'corpus', name),
      stamp,
      operations,
    );
  }

  // Dedupe and normalize enrichment by document_id.
  const enrichment = chooseDeduplicated(enrichmentGroups(packageRoot, 'enrichment'));
  const evaluation = chooseDeduplicated(enrichmentGroups(packageRoot, 'evaluation'));
  const catalog = catalogRecords();
  const packageTranscripts = packageTranscriptRecords(packageRoot, readFileMap(packageRoot));
  const existingTranscripts = existingTranscriptRecords();
  const coverage = enrichmentCoverage(
    enrichment.chosen,
    catalog,
    packageTranscripts,
    existingTranscripts,
  );
  const unmatchedCoverage = coverage.filter((item) => item.mapping === 'unmatched');

  if (unmatchedCoverage.length && !ARGS.has('--allow-unmatched-enrichment')) {
    throw new Error(
      `Refusing to stage: ${unmatchedCoverage.length} enrichment document(s) remain unmatched. `
      + 'Review the v2 audit or pass --allow-unmatched-enrichment deliberately.',
    );
  }

  const coverageById = new Map(coverage.map((item) => [item.documentId, item]));

  for (const item of enrichment.chosen) {
    const destination = path.join(ROOT, 'data', 'rag_enrichment', `${item.documentId}.json`);
    const mapped = coverageById.get(item.documentId);
    writeNormalizedJson(
      destination,
      normalizedEnrichmentData(item.record.data, mapped),
      stamp,
      operations,
    );
  }

  for (const item of evaluation.chosen) {
    const destination = path.join(ROOT, 'data', 'rag_eval', `${item.documentId}.json`);
    const mapped = coverageById.get(item.documentId);
    const normalized = JSON.parse(JSON.stringify(item.record.data));
    normalized.canonical_document_id = mapped?.catalogIds?.[0] || null;
    normalized.canonical_catalog_ids = mapped?.catalogIds || [];
    normalized.canonical_mapping = mapped?.mapping || 'unmatched';
    writeNormalizedJson(destination, normalized, stamp, operations);
  }

  writeJson(path.join(ROOT, 'data', 'rag_enrichment', 'manifest.json'), {
    generatedAt: new Date().toISOString(),
    reviewRule: 'All enrichment remains draft metadata and may never be quoted as canonical evidence.',
    sourcePackage: path.basename(packageRoot),
    uniqueDocuments: enrichment.chosen.length,
    duplicateCopiesRemoved: enrichment.chosen.reduce((sum, item) => sum + item.duplicateCopies, 0),
    catalogCoverage: coverage,
  });
  operations.push({ action: 'created-or-updated', destination: 'data/rag_enrichment/manifest.json' });

  // Preserve current canonical source paths. Copy only a genuinely absent historical
  // Quran complete JSON, never overwrite a different existing transcription.
  const sourceChecks = inspectCanonicalSources(packageRoot);
  for (const check of sourceChecks) {
    if (check.action !== 'copy-missing-only') continue;
    safeCopy(
      path.join(ROOT, check.packagePath),
      path.join(ROOT, check.canonicalPath),
      stamp,
      operations,
    );
  }

  // Package transcript copies are only used to fill a genuinely missing recording.
  const missing = report.transcriptComparison.filter((item) => item.status === 'missing');
  if (missing.length && ARGS.has('--copy-missing-transcripts')) {
    for (const item of missing) {
      const packageRecord = item.package;
      const destinationRoot = packageRecord.kind === 'audio'
        ? path.join(ROOT, 'data', 'sources', 'playlists', 'audio-transcripts')
        : path.join(ROOT, 'data', 'sources', 'playlists', 'video-transcripts');
      const safeName = packageRecord.originalName.replace(/[<>:"/\\|?*]/g, '_');
      safeCopy(packageRecord.filePath, path.join(destinationRoot, safeName), stamp, operations);
    }
  }

  const state = {
    stagedAt: new Date().toISOString(),
    packageRoot,
    stamp,
    operations,
    verificationPassed: false,
  };
  writeJson(STATE_PATH, state);

  return state;
}

function runCommand(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(' ')}`);
  }
}

function verify(packageRoot) {
  const report = audit(packageRoot);
  const errors = [];

  if (report.transcriptSummary.contentConflicts > 0) {
    errors.push(`${report.transcriptSummary.contentConflicts} package transcript identity conflict(s)`);
  }

  if (report.transcriptSummary.identityConflictsInsideCanonicalFolders > 0) {
    errors.push(
      `${report.transcriptSummary.identityConflictsInsideCanonicalFolders} canonical transcript identity conflict group(s)`,
    );
  }

  if (
    report.enrichmentSummary.unmatched > 0
    && !ARGS.has('--allow-unmatched-enrichment')
  ) {
    errors.push(`${report.enrichmentSummary.unmatched} enrichment document(s) remain unmatched`);
  }

  if (report.packageReferencesInLiveCode.length > 0) {
    errors.push(`Live code references the extracted package: ${report.packageReferencesInLiveCode.join(', ')}`);
  }

  const manifest = path.join(ROOT, 'data', 'rag_enrichment', 'manifest.json');
  if (!existsSync(manifest)) {
    errors.push('data/rag_enrichment/manifest.json is missing; run stage first');
  }

  if (!ARGS.has('--skip-project-checks')) {
    runCommand('npm', ['run', 'generate:catalog']);
    runCommand('npm', ['run', 'validate:catalog']);
    runCommand('npm', ['test']);
    runCommand('npm', ['run', 'typecheck']);
  }

  const state = existsSync(STATE_PATH) ? readJson(STATE_PATH) : {};
  state.verificationPassed = errors.length === 0;
  state.verifiedAt = new Date().toISOString();
  state.verificationErrors = errors;
  writeJson(STATE_PATH, state);

  if (errors.length) {
    throw new Error(`Verification failed:\n- ${errors.join('\n- ')}`);
  }

  return { ok: true, report };
}

function cleanup(packageRoot) {
  if (!existsSync(STATE_PATH)) {
    throw new Error('No migration state exists. Run stage and verify first.');
  }
  const state = readJson(STATE_PATH);
  if (!state.verificationPassed) {
    throw new Error('Verification has not passed. Refusing to move the package.');
  }

  const archiveRoot = findArgValue('--archive')
    ? path.resolve(ROOT, findArgValue('--archive'))
    : path.resolve(ROOT, '..', '_askarchives_corpus_packages');
  ensureDir(archiveRoot);

  let destination = path.join(archiveRoot, path.basename(packageRoot));
  if (existsSync(destination)) destination += `-${nowStamp()}`;

  renameSync(packageRoot, destination);
  state.packageMovedTo = destination;
  state.cleanedAt = new Date().toISOString();
  writeJson(STATE_PATH, state);

  return destination;
}

function saveAudit(report) {
  ensureDir(REPORT_DIR);
  const stamp = nowStamp();
  const jsonPath = path.join(REPORT_DIR, `${stamp}-audit.json`);
  const mdPath = path.join(REPORT_DIR, `${stamp}-audit.md`);
  writeJson(jsonPath, report);
  writeFileSync(mdPath, markdownReport(report), 'utf8');
  writeJson(path.join(REPORT_DIR, 'latest-audit.json'), report);
  writeFileSync(path.join(REPORT_DIR, 'latest-audit.md'), markdownReport(report), 'utf8');
  console.log(`Audit JSON: ${relative(jsonPath)}`);
  console.log(`Audit Markdown: ${relative(mdPath)}`);
}

function main() {
  assertRepoRoot();
  const packageRoot = findPackage(findArgValue('--package'));

  if (COMMAND === 'audit') {
    const report = audit(packageRoot);
    saveAudit(report);
    console.log('\nRead-only audit completed. No files were changed.');
    console.log(JSON.stringify(report.transcriptSummary, null, 2));
    console.log(JSON.stringify(report.enrichmentSummary, null, 2));
    return;
  }

  if (COMMAND === 'stage') {
    const report = audit(packageRoot);
    saveAudit(report);
    const state = stage(packageRoot, report);
    console.log(`\nStaged ${state.operations.length} operation(s).`);
    console.log('Canonical transcript directories were preserved.');
    console.log('Run verify next.');
    return;
  }

  if (COMMAND === 'verify') {
    verify(packageRoot);
    console.log('\nVerification passed.');
    return;
  }

  if (COMMAND === 'cleanup') {
    const destination = cleanup(packageRoot);
    console.log(`\nMoved extracted package outside the repo:\n${destination}`);
    return;
  }

  throw new Error(`Unknown command: ${COMMAND}. Use audit, stage, verify, or cleanup.`);
}

try {
  main();
} catch (error) {
  console.error(`\nCorpus migration failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
