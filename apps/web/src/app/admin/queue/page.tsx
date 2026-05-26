import { labelForCategory } from '@goodie-goods/shared/categories';
import { Check, ExternalLink, X } from 'lucide-react';

import type { Article } from '@goodie-goods/shared/schema';

import { setArticleStatusAction } from '@/lib/admin-actions';
import { getPendingArticles } from '@/lib/queries';

const PENDING_LIMIT = 50;

interface SearchParams {
  readonly refresh?: string;
}

interface PageProps {
  readonly searchParams: Promise<SearchParams>;
}

export default async function QueuePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pending = await getPendingArticles(PENDING_LIMIT);
  return (
    <section className="space-y-4">
      {params.refresh !== undefined ? <RefreshBanner status={params.refresh} /> : null}
      <h2 className="eyebrow">მოლოდინში ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper-soft)] p-8 text-center text-[color:var(--color-ink-soft)]">
          მოლოდინში არაფერია.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((article) => (
            <QueueRow key={article.id} article={article} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RefreshBanner({ status }: { readonly status: string }) {
  const ok = status === 'ok';
  const classes = ok
    ? 'border-[color:var(--color-sage)] bg-[color:var(--color-sage-soft)] text-[color:var(--color-ink)]'
    : 'border-red-400/50 bg-red-500/10 text-red-700 dark:text-red-300';
  const message = ok ? 'მოთხოვნა გაიგზავნა' : refreshErrorMessage(status);
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${classes}`} role="status">
      {message}
    </div>
  );
}

function refreshErrorMessage(status: string): string {
  if (status === 'not-configured') {
    return 'GitHub-ის ინტეგრაცია არ არის კონფიგურირებული';
  }
  if (status === 'unauthorized') {
    return 'ავტორიზაცია ვერ მოხერხდა';
  }
  if (status === 'not-found') {
    return 'სამუშაო პროცესი ვერ მოიძებნა';
  }
  return 'ვერ მოხერხდა';
}

function QueueRow({ article }: { readonly article: Article }) {
  return (
    <li className="grid gap-4 rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper-soft)] p-5 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="space-y-2">
        <div className="eyebrow">
          {labelForCategory(article.category)} / {article.score}
        </div>
        <h3 className="font-serif text-lg leading-snug text-[color:var(--color-ink)]">
          {article.title}
        </h3>
        {article.reason !== null && article.reason !== '' ? (
          <p className="text-sm text-[color:var(--color-ink-soft)]">{article.reason}</p>
        ) : null}
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[0.6875rem] tracking-widest text-(--color-ink-soft) uppercase hover:text-(--color-ink)"
        >
          <ExternalLink size={11} strokeWidth={1.6} aria-hidden="true" />
          წყაროს ნახვა
        </a>
      </div>
      <div className="flex gap-2 sm:flex-col">
        <StatusForm id={article.id} status="approved" label="დადასტურება" tone="approve" />
        <StatusForm id={article.id} status="rejected" label="უარყოფა" tone="reject" />
      </div>
    </li>
  );
}

function StatusForm({
  id,
  status,
  label,
  tone,
}: {
  readonly id: string;
  readonly status: 'approved' | 'rejected';
  readonly label: string;
  readonly tone: 'approve' | 'reject';
}) {
  const Icon = tone === 'approve' ? Check : X;
  const classes =
    tone === 'approve'
      ? 'bg-[color:var(--color-sage)] text-[color:var(--color-paper)] hover:opacity-90'
      : 'border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] hover:border-red-500/60';
  return (
    <form action={setArticleStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[0.6875rem] tracking-widest whitespace-nowrap uppercase transition ${classes}`}
      >
        <Icon size={12} strokeWidth={1.7} aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}
