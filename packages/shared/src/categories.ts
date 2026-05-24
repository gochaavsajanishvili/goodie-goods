import { CATEGORIES, CATEGORY_LABELS_KA, type Category } from './constants';

export function labelForCategory(value: string): string {
  const list: readonly string[] = CATEGORIES;
  if (list.includes(value)) {
    return CATEGORY_LABELS_KA[value as Category];
  }
  return value;
}
