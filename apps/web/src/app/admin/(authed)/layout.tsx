import { LogOut, RefreshCw, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';

import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { logoutAction, refreshFeedAction, toggleReadLocallyAction } from '@/lib/admin-actions';
import { getSession } from '@/lib/auth';
import { getReadLocallySetting } from '@/lib/queries';

const BUTTON_SHELL =
  'group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[0.6875rem] tracking-widest uppercase transition';
const INACTIVE_STATE =
  'border-(--color-rule) bg-(--color-paper-soft) text-(--color-ink-soft) hover:border-(--color-sage) hover:text-(--color-ink)';
const ACTIVE_STATE = 'border-(--color-sage) bg-(--color-sage-soft) text-(--color-ink)';

export default async function AdminLayout({ children }: { readonly children: ReactNode }) {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect('/admin/login');
  }
  const zenOn = await getReadLocallySetting();
  return (
    <div className="mx-auto max-w-5xl px-5 pt-10 pb-16 sm:pt-16">
      <AdminHeader zenOn={zenOn} />
      {children}
    </div>
  );
}

function AdminHeader({ zenOn }: { readonly zenOn: boolean }) {
  return (
    <header className="mb-10 flex flex-col gap-4 border-b border-(--color-rule) pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1.5">
        <p className="eyebrow flex items-center gap-2">
          <span className="inline-block h-px w-6 bg-(--color-sage)" aria-hidden="true" />
          ადმინი
        </p>
        <h1 className="font-serif text-3xl text-(--color-ink) sm:text-4xl">მოლოდინი</h1>
      </div>
      <AdminActions zenOn={zenOn} />
    </header>
  );
}

function AdminActions({ zenOn }: { readonly zenOn: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={toggleReadLocallyAction}>
        <button
          type="submit"
          aria-pressed={zenOn}
          className={`${BUTTON_SHELL} ${zenOn ? ACTIVE_STATE : INACTIVE_STATE}`}
        >
          <span className="inline-flex transition duration-500 group-hover:scale-110">
            <Sparkles size={12} strokeWidth={1.6} aria-hidden="true" />
          </span>
          ზენ რეჟიმი
        </button>
      </form>
      <form action={refreshFeedAction}>
        <button type="submit" className={`${BUTTON_SHELL} ${INACTIVE_STATE}`}>
          <span className="inline-flex transition duration-500 ease-in-out group-hover:rotate-180">
            <RefreshCw size={12} strokeWidth={1.6} aria-hidden="true" />
          </span>
          განახლება
        </button>
      </form>
      <form action={logoutAction}>
        <button type="submit" className={`${BUTTON_SHELL} ${INACTIVE_STATE}`}>
          <span className="inline-flex transition duration-300 group-hover:translate-x-0.5">
            <LogOut size={12} strokeWidth={1.6} aria-hidden="true" />
          </span>
          გასვლა
        </button>
      </form>
      <ThemeToggle />
    </div>
  );
}
