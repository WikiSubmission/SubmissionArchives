import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import './lib/env';
import { getPool, closePool } from './lib/db';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'scripts', 'rag', 'migrations');

async function main(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rag_schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await pool.query<{ filename: string }>('SELECT filename FROM rag_schema_migrations')).rows.map(
      (row) => row.filename,
    ),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((filename) => filename.endsWith('.sql'))
    .sort();

  let appliedCount = 0;
  for (const filename of files) {
    if (applied.has(filename)) continue;

    const sql = readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO rag_schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`Applied ${filename}`);
      appliedCount += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${filename} failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      client.release();
    }
  }

  console.log(appliedCount === 0 ? 'No pending migrations.' : `Applied ${appliedCount} migration(s).`);
}

main()
  .catch((error: unknown) => {
    console.error('migrate failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closePool);
