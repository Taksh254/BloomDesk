import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSessionCookie, validateSessionToken } from "@/lib/auth/session";
import type { MemberRole, School } from "@/lib/types";

export type SessionUser = { id: string; email: string; name: string; emailVerifiedAt: Date | null };

export type SchoolSession = {
  userId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  role: MemberRole;
  school: School;
};

/** The signed-in user and their first staff membership, or null for each. Cached per request. */
export const getSession = cache(async () => {
  const user: SessionUser | null = await validateSessionToken(await readSessionCookie());
  if (!user) return { user: null, membership: null } as const;

  const membership = await db.schoolMember.findFirst({
    where: { userId: user.id, role: { in: ["owner", "admin", "teacher"] } },
    select: { role: true, fullName: true, school: { select: { id: true, name: true, city: true, timezone: true } } },
    orderBy: { createdAt: "asc" },
  });

  return { user, membership } as const;
});

/** For signed-in pages without a school yet (onboarding). Sends signed-out visitors to login. */
export async function requireUser(): Promise<SessionUser> {
  const { user } = await getSession();
  if (!user) redirect("/login");
  return user;
}

/**
 * For every page and Server Action inside the app: sends signed-out visitors to login and
 * users without a school to onboarding. The school always comes from the session, never
 * from the browser.
 */
export async function requireSchool(): Promise<SchoolSession> {
  const { user, membership } = await getSession();
  if (!user) redirect("/login");
  if (!membership) redirect("/onboarding");

  return {
    userId: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    displayName: membership.fullName || user.name || user.email.split("@")[0] || "there",
    role: membership.role,
    school: membership.school,
  };
}

export function canManage(role: MemberRole) {
  return role === "owner" || role === "admin";
}
