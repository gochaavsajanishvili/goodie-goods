import type { ArticleBlock } from '@goodie-goods/shared/types';

import { hyphenateGeorgian, hyphenateGeorgianHtml } from '@/lib/hyphenate-georgian';

const PROSE_CLASSES = 'prose-article';
const DROP_CAP_CLASSES =
  'first-letter:float-left first-letter:mt-1 first-letter:mr-2.5 first-letter:font-serif first-letter:text-[3.2rem] first-letter:leading-[0.95] first-letter:font-medium first-letter:text-(--color-quote)';

export function BlockProse({ blocks }: { readonly blocks: readonly ArticleBlock[] }) {
  if (blocks.length === 0) {
    return <EmptyBody />;
  }
  const firstParagraphIdx = blocks.findIndex((b) => b.kind === 'paragraph');
  return (
    <div lang="ka" className={PROSE_CLASSES}>
      {blocks.map((block, idx) => (
        <BlockNode key={idx} block={block} withDropCap={idx === firstParagraphIdx} />
      ))}
    </div>
  );
}

export function LegacyProse({ paragraphs }: { readonly paragraphs: readonly string[] }) {
  if (paragraphs.length === 0) {
    return <EmptyBody />;
  }
  return (
    <div lang="ka" className={PROSE_CLASSES}>
      {paragraphs.map((p, idx) => (
        <p key={idx} className={idx === 0 ? DROP_CAP_CLASSES : undefined}>
          {p}
        </p>
      ))}
    </div>
  );
}

export function LegacyGallery({ images }: { readonly images: readonly string[] }) {
  return (
    <figure className="hairline mt-8 space-y-4 border-t pt-8">
      {images.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          className="block w-full rounded-lg bg-(--color-paper-soft) shadow-[0_18px_36px_-24px_var(--color-shadow)]"
        />
      ))}
    </figure>
  );
}

function BlockNode({
  block,
  withDropCap,
}: {
  readonly block: ArticleBlock;
  readonly withDropCap: boolean;
}) {
  if (block.kind === 'paragraph') {
    return <ProseParagraph html={block.html} withDropCap={withDropCap} />;
  }
  if (block.kind === 'heading') {
    return <ProseHeading level={block.level} text={block.text} />;
  }
  if (block.kind === 'list') {
    return <ProseList ordered={block.ordered} items={block.items} />;
  }
  if (block.kind === 'quote') {
    return <ProseQuote html={block.html} />;
  }
  const inlineImageProps =
    block.caption !== undefined
      ? { src: block.src, alt: block.alt, caption: block.caption }
      : { src: block.src, alt: block.alt };
  return <InlineImage {...inlineImageProps} />;
}

function ProseParagraph({
  html,
  withDropCap,
}: {
  readonly html: string;
  readonly withDropCap: boolean;
}) {
  const hyphenated = hyphenateGeorgianHtml(html);
  return (
    <p
      lang="ka"
      className={withDropCap ? DROP_CAP_CLASSES : undefined}
      dangerouslySetInnerHTML={{ __html: hyphenated }}
    />
  );
}

function ProseHeading({ level, text }: { readonly level: 2 | 3; readonly text: string }) {
  const hyphenated = hyphenateGeorgian(text);
  if (level === 2) {
    return (
      <h2 className="mt-10 font-serif text-2xl leading-tight text-(--color-ink) sm:text-[1.75rem]">
        {hyphenated}
      </h2>
    );
  }
  return <h3 className="mt-8 font-serif text-xl leading-tight text-(--color-ink)">{hyphenated}</h3>;
}

function ProseList({
  ordered,
  items,
}: {
  readonly ordered: boolean;
  readonly items: readonly string[];
}) {
  if (ordered) {
    return (
      <ol className="ml-6 list-decimal space-y-2 marker:text-(--color-ink-soft)">
        {items.map((html, idx) => (
          <li key={idx} dangerouslySetInnerHTML={{ __html: hyphenateGeorgianHtml(html) }} />
        ))}
      </ol>
    );
  }
  return (
    <ul className="ml-6 list-disc space-y-2 marker:text-(--color-ink-soft)">
      {items.map((html, idx) => (
        <li key={idx} dangerouslySetInnerHTML={{ __html: hyphenateGeorgianHtml(html) }} />
      ))}
    </ul>
  );
}

function ProseQuote({ html }: { readonly html: string }) {
  return (
    <blockquote
      className="my-8 border-l-2 border-(--color-sage) pl-5 font-serif text-[1.15rem] text-(--color-ink) italic"
      dangerouslySetInnerHTML={{ __html: hyphenateGeorgianHtml(html) }}
    />
  );
}

function InlineImage({
  src,
  alt,
  caption,
}: {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
}) {
  return (
    <figure className="my-7 overflow-hidden rounded-lg bg-(--color-paper-soft) shadow-[0_18px_36px_-24px_var(--color-shadow)]">
      <img src={src} alt={alt} loading="lazy" className="block w-full" />
      {caption !== undefined && caption.length > 0 ? (
        <figcaption className="px-4 py-3 text-sm text-(--color-ink-soft)">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function EmptyBody() {
  return (
    <p className="text-sm text-(--color-ink-soft)">
      სრული ტექსტი ხელმისაწვდომი არ არის. სცადეთ წყაროზე გადასვლა.
    </p>
  );
}
