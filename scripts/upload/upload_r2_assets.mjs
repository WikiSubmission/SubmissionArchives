import fs from 'node:fs';
import path from 'node:path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, 'public', 'data', 'generated_indices', 'ASSET_MANIFEST.csv');
const REPORT_PATH = path.join(ROOT, 'public', 'data', 'generated_indices', 'R2_UPLOAD_REPORT.csv');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const verifyOnly = args.has('--verify-only');
const force = args.has('--force');
const allowAnyBucket = args.has('--allow-any-bucket');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
const expectedBucket = process.env.R2_EXPECTED_BUCKET_NAME || 'submissionarchives';

const requiredEnv = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0 && !dryRun) {
  console.error(`Missing required new-bucket R2 variables: ${missingEnv.join(', ')}`);
  console.error('Run with --dry-run to inspect the manifest without uploading.');
  process.exit(1);
}

if (!dryRun && !allowAnyBucket && process.env.R2_BUCKET_NAME !== expectedBucket) {
  console.error(`Refusing to upload to bucket "${process.env.R2_BUCKET_NAME}". Expected new bucket "${expectedBucket}".`);
  console.error('Set R2_BUCKET_NAME to the new bucket, or pass --allow-any-bucket only if you are intentionally overriding this safety check.');
  process.exit(1);
}

const s3Client = missingEnv.length === 0
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

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
  return rows.map((row) =>
    headers.reduce((acc, header, index) => {
      acc[header] = row[index] ?? '';
      return acc;
    }, {})
  );
}

function csvEscape(value) {
  if (value === undefined || value === null) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, columns) {
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n');
}

async function headObject(row) {
  if (!s3Client) return null;
  try {
    return await s3Client.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: row.r2_key,
    }));
  } catch {
    return null;
  }
}

async function uploadObject(row) {
  if (!s3Client) return 'dry-run';
  const localPath = path.join(ROOT, 'public', row.local_path);
  const body = fs.createReadStream(localPath);

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: row.r2_key,
    Body: body,
    ContentType: row.content_type || 'application/octet-stream',
    CacheControl: cacheControlFor(row),
    Metadata: {
      sha256: row.sha256,
      record_id: row.record_id.replace(/[^\w.-]/g, '_').slice(0, 128),
      asset_kind: row.asset_kind,
    },
  }));

  return 'uploaded';
}

function cacheControlFor(row) {
  if (row.asset_kind === 'media' || row.asset_kind === 'pdf') {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=86400';
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing manifest: ${MANIFEST_PATH}. Run the catalog generator first.`);
  }

  const rows = rowsToObjects(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    .filter((row) => row.local_path && row.r2_key)
    .slice(0, Number.isFinite(limit) ? limit : undefined);

  const report = [];
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`${dryRun ? 'Dry run' : verifyOnly ? 'Verify only' : 'Uploading'} ${rows.length} assets to new bucket: ${process.env.R2_BUCKET_NAME || '(not configured)'}`);

  for (const [index, row] of rows.entries()) {
    const localPath = path.join(ROOT, 'public', row.local_path);
    const localExists = fs.existsSync(localPath);
    const expectedSize = Number(row.size_bytes || 0);
    let status = 'pending';
    let remoteSize = '';
    let error = '';

    try {
      if (!localExists) {
        status = 'missing-local';
        failed += 1;
      } else if (dryRun) {
        status = 'dry-run';
        skipped += 1;
      } else {
        const before = await headObject(row);
        if (verifyOnly) {
          const after = before;
          remoteSize = after?.ContentLength === undefined ? '' : String(after.ContentLength);
          if (after?.ContentLength === expectedSize) {
            status = 'verified';
            skipped += 1;
          } else if (!after) {
            status = 'missing-remote';
            failed += 1;
          } else {
            status = 'size-mismatch';
            failed += 1;
          }
        } else if (before?.ContentLength === expectedSize && !force) {
          status = 'already-present';
          remoteSize = String(before.ContentLength);
          skipped += 1;
        } else {
          status = await uploadObject(row);
          uploaded += 1;

          const after = await headObject(row);
          remoteSize = after?.ContentLength === undefined ? '' : String(after.ContentLength);
          if (after && after.ContentLength !== expectedSize) {
            status = 'size-mismatch';
            failed += 1;
          }
        }
      }
    } catch (err) {
      status = 'failed';
      error = err instanceof Error ? err.message : String(err);
      failed += 1;
    }

    report.push({
      ...row,
      status,
      remote_size_bytes: remoteSize,
      error,
    });

    process.stdout.write(`\r${index + 1}/${rows.length} ${status}: ${row.r2_key}`.slice(0, 160));
  }

  fs.writeFileSync(REPORT_PATH, `${toCsv(report, [
    'record_id',
    'category',
    'type',
    'title',
    'asset_kind',
    'local_path',
    'r2_key',
    'public_url',
    'size_bytes',
    'remote_size_bytes',
    'sha256',
    'content_type',
    'status',
    'error',
  ])}\n`);

  console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`);

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
