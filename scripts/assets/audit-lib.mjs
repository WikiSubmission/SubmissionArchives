import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.next',
  '.git',
  'test-results',
  'playwright-report',
  'scratch',
]);

export const WALK_ROOTS = ['src', 'public', 'data', 'scripts', 'docs'];

export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

export const GENERATED_INDICES_DIR = 'public/data/generated_indices';

/** Convert an OS path to forward-slash posix style for stable, deterministic output. */
export function toPosix(relPath) {
  return relPath.split(path.sep).join('/');
}

/**
 * Enumerate every relevant file in the repo using `git ls-files` as the source of truth for
 * "tracked-relevant" (cached + untracked-but-not-ignored, respecting .gitignore). Falls back to a
 * manual filesystem walk if git is unavailable. Restricted to the five canonical roots plus files
 * sitting directly at the repo root.
 */
export function listRepositoryFiles(root) {
  const viaGit = listViaGit(root);
  if (viaGit) return viaGit;
  return listViaFilesystem(root);
}

function listViaGit(root) {
  try {
    const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: root,
      maxBuffer: 1024 * 1024 * 64,
    });
    const entries = output.toString('utf8').split('\0').filter(Boolean);
    const relevant = entries.filter((entry) => isWithinScope(entry));
    return relevant.sort();
  } catch {
    return null;
  }
}

function isWithinScope(posixRelPath) {
  const firstSegment = posixRelPath.split('/')[0];
  if (!posixRelPath.includes('/')) return true; // file directly at repo root
  return WALK_ROOTS.includes(firstSegment);
}

function listViaFilesystem(root) {
  const results = [];
  for (const rootName of WALK_ROOTS) {
    const absRoot = path.join(root, rootName);
    if (!fs.existsSync(absRoot)) continue;
    walkSync(absRoot, root, results);
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile()) results.push(entry.name);
  }
  return results.sort();
}

function walkSync(absDir, root, results) {
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const absPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      walkSync(absPath, root, results);
    } else if (entry.isFile()) {
      results.push(toPosix(path.relative(root, absPath)));
    }
  }
}

export async function sha256File(absPath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(absPath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/** Run async tasks with a bounded concurrency, preserving input order in the returned array. */
export async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runNext() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, runNext);
  await Promise.all(workers);
  return results;
}

export function csvEscape(value) {
  const stringValue = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function toCsvRow(columns) {
  return columns.map(csvEscape).join(',');
}

export async function writeCsv(absPath, header, rows) {
  await fsp.mkdir(path.dirname(absPath), { recursive: true });
  const lines = [toCsvRow(header), ...rows.map(toCsvRow)];
  await fsp.writeFile(absPath, lines.join('\n') + '\n', 'utf8');
}

export async function writeJson(absPath, data) {
  await fsp.mkdir(path.dirname(absPath), { recursive: true });
  await fsp.writeFile(absPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function writeText(absPath, text) {
  await fsp.mkdir(path.dirname(absPath), { recursive: true });
  await fsp.writeFile(absPath, text, 'utf8');
}

export function extensionOf(relPath) {
  const ext = path.extname(relPath);
  return ext ? ext.toLowerCase() : '';
}

/** Read a file as utf8 text, returning null instead of throwing on binary/decoding failures. */
export async function readTextSafe(absPath) {
  try {
    return await fsp.readFile(absPath, 'utf8');
  } catch {
    return null;
  }
}

export async function readJsonSafe(absPath) {
  const text = await readTextSafe(absPath);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function collectFilesRecursive(absDir, root) {
  const results = [];
  async function walk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absPath);
      } else if (entry.isFile()) {
        results.push(toPosix(path.relative(root, absPath)));
      }
    }
  }
  await walk(absDir);
  return results;
}

/** Read every file under `root/dirName` as utf8 text, tagged with `type`, skipping binary files. */
export async function loadTextCandidates(root, dirName, type) {
  const absDir = path.join(root, dirName);
  if (!fs.existsSync(absDir)) return [];
  const relPaths = await collectFilesRecursive(absDir, root);
  const candidates = [];
  for (const relPath of relPaths) {
    const content = await readTextSafe(path.join(root, relPath));
    if (content !== null) candidates.push({ relPath, content, type });
  }
  return candidates;
}

