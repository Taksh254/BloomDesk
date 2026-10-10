import "server-only";
import bcrypt from "bcryptjs";

const COST = 12;

export const PASSWORD_MIN = 8;

/** bcrypt only reads the first 72 bytes, so longer passwords are refused rather than silently cut. */
export function passwordProblem(password: string) {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (new TextEncoder().encode(password).length > 72) return "Use 72 characters or fewer.";
  return null;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, COST);
}

// Compared against when the email isn't found, so a wrong email takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("bloomdesk-dummy-password", COST);

export function verifyPassword(password: string, hash: string | null | undefined) {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}
