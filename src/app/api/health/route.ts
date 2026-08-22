import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CatalogValidation = {
  valid?: boolean;
  recordCount?: number;
  segmentCount?: number;
};

const INDICES_DIR = path.join(process.cwd(), 'public', 'data', 'generated_indices');

// Each check is reported individually so a 503 says which dependency is missing
// instead of just that something is wrong.
function runChecks() {
  const checks = { indices: false, masterIndex: false, catalog: false };
  let catalog: { records: number; segments: number } | undefined;

  try {
    checks.indices = fs.statSync(INDICES_DIR).isDirectory();
  } catch {
    // stays false
  }

  try {
    // Size only: parsing the whole index on every probe would make the health
    // check the most expensive request the server serves.
    checks.masterIndex = fs.statSync(path.join(INDICES_DIR, 'MASTER_INDEX.json')).size > 0;
  } catch {
    // stays false
  }

  try {
    const validation = JSON.parse(
      fs.readFileSync(path.join(INDICES_DIR, 'CATALOG_VALIDATION.json'), 'utf8'),
    ) as CatalogValidation;

    if (
      validation.valid === true &&
      Number.isInteger(validation.recordCount) &&
      Number.isInteger(validation.segmentCount)
    ) {
      checks.catalog = true;
      catalog = { records: validation.recordCount!, segments: validation.segmentCount! };
    }
  } catch {
    // stays false
  }

  return { checks, catalog };
}

export async function GET() {
  const { checks, catalog } = runChecks();
  const ok = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: ok ? 'ok' : 'unavailable',
      ok,
      checks,
      ...(catalog ? { catalog } : {}),
    },
    {
      status: ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
