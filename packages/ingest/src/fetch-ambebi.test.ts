import { describe, expect, it } from 'vitest';

import { parseArticle } from './fetch-ambebi';

const SOURCE_URL = 'https://www.ambebi.ge/article/test-slug';

function htmlWith(content: string): string {
  return `<!doctype html><html><head><title>t</title></head><body><h1>სათაური</h1><div class="article_content">${content}</div></body></html>`;
}

describe('parseArticle bodyBlocks', () => {
  it('returns an empty block list when the article body has no content', () => {
    const result = parseArticle(htmlWith(''), SOURCE_URL);
    expect(result.bodyBlocks).toEqual([]);
    expect(result.body).toBe('');
    expect(result.bodyImages).toEqual([]);
  });

  it('emits a paragraph block per non-empty <p> with sanitized inline html', () => {
    const html = htmlWith('<p>პირველი აბზაცი</p><p>მეორე აბზაცი</p>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'paragraph', html: 'პირველი აბზაცი' },
      { kind: 'paragraph', html: 'მეორე აბზაცი' },
    ]);
  });

  it('drops paragraphs that are empty or whitespace-only', () => {
    const html = htmlWith('<p>first</p><p>   </p><p></p><p>second</p>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'paragraph', html: 'first' },
      { kind: 'paragraph', html: 'second' },
    ]);
  });

  it('preserves the document order of paragraphs and images interleaved', () => {
    const html = htmlWith(
      '<p>before</p><img src="https://static.ambebi.ge/a.jpg" alt="alpha"><p>middle</p><img src="https://static.ambebi.ge/b.jpg" alt=""><p>after</p>',
    );
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'paragraph', html: 'before' },
      { kind: 'image', src: 'https://static.ambebi.ge/a.jpg', alt: 'alpha' },
      { kind: 'paragraph', html: 'middle' },
      { kind: 'image', src: 'https://static.ambebi.ge/b.jpg', alt: '' },
      { kind: 'paragraph', html: 'after' },
    ]);
  });

  it('emits heading blocks for h2 with level 2', () => {
    const html = htmlWith('<h2>სათაური 2</h2><p>x</p>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks[0]).toEqual({ kind: 'heading', level: 2, text: 'სათაური 2' });
  });

  it('emits heading blocks for h3 with level 3', () => {
    const html = htmlWith('<h3>ქვესათაური</h3>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks[0]).toEqual({ kind: 'heading', level: 3, text: 'ქვესათაური' });
  });

  it('emits an unordered list block from <ul>', () => {
    const html = htmlWith('<ul><li>one</li><li>two</li><li>three</li></ul>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'list', ordered: false, items: ['one', 'two', 'three'] },
    ]);
  });

  it('emits an ordered list block from <ol>', () => {
    const html = htmlWith('<ol><li>first</li><li>second</li></ol>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'list', ordered: true, items: ['first', 'second'] },
    ]);
  });

  it('emits a quote block from <blockquote>', () => {
    const html = htmlWith('<blockquote>quoted text</blockquote>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([{ kind: 'quote', html: 'quoted text' }]);
  });

  it('extracts images from inside <figure> and attaches the figcaption as caption', () => {
    const html = htmlWith(
      '<figure><img src="https://static.ambebi.ge/fig.jpg" alt="alt"><figcaption>caption text</figcaption></figure>',
    );
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      {
        kind: 'image',
        src: 'https://static.ambebi.ge/fig.jpg',
        alt: 'alt',
        caption: 'caption text',
      },
    ]);
  });

  it('emits image without a caption key when figcaption is empty', () => {
    const html = htmlWith(
      '<figure><img src="https://static.ambebi.ge/no-cap.jpg" alt=""><figcaption></figcaption></figure>',
    );
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'image', src: 'https://static.ambebi.ge/no-cap.jpg', alt: '' },
    ]);
  });

  it('preserves allowed inline tags (a, strong, em, b, i, br) inside paragraphs', () => {
    const html = htmlWith(
      '<p>before <strong>bold</strong> and <em>italic</em> and <a href="https://example.com">link</a></p>',
    );
    const result = parseArticle(html, SOURCE_URL);
    const block = result.bodyBlocks[0];
    if (block?.kind !== 'paragraph') {
      throw new Error('expected paragraph block');
    }
    expect(block.html).toContain('<strong>bold</strong>');
    expect(block.html).toContain('<em>italic</em>');
    expect(block.html).toContain('<a href="https://example.com"');
    expect(block.html).toContain('target="_blank"');
    expect(block.html).toContain('rel="noopener noreferrer"');
  });

  it('strips disallowed inline tags while keeping their text content', () => {
    const html = htmlWith('<p>before <span class="x">middle</span> after</p>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([{ kind: 'paragraph', html: 'before middle after' }]);
  });

  it('drops anchors with non-http hrefs (javascript:, data:, etc.) while keeping their text', () => {
    const html = htmlWith('<p>safe <a href="javascript:alert(1)">danger</a> text</p>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([{ kind: 'paragraph', html: 'safe danger text' }]);
  });

  it('reads lazy-loaded images from data-src when src is missing', () => {
    const html = htmlWith(
      '<p>x</p><img data-src="https://static.ambebi.ge/lazy.jpg" alt="lazy"><p>y</p>',
    );
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toContainEqual({
      kind: 'image',
      src: 'https://static.ambebi.ge/lazy.jpg',
      alt: 'lazy',
    });
  });

  it('prefers data-src over src when both are present (lazy-load pattern)', () => {
    const html = htmlWith(
      '<img src="https://static.ambebi.ge/placeholder.gif" data-src="https://static.ambebi.ge/real.jpg" alt="x">',
    );
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'image', src: 'https://static.ambebi.ge/real.jpg', alt: 'x' },
    ]);
  });

  it('normalizes protocol-relative image URLs to https', () => {
    const html = htmlWith('<img src="//cdn.ambebi.ge/img.jpg" alt="rel">');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'image', src: 'https://cdn.ambebi.ge/img.jpg', alt: 'rel' },
    ]);
  });

  it('deduplicates images that appear more than once in the body', () => {
    const html = htmlWith(
      '<p>1</p><img src="https://static.ambebi.ge/dup.jpg" alt="a"><p>2</p><img src="https://static.ambebi.ge/dup.jpg" alt="a">',
    );
    const result = parseArticle(html, SOURCE_URL);
    const images = result.bodyBlocks.filter((b) => b.kind === 'image');
    expect(images).toHaveLength(1);
  });

  it('drops images that have neither src nor data-src', () => {
    const html = htmlWith('<p>x</p><img alt="missing"><p>y</p>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks.filter((b) => b.kind === 'image')).toEqual([]);
  });

  it('skips script, style, iframe, noscript, aside, form, and svg elements', () => {
    const html = htmlWith(
      '<p>before</p><script>alert(1)</script><style>x{}</style><iframe></iframe><aside>side</aside><form></form><svg></svg><p>after</p>',
    );
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'paragraph', html: 'before' },
      { kind: 'paragraph', html: 'after' },
    ]);
  });

  it('recurses into generic containers (divs) to find real content', () => {
    const html = htmlWith(
      '<div><div><p>nested deep</p><img src="https://static.ambebi.ge/n.jpg" alt=""></div></div>',
    );
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyBlocks).toEqual([
      { kind: 'paragraph', html: 'nested deep' },
      { kind: 'image', src: 'https://static.ambebi.ge/n.jpg', alt: '' },
    ]);
  });

  it('derives the plain-text body from paragraph and heading blocks (no html tags)', () => {
    const html = htmlWith('<h2>headline</h2><p>first <strong>bold</strong> word</p><p>second</p>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.body).toBe('headline\n\nfirst bold word\n\nsecond');
  });

  it('derives the bodyImages list from the image blocks for back-compat', () => {
    const html = htmlWith(
      '<p>x</p><img src="https://static.ambebi.ge/a.jpg" alt=""><p>y</p><img src="https://static.ambebi.ge/b.jpg" alt="">',
    );
    const result = parseArticle(html, SOURCE_URL);
    expect(result.bodyImages).toEqual([
      'https://static.ambebi.ge/a.jpg',
      'https://static.ambebi.ge/b.jpg',
    ]);
  });

  it('falls back to og:image for imageUrl when present', () => {
    const html = `<!doctype html><html><head><meta property="og:image" content="https://static.ambebi.ge/og.jpg"></head><body><h1>t</h1><div class="article_content"><p>x</p></div></body></html>`;
    const result = parseArticle(html, SOURCE_URL);
    expect(result.imageUrl).toBe('https://static.ambebi.ge/og.jpg');
  });

  it('falls back to the first body image when og:image is missing', () => {
    const html = htmlWith('<img src="https://static.ambebi.ge/first.jpg" alt=""><p>x</p>');
    const result = parseArticle(html, SOURCE_URL);
    expect(result.imageUrl).toBe('https://static.ambebi.ge/first.jpg');
  });
});
