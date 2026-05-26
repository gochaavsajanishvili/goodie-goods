import { CATEGORIES, CATEGORY_LABELS_KA } from '@goodie-goods/shared/constants';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  readonly active: string | null;
}

export function CategoryFilter({ active }: Props) {
  return (
    <nav aria-label="კატეგორიები" className="flex flex-wrap items-center gap-2">
      <CategoryPill href="/" active={active === null} label="ყველა" />
      {CATEGORIES.map((cat) => (
        <CategoryPill
          key={cat}
          href={`/?category=${cat}`}
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
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        buttonVariants({ variant: active ? 'default' : 'outline', size: 'sm' }),
        'rounded-full',
      )}
    >
      {label}
    </Link>
  );
}
