import { ArticleCard } from '@/components/article-card';
import { CategoryFilter } from '@/components/category-filter';
import { StrictToggle } from '@/components/strict-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { getApprovedArticles, getReadLocallySetting, type FeedMode } from '@/lib/queries';

export const revalidate = 60;

interface SearchParams {
  readonly strict?: string;
  readonly category?: string;
}

interface PageProps {
  readonly searchParams: Promise<SearchParams>;
}

const FEED_LIMIT = 30;

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const mode: FeedMode = params.strict === 'false' ? 'soft' : 'strict';
  const category =
    typeof params.category === 'string' && params.category !== '' ? params.category : null;
  const strictParam = params.strict ?? null;
  const [articles, zenMode] = await Promise.all([
    getApprovedArticles({ mode, category, limit: FEED_LIMIT }),
    getReadLocallySetting(),
  ]);
  return (
    <main className="mx-auto max-w-6xl px-5 pt-10 pb-20 sm:pt-16">
      <Masthead />
      <FilterRow mode={mode} category={category} strictParam={strictParam} />
      {articles.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} zenMode={zenMode} />
          ))}
        </section>
      )}
      <SiteFooter />
    </main>
  );
}

function Masthead() {
  return (
    <header className="mb-12 flex items-start justify-between gap-4">
      <div className="space-y-3">
        <p className="eyebrow flex items-center gap-2">
          <span className="inline-block h-px w-8 bg-(--color-sage)" aria-hidden="true" />
          დღევანდელი კარგი
        </p>
        <h1 className="font-serif text-4xl leading-[1.05] text-balance text-(--color-ink) sm:text-5xl md:text-6xl">
          კარგი ამბები
        </h1>
        <p className="max-w-xl text-base text-(--color-ink-soft) sm:text-lg">
          მხოლოდ თბილი, სასიამოვნო და სასარგებლო ამბები.
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}

function FilterRow({
  mode,
  category,
  strictParam,
}: {
  readonly mode: FeedMode;
  readonly category: string | null;
  readonly strictParam: string | null;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 border-y border-(--color-rule) py-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="min-w-0 flex-1">
        <CategoryFilter active={category} strictParam={strictParam} />
      </div>
      <StrictToggle mode={mode} />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-(--color-rule) pt-6 text-center font-mono text-[0.6875rem] tracking-widest text-(--color-ink-soft) uppercase">
      წყარო ·{' '}
      <a
        href="https://www.ambebi.ge"
        className="underline-offset-4 hover:underline"
        target="_blank"
      >
        ambebi.ge
      </a>
    </footer>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper-soft)] px-6 py-16 text-center">
      <p className="text-base text-[color:var(--color-ink-soft)]">
        ახალი კარგი ამბები ჯერ არ არის. სცადეთ მოგვიანებით.
      </p>
    </div>
  );
}
