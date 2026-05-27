import { AMBEBI_BASE_URL, SCRAPER_USER_AGENT } from '@goodie-goods/shared/constants';
import * as cheerio from 'cheerio';

import type { ArticleBlock, ParsedArticle, ParsedArticleLink } from '@goodie-goods/shared/types';
import type { Element } from 'domhandler';

const ARTICLE_PATH_PREFIX = '/article/';
const BODY_TEXT_CAP = 6000;
const ALLOWED_INLINE = new Set(['a', 'strong', 'em', 'b', 'i', 'br']);
const SKIP_TAGS = new Set(['script', 'style', 'iframe', 'noscript', 'aside', 'form', 'svg']);

interface WalkContext {
  readonly $: cheerio.CheerioAPI;
  readonly out: ArticleBlock[];
  readonly seenImages: Set<string>;
}

interface ImageOptions {
  readonly out: ArticleBlock[];
  readonly seenImages: Set<string>;
  readonly caption?: string;
}

export async function fetchHomepageLinks(): Promise<ParsedArticleLink[]> {
  const html = await fetchHtml(AMBEBI_BASE_URL);
  return extractArticleLinks(html);
}

function extractArticleLinks(html: string): ParsedArticleLink[] {
  const $ = cheerio.load(html);
  const seen = new Map<string, ParsedArticleLink>();

  $(`a[href^="${ARTICLE_PATH_PREFIX}"]`).each((_, element) => {
    const href = $(element).attr('href');
    if (typeof href !== 'string') {
      return;
    }
    const url = new URL(href, AMBEBI_BASE_URL).toString();
    if (seen.has(url)) {
      return;
    }
    const title = resolveAnchorTitle($, element);
    if (title.length === 0) {
      return;
    }
    seen.set(url, { title, url });
  });

  return [...seen.values()];
}

function resolveAnchorTitle($: cheerio.CheerioAPI, element: Element): string {
  const $a = $(element);
  const direct = $a.text().trim();
  if (direct.length > 0) {
    return direct;
  }
  const imgAlt = $a.find('img').first().attr('alt')?.trim();
  if (imgAlt !== undefined && imgAlt.length > 0) {
    return imgAlt;
  }
  const container = $a.closest('[itemscope]');
  const headline = container
    .find('h1, h2, h3')
    .filter('[itemprop="headline"]')
    .first()
    .text()
    .trim();
  if (headline.length > 0) {
    return headline;
  }
  return container.find('h1, h2, h3').first().text().trim();
}

export async function fetchArticle(url: string): Promise<ParsedArticle> {
  const html = await fetchHtml(url);
  return parseArticle(html, url);
}

export function parseArticle(html: string, sourceUrl: string): ParsedArticle {
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim();
  const $content = $('div.article_content, article').first();
  const ctx: WalkContext = { $, out: [], seenImages: new Set() };
  walkChildren(ctx, $content);
  const bodyBlocks = ctx.out;
  const body = deriveBodyText(bodyBlocks);
  const bodyImages = bodyBlocks.flatMap((b) => (b.kind === 'image' ? [b.src] : []));
  const ogImage = $('meta[property="og:image"]').attr('content');
  const imageUrl =
    typeof ogImage === 'string' && ogImage.length > 0 ? ogImage : (bodyImages[0] ?? null);
  const publishedAtAttr = $('meta[property="article:published_time"]').attr('content');
  const publishedAt = publishedAtAttr !== undefined ? new Date(publishedAtAttr) : null;

  return { sourceUrl, title, body, imageUrl, bodyImages, bodyBlocks, publishedAt };
}

function walkChildren(ctx: WalkContext, $container: cheerio.Cheerio<Element>): void {
  $container.children().each((_, el) => {
    visitElement(ctx, el);
  });
}

const BLOCK_HANDLERS: Record<string, (ctx: WalkContext, el: Element) => void> = {
  p: emitParagraph,
  h2: (ctx, el) => {
    emitHeading(ctx, el, 2);
  },
  h3: (ctx, el) => {
    emitHeading(ctx, el, 3);
  },
  h4: (ctx, el) => {
    emitHeading(ctx, el, 3);
  },
  ul: (ctx, el) => {
    emitList(ctx, el, false);
  },
  ol: (ctx, el) => {
    emitList(ctx, el, true);
  },
  blockquote: emitQuote,
  img: (ctx, el) => {
    emitImage(ctx.$, el, { out: ctx.out, seenImages: ctx.seenImages });
  },
  figure: emitFigure,
};

