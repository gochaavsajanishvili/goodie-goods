import type { z } from 'zod';

export function makeEnvLoader<T>(schema: z.ZodType<T>): () => T {
  let cached: T | null = null;
  return function getEnv(): T {
    if (cached !== null) {
      return cached;
    }
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n  ');
      throw new Error(`Invalid environment.\n  ${issues}`);
    }
    cached = parsed.data;
    return cached;
  };
}
