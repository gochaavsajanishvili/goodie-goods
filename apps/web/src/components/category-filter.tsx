import { CATEGORIES, CATEGORY_LABELS_KA } from '@goodie-goods/shared/constants';
import Link from 'next/link';

interface Props {
  readonly active: string | null;
  readonly strictParam: string | null;
}

export function CategoryFilter({ active, strictParam }: Props) {
  const baseParams = strictParam === null ? '' : `&strict=${strictParam}`;
  const allHref = strictParam === null ? '/' : `/?strict=${strictParam}`;

  return (
    <nav
      aria-label="კატეგორიები"
      className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden"
    >
      <CategoryPill href={allHref} active={active === null} label="ყველა" />
      {CATEGORIES.map((cat) => (
        <CategoryPill
          key={cat}
          href={`/?category=${cat}${baseParams}`}
          active={active === cat}
          label={CATEGORY_LABELS_KA[cat]}
        />
      ))}
    </nav>
  );
}

function CategoryPill({
  href,
  active,
  label,
}: {
  readonly href: string;
  readonly active: boolean;
  readonly label: string;
}) {
  const base = 'shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition';
  const styled = active
    ? 'border-[color:var(--color-sage)] bg-[color:var(--color-sage-soft)] text-[color:var(--color-ink)]'
    : 'border-[color:var(--color-rule)] bg-[color:var(--color-paper-soft)] text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-sage)] hover:text-[color:var(--color-ink)]';
  return (
    <Link href={href} className={`${base} ${styled}`}>
      {label}
    </Link>
  );
}
