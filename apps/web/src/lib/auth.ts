import 'server-only';

import { sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';

import { getEnv } from './env';

interface AdminSession {
  isAdmin: boolean;
}

export interface AdminSessionHandle extends AdminSession {
  save(): Promise<void>;
  destroy(): void;
}

const COOKIE_NAME = 'goodie-goods-admin';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

async function readSessionData(
  rawCookie: string | undefined,
  password: string,
): Promise<AdminSession> {
  if (rawCookie === undefined || rawCookie === '') {
    return { isAdmin: false };
  }
  try {
    return await unsealData<AdminSession>(rawCookie, { password });
  } catch {
    return { isAdmin: false };
  }
}

export async function getSession(): Promise<AdminSessionHandle> {
  const env = getEnv();
  const cookieStore = await cookies();
  const initial = await readSessionData(
    cookieStore.get(COOKIE_NAME)?.value,
    env.IRON_SESSION_PASSWORD,
  );

  const handle: AdminSessionHandle = {
    isAdmin: initial.isAdmin,
    async save() {
      const sealed = await sealData(
        { isAdmin: handle.isAdmin },
        { password: env.IRON_SESSION_PASSWORD, ttl: COOKIE_MAX_AGE_SECONDS },
      );
      cookieStore.set(COOKIE_NAME, sealed, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE_SECONDS,
        path: '/',
      });
    },
    destroy() {
      handle.isAdmin = false;
      cookieStore.delete(COOKIE_NAME);
    },
  };
  return handle;
}

export function isAdminPassword(candidate: string): boolean {
  const env = getEnv();
  const a = Buffer.from(candidate);
  const b = Buffer.from(env.ADMIN_PASSWORD);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
