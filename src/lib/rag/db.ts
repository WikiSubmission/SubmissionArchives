import 'server-only';
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getRagPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}
