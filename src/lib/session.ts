import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole, School } from "@/lib/types";

export type SchoolSession = {
  userId: string;
  email: string | undefined;
  displayName: string;
  role: MemberRole;
  school: School;
};

/** The signed-in user and their first school, or null for each when missing. Cached per request. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, membership: null } as const;

  const { data: membership } = await supabase
    .from("school_members")
    .select("role, full_name, schools(id, name, city, timezone)")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "teacher"])
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return { user, membership } as const;
});

/** For pages inside the app: sends signed-out users to login and users without a school to onboarding. */
export async function requireSchool(): Promise<SchoolSession> {
  const { user, membership } = await getSession();
  if (!user) redirect("/login");
  const school = membership?.schools as unknown as School | null;
  if (!membership || !school) redirect("/onboarding");

  const metaName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  return {
    userId: user.id,
    email: user.email,
    displayName: membership.full_name || metaName || user.email?.split("@")[0] || "there",
    role: membership.role as MemberRole,
    school,
  };
}

export function canManage(role: MemberRole) {
  return role === "owner" || role === "admin";
}
