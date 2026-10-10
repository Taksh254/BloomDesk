"use server";

import { revalidatePath } from "next/cache";
import { requireSchool } from "@/lib/session";
import { todayISO } from "@/lib/format";
import { recordAttendance, type AttendanceInput, type SaveAttendanceResult } from "@/lib/attendance";

export async function saveAttendance(input: AttendanceInput): Promise<SaveAttendanceResult> {
  const { school, userId } = await requireSchool();
  let result: SaveAttendanceResult;
  try {
    result = await recordAttendance(school.id, userId, input, todayISO(school.timezone));
  } catch {
    return { ok: false, error: "Couldn't save attendance. Check your connection and try again." };
  }
  if (result.ok) {
    revalidatePath("/attendance");
    revalidatePath("/today");
  }
  return result;
}
