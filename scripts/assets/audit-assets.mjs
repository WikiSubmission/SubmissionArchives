// Phase 1 repository & asset inventory audit. Strictly read-only: walks the repo and writes
// reports under reports/. Run with `npm run audit:assets` or `node scripts/assets/audit-assets.mjs`.
import fsp from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  WALK_ROOTS,
  IMAGE_EXTENSIONS,
  listRepositoryFiles,
  toPosix,
  sha256File,
  mapWithConcurrency,
  writeCsv,
  writeJson,
  writeText,
  extensionOf,
  loadTextCandidates,
  loadCatalogTextCandidates,
  loadRootConfigFiles,
  buildCatalogRecordIndex,
  matchesPackage,
  runNpmScript,
  dirSizeBytes,
} from './audit-lib.mjs';

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const HASH_CONCURRENCY = 6;

// Devdependencies driven purely by CLI/build-tool wiring (npm scripts, framework internals) with no
// expected static import signature; a static scan finding nothing for these is inconclusive rather
// than proof of being unused.
const CLI_OR_PEER_ONLY = new Set(['typescript', 'tsx', 'ts-node', 'react-dom']);

async function main() {
  const files = listRepositoryFiles(ROOT);
  const fileEntries = await statFiles(files);

  await writeRepositoryFilesCsv(fileEntries);
  await writeDirectorySizesCsv(fileEntries);

  const hashableEntries = fileEntries.filter(
    (entry) => entry.relPath.startsWith('public/') || entry.relPath.startsWith('data/'),
  );
  const hashes = await mapWithConcurrency(hashableEntries, HASH_CONCURRENCY, (entry) =>
    sha256File(path.join(ROOT, entry.relPath)),
  );
  const hashByRelPath = new Map(hashableEntries.map((entry, index) => [entry.relPath, hashes[index]]));

  const duplicateGroupIdByHash = await writeDuplicateFilesCsv(hashableEntries, hashByRelPath);

  const publicEntries = fileEntries.filter((entry) => entry.relPath.startsWith('public/'));
  const referenceIndex = await buildReferenceIndex(publicEntries);
  const catalogRecordIndex = await buildCatalogRecordIndex(ROOT);

  await writeImageInventoryAndReferences(
    publicEntries,
    hashByRelPath,
    duplicateGroupIdByHash,
    referenceIndex,
    catalogRecordIndex,
  );
  await writeOrphanAssetsCsv(publicEntries, referenceIndex);
  await writeDependencyUsageJson();
  await writeRouteMapMarkdown();
  await writeBaselineMetrics();

  console.log(`Audit complete. Reports written to ${path.relative(ROOT, REPORTS_DIR)}/`);
}

async function statFiles(relPaths) {
  const entries = [];
  for (const relPath of relPaths) {
    const absPath = path.join(ROOT, relPath);
    const stat = await fsp.stat(absPath).catch(() => null);
    if (!stat || !stat.isFile()) continue;
    entries.push({ relPath, size: stat.size });
  }
  return entries;
}

async function writeRepositoryFilesCsv(fileEntries) {
  const rows = fileEntries.map((entry) => [entry.relPath, entry.size, extensionOf(entry.relPath)]);
  await writeCsv(path.join(REPORTS_DIR, 'repository-files.csv'), ['path', 'size_bytes', 'extension'], rows);
}

async function writeDirectorySizesCsv(fileEntries) {
  const totals = new Map(); // directory -> { size, count }
  function addTo(dir, size) {
    const current = totals.get(dir) ?? { size: 0, count: 0 };
    current.size += size;
    current.count += 1;
    totals.set(dir, current);
  }

  for (const entry of fileEntries) {
    const segments = entry.relPath.split('/');
    if (segments.length < 2) continue; // root-level loose file, not under a walked directory
    const rootName = segments[0];
    if (!WALK_ROOTS.includes(rootName)) continue;
    addTo(rootName, entry.size); // top-level
    if (segments.length >= 3) {
      addTo(`${rootName}/${segments[1]}`, entry.size); // second-level
    }
  }

  const rows = [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([directory, stats]) => [directory, stats.size, stats.count]);
  await writeCsv(path.join(REPORTS_DIR, 'directory-sizes.csv'), ['directory', 'size_bytes', 'file_count'], rows);
}

async function writeDuplicateFilesCsv(hashableEntries, hashByRelPath) {
  const groups = new Map(); // hash -> relPath[]
  for (const entry of hashableEntries) {
    const hash = hashByRelPath.get(entry.relPath);
    const list = groups.get(hash) ?? [];
    list.push(entry.relPath);
    groups.set(hash, list);
  }

  const duplicateHashes = [...groups.entries()]
    .filter(([, paths]) => paths.length >= 2)
    .sort(([a], [b]) => a.localeCompare(b));

  const duplicateGroupIdByHash = new Map(duplicateHashes.map(([hash], index) => [hash, `group-${index + 1}`]));

  const rows = duplicateHashes.map(([hash, paths]) => [hash, paths.length, [...paths].sort().join(';')]);
  await writeCsv(path.join(REPORTS_DIR, 'duplicate-files.csv'), ['sha256', 'duplicate_group_size', 'paths'], rows);
  return duplicateGroupIdByHash;
}

