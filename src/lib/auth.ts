import crypto from 'node:crypto';
import { requireServerEnv } from '@/lib/constants';

const COOKIE_NAME = 'rifa_admin';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function buildSessionCookie(): { name: string; value: string; maxAge: number } {
  const secret = requireServerEnv('ADMIN_SESSION_SECRET');
  const issuedAt = Date.now().toString();
  const sig = sign(issuedAt, secret);
  return { name: COOKIE_NAME, value: `${issuedAt}.${sig}`, maxAge: MAX_AGE_SECONDS };
}

export function verifySessionCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const [issuedAt, sig] = cookieValue.split('.');
  if (!issuedAt || !sig) return false;
  const secret = requireServerEnv('ADMIN_SESSION_SECRET');
  const expected = sign(issuedAt, secret);
  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
  const age = Date.now() - Number(issuedAt);
  return age < MAX_AGE_SECONDS * 1000;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
