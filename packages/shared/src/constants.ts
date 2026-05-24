export const SOURCE_NAME = 'ambebi.ge';
export const AMBEBI_BASE_URL = 'https://www.ambebi.ge';

export const SCRAPER_USER_AGENT = 'goodie-goods/1.0';
export const SCRAPER_CONCURRENCY = 4;
export const SCRAPER_DELAY_MS = 250;
export const SCRAPER_BATCH_PAUSE_MS = 1000;

export const CLASSIFIER_MODEL = 'gemini-2.5-flash';
export const CLASSIFIER_VERSION = 2;

export const STRICT_SCORE_THRESHOLD = 75;
export const SOFT_SCORE_THRESHOLD = 50;

export const CATEGORIES = [
  'family',
  'science',
  'culture',
  'health',
  'animals',
  'education',
  'human_interest',
  'entertainment',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS_KA: Record<Category, string> = {
  family: 'ოჯახი',
  science: 'მეცნიერება',
  culture: 'კულტურა',
  health: 'ჯანმრთელობა',
  animals: 'ცხოველები',
  education: 'განათლება',
  human_interest: 'ადამიანების ისტორიები',
  entertainment: 'გართობა',
  other: 'სხვა',
};

export const NEGATIVE_KEYWORDS_KA = [
  'მოკლეს',
  'გარდაიცვალა',
  'დაიღუპა',
  'ომი',
  'ომში',
  'დაკავება',
  'დააკავეს',
  'დანაშაული',
  'ავარია',
  'აფეთქება',
  'დაშავდა',
  'გატაცება',
  'ძალადობა',
  'სიკვდილი',
  'კრიზისი',
  'მკვლელობა',
  'ცეცხლი გახსნა',
  'ცეცხლი გაუხსნა',
  'თვითმკვლელობა',
  'გაუპატიურა',
  'ნარკოტიკ',
  'ცემა',
  'ცემეს',
] as const;

export const NEGATIVE_KEYWORDS_EN = [
  'killed',
  'dead',
  'war',
  'crime',
  'violence',
  'accident',
  'murder',
  'assault',
  'rape',
  'terror',
  'bomb',
  'shoot',
] as const;

export const ADMIN_STATUS_VALUES = ['pending', 'approved', 'rejected'] as const;
export type AdminStatus = (typeof ADMIN_STATUS_VALUES)[number];