/** Build a map of public-relative asset path -> list of { file, type } references, by scanning
 * src/** text files and the generated catalog JSON files for literal string occurrences. */
async function buildReferenceIndex(publicEntries) {
  const srcCandidates = await loadTextCandidates(ROOT, 'src', 'source');
  const catalogCandidates = await loadCatalogTextCandidates(ROOT, 'catalog');
  const candidates = [...srcCandidates, ...catalogCandidates];

  const index = new Map();
  for (const entry of publicEntries) {
    const publicRelPath = '/' + entry.relPath.slice('public/'.length);
    const referencedBy = [];
    for (const candidate of candidates) {
      if (candidate.content.includes(publicRelPath)) {
        referencedBy.push({ file: candidate.relPath, type: candidate.type });
      }
    }
    index.set(publicRelPath, referencedBy);
  }
  return index;
}

async function writeImageInventoryAndReferences(
  publicEntries,
  hashByRelPath,
  duplicateGroupIdByHash,
  referenceIndex,
  catalogRecordIndex,
) {
  const imageEntries = publicEntries.filter((entry) => IMAGE_EXTENSIONS.has(extensionOf(entry.relPath)));
  const inventoryRows = [];
  const referenceRows = [];

  for (const entry of imageEntries) {
    const publicRelPath = '/' + entry.relPath.slice('public/'.length);
    const format = extensionOf(entry.relPath).slice(1);
    const isSvg = format === 'svg';
    let width = '';
    let height = '';
    if (!isSvg) {
      try {
        const metadata = await sharp(path.join(ROOT, entry.relPath)).metadata();
        width = metadata.width ?? '';
        height = metadata.height ?? '';
      } catch {
        // Leave blank if sharp cannot read the file (e.g. corrupt image).
      }
    }

    const referencedBy = referenceIndex.get(publicRelPath) ?? [];
    const hash = hashByRelPath.get(entry.relPath) ?? '';
    const sourceOrGenerated = /^public\/content\/[^/]+\/thumbnails\//.test(entry.relPath)
      ? 'generated'
      : 'source';
    const duplicateGroup = duplicateGroupIdByHash.get(hash) ?? '';
    const optimizationStatus =
      (format === 'jpg' || format === 'jpeg' || format === 'png') && entry.size > 500000 ? 'unoptimized' : 'ok';

    inventoryRows.push([
      entry.relPath,
      entry.size,
      hash,
      width,
      height,
      isSvg ? 'svg' : format,
      referencedBy.map((ref) => ref.file).join(';'),
      referencedBy.length,
      catalogRecordIndex.get(publicRelPath) ?? '',
      sourceOrGenerated,
      duplicateGroup,
      optimizationStatus,
    ]);

    for (const ref of referencedBy) {
      referenceRows.push([publicRelPath, ref.file, ref.type]);
    }
  }

  await writeCsv(
    path.join(REPORTS_DIR, 'image-inventory.csv'),
    [
      'path',
      'size_bytes',
      'sha256',
      'width',
      'height',
      'format',
      'referenced_by',
      'reference_count',
      'catalog_record_id',
      'source_or_generated',
      'duplicate_group',
      'optimization_status',
    ],
    inventoryRows,
  );

  await writeCsv(
    path.join(REPORTS_DIR, 'asset-references.csv'),
    ['asset_path', 'referenced_from', 'reference_type'],
    referenceRows,
  );
}

async function writeOrphanAssetsCsv(publicEntries, referenceIndex) {
  const rows = [];
  for (const entry of publicEntries) {
    const publicRelPath = '/' + entry.relPath.slice('public/'.length);
    const referencedBy = referenceIndex.get(publicRelPath) ?? [];
    if (referencedBy.length === 0) rows.push([entry.relPath, entry.size]);
  }
  await writeCsv(path.join(REPORTS_DIR, 'orphan-assets.csv'), ['path', 'size_bytes'], rows);
}

