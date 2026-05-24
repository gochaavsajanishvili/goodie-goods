import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { getEnv } from './env';

export function createDbClient() {
  const env = getEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  return drizzle(sql);
}

export type DbClient = ReturnType<typeof createDbClient>;
