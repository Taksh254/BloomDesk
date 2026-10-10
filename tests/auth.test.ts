import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { hashToken, randomToken } from "@/lib/auth/tokens";
import { consumeEmailToken, createEmailToken, peekEmailToken } from "@/lib/auth/email-tokens";
import { validateSessionToken } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { safeNext } from "@/lib/form";

const userIds: string[] = [];
async function makeUser() {
  const user = await db.user.create({
    data: { email: `auth-${randomUUID()}@example.test`, name: "Test", passwordHash: await hashPassword("correct horse") },
  });
  userIds.push(user.id);
  return user;
}

after(async () => {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
  await db.$disconnect();
});

describe("passwords", () => {
  test("are stored as bcrypt hashes and checked correctly", async () => {
    const user = await makeUser();
    assert.match(user.passwordHash, /^\$2[aby]\$12\$/);
    assert.ok(!user.passwordHash.includes("correct horse"));
    assert.equal(await verifyPassword("correct horse", user.passwordHash), true);
    assert.equal(await verifyPassword("wrong horse", user.passwordHash), false);
    assert.equal(await verifyPassword("anything", null), false);
  });

  test("must be 8 to 72 bytes", () => {
    assert.ok(passwordProblem("short"));
    assert.equal(passwordProblem("long enough"), null);
    assert.ok(passwordProblem("é".repeat(40)));
  });
});

describe("sessions", () => {
  test("a valid token finds its user; unknown and expired ones don't", async () => {
    const user = await makeUser();
    const token = randomToken();
    await db.session.create({ data: { id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 86_400_000 * 20) } });
    assert.equal((await validateSessionToken(token))?.id, user.id);
    assert.equal(await validateSessionToken(randomToken()), null);
    assert.equal(await validateSessionToken(undefined), null);

    const old = randomToken();
    await db.session.create({ data: { id: hashToken(old), userId: user.id, expiresAt: new Date(Date.now() - 1000) } });
    assert.equal(await validateSessionToken(old), null);
    assert.equal(await db.session.count({ where: { id: hashToken(old) } }), 0, "expired session is deleted");
  });

  test("only the token's hash is stored", async () => {
    const user = await makeUser();
    const token = randomToken();
    await db.session.create({ data: { id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 1000) } });
    assert.equal(await db.session.count({ where: { id: token } }), 0);
  });

  test("a session past half its life is renewed", async () => {
    const user = await makeUser();
    const token = randomToken();
    await db.session.create({ data: { id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 86_400_000 * 2) } });
    await validateSessionToken(token);
    const row = await db.session.findUnique({ where: { id: hashToken(token) } });
    assert.ok(row!.expiresAt.getTime() > Date.now() + 86_400_000 * 29);
  });
});

describe("email links", () => {
  test("work once, for their own purpose only", async () => {
    const user = await makeUser();
    const token = await createEmailToken(user.id, "reset_password");
    assert.equal(await consumeEmailToken(token, "verify_email"), null);
    assert.equal((await peekEmailToken(token, "reset_password"))?.userId, user.id);
    assert.equal(await consumeEmailToken(token, "reset_password"), user.id);
    assert.equal(await consumeEmailToken(token, "reset_password"), null);
  });

  test("a new link cancels the previous one", async () => {
    const user = await makeUser();
    const first = await createEmailToken(user.id, "verify_email");
    const second = await createEmailToken(user.id, "verify_email");
    assert.equal(await consumeEmailToken(first, "verify_email"), null);
    assert.equal(await consumeEmailToken(second, "verify_email"), user.id);
  });

  test("expired links are refused", async () => {
    const user = await makeUser();
    const token = await createEmailToken(user.id, "reset_password");
    await db.authToken.updateMany({ where: { tokenHash: hashToken(token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal(await consumeEmailToken(token, "reset_password"), null);
  });
});

describe("rate limits", () => {
  test("allow up to the limit in a window, then refuse", async () => {
    const key = `test:${randomUUID()}`;
    for (let i = 0; i < 3; i++) assert.equal((await rateLimit(key, 3, 60)).ok, true);
    const blocked = await rateLimit(key, 3, 60);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 60);
  });
});

describe("redirect after sign-in", () => {
  test("stays inside the app", () => {
    assert.equal(safeNext("/children?class=1"), "/children?class=1");
    assert.equal(safeNext("//evil.example"), "/today");
    assert.equal(safeNext("/\\evil.example"), "/today");
    assert.equal(safeNext("https://evil.example"), "/today");
    assert.equal(safeNext(""), "/today");
  });
});
