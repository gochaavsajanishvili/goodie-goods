import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { getEnv } from './env';

type DbClient = ReturnType<typeof drizzle>;

let cached: DbClient | null = null;

export function getDb(): DbClient {
  if (cached !== null) {
    return cached;
  }
  const env = getEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  cached = drizzle(sql);
  return cached;
}