/** Read every generated catalog JSON file (public/data/generated_indices/*.json) as utf8 text. */
export async function loadCatalogTextCandidates(root, type) {
  const absDir = path.join(root, GENERATED_INDICES_DIR);
  if (!fs.existsSync(absDir)) return [];
  const entries = await fsp.readdir(absDir, { withFileTypes: true });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const relPath = toPosix(path.join(GENERATED_INDICES_DIR, entry.name));
    const content = await readTextSafe(path.join(root, relPath));
    if (content !== null) candidates.push({ relPath, content, type });
  }
  return candidates;
}

/** Only root-level *.config.ts / *.config.mjs files (next.config.ts, playwright.config.ts,
 * eslint.config.mjs, postcss.config.mjs, ...). */
export async function loadRootConfigFiles(root) {
  const entries = await fsp.readdir(root, { withFileTypes: true });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.config\.(ts|mjs)$/.test(entry.name)) continue;
    const content = await readTextSafe(path.join(root, entry.name));
    if (content !== null) candidates.push({ relPath: entry.name, content, type: 'config' });
  }
  return candidates;
}

/** Parse each generated catalog JSON file and record which archive record (by id) references a
 * given public asset path through a thumbnail/image/coverImage-style field. First match wins. */
export async function buildCatalogRecordIndex(root) {
  const index = new Map();
  const absDir = path.join(root, GENERATED_INDICES_DIR);
  if (!fs.existsSync(absDir)) return index;
  const names = (await fsp.readdir(absDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();

  for (const name of names) {
    const data = await readJsonSafe(path.join(absDir, name));
    if (data === null) continue;
    collectRecordAssets(data, null, index);
  }
  return index;
}

function collectRecordAssets(node, currentRecordId, index) {
  if (Array.isArray(node)) {
    for (const item of node) collectRecordAssets(item, currentRecordId, index);
    return;
  }
  if (!node || typeof node !== 'object') return;

  const recordId = typeof node.id === 'string' ? node.id : currentRecordId;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' && /thumbnail|image|cover/i.test(key) && value.startsWith('/')) {
      if (!index.has(value)) index.set(value, recordId);
    } else if (value && typeof value === 'object') {
      collectRecordAssets(value, recordId, index);
    }
  }
}

/** Check whether any candidate's content references `packageName` via import/require/dynamic
 * import/CSS @import. `bareQuoted` additionally matches a plain quoted occurrence of the package
 * name, useful for small trusted config files that reference a plugin by object key rather than
 * an import statement (e.g. `plugins: { "@tailwindcss/postcss": {} }`). */
export function matchesPackage(candidates, packageName, { bareQuoted = false } = {}) {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`from\\s+["']${escaped}(?:/[^"']*)?["']`),
    new RegExp(`require\\(\\s*["']${escaped}(?:/[^"']*)?["']\\s*\\)`),
    new RegExp(`import\\(\\s*["']${escaped}(?:/[^"']*)?["']`),
    new RegExp(`@import\\s+["']${escaped}["']`),
  ];
  if (bareQuoted) patterns.push(new RegExp(`["']${escaped}["']`));
  return candidates.some((candidate) => patterns.some((pattern) => pattern.test(candidate.content)));
}

/** Run a fixed, hardcoded npm script (never user input) via an argument array, not a shell string.
 * On Windows, npm resolves to npm.cmd, which the OS can only launch through a shell; `shell: true`
 * is safe here because both the command and arguments are hardcoded literals, not user input. */
export function runNpmScript(root, scriptName) {
  return execFileSync('npm', ['run', scriptName], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    shell: process.platform === 'win32',
  });
}

export async function dirSizeBytes(absDir) {
  let total = 0;
  const entries = await fsp.readdir(absDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const absPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      total += await dirSizeBytes(absPath);
    } else if (entry.isFile()) {
      const stat = await fsp.stat(absPath).catch(() => null);
      if (stat) total += stat.size;
    }
  }
  return total;
}
