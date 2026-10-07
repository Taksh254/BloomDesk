import "server-only";
import { db } from "@/lib/db";
import type { TokenPurpose } from "@/generated/prisma/client";
import { hashToken, randomToken } from "./tokens";

const LIFETIME_MINUTES: Record<TokenPurpose, number> = {
  verify_email: 24 * 60,
  reset_password: 60,
};

/** Makes a new one-time link token and cancels any earlier unused ones for the same purpose. */
export async function createEmailToken(userId: string, purpose: TokenPurpose) {
  const token = randomToken();
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
    db.authToken.create({
      data: {
        userId,
        purpose,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + LIFETIME_MINUTES[purpose] * 60 * 1000),
      },
    }),
  ]);
  return token;
}

/** Looks up a token without using it, for showing the right screen. */
export async function peekEmailToken(token: string, purpose: TokenPurpose) {
  if (!token) return null;
  return db.authToken.findFirst({
    where: { tokenHash: hashToken(token), purpose, usedAt: null, expiresAt: { gt: new Date() } },
    select: { userId: true, user: { select: { email: true } } },
  });
}

/** Uses a token exactly once. Returns the user id, or null if it is wrong, used or expired. */
export async function consumeEmailToken(token: string, purpose: TokenPurpose) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  // The conditional update is atomic, so two clicks on the same link can't both succeed.
  const { count } = await db.authToken.updateMany({
    where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count !== 1) return null;
  const row = await db.authToken.findUnique({ where: { tokenHash }, select: { userId: true } });
  return row?.userId ?? null;
}
