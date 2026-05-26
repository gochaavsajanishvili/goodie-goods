import { baseEnvSchema } from '@goodie-goods/shared/base-env';
import { makeEnvLoader } from '@goodie-goods/shared/env-loader';
import { z } from 'zod';

const envSchema = baseEnvSchema.extend({
  GEMINI_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).default('openai/gpt-oss-120b'),
  OLLAMA_BASE_URL: z.url().optional(),
  OLLAMA_MODEL: z.string().min(1).default('gemma4:e4b'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export const getEnv = makeEnvLoader<Env>(envSchema);
