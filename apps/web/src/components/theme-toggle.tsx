'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Pref = 'system' | 'light' | 'dark';
type Effective = 'light' | 'dark';

const STORAGE_KEY = 'goodie-goods-theme';

function readSystem(): Effective {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readPref(): Pref {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function apply(pref: Pref): void {
  const effective: Effective = pref === 'system' ? readSystem() : pref;
  document.documentElement.dataset['theme'] = effective;
}

function persist(pref: Pref): void {
  if (pref === 'system') {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, pref);
  }
}

function useSystemThemeSync(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => {
      apply('system');
    };
    mq.addEventListener('change', onChange);
    return (): void => {
      mq.removeEventListener('change', onChange);
    };
  }, [active]);
}

export function ThemeToggle() {
  const [pref, setPref] = useState<Pref>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPref(readPref());
    setMounted(true);
  }, []);

  useSystemThemeSync(mounted && pref === 'system');

  const pick = (next: Pref): void => {
    setPref(next);
    persist(next);
    apply(next);
  };

  const Icon = pickIcon(pref, mounted);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hairline relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-(--color-paper-soft) text-(--color-ink) transition hover:border-(--color-sage)"
        aria-label="თემის არჩევა"
      >
        <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <ThemeMenu pref={pref} onPick={pick} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeMenu({
  pref,
  onPick,
}: {
  readonly pref: Pref;
  readonly onPick: (next: Pref) => void;
}) {
  return (
    <>
      <ThemeOption
        label="სისტემური"
        icon={Monitor}
        active={pref === 'system'}
        onSelect={() => {
          onPick('system');
        }}
      />
      <ThemeOption
        label="ნათელი"
        icon={Sun}
        active={pref === 'light'}
        onSelect={() => {
          onPick('light');
        }}
      />
      <ThemeOption
        label="მუქი"
        icon={Moon}
        active={pref === 'dark'}
        onSelect={() => {
          onPick('dark');
        }}
      />
    </>
  );
}

function pickIcon(pref: Pref, mounted: boolean): typeof Sun {
  if (!mounted || pref === 'system') {
    return Monitor;
  }
  return pref === 'dark' ? Moon : Sun;
}

function ThemeOption({
  label,
  icon: IconCmp,
  active,
  onSelect,
}: {
  readonly label: string;
  readonly icon: typeof Sun;
  readonly active: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onClick={onSelect} className={active ? 'bg-accent' : undefined}>
      <IconCmp size={14} strokeWidth={1.6} aria-hidden="true" />
      {label}
    </DropdownMenuItem>
  );
}