async function writeDependencyUsageJson() {
  const packageJson = JSON.parse(await fsp.readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const dependencies = packageJson.dependencies ?? {};
  const devDependencies = packageJson.devDependencies ?? {};

  const srcFiles = await loadTextCandidates(ROOT, 'src', 'src');
  const scriptsFiles = await loadTextCandidates(ROOT, 'scripts', 'scripts');
  const testsFiles = await loadTextCandidates(ROOT, 'tests', 'tests');
  const configFiles = await loadRootConfigFiles(ROOT);

  const result = {};
  for (const [name, declaredIn] of [
    ...Object.keys(dependencies).map((name) => [name, 'dependencies']),
    ...Object.keys(devDependencies).map((name) => [name, 'devDependencies']),
  ]) {
    const foundIn = [];
    if (matchesPackage(srcFiles, name)) foundIn.push('src');
    if (matchesPackage(scriptsFiles, name)) foundIn.push('scripts');
    if (matchesPackage(testsFiles, name)) foundIn.push('tests');
    if (matchesPackage(configFiles, name, { bareQuoted: true })) foundIn.push('config');

    result[name] = { declaredIn, classification: classifyDependency(name, foundIn), foundIn };
  }

  await writeJson(path.join(REPORTS_DIR, 'dependency-usage.json'), {
    dependencies: result,
    generatedAt: 'static-scan',
  });
}

function classifyDependency(name, foundIn) {
  if (foundIn.includes('src')) return 'runtime';
  if (foundIn.length === 0) {
    if (name.startsWith('@types/') || CLI_OR_PEER_ONLY.has(name)) return 'uncertain';
    return 'unused';
  }
  if (foundIn.includes('tests') || foundIn.includes('config')) return 'development';
  if (foundIn.includes('scripts')) return 'script-only';
  return 'uncertain';
}

async function writeRouteMapMarkdown() {
  const appDir = path.join(ROOT, 'src', 'app');
  const pages = [];
  const apiRoutes = [];
  const layouts = [];

  async function walk(absDir, segments) {
    const entries = await fsp.readdir(absDir, { withFileTypes: true });
    const urlPath = '/' + segments.filter((segment) => !/^\(.*\)$/.test(segment)).join('/');
    const normalizedUrl = urlPath === '/' ? '/' : urlPath.replace(/\/+/g, '/');

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const relFile = toPosix(path.join('src/app', ...segments, entry.name));
      if (entry.name === 'page.tsx') pages.push({ urlPath: normalizedUrl, relFile });
      if (entry.name === 'route.ts') apiRoutes.push({ urlPath: normalizedUrl, relFile });
      if (entry.name === 'layout.tsx') layouts.push({ urlPath: normalizedUrl, relFile });
    }
    for (const entry of entries) {
      if (entry.isDirectory()) await walk(path.join(absDir, entry.name), [...segments, entry.name]);
    }
  }
  await walk(appDir, []);

  const sortByUrl = (a, b) => a.urlPath.localeCompare(b.urlPath);
  pages.sort(sortByUrl);
  apiRoutes.sort(sortByUrl);
  layouts.sort(sortByUrl);

  const lines = ['# Route Map', ''];
  lines.push('## Pages', '');
  for (const page of pages) lines.push(`- \`${page.urlPath}\` — ${page.relFile}`);
  lines.push('', '## API Routes', '');
  for (const route of apiRoutes) lines.push(`- \`${route.urlPath}\` — ${route.relFile}`);
  lines.push('', '## Layout Boundaries', '');
  for (const layout of layouts) lines.push(`- \`${layout.urlPath}\` — ${layout.relFile}`);
  lines.push('');

  await writeText(path.join(REPORTS_DIR, 'route-map.md'), lines.join('\n'));
}

async function writeBaselineMetrics() {
  const lines = ['# Baseline Metrics', '', 'Recorded on branch `preview` as part of Phase 1 inventory.', ''];

  lines.push('## Catalog Validation', '');
  lines.push('Command: `npm run validate:catalog`', '');
  try {
    const output = runNpmScript(ROOT, 'validate:catalog');
    lines.push('```', output.trim(), '```', '');
  } catch (error) {
    lines.push('```', `FAILED: ${error.message}`, '```', '');
  }

  lines.push('## Production Build', '');
  lines.push('Command: `npm run build`', '');
  try {
    runNpmScript(ROOT, 'build');
    const nextSizeBytes = await dirSizeBytes(path.join(ROOT, '.next'));
    lines.push('Build succeeded.', '', `\`.next/\` size: ${(nextSizeBytes / (1024 * 1024)).toFixed(2)} MB`, '');
  } catch (error) {
    lines.push('Build FAILED.', '', '```', String(error.message).slice(0, 2000), '```', '');
  }

  lines.push('## Docker Image Size', '');
  lines.push(
    'Docker was not built as part of this pass (out of scope for a fast, low-risk inventory run).',
    'A future step should run:',
    '',
    '```',
    'docker build -t submission-archives-baseline .',
    'docker images submission-archives-baseline',
    '```',
    '',
  );

  await writeText(path.join(REPORTS_DIR, 'baseline-metrics.md'), lines.join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
