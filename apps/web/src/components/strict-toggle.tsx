'use client';

import { Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import type { FeedMode } from '@/lib/queries';

interface Props {
  readonly mode: FeedMode;
}

export function StrictToggle({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const handleToggle = (): void => {
    const next = new URLSearchParams(searchParams.toString());
    if (mode === 'strict') {
      next.set('strict', 'false');
    } else {
      next.delete('strict');
    }
    startTransition(() => {
      router.push(next.size > 0 ? `/?${next.toString()}` : '/');
    });
  };

  const isStrict = mode === 'strict';
  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={isStrict}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[0.6875rem] tracking-widest whitespace-nowrap uppercase transition disabled:opacity-50 ${
        isStrict
          ? 'border-[color:var(--color-sage)] bg-[color:var(--color-sage-soft)] text-[color:var(--color-ink)]'
          : 'border-[color:var(--color-rule)] bg-[color:var(--color-paper-soft)] text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-sage)] hover:text-[color:var(--color-ink)]'
      }`}
    >
      <Filter size={12} strokeWidth={1.6} aria-hidden="true" />
      {isStrict ? 'მკაცრი რეჟიმი' : 'მსუბუქი რეჟიმი'}
    </button>
  );
}