function visitElement(ctx: WalkContext, el: Element): void {
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) {
    return;
  }
  const handler = BLOCK_HANDLERS[tag];
  if (handler !== undefined) {
    handler(ctx, el);
    return;
  }
  walkChildren(ctx, ctx.$(el));
}

function emitParagraph(ctx: WalkContext, el: Element): void {
  const $el = ctx.$(el);
  const $stripped = $el.clone();
  $stripped.find('img').remove();
  const html = sanitizeInlineHtml(ctx.$, $stripped);
  if (html.length > 0) {
    ctx.out.push({ kind: 'paragraph', html });
  }
  $el.find('img').each((_, img) => {
    emitImage(ctx.$, img, { out: ctx.out, seenImages: ctx.seenImages });
  });
}

function emitHeading(ctx: WalkContext, el: Element, level: 2 | 3): void {
  const text = ctx.$(el).text().trim();
  if (text.length > 0) {
    ctx.out.push({ kind: 'heading', level, text });
  }
}

function emitList(ctx: WalkContext, el: Element, ordered: boolean): void {
  const items: string[] = [];
  ctx
    .$(el)
    .children('li')
    .each((_, li) => {
      const html = sanitizeInlineHtml(ctx.$, ctx.$(li));
      if (html.length > 0) {
        items.push(html);
      }
    });
  if (items.length > 0) {
    ctx.out.push({ kind: 'list', ordered, items });
  }
}

function emitQuote(ctx: WalkContext, el: Element): void {
  const html = sanitizeInlineHtml(ctx.$, ctx.$(el));
  if (html.length > 0) {
    ctx.out.push({ kind: 'quote', html });
  }
}

function emitImage($: cheerio.CheerioAPI, el: Element, opts: ImageOptions): void {
  const $img = $(el);
  const raw = $img.attr('data-src') ?? $img.attr('src') ?? '';
  if (raw.length === 0) {
    return;
  }
  const src = raw.startsWith('//') ? `https:${raw}` : raw;
  if (opts.seenImages.has(src)) {
    return;
  }
  opts.seenImages.add(src);
  const alt = $img.attr('alt') ?? '';
  const block: ArticleBlock =
    opts.caption !== undefined && opts.caption.length > 0
      ? { kind: 'image', src, alt, caption: opts.caption }
      : { kind: 'image', src, alt };
  opts.out.push(block);
}

function emitFigure(ctx: WalkContext, el: Element): void {
  const $fig = ctx.$(el);
  const img = $fig.find('img').first()[0];
  if (img === undefined) {
    return;
  }
  const caption = $fig.find('figcaption').first().text().trim();
  emitImage(ctx.$, img, { out: ctx.out, seenImages: ctx.seenImages, caption });
}

function sanitizeInlineHtml($: cheerio.CheerioAPI, $node: cheerio.Cheerio<Element>): string {
  const $clone = $node.clone();
  $clone.find('*').each((_, child) => {
    sanitizeNode($, child);
  });
  const html = $clone.html() ?? '';
  return collapseWhitespace(html);
}

function sanitizeNode($: cheerio.CheerioAPI, el: Element): void {
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_INLINE.has(tag)) {
    $(el).replaceWith($(el).text());
    return;
  }
  stripAttributes($, el, tag);
}

function stripAttributes($: cheerio.CheerioAPI, el: Element, tag: string): void {
  const $el = $(el);
  const attrs = el.attribs;
  for (const name of Object.keys(attrs)) {
    if (tag === 'a' && name === 'href') {
      continue;
    }
    $el.removeAttr(name);
  }
  if (tag === 'a') {
    const href = $el.attr('href');
    if (typeof href === 'string' && /^https?:/i.test(href)) {
      $el.attr('target', '_blank');
      $el.attr('rel', 'noopener noreferrer');
    } else {
      $el.replaceWith($el.text());
    }
  }
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function deriveBodyText(blocks: readonly ArticleBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.kind === 'paragraph' || b.kind === 'quote') {
      parts.push(stripTags(b.html));
    } else if (b.kind === 'heading') {
      parts.push(b.text);
    } else if (b.kind === 'list') {
      for (const item of b.items) {
        parts.push(`- ${stripTags(item)}`);
      }
    }
  }
  const joined = parts.join('\n\n');
  return joined.length > BODY_TEXT_CAP ? joined.slice(0, BODY_TEXT_CAP) : joined;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': SCRAPER_USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status.toString()} ${response.statusText}`);
  }
  return await response.text();
}
