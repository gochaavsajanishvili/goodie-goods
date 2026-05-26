import { z } from 'zod';

import { CATEGORIES } from './constants';

export const classificationSchema = z.object({
  isGoodNews: z.boolean(),
  score: z.number().int().min(0).max(100),
  category: z.enum(CATEGORIES),
  reason: z.string().min(1).max(500),
});

export type Classification = z.infer<typeof classificationSchema>;

export const articleBlockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('paragraph'), html: z.string().min(1) }),
  z.object({
    kind: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().min(1),
  }),
  z.object({
    kind: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({ kind: z.literal('quote'), html: z.string().min(1) }),
  z.object({
    kind: z.literal('image'),
    src: z.url(),
    alt: z.string(),
    caption: z.string().optional(),
  }),
]);

export const articleBlocksSchema = z.array(articleBlockSchema);

export type ArticleBlock = z.infer<typeof articleBlockSchema>;

export interface ParsedArticleLink {
  readonly title: string;
  readonly url: string;
}

export interface ParsedArticle {
  readonly sourceUrl: string;
  readonly title: string;
  readonly body: string;
  readonly imageUrl: string | null;
  readonly bodyImages: readonly string[];
  readonly bodyBlocks: readonly ArticleBlock[];
  readonly publishedAt: Date | null;
}

export interface IngestSummary {
  readonly urlsSeen: number;
  readonly urlsNew: number;
  readonly keywordRejected: number;
  readonly llmClassified: number;
  readonly llmApproved: number;
  readonly pruned: number;
  readonly errors: readonly string[];
}
