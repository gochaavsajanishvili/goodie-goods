import { loginAction } from '@/lib/admin-actions';

interface SearchParams {
  readonly error?: string;
}

interface PageProps {
  readonly searchParams: Promise<SearchParams>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hasError = params.error !== undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5">
      <div className="w-full rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper-soft)] p-8">
        <h1 className="mb-6 font-serif text-2xl text-[color:var(--color-ink)]">ადმინი</h1>
        <form action={loginAction} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-[color:var(--color-ink-soft)]">პაროლი</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] px-3 py-2 text-[color:var(--color-ink)] focus:border-[color:var(--color-sage)] focus:outline-none"
            />
          </label>
          {hasError ? (
            <p className="text-sm text-red-600 dark:text-red-400">არასწორი პაროლი</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-md bg-[color:var(--color-sage)] py-2 text-[color:var(--color-paper)] transition hover:opacity-90"
          >
            შესვლა
          </button>
        </form>
      </div>
    </main>
  );
}
