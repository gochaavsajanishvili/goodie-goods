/**
 * Verifies that every Georgian-script string literal in tracked source
 * sounds natural to a native speaker. Calls Gemini once per run with
 * the deduplicated set, fails the script on any awkward string.
 *
 * Skipped (with a warning, not a failure) when GEMINI_API_KEY is unset,
 * so contributors without an API key can still run `bun run check`.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx']);
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.git',
  'playwright-report',
  'test-results',
  '.claude',
  'docs',
]);

const GEORGIAN_RANGE = '\\u10A0-\\u10FF\\u2D00-\\u2D2F';
const STRING_LITERAL_REGEX = new RegExp(
  `["'\`]([^"'\`\\n]*[${GEORGIAN_RANGE}][^"'\`\\n]*)["'\`]`,
  'gu',
);

interface FoundString {
  readonly value: string;
  readonly location: string;
}

interface VerdictItem {
  readonly id: number;
  readonly original: string;
  readonly natural: boolean;
  readonly natural_alternative: string;
  readonly note: string;
}

function shouldSkipDir(name: string): boolean {
  if (name.startsWith('.') && name !== '.github') {
    return true;
  }
  return SKIP_DIRECTORIES.has(name);
}

function shouldSkipFile(name: string, absolute: string): boolean {
  const ext = name.slice(name.lastIndexOf('.'));
  if (!TARGET_EXTENSIONS.has(ext)) {
    return true;
  }
  if (/\.(test|spec)\.tsx?$/u.test(name)) {
    return true;
  }
  if (name === 'constants.ts') {
    return true;
  }
  return absolute.includes(`${ROOT}/scripts/`);
}

async function walk(dir: string, acc: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) {
        continue;
      }
      await walk(join(dir, entry.name), acc);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const absolute = join(dir, entry.name);
    if (!shouldSkipFile(entry.name, absolute)) {
      acc.push(absolute);
    }
  }
}

async function extractStrings(paths: readonly string[]): Promise<FoundString[]> {
  const collected = new Map<string, string>();
  for (const path of paths) {
    const content = await readFile(path, 'utf8');
    const matches = content.matchAll(STRING_LITERAL_REGEX);
    for (const match of matches) {
      const literal = match[1];
      if (literal === undefined) {
        continue;
      }
      const trimmed = literal.trim();
      if (trimmed.length === 0) {
        continue;
      }
      if (!collected.has(trimmed)) {
        collected.set(trimmed, relative(ROOT, path));
      }
    }
  }
  return [...collected.entries()].map(([value, location]) => ({ value, location }));
}

function buildPrompt(strings: readonly FoundString[]): string {
  const lines = strings.map(
    (s, idx) => `${(idx + 1).toString()}. "${s.value}"  (source: ${s.location})`,
  );
  return [
    'You are a native Georgian (ქართული) translator and copyeditor.',
    'Judge whether each Georgian UI string sounds natural to a native speaker.',
    'If awkward or machine-translated, suggest a more natural alternative.',
    'Return JSON ONLY, matching this shape:',
    '[ { "id": N, "original": "...", "natural": true|false, "natural_alternative": "...", "note": "short reason" } ]',
    '',
    'Strings:',
    ...lines,
  ].join('\n');
}

async function verifyWithOllama(
  baseUrl: string,
  model: string,
  strings: readonly FoundString[],
): Promise<readonly VerdictItem[]> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      options: { temperature: 0.2 },
      messages: [{ role: 'user', content: buildPrompt(strings) }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Ollama call failed: ${response.status.toString()} ${response.statusText}`);
  }
  const json = (await response.json()) as { message?: { content?: string } };
  const text = json.message?.content;
  if (typeof text !== 'string') {
    throw new Error('Ollama returned no text');
  }
  const parsed = JSON.parse(text) as unknown;
  const list = Array.isArray(parsed) ? parsed : (parsed as { results?: unknown }).results;
  if (!Array.isArray(list)) {
    throw new Error('Ollama response was not a JSON array');
  }
  return list as VerdictItem[];
}

async function verifyWithGemini(
  apiKey: string,
  strings: readonly FoundString[],
): Promise<readonly VerdictItem[]> {
  const body = {
    contents: [{ role: 'user', parts: [{ text: buildPrompt(strings) }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  };
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    if (response.status === 429) {
      process.stderr.write('check-georgian: Gemini quota exhausted, skipping check.\n');
      return [];
    }
    throw new Error(`Gemini call failed: ${response.status.toString()} ${response.statusText}`);
  }
  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Gemini returned no text');
  }
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Gemini response was not a JSON array');
  }
  return parsed as VerdictItem[];
}

function reportAwkward(strings: readonly FoundString[], verdicts: readonly VerdictItem[]): number {
  let awkwardCount = 0;
  for (const v of verdicts) {
    if (v.natural) {
      continue;
    }
    awkwardCount += 1;
    const source = strings[v.id - 1];
    const where = source !== undefined ? source.location : 'unknown';
    process.stderr.write(`\nAWKWARD  ${where}\n`);
    process.stderr.write(`  current:    "${v.original}"\n`);
    process.stderr.write(`  suggested:  "${v.natural_alternative}"\n`);
    process.stderr.write(`  reason:     ${v.note}\n`);
  }
  return awkwardCount;
}

async function collectStrings(): Promise<FoundString[]> {
  const files: string[] = [];
  await walk(ROOT, files);
  return extractStrings(files);
}

interface CheckerConfig {
  readonly ollamaBaseUrl?: string;
  readonly ollamaModel: string;
  readonly geminiApiKey?: string;
}

function readConfig(): CheckerConfig | null {
  const ollamaBaseUrl = process.env['OLLAMA_BASE_URL'];
  const apiKey = process.env['GEMINI_API_KEY'];
  const hasOllama = ollamaBaseUrl !== undefined && ollamaBaseUrl !== '';
  const hasGemini = apiKey !== undefined && apiKey !== '';
  if (!hasOllama && !hasGemini) {
    return null;
  }
  return {
    ollamaBaseUrl: hasOllama ? ollamaBaseUrl : undefined,
    ollamaModel: process.env['OLLAMA_MODEL'] ?? 'gemma4:e4b',
    geminiApiKey: hasGemini ? apiKey : undefined,
  };
}

async function verify(
  config: CheckerConfig,
  strings: readonly FoundString[],
): Promise<readonly VerdictItem[]> {
  if (config.ollamaBaseUrl !== undefined) {
    return await verifyWithOllama(config.ollamaBaseUrl, config.ollamaModel, strings);
  }
  return await verifyWithGemini(config.geminiApiKey ?? '', strings);
}

function finishReport(strings: readonly FoundString[], awkward: number): void {
  if (awkward > 0) {
    process.stderr.write(
      `\ncheck-georgian: ${awkward.toString()} awkward string(s). Fix and re-run.\n`,
    );
    process.exit(1);
  }
  process.stderr.write(`check-georgian: ${strings.length.toString()} string(s) sound natural.\n`);
}

async function main(): Promise<void> {
  const config = readConfig();
  if (config === null) {
    process.stderr.write('check-georgian: no OLLAMA_BASE_URL or GEMINI_API_KEY, skipping.\n');
    return;
  }
  const strings = await collectStrings();
  if (strings.length === 0) {
    process.stderr.write('check-georgian: no Georgian strings found.\n');
    return;
  }
  const verdicts = await verify(config, strings);
  if (verdicts.length === 0) {
    return;
  }
  finishReport(strings, reportAwkward(strings, verdicts));
}

await main();
