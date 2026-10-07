import "server-only";
import { db } from "@/lib/db";
import { dayToDate, isISODate } from "@/lib/format";
import { isUuid } from "@/lib/data";
import type { AttendanceStatus } from "@/lib/types";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "leave"];

export type AttendanceInput = {
  classId: string;
  date: string;
  entries: { childId: string; status: AttendanceStatus }[];
};

export type SaveAttendanceResult = { ok: true; saved: number } | { ok: false; error: string };

/**
 * Saves a class's attendance for one day. Only children who are active in this class
 * of this school are accepted; anything else in `entries` is ignored. Saving again
 * replaces the earlier mark, so there is never more than one per child per day.
 */
export async function recordAttendance(
  schoolId: string,
  userId: string,
  input: AttendanceInput,
  today: string,
): Promise<SaveAttendanceResult> {
  const { classId, date } = input;
  if (!isISODate(date) || date > today) {
    return { ok: false, error: "You can only take attendance for today or an earlier day." };
  }
  const entries = (Array.isArray(input.entries) ? input.entries : []).filter((e) => STATUSES.includes(e?.status));
  if (entries.length === 0) return { ok: false, error: "Mark at least one child first." };
  if (!isUuid(classId)) return { ok: false, error: "That class doesn't exist. Refresh and try again." };

  const kids = await db.child.findMany({
    where: { schoolId, classId, status: "active" },
    select: { id: true },
  });
  const allowed = new Set(kids.map((k) => k.id));
  const rows = entries.filter((e) => allowed.has(e.childId));
  if (rows.length === 0) return { ok: false, error: "These children are no longer in this class. Refresh and try again." };

  const day = dayToDate(date);
  const markedAt = new Date();
  await db.$transaction(
    rows.map((e) =>
      db.attendance.upsert({
        where: { childId_date: { childId: e.childId, date: day } },
        create: { childId: e.childId, schoolId, classId, date: day, status: e.status, markedById: userId, markedAt },
        update: { status: e.status, classId, markedById: userId, markedAt },
      }),
    ),
  );
  return { ok: true, saved: rows.length };
}
