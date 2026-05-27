import { RefreshCw } from 'lucide-react';

import { refreshFeedFromHomeAction } from '@/lib/admin-actions';

export function RefreshFab() {
  return (
    <form
      action={refreshFeedFromHomeAction}
      className="fixed right-5 bottom-5 z-40 sm:right-7 sm:bottom-7"
    >
      <button
        type="submit"
        aria-label="ახალი ამბების განახლება"
        title="ახალი ამბების განახლება"
        className="group hairline inline-flex h-12 w-12 items-center justify-center rounded-full border bg-(--color-paper-soft) text-(--color-ink) shadow-[0_18px_36px_-18px_var(--color-shadow)] transition hover:border-(--color-sage) hover:text-(--color-sage) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-sage)"
      >
        <RefreshCw
          size={18}
          strokeWidth={1.6}
          aria-hidden="true"
          className="transition group-hover:rotate-90"
        />
      </button>
    </form>
  );
}
