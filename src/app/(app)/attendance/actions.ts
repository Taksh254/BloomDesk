"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/session";
import { isISODate, todayISO } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "leave"];

export type SaveAttendanceResult = { ok: true; saved: number } | { ok: false; error: string };

export async function saveAttendance(input: {
  classId: string;
  date: string;
  entries: { childId: string; status: AttendanceStatus }[];
}): Promise<SaveAttendanceResult> {
  const { school } = await requireSchool();
  const { classId, date } = input;

  if (!isISODate(date) || date > todayISO(school.timezone)) {
    return { ok: false, error: "You can only take attendance for today or an earlier day." };
  }
  const entries = (input.entries ?? []).filter((e) => STATUSES.includes(e.status));
  if (entries.length === 0) return { ok: false, error: "Mark at least one child first." };

  const supabase = await createClient();
  // Only children who are currently in this class can be marked from this sheet.
  const { data: kids, error: kidsError } = await supabase
    .from("children")
    .select("id")
    .eq("school_id", school.id)
    .eq("class_id", classId)
    .eq("status", "active");
  if (kidsError) return { ok: false, error: "Couldn't load the class. Try again." };
  const allowed = new Set((kids ?? []).map((k) => k.id));

  const rows = entries
    .filter((e) => allowed.has(e.childId))
    .map((e) => ({
      child_id: e.childId,
      school_id: school.id,
      class_id: classId,
      date,
      status: e.status,
      marked_at: new Date().toISOString(),
    }));
  if (rows.length === 0) return { ok: false, error: "These children are no longer in this class. Refresh and try again." };

  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "child_id,date" });
  if (error) return { ok: false, error: "Couldn't save attendance. Check your connection and try again." };

  revalidatePath("/attendance");
  revalidatePath("/today");
  return { ok: true, saved: rows.length };
}
