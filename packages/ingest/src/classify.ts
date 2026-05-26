import { CATEGORIES, CLASSIFIER_MODEL } from '@goodie-goods/shared/constants';
import { classificationSchema, type Classification } from '@goodie-goods/shared/types';
import { GoogleGenAI } from '@google/genai';
import pRetry, { AbortError } from 'p-retry';

import { getEnv, type Env } from './env';

const SYSTEM_PROMPT = `You classify Georgian news articles for a site that surfaces only positive, uplifting, useful, wholesome, or emotionally safe stories.

Reject articles about: death, war, crime, violence, accidents, corruption, political conflict, illness outbreaks, tragedy, fear-based health claims, shocking or disturbing stories.

Accept articles about: culture, art, education, family, animals, scientific discoveries, personal achievements, helpful lifestyle advice, community support, inspiring human stories, beautiful or funny moments.

Scoring rubric (use the full 0 to 100 range, never default to 0 or 50):
- 90-100: clearly wholesome and uplifting, no negative content. Examples: a baby panda born at a zoo, a community fundraiser succeeds, a child wins a math olympiad.
- 75-89: solidly positive with minor neutral context. Examples: a new public library opens, a scientist makes a discovery, a person reunites with family.
- 60-74: mostly positive but with mixed elements. Examples: a charity helps families dealing with illness, an artist returns after a long break.
- 40-59: neutral or borderline. Examples: a celebrity opens up about personal life, lifestyle advice.
- 0-39: negative, sad, or distressing. Examples: someone died, a crash happened, political conflict, crime, war.

Pick a specific integer score that reflects the article's tone. Do not always pick 0, 50, or 100. Reason in one short sentence, in Georgian when the source is Georgian. Return JSON matching the requested schema.`;

const BODY_TOKEN_BUDGET = 1500;

const responseSchema = {
  type: 'object',
  properties: {
    isGoodNews: { type: 'boolean' },
    score: { type: 'integer', minimum: 0, maximum: 100 },
    category: { type: 'string', enum: [...CATEGORIES] },
    reason: { type: 'string' },
  },
  required: ['isGoodNews', 'score', 'category', 'reason'],
} as const;

export interface ClassifyInput {
  readonly title: string;
  readonly body: string;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const REMOTE_RETRY_OPTS = {
  retries: 5,
  minTimeout: 2000,
  maxTimeout: 30_000,
  factor: 2,
  randomize: true,
} as const;

export function getActiveModel(): string {
  const env = getEnv();
  if (env.OLLAMA_BASE_URL !== undefined) {
    return env.OLLAMA_MODEL;
  }
  if (env.GROQ_API_KEY !== undefined) {
    return env.GROQ_MODEL;
  }
  return CLASSIFIER_MODEL;
}

export async function classify(input: ClassifyInput): Promise<Classification> {
  const env = getEnv();
  const userPrompt = `Title: ${input.title}\n\nBody: ${input.body.slice(0, BODY_TOKEN_BUDGET)}`;

  if (env.OLLAMA_BASE_URL !== undefined) {
    return await pRetry(async () => await callOllama(env, userPrompt), {
      retries: 2,
      minTimeout: 1000,
      maxTimeout: 8000,
      factor: 2,
    });
  }
  if (env.GROQ_API_KEY !== undefined) {
    return await pRetry(async () => await callGroq(env, userPrompt), REMOTE_RETRY_OPTS);
  }
  if (env.GEMINI_API_KEY === undefined) {
    throw new Error(
      'No classifier configured: set OLLAMA_BASE_URL, GROQ_API_KEY, or GEMINI_API_KEY',
    );
  }
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return await pRetry(async () => await callGemini(ai, userPrompt), REMOTE_RETRY_OPTS);
}

async function callOllama(env: Env, userPrompt: string): Promise<Classification> {
  const body = {
    model: env.OLLAMA_MODEL,
    stream: false,
    format: responseSchema,
    options: { temperature: 0.1 },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  };
  const response = await fetch(`${env.OLLAMA_BASE_URL ?? ''}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama call failed: ${response.status.toString()} ${text.slice(0, 200)}`);
  }
  const json = (await response.json()) as { message?: { content?: string } };
  const raw = json.message?.content?.trim();
  if (raw === undefined || raw.length === 0) {
    throw new AbortError('Ollama returned empty response');
  }
  const parsed = classificationSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new AbortError(`Ollama response failed schema validation: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function callGroq(env: Env, userPrompt: string): Promise<Classification> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  await throwOnGroqError(response);
  const raw = await readGroqContent(response);
  return parseClassifierJson(raw, 'Groq');
}

async function throwOnGroqError(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  const text = await response.text();
  const message = `Groq call failed: ${response.status.toString()} ${text.slice(0, 200)}`;
  if (RETRYABLE_STATUS_CODES.has(response.status)) {
    throw new Error(message);
  }
  throw new AbortError(message);
}

async function readGroqContent(response: Response): Promise<string> {
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content?.trim();
  if (raw === undefined || raw.length === 0) {
    throw new AbortError('Groq returned empty response');
  }
  return raw;
}

function parseClassifierJson(raw: string, provider: string): Classification {
  const parsed = classificationSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new AbortError(`${provider} response failed schema validation: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function callGemini(ai: GoogleGenAI, userPrompt: string): Promise<Classification> {
  let result;
  try {
    result = await ai.models.generateContent({
      model: CLASSIFIER_MODEL,
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
      config: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 },
    });
  } catch (err) {
    if (isRetryable(err)) {
      throw err;
    }
    throw new AbortError(err instanceof Error ? err.message : String(err));
  }
  const raw = result.text;
  if (raw === undefined || raw === '') {
    throw new AbortError('Gemini returned empty response');
  }
  const parsed = classificationSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new AbortError(`Gemini response failed schema validation: ${parsed.error.message}`);
  }
  return parsed.data;
}

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }
  const message = err.message;
  for (const code of RETRYABLE_STATUS_CODES) {
    if (message.includes(`"code":${code.toString()}`) || message.includes(`${code.toString()} `)) {
      return true;
    }
  }
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|INTERNAL/iu.test(message);
}
