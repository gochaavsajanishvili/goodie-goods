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
      <div className="hairline w-full rounded-lg border bg-(--color-paper-soft) p-8">
        <h1 className="mb-6 font-serif text-2xl text-(--color-ink)">ადმინი</h1>
        <form action={loginAction} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-(--color-ink-soft)">პაროლი</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="hairline w-full rounded-md border bg-(--color-paper) px-3 py-2 text-(--color-ink) focus:border-(--color-sage) focus:outline-none"
            />
          </label>
          {hasError ? (
            <p className="text-sm text-red-600 dark:text-red-400">არასწორი პაროლი</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-md bg-(--color-sage) py-2 text-(--color-paper) transition hover:opacity-90"
          >
            შესვლა
          </button>
        </form>
      </div>
    </main>
  );
}
