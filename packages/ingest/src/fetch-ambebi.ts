import { AMBEBI_BASE_URL, SCRAPER_USER_AGENT } from '@goodie-goods/shared/constants';
import * as cheerio from 'cheerio';

import type { ParsedArticle, ParsedArticleLink } from '@goodie-goods/shared/types';
import type { Element } from 'domhandler';

const ARTICLE_PATH_PREFIX = '/article/';

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

function parseArticle(html: string, sourceUrl: string): ParsedArticle {
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim();
  const $content = $('div.article_content, article').first();
  const body = $content.text().trim().slice(0, 6000);
  const bodyImages = extractBodyImages($, $content);
  const imageUrl = $('meta[property="og:image"]').attr('content') ?? bodyImages[0] ?? null;
  const publishedAtAttr = $('meta[property="article:published_time"]').attr('content');
  const publishedAt = publishedAtAttr !== undefined ? new Date(publishedAtAttr) : null;

  return { sourceUrl, title, body, imageUrl, bodyImages, publishedAt };
}

function extractBodyImages(
  $: cheerio.CheerioAPI,
  $content: cheerio.Cheerio<Element>,
): readonly string[] {
  const seen = new Set<string>();
  const images: string[] = [];
  $content.find('img').each((_, img) => {
    const raw = $(img).attr('data-src') ?? $(img).attr('src') ?? '';
    if (raw.length === 0) {
      return;
    }
    const normalized = raw.startsWith('//') ? `https:${raw}` : raw;
    if (seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    images.push(normalized);
  });
  return images;
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
