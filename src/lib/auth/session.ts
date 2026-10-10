import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashToken, randomToken } from "./tokens";
import { SESSION_COOKIE, SESSION_DAYS, sessionCookieOptions } from "./cookie";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Signs the user in on this browser. Call from a Server Action or Route Handler. */
export async function createSession(userId: string) {
  const token = randomToken();
  await db.session.create({
    data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + SESSION_DAYS * DAY_MS) },
  });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

/**
 * The user behind a session cookie, or null when it is missing, unknown or expired.
 * Sessions slide: once half the lifetime has passed, the expiry moves forward again.
 * (proxy.ts keeps the cookie itself fresh on every visit.)
 */
export async function validateSessionToken(token: string | undefined) {
  if (!token) return null;
  const id = hashToken(token);
  const session = await db.session.findUnique({
    where: { id },
    select: { expiresAt: true, user: { select: { id: true, email: true, name: true, emailVerifiedAt: true } } },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.session.deleteMany({ where: { id } });
    return null;
  }
  if (session.expiresAt.getTime() - now < (SESSION_DAYS / 2) * DAY_MS) {
    await db.session.update({ where: { id }, data: { expiresAt: new Date(now + SESSION_DAYS * DAY_MS) } });
  }
  return session.user;
}

export async function readSessionCookie() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Signs out this browser. */
export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Signs the user out everywhere, e.g. after a password reset. */
export async function endAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}
