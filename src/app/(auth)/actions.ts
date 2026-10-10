"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { createSession, endAllSessions, endSession } from "@/lib/auth/session";
import { consumeEmailToken, createEmailToken } from "@/lib/auth/email-tokens";
import { clientIp, rateLimit, tryAgainIn } from "@/lib/auth/rate-limit";
import { sendEmail } from "@/lib/email";
import { resetPasswordMessage, verifyEmailMessage } from "@/lib/email/templates";
import { createSchool } from "@/lib/schools";
import { getSession } from "@/lib/session";
import { appUrl } from "@/lib/url";
import { keepValues, safeNext, str, type FormState } from "@/lib/form";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINUTE = 60;
const HOUR = 60 * MINUTE;

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = keepValues(formData);

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter the email you signed up with.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const ip = await clientIp();
  for (const [key, limit] of [[`login:email:${email}`, 10], [`login:ip:${ip}`, 50]] as const) {
    const rl = await rateLimit(key, limit, 15 * MINUTE);
    if (!rl.ok) return { error: `Too many sign-in attempts. Try again ${tryAgainIn(rl.retryAfterSeconds)}.`, values };
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok) return { error: "That email and password don't match. Try again, or reset your password.", values };

  await createSession(user.id);
  redirect(safeNext(str(formData, "next")));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = str(formData, "full_name");
  const schoolName = str(formData, "school_name");
  const city = str(formData, "city");
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = keepValues(formData);

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.full_name = "Enter your name.";
  if (fullName.length > 120) fieldErrors.full_name = "Keep your name under 120 characters.";
  if (schoolName.length < 2) fieldErrors.school_name = "Enter your school's name.";
  if (schoolName.length > 120) fieldErrors.school_name = "Keep the school name under 120 characters.";
  if (!EMAIL_RE.test(email) || email.length > 254) fieldErrors.email = "Enter a valid email, like name@school.in.";
  const pwProblem = passwordProblem(password);
  if (pwProblem) fieldErrors.password = pwProblem;
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const rl = await rateLimit(`signup:ip:${await clientIp()}`, 10, HOUR);
  if (!rl.ok) return { error: `Too many new accounts from here. Try again ${tryAgainIn(rl.retryAfterSeconds)}.`, values };

  const passwordHash = await hashPassword(password);
  let userId: string;
  try {
    userId = await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, name: fullName, passwordHash }, select: { id: true } });
      await createSchool({ userId: user.id, name: schoolName, city, ownerName: fullName }, tx);
      return user.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { email: "An account with this email already exists. Sign in instead." }, values };
    }
    throw error;
  }

  await createSession(userId);
  await sendVerificationEmail(userId, email, fullName);
  redirect("/today?welcome=1");
}

export async function signOut() {
  await endSession();
  redirect("/login");
}

/** Always answers the same way, so the form can't be used to find out who has an account. */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email").toLowerCase();
  const values = keepValues(formData);
  if (!EMAIL_RE.test(email)) return { fieldErrors: { email: "Enter the email you signed up with." }, values };

  for (const [key, limit] of [[`reset:email:${email}`, 3], [`reset:ip:${await clientIp()}`, 20]] as const) {
    const rl = await rateLimit(key, limit, HOUR);
    if (!rl.ok) return { error: `Too many reset requests. Try again ${tryAgainIn(rl.retryAfterSeconds)}.`, values };
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (user) {
    const token = await createEmailToken(user.id, "reset_password");
    const link = `${await appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail(resetPasswordMessage(email, user.name, link));
  }
  return { message: `If ${email} has a BloomDesk account, we've sent it a link to reset the password. It works for 1 hour.` };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = str(formData, "token");
  const password = String(formData.get("password") ?? "");
  const pwProblem = passwordProblem(password);
  if (pwProblem) return { fieldErrors: { password: pwProblem } };

  const rl = await rateLimit(`reset-submit:ip:${await clientIp()}`, 20, 15 * MINUTE);
  if (!rl.ok) return { error: `Too many attempts. Try again ${tryAgainIn(rl.retryAfterSeconds)}.` };

  const userId = await consumeEmailToken(token, "reset_password");
  if (!userId) return { error: "This reset link has expired or was already used. Ask for a new one." };

  // Opening the emailed link also proves the address is theirs.
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() },
  });
  await endAllSessions(userId);
  await createSession(userId);
  redirect("/today");
}

export async function verifyEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await consumeEmailToken(str(formData, "token"), "verify_email");
  if (!userId) return { error: "This link has expired or was already used. Sign in and ask for a new one." };
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  // The token is used up now, so show the result on a page that doesn't need it.
  redirect("/verify-email?confirmed=1");
}

export async function resendVerification(): Promise<FormState> {
  const { user } = await getSession();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) return { message: "Your email is already confirmed." };

  const rl = await rateLimit(`verify-resend:user:${user.id}`, 3, HOUR);
  if (!rl.ok) return { error: `We've sent a few already. Try again ${tryAgainIn(rl.retryAfterSeconds)}.` };

  await sendVerificationEmail(user.id, user.email, user.name);
  return { message: `Sent. Check ${user.email} for the link.` };
}

async function sendVerificationEmail(userId: string, email: string, name: string) {
  const token = await createEmailToken(userId, "verify_email");
  const link = `${await appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail(verifyEmailMessage(email, name, link));
}
