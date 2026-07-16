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

export async function GET() {
  try {
    const validationPath = path.join(
      process.cwd(),
      'public',
      'data',
      'generated_indices',
      'CATALOG_VALIDATION.json',
    );
    const validation = JSON.parse(fs.readFileSync(validationPath, 'utf8')) as CatalogValidation;

    if (
      validation.valid !== true ||
      !Number.isInteger(validation.recordCount) ||
      !Number.isInteger(validation.segmentCount)
    ) {
      throw new Error('Catalog validation report is not healthy.');
    }

    return NextResponse.json(
      {
        status: 'ok',
        catalog: {
          records: validation.recordCount,
          segments: validation.segmentCount,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'unavailable' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
