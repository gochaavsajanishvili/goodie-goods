import { z } from 'zod';

export const blankToUndefined = (v: unknown): unknown => (v === '' ? undefined : v);

export const baseEnvSchema = z.object({
  DATABASE_URL: z.url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});
