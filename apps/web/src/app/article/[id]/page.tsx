import { labelForCategory } from '@goodie-goods/shared/categories';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { Article } from '@goodie-goods/shared/schema';

import { BlockProse, LegacyGallery, LegacyProse } from '@/components/article-prose';
import { hyphenateGeorgian } from '@/lib/hyphenate-georgian';
import { getApprovedArticleById, getRelatedArticles } from '@/lib/queries';

export const revalidate = 60;

const GEORGIAN_CHARS_PER_MINUTE = 1100;
const RELATED_LIMIT = 6;

interface PageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getApprovedArticleById(id);
  if (article === null) {
    notFound();
  }
  const related = await getRelatedArticles(article.id, article.category, RELATED_LIMIT);
  return (
    <main className="mx-auto max-w-7xl px-3 pt-10 pb-24 sm:px-5 sm:pt-16">
      <BackLink />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        <ArticleBody article={article} />
        <RelatedSidebar items={related} />
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <nav className="mb-8">
      <Link
        href="/"
        className="group inline-flex items-center gap-2 text-(--color-ink-soft) transition hover:text-(--color-ink)"
      >
        <span className="inline-flex transition group-hover:-translate-x-0.5">
          <ArrowLeft size={16} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <span className="text-sm">უკან</span>
      </Link>
    </nav>
  );
}

function ArticleBody({ article }: { readonly article: Article }) {
  const publishedDate =
    article.publishedAt !== null ? formatTbilisiDate(article.publishedAt) : null;
  const readMinutes = estimateReadMinutes(article.body);
  const heroImage = article.imageUrl ?? article.bodyImages[0] ?? null;
  return (
    <article className="min-w-0 space-y-8">
      <ArticleHeader
        category={labelForCategory(article.category)}
        publishedDate={publishedDate}
        readMinutes={readMinutes}
        title={article.title}
      />
      {heroImage !== null ? <HeroImage src={heroImage} /> : null}
      <ArticleContent article={article} heroImage={heroImage} />
      <ArticleFooter sourceUrl={article.sourceUrl} />
    </article>
  );
}

function ArticleContent({
  article,
  heroImage,
}: {
  readonly article: Article;
  readonly heroImage: string | null;
}) {
  if (article.bodyBlocks !== null && article.bodyBlocks.length > 0) {
    const blocks = article.bodyBlocks.filter((b) => b.kind !== 'image' || b.src !== heroImage);
    return <BlockProse blocks={blocks} />;
  }
  const paragraphs = splitParagraphs(article.body).map(hyphenateGeorgian);
  const galleryImages = article.bodyImages.filter((url) => url !== heroImage);
  return (
    <>
      <LegacyProse paragraphs={paragraphs} />
      {galleryImages.length > 0 ? <LegacyGallery images={galleryImages} /> : null}
    </>
  );
}

function ArticleHeader({
  category,
  publishedDate,
  readMinutes,
  title,
}: {
  readonly category: string;
  readonly publishedDate: string | null;
  readonly readMinutes: number | null;
  readonly title: string;
}) {
  return (
    <header className="hairline space-y-5 border-b pb-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] tracking-widest text-(--color-ink-soft) uppercase">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles
            size={11}
            strokeWidth={1.6}
            className="text-(--color-sage)"
            aria-hidden="true"
          />
          {category}
        </span>
        {publishedDate !== null ? <MetaSep>{publishedDate}</MetaSep> : null}
        {readMinutes !== null ? <MetaSep>{readMinutes.toString()} წთ კითხვა</MetaSep> : null}
      </div>
      <h1 className="font-serif text-3xl leading-[1.15] text-balance text-(--color-ink) sm:text-4xl md:text-[2.6rem]">
        {title}
      </h1>
    </header>
  );
}

function MetaSep({ children }: { readonly children: React.ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="text-(--color-rule)">
        /
      </span>
      <span>{children}</span>
    </>
  );
}

function HeroImage({ src }: { readonly src: string }) {
  return (
    <figure className="aspect-video overflow-hidden rounded-lg bg-(--color-paper-soft) shadow-[0_30px_60px_-30px_var(--color-shadow)]">
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        fetchPriority="high"
      />
    </figure>
  );
}

function ArticleFooter({ sourceUrl }: { readonly sourceUrl: string }) {
  return (
    <footer className="hairline mt-10 border-t pt-8">
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hairline inline-flex items-center gap-2 rounded-full border bg-(--color-paper-soft) px-4 py-2 font-mono text-[0.6875rem] tracking-widest text-(--color-ink-soft) uppercase transition hover:border-(--color-sage) hover:text-(--color-ink)"
      >
        <ExternalLink size={12} strokeWidth={1.6} aria-hidden="true" />
        ambebi.ge
      </a>
    </footer>
  );
}

function RelatedSidebar({ items }: { readonly items: readonly Article[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <aside>
      <h2 className="eyebrow mb-5 flex items-center gap-2">
        <span className="inline-block h-px w-6 bg-(--color-sage)" aria-hidden="true" />
        კიდევ კარგი
      </h2>
      <ul className="space-y-5">
        {items.map((item) => (
          <RelatedItem key={item.id} item={item} />
        ))}
      </ul>
    </aside>
  );
}

function RelatedItem({ item }: { readonly item: Article }) {
  return (
    <li>
      <Link href={`/article/${item.id}`} className="group block">
        {item.imageUrl !== null && item.imageUrl !== '' ? (
          <div className="mb-3 aspect-16/10 overflow-hidden rounded-md bg-(--color-paper-soft)">
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          </div>
        ) : null}
        <p className="mb-1 font-mono text-[0.625rem] tracking-widest text-(--color-ink-soft) uppercase">
          {labelForCategory(item.category)}
        </p>
        <h3 className="font-serif text-base leading-snug text-(--color-ink) transition group-hover:text-(--color-warm)">
          {item.title}
        </h3>
      </Link>
    </li>
  );
}

function formatTbilisiDate(date: Date): string {
  return new Intl.DateTimeFormat('ka-GE', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function estimateReadMinutes(body: string | null): number | null {
  if (body === null || body.length === 0) {
    return null;
  }
  return Math.max(1, Math.round(body.length / GEORGIAN_CHARS_PER_MINUTE));
}

function splitParagraphs(body: string | null): string[] {
  if (body === null || body.length === 0) {
    return [];
  }
  return body
    .split(/\n{2,}|(?<=[.!?])\s{2,}/u)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
