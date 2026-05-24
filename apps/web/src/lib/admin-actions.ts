'use server';

import { ADMIN_STATUS_VALUES } from '@goodie-goods/shared/constants';
import { articles } from '@goodie-goods/shared/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getSession, isAdminPassword } from './auth';
import { getDb } from './db';
import { triggerIngestWorkflow } from './github-dispatch';
import { toggleReadLocally } from './queries';

const LOGIN_PATH = '/admin/login';
const LOGIN_INVALID_PATH = `${LOGIN_PATH}?error=invalid`;
const QUEUE_PATH = '/admin/queue';

async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect(LOGIN_PATH);
  }
}

const loginInputSchema = z.object({
  password: z.string().min(1),
});

const articleStatusInputSchema = z.object({
  id: z.uuid(),
  status: z.enum(ADMIN_STATUS_VALUES),
});

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = loginInputSchema.safeParse({ password: formData.get('password') });
  if (!parsed.success) {
    redirect(LOGIN_INVALID_PATH);
  }
  if (!isAdminPassword(parsed.data.password)) {
    redirect(LOGIN_INVALID_PATH);
  }
  const session = await getSession();
  session.isAdmin = true;
  await session.save();
  redirect(QUEUE_PATH);
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect(LOGIN_PATH);
}

export async function setArticleStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = articleStatusInputSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  });
  if (!parsed.success) {
    return;
  }
  const db = getDb();
  await db
    .update(articles)
    .set({ adminStatus: parsed.data.status })
    .where(eq(articles.id, parsed.data.id));
  revalidatePath(QUEUE_PATH);
  revalidatePath('/');
}

export async function refreshFeedAction(): Promise<void> {
  await requireAdmin();
  const result = await triggerIngestWorkflow();
  const target = result.ok ? `${QUEUE_PATH}?refresh=ok` : `${QUEUE_PATH}?refresh=${result.reason}`;
  redirect(target);
}

export async function toggleReadLocallyAction(): Promise<void> {
  await requireAdmin();
  await toggleReadLocally();
  revalidatePath('/');
  revalidatePath(QUEUE_PATH);
  redirect(QUEUE_PATH);
}
