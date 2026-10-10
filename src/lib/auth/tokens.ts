import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** A random, URL-safe token for cookies and email links (256 bits). */
export function randomToken() {
  return randomBytes(32).toString("base64url");
}

/** Tokens are stored only as their SHA-256 hash, so a database leak can't be used to sign in. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
