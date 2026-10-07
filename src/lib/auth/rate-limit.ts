import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Counts one attempt for `key` in a fixed window and says whether it is still allowed.
 * Kept in PostgreSQL so it holds across server instances and restarts.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  const row = await db.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  // Tidy up old windows now and then instead of running a separate job.
  if (Math.random() < 0.02) {
    await db.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now - 24 * 60 * 60 * 1000) } } });
  }

  if (row.count <= limit) return { ok: true };
  return { ok: false, retryAfterSeconds: Math.ceil((windowStart.getTime() + windowMs - now) / 1000) };
}

/** The visitor's IP address as reported by the hosting proxy, for rate limit keys. */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export function tryAgainIn(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "in a minute" : `in ${minutes} minutes`;
}
