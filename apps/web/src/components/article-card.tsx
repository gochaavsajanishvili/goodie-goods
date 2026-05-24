import { labelForCategory } from '@goodie-goods/shared/categories';
import Link from 'next/link';

import type { Article } from '@goodie-goods/shared/schema';

interface Props {
  readonly article: Article;
  readonly zenMode: boolean;
}

const SHELL =
  'group block overflow-hidden rounded-lg border border-(--color-rule) bg-(--color-paper-soft) transition duration-300 hover:-translate-y-0.5 hover:border-(--color-sage) hover:shadow-[0_24px_60px_-32px_var(--color-shadow)]';

export function ArticleCard({ article, zenMode }: Props) {
  const body = <CardBody article={article} />;
  if (zenMode) {
    return (
      <Link href={`/article/${article.id}`} className={SHELL}>
        {body}
      </Link>
    );
  }
  return (
    <a href={article.sourceUrl} target="_blank" className={SHELL}>
      {body}
    </a>
  );
}

function CardBody({ article }: { readonly article: Article }) {
  const categoryLabel = labelForCategory(article.category);
  return (
    <>
      <CardImage src={article.imageUrl} />
      <div className="space-y-3 p-6">
        <div className="eyebrow flex items-center gap-2">
          <span>{categoryLabel}</span>
          <span aria-hidden="true" className="text-(--color-rule)">
            /
          </span>
          <span className="text-(--color-warm)">{article.score}</span>
        </div>
        <h2 className="font-serif text-[1.35rem] leading-[1.2] text-balance text-(--color-ink)">
          {article.title}
        </h2>
        {article.excerpt !== null && article.excerpt !== '' ? (
          <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-(--color-ink-soft)">
            {article.excerpt}
          </p>
        ) : null}
      </div>
    </>
  );
}

function CardImage({ src }: { readonly src: string | null }) {
  if (src === null || src === '') {
    return <div className="aspect-[16/10] bg-(--color-sage-soft)" aria-hidden="true" />;
  }
  return (
    <div className="aspect-[16/10] overflow-hidden bg-(--color-sage-soft)">
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
    </div>
  );
}
