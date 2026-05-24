import { baseEnvSchema } from '@goodie-goods/shared/base-env';
import { makeEnvLoader } from '@goodie-goods/shared/env-loader';
import { z } from 'zod';

const envSchema = baseEnvSchema.extend({
  ADMIN_PASSWORD: z.string().min(8),
  IRON_SESSION_PASSWORD: z.string().min(32),
  GITHUB_REPO: z
    .string()
    .regex(/^[^/]+\/[^/]+$/, 'expected "owner/repo" format')
    .optional(),
  GITHUB_DISPATCH_TOKEN: z.string().min(1).optional(),
  GITHUB_WORKFLOW_FILE: z.string().default('ingest.yml'),
  GITHUB_DEFAULT_REF: z.string().default('main'),
});

export type Env = z.infer<typeof envSchema>;

export const getEnv = makeEnvLoader<Env>(envSchema);
